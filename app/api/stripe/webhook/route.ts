import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const getServiceRoleClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Map a Stripe price ID to a TropiChat plan name.
// Falls back to "starter" if the price ID is unrecognised.
function planFromPriceId(priceId: string): string {
  const starterMonthly = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY
  const starterAnnual  = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL
  const mediumMonthly  = process.env.NEXT_PUBLIC_STRIPE_PRICE_MEDIUM_MONTHLY
  const mediumAnnual   = process.env.NEXT_PUBLIC_STRIPE_PRICE_MEDIUM_ANNUAL
  const proMonthly     = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
  const proAnnual      = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL
  const eliteMonthly   = process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY
  const eliteAnnual    = process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_ANNUAL

  if (priceId === starterMonthly || priceId === starterAnnual) return "starter"
  if (priceId === mediumMonthly  || priceId === mediumAnnual)  return "medium"
  if (priceId === proMonthly     || priceId === proAnnual)     return "pro"
  if (priceId === eliteMonthly   || priceId === eliteAnnual)   return "elite"
  return "starter"
}

function billingPeriodFromPriceId(priceId: string): string {
  if (
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL ||
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_MEDIUM_ANNUAL ||
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL ||
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_ANNUAL
  ) {
    return "annual"
  }
  return "monthly"
}

export async function POST(req: Request) {
  const payload = await req.text()
  const sig = req.headers.get("Stripe-Signature")
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook Error: ${msg}`)
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 })
  }

  const supabase = getServiceRoleClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (!session.metadata?.supabase_user_id) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = (subscription as any).items.data[0].price.id

        await supabase
          .from("customers")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            stripe_current_period_end: new Date(
              (subscription as any).current_period_end * 1000
            ).toISOString(),
            status: (subscription as any).status,
            plan: planFromPriceId(priceId),
            billing_period: billingPeriodFromPriceId(priceId),
          })
          .eq("id", session.metadata.supabase_user_id)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0].price.id

        await supabase
          .from("customers")
          .update({
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            stripe_current_period_end: new Date(
              (subscription as any).current_period_end * 1000
            ).toISOString(),
            status: subscription.status,
            plan: planFromPriceId(priceId),
            billing_period: billingPeriodFromPriceId(priceId),
          })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from("customers")
          .update({
            stripe_subscription_id: null,
            stripe_price_id: null,
            stripe_current_period_end: null,
            status: "canceled",
            plan: "starter",
            billing_period: "monthly",
          })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        await supabase
          .from("customers")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId)

        console.warn(`[stripe] payment failed for customer: ${customerId}`)
        break
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("Error processing webhook:", msg)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
