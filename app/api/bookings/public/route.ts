import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const COCONUT_BOOKING_LIMIT = 20

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generateReferenceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "BK-"
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// POST /api/bookings/public — create a booking from the public booking page (no auth required)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    merchant_user_id,
    service_id,
    customer_name,
    customer_phone,
    customer_email,
    booking_date,
    booking_time,
    number_of_people,
    notes,
  } = body

  if (!merchant_user_id || !service_id || !customer_name || !booking_date || !booking_time || !number_of_people) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 })
  }

  // Validate time format
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(booking_time)) {
    return NextResponse.json({ error: "Invalid time format. Use HH:MM or HH:MM:SS." }, { status: 400 })
  }

  const db = getServiceClient()

  // Verify service belongs to merchant and is active
  const { data: service } = await db
    .from("booking_services")
    .select("id, name, max_capacity, user_id, price, price_type, duration_minutes")
    .eq("id", service_id)
    .eq("user_id", merchant_user_id)
    .eq("active", true)
    .single()

  if (!service) {
    return NextResponse.json({ error: "Service not found or unavailable" }, { status: 404 })
  }

  // ── Plan enforcement: Coconut tier = 20 bookings/month cap ──────────────────
  const { data: merchantCustomer } = await db
    .from("customers")
    .select("plan")
    .eq("id", merchant_user_id)
    .single()

  if (!merchantCustomer || merchantCustomer.plan === "coconut" || merchantCustomer.plan === "free") {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

    const { count: monthlyCount } = await db
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", merchant_user_id)
      .neq("status", "cancelled")
      .gte("booking_date", monthStart)
      .lte("booking_date", monthEnd)

    if ((monthlyCount ?? 0) >= COCONUT_BOOKING_LIMIT) {
      return NextResponse.json(
        {
          error: "This business has reached its monthly booking limit. Please contact them directly to book.",
          code: "MERCHANT_PLAN_LIMIT_REACHED",
        },
        { status: 403 }
      )
    }
  }
  // ── End plan enforcement ────────────────────────────────────────────────────

  // Capacity check: count existing bookings for this service/date/time
  const normalizedTime = booking_time.length === 5 ? booking_time + ":00" : booking_time

  const { data: existing } = await db
    .from("bookings")
    .select("number_of_people")
    .eq("service_id", service_id)
    .eq("booking_date", booking_date)
    .eq("booking_time", normalizedTime)
    .neq("status", "cancelled")

  const bookedPeople = (existing ?? []).reduce((sum: number, b: { number_of_people: number }) => sum + b.number_of_people, 0)
  if (bookedPeople + Number(number_of_people) > service.max_capacity) {
    const remaining = service.max_capacity - bookedPeople
    return NextResponse.json(
      {
        error: remaining <= 0
          ? "This time slot is fully booked. Please select another time."
          : `Only ${remaining} spot${remaining === 1 ? "" : "s"} remaining for this time slot.`,
      },
      { status: 409 }
    )
  }

  // Generate unique reference code with retry
  let reference_code: string | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateReferenceCode()
    const { data: codeConflict } = await db
      .from("bookings")
      .select("id")
      .eq("reference_code", candidate)
      .maybeSingle()
    if (!codeConflict) {
      reference_code = candidate
      break
    }
  }

  const { data, error } = await db
    .from("bookings")
    .insert({
      user_id: merchant_user_id,
      service_id,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone?.trim() ?? null,
      customer_email: customer_email?.trim() ?? null,
      booking_date,
      booking_time: normalizedTime,
      number_of_people: Number(number_of_people),
      notes: notes?.trim() ?? null,
      status: "pending",
      reference_code,
    })
    .select("*, service:booking_services(*)")
    .single()

  if (error) {
    console.error("[POST /api/bookings/public] insert error:", error)
    return NextResponse.json({ error: "Failed to create booking. Please try again." }, { status: 500 })
  }

  // Look up merchant's business profile for email + WhatsApp number (fire-and-forget safe)
  const { data: merchantProfile } = await db
    .from("business_profiles")
    .select("business_name, contact_email, whatsapp_number")
    .eq("user_id", merchant_user_id)
    .maybeSingle()

  const merchantEmail = merchantProfile?.contact_email ?? null
  const merchantBusinessName = merchantProfile?.business_name ?? service.name
  const merchantWhatsapp = merchantProfile?.whatsapp_number ?? null
  const refCode = reference_code ?? data.id.slice(0, 8).toUpperCase()

  // Send customer confirmation email (fire-and-forget)
  if (customer_email && data) {
    sendConfirmationEmail({
      to: customer_email,
      customerName: customer_name,
      businessName: merchantBusinessName,
      bookingDate: booking_date,
      bookingTime: normalizedTime,
      serviceName: service.name,
      referenceCode: refCode,
      durationMinutes: service.duration_minutes,
    }).catch((err) => {
      console.error("[booking confirmation email] failed:", err)
    })
  }

  // Send merchant new-booking alert email (fire-and-forget)
  if (merchantEmail) {
    sendMerchantAlertEmail({
      to: merchantEmail,
      merchantBusinessName,
      customerName: customer_name,
      customerPhone: customer_phone ?? null,
      customerEmail: customer_email ?? null,
      bookingDate: booking_date,
      bookingTime: normalizedTime,
      serviceName: service.name,
      referenceCode: refCode,
      numberOfPeople: Number(number_of_people),
      whatsappNumber: merchantWhatsapp,
    }).catch((err) => {
      console.error("[merchant alert email] failed:", err)
    })
  }

  return NextResponse.json({ data }, { status: 201 })
}

