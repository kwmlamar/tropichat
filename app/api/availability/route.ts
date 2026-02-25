import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateAvailabilitySlotInput } from '@/types/bookings'

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

// GET /api/availability?service_id=
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('service_id')

  const db = getServiceClient()
  let query = db
    .from('availability_slots')
    .select('*, service:booking_services(id, name, user_id)')
    .order('is_recurring', { ascending: false })
    .order('day_of_week')
    .order('specific_date')
    .order('start_time')

  if (serviceId) {
    query = query.eq('service_id', serviceId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Verify user owns the services (filter after fetch for compatibility)
  const filtered = (data ?? []).filter((s: any) => s.service?.user_id === userId)
  return NextResponse.json({ data: filtered })
}

// POST /api/availability
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateAvailabilitySlotInput = await req.json()
  const { service_id, is_recurring, day_of_week, specific_date, start_time, end_time, max_bookings } = body

  if (!service_id || !start_time || !end_time) {
    return NextResponse.json({ error: 'service_id, start_time and end_time are required' }, { status: 400 })
  }
  if (is_recurring && day_of_week === undefined) {
    return NextResponse.json({ error: 'day_of_week required for recurring slots' }, { status: 400 })
  }
  if (!is_recurring && !specific_date) {
    return NextResponse.json({ error: 'specific_date required for one-time slots' }, { status: 400 })
  }

  const db = getServiceClient()

  // Verify ownership
  const { data: service } = await db
    .from('booking_services')
    .select('id')
    .eq('id', service_id)
    .eq('user_id', userId)
    .single()

  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  const { data, error } = await db
    .from('availability_slots')
    .insert({
      service_id,
      is_recurring,
      day_of_week: is_recurring ? day_of_week : null,
      specific_date: !is_recurring ? specific_date : null,
      start_time,
      end_time,
      max_bookings: max_bookings ?? 1,
      is_available: body.is_available !== false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
