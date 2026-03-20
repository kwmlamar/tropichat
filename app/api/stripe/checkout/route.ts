import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const getServiceRoleClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = getServiceRoleClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { priceId } = await req.json()
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 })
    }

    // Get customer from database
    const { data: customer } = await supabase
      .from("customers")
      .select("stripe_customer_id, email, business_name")
      .eq("id", user.id)
      .single()

    let stripeCustomerId = customer?.stripe_customer_id

    // Create a new Stripe customer if they don't have one
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: customer?.business_name || user.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
      stripeCustomerId = stripeCustomer.id

      // Save it in our database
      await supabase
        .from("customers")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id)
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/dashboard/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/dashboard/settings?tab=billing&canceled=true`,
      metadata: {
        supabase_user_id: user.id
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
