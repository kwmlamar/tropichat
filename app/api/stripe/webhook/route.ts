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
// Falls back to "coconut" (free) if the price ID is unrecognised.
function planFromPriceId(priceId: string): string {
  const tropicMonthly  = process.env.STRIPE_PRICE_TROPIC_MONTHLY
  const tropicAnnual   = process.env.STRIPE_PRICE_TROPIC_ANNUAL
  const islandMonthly  = process.env.STRIPE_PRICE_ISLAND_PRO_MONTHLY
  const islandAnnual   = process.env.STRIPE_PRICE_ISLAND_PRO_ANNUAL

  if (priceId === tropicMonthly  || priceId === tropicAnnual)  return "tropic"
  if (priceId === islandMonthly  || priceId === islandAnnual)  return "island_pro"
  return "coconut"
}

function billingPeriodFromPriceId(priceId: string): string {
  const tropicAnnual  = process.env.STRIPE_PRICE_TROPIC_ANNUAL
  const islandAnnual  = process.env.STRIPE_PRICE_ISLAND_PRO_ANNUAL
  if (priceId === tropicAnnual || priceId === islandAnnual) return "annual"
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
        const priceId = subscription.items.data[0].price.id

        await supabase
          .from("customers")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            stripe_current_period_end: new Date(
              (subscription as unknown as { current_period_end: number }).current_period_end * 1000
            ).toISOString(),
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
              (subscription as unknown as { current_period_end: number }).current_period_end * 1000
            ).toISOString(),
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
            plan: "coconut",
            billing_period: "monthly",
          })
          .eq("stripe_customer_id", customerId)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        // Log the failure — optionally downgrade or mark as past_due
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