interface EmailParams {
  to: string
  customerName: string
  businessName: string
  bookingDate: string
  bookingTime: string
  serviceName: string
  referenceCode: string
  durationMinutes: number
}

async function sendConfirmationEmail(params: EmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return

  const [y, m, d] = params.bookingDate.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  const [h, mi] = params.bookingTime.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  const timeStr = `${h12}:${String(mi).padStart(2, "0")} ${ampm}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #007B85; padding: 32px 24px; text-align: center;">
      <p style="color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 4px;">Confirmation #</p>
      <p style="color: white; font-size: 28px; font-weight: 900; letter-spacing: 0.1em; margin: 0;">${params.referenceCode}</p>
    </div>
    <div style="padding: 32px 24px;">
      <h1 style="font-size: 22px; font-weight: 900; color: #111; margin: 0 0 4px;">You&apos;re Booked! ✅</h1>
      <p style="color: #64748b; margin: 0 0 28px;">Hi ${params.customerName}, your booking is confirmed.</p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; space-y: 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Service</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${params.serviceName}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Date</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${dateStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Time</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${timeStr} (${params.durationMinutes} min)</td></tr>
        </table>
      </div>

      <p style="color: #64748b; font-size: 14px; line-height: 1.6;">If you need to make changes or have questions, please contact ${params.businessName} directly.</p>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #f1f5f9; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">Powered by <strong style="color: #007B85;">TropiChat</strong></p>
    </div>
  </div>
</body>
</html>`

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TropiChat Bookings <bookings@tropichat.app>",
      to: [params.to],
      subject: `Your booking is confirmed — Ref: ${params.referenceCode}`,
      html,
    }),
  })
}

interface MerchantAlertParams {
  to: string
  merchantBusinessName: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  bookingDate: string
  bookingTime: string
  serviceName: string
  referenceCode: string
  numberOfPeople: number
  whatsappNumber: string | null
}

async function sendMerchantAlertEmail(params: MerchantAlertParams) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return

  const [y, m, d] = params.bookingDate.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  const [h, mi] = params.bookingTime.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 || 12
  const timeStr = `${h12}:${String(mi).padStart(2, "0")} ${ampm}`

  // Build WhatsApp click-to-chat link for merchant to contact the customer
  const waText = encodeURIComponent(
    `Hi ${params.customerName}, this is ${params.merchantBusinessName}! I saw your booking request for ${params.serviceName} on ${dateStr} at ${timeStr} (Ref: ${params.referenceCode}). Looking forward to seeing you!`
  )
  const customerPhone = params.customerPhone?.replace(/[^\d]/g, "") ?? null
  const whatsappLink = customerPhone
    ? `https://wa.me/${customerPhone}?text=${waText}`
    : null

  const whatsappSection = whatsappLink
    ? `
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #166534; font-size: 14px; font-weight: 700; margin: 0 0 12px;">💬 Reply via WhatsApp</p>
        <p style="color: #4b7c5e; font-size: 13px; margin: 0 0 16px;">Tap below to send ${params.customerName} a WhatsApp message confirming their booking.</p>
        <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; font-weight: 900; font-size: 14px; padding: 12px 28px; border-radius: 12px; text-decoration: none;">
          Open WhatsApp Chat
        </a>
      </div>`
    : ""

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #0F172A; padding: 24px; text-align: center;">
      <p style="color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 4px;">New Booking</p>
      <p style="color: #F4C430; font-size: 22px; font-weight: 900; margin: 0;">${params.merchantBusinessName}</p>
    </div>
    <div style="padding: 32px 24px;">
      <h1 style="font-size: 20px; font-weight: 900; color: #111; margin: 0 0 4px;">🎉 New booking received!</h1>
      <p style="color: #64748b; margin: 0 0 24px;">A customer just booked via TropiChat. Details below.</p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Customer</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${params.customerName}</td></tr>
          ${params.customerPhone ? `<tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Phone</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${params.customerPhone}</td></tr>` : ""}
          ${params.customerEmail ? `<tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Email</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${params.customerEmail}</td></tr>` : ""}
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Service</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${params.serviceName}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Date</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${dateStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Time</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${timeStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Guests</td><td style="padding: 8px 0; font-weight: 700; color: #111; text-align: right;">${params.numberOfPeople}</td></tr>
          <tr><td style="padding: 8px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Ref #</td><td style="padding: 8px 0; font-weight: 900; color: #007B85; text-align: right;">${params.referenceCode}</td></tr>
        </table>
      </div>

      ${whatsappSection}

      <p style="color: #64748b; font-size: 13px; line-height: 1.6;">Log in to your TropiChat dashboard to confirm or manage this booking.</p>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #f1f5f9; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">Powered by <strong style="color: #007B85;">TropiChat</strong></p>
    </div>
  </div>
</body>
</html>`

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TropiChat Bookings <bookings@tropichat.app>",
      to: [params.to],
      subject: `New booking: ${params.customerName} — ${params.serviceName} on ${dateStr}`,
      html,
    }),
  })
}
