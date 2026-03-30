import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UpdateBookingInput } from '@/types/bookings'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getUserId(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  return user?.id ?? null
}

// GET /api/bookings/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()
  const { data, error } = await db
    .from('bookings')
    .select('*, service:booking_services(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/bookings/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: UpdateBookingInput = await req.json()
  const db = getServiceClient()

  // Fetch the existing booking before update (need for email context)
  const { data: existingBooking } = await db
    .from('bookings')
    .select('*, service:booking_services(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!existingBooking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = { ...body }
  if (body.status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString()
  }

  const { data, error } = await db
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*, service:booking_services(*)')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 500 })

  // Send notification email if status changed to confirmed or cancelled (= decline)
  const statusChanged = body.status && body.status !== existingBooking.status
  const shouldEmailCustomer = statusChanged &&
    (body.status === 'confirmed' || body.status === 'cancelled') &&
    data.customer_email

  if (shouldEmailCustomer) {
    // Get business name from business_profiles
    const { data: businessProfile } = await db
      .from('business_profiles')
      .select('business_name')
      .eq('user_id', userId)
      .maybeSingle()

    const merchantName = businessProfile?.business_name ?? 'your service provider'

    sendStatusEmail({
      to: data.customer_email!,
      customerName: data.customer_name,
      merchantName,
      serviceName: data.service?.name ?? 'your service',
      bookingDate: data.booking_date,
      bookingTime: data.booking_time,
      referenceCode: data.reference_code ?? data.id.slice(0, 8).toUpperCase(),
      newStatus: body.status as 'confirmed' | 'cancelled',
      merchantNote: body.merchant_note ?? null,
    }).catch((err) => {
      console.error('[booking status email] failed:', err)
    })
  }

  return NextResponse.json({ data })
}

// DELETE /api/bookings/[id] — hard delete (usually use PATCH status=cancelled instead)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()
  const { error } = await db
    .from('bookings')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ─── Email helpers ────────────────────────────────────────────────────────────

interface StatusEmailParams {
  to: string
  customerName: string
  merchantName: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  referenceCode: string
  newStatus: 'confirmed' | 'cancelled'
  merchantNote: string | null
}

function formatDateDisplay(bookingDate: string): string {
  const [y, m, d] = bookingDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTimeDisplay(bookingTime: string): string {
  const [h, mi] = bookingTime.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(mi).padStart(2, '0')} ${ampm}`
}

async function sendStatusEmail(params: StatusEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) return

  const isConfirmed = params.newStatus === 'confirmed'
  const accentColor = isConfirmed ? '#007B85' : '#EF4444'
  const statusLabel = isConfirmed ? 'Confirmed ✅' : 'Declined'
  const subjectLine = isConfirmed
    ? `Your booking with ${params.merchantName} is confirmed — Ref: ${params.referenceCode}`
    : `Update on your booking with ${params.merchantName} — Ref: ${params.referenceCode}`

  const dateStr = formatDateDisplay(params.bookingDate)
  const timeStr = formatTimeDisplay(params.bookingTime)

  const noteSection = params.merchantNote
    ? `<div style="background:#f8fafc;border-left:3px solid ${accentColor};border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px;">Message from ${params.merchantName}</p>
        <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;">${params.merchantNote}</p>
       </div>`
    : ''

  const bodyContent = isConfirmed
    ? `<h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 4px;">Booking Confirmed!</h1>
       <p style="color:#64748b;margin:0 0 20px;">Hi ${params.customerName}, your booking has been confirmed by ${params.merchantName}.</p>`
    : `<h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 4px;">Booking Update</h1>
       <p style="color:#64748b;margin:0 0 20px;">Hi ${params.customerName}, unfortunately ${params.merchantName} is unable to accommodate your booking request.</p>`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:${accentColor};padding:32px 24px;text-align:center;">
      <p style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 4px;">Booking ${statusLabel}</p>
      <p style="color:white;font-size:22px;font-weight:900;letter-spacing:0.08em;margin:0;">${params.referenceCode}</p>
    </div>
    <div style="padding:32px 24px;">
      ${bodyContent}
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:16px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Service</td><td style="padding:8px 0;font-weight:700;color:#111;text-align:right;">${params.serviceName}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Date</td><td style="padding:8px 0;font-weight:700;color:#111;text-align:right;">${dateStr}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Time</td><td style="padding:8px 0;font-weight:700;color:#111;text-align:right;">${timeStr}</td></tr>
        </table>
      </div>
      ${noteSection}
      ${isConfirmed
        ? '<p style="color:#64748b;font-size:14px;line-height:1.6;">If you need to make changes or have questions, please contact them directly.</p>'
        : '<p style="color:#64748b;font-size:14px;line-height:1.6;">You may visit their booking page to request a different date or time.</p>'
      }
    </div>
    <div style="padding:16px 24px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">Powered by <strong style="color:#007B85;">TropiChat</strong></p>
    </div>
  </div>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TropiChat Bookings <bookings@tropichat.app>',
      to: [params.to],
      subject: subjectLine,
      html,
    }),
  })
}
