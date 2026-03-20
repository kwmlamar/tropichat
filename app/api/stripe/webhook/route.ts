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
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = getServiceRoleClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (session.metadata?.supabase_user_id) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          await supabase
            .from("customers")
            .update({
              stripe_subscription_id: subscriptionId,
              stripe_price_id: subscription.items.data[0].price.id,
              stripe_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              plan: "professional", // Example: set plan based on price
            })
            .eq("id", session.metadata.supabase_user_id)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from("customers")
          .update({
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0].price.id,
            stripe_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
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
            plan: "free",
          })
          .eq("stripe_customer_id", customerId)
        break
      }
    }
  } catch (err: any) {
    console.error("Error processing webhook:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
