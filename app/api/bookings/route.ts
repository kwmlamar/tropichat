import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateBookingInput, UpdateBookingInput } from '@/types/bookings'

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

// GET /api/bookings — list bookings for authenticated user
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')    // 'YYYY-MM' for calendar view
  const date  = searchParams.get('date')     // 'YYYY-MM-DD' for daily view
  const status = searchParams.get('status')
  const serviceId = searchParams.get('service_id')
  const conversationId = searchParams.get('conversation_id')

  const db = getServiceClient()
  let query = db
    .from('bookings')
    .select('*, service:booking_services(*)')
    .eq('user_id', userId)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true })

  if (month) {
    const [year, m] = month.split('-')
    const startDate = `${year}-${m}-01`
    const endDate = new Date(Number(year), Number(m), 0).toISOString().slice(0, 10)
    query = query.gte('booking_date', startDate).lte('booking_date', endDate)
  }
  if (date)   query = query.eq('booking_date', date)
  if (status) query = query.eq('status', status)
  if (serviceId) query = query.eq('service_id', serviceId)
  if (conversationId) query = query.eq('conversation_id', conversationId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/bookings — create a booking
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateBookingInput = await req.json()
  const {
    service_id, conversation_id, customer_name, customer_phone, customer_email,
    booking_date, booking_time, number_of_people, notes
  } = body

  if (!service_id || !customer_name || !booking_date || !booking_time || !number_of_people) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const db = getServiceClient()

  // Verify service belongs to user
  const { data: service } = await db
    .from('booking_services')
    .select('id, max_capacity, user_id')
    .eq('id', service_id)
    .eq('user_id', userId)
    .single()

  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  // Availability check
  const { data: existing } = await db
    .from('bookings')
    .select('number_of_people')
    .eq('service_id', service_id)
    .eq('booking_date', booking_date)
    .eq('booking_time', booking_time)
    .neq('status', 'cancelled')

  const bookedPeople = (existing ?? []).reduce((sum, b) => sum + b.number_of_people, 0)
  if (bookedPeople + number_of_people > service.max_capacity) {
    return NextResponse.json({
      error: `Not enough capacity. ${service.max_capacity - bookedPeople} spots remaining.`
    }, { status: 409 })
  }

  const { data, error } = await db
    .from('bookings')
    .insert({
      user_id: userId,
      service_id,
      conversation_id: conversation_id ?? null,
      customer_name,
      customer_phone: customer_phone ?? null,
      customer_email: customer_email ?? null,
      booking_date,
      booking_time,
      number_of_people,
      notes: notes ?? null,
      status: 'confirmed',
    })
    .select('*, service:booking_services(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
