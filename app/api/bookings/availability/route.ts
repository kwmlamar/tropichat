import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { AvailabilityCheckResult } from '@/types/bookings'

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

// GET /api/bookings/availability?service_id=&date=YYYY-MM-DD&time=HH:MM&people=N
// Returns availability check result for a specific date/time/service combination
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('service_id')
  const date      = searchParams.get('date')   // YYYY-MM-DD
  const time      = searchParams.get('time')   // HH:MM
  const people    = parseInt(searchParams.get('people') ?? '1', 10)

  if (!serviceId || !date || !time) {
    return NextResponse.json({ error: 'service_id, date and time are required' }, { status: 400 })
  }

  const db = getServiceClient()

  // Verify service belongs to user
  const { data: service } = await db
    .from('booking_services')
    .select('id, max_capacity, name')
    .eq('id', serviceId)
    .eq('user_id', userId)
    .eq('active', true)
    .single()

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  // Get day of week (0=Sunday)
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()
  const timeHHMM  = time.slice(0, 5) // normalise to HH:MM

  // Check availability slots — prefer one-time override, fall back to recurring
  const { data: slots } = await db
    .from('availability_slots')
    .select('*')
    .eq('service_id', serviceId)
    .eq('is_available', true)
    .or(`and(is_recurring.eq.false,specific_date.eq.${date}),and(is_recurring.eq.true,day_of_week.eq.${dayOfWeek})`)

  // Prefer one-time slot if both exist
  const slot = slots?.find(s => !s.is_recurring && s.specific_date === date)
    ?? slots?.find(s => s.is_recurring && s.day_of_week === dayOfWeek)
    ?? null

  // Count existing bookings at this exact date+time
  const { data: existing } = await db
    .from('bookings')
    .select('number_of_people')
    .eq('service_id', serviceId)
    .eq('booking_date', date)
    .eq('booking_time', timeHHMM + ':00')
    .neq('status', 'cancelled')

  const bookedPeople = (existing ?? []).reduce((sum, b) => sum + b.number_of_people, 0)
  const remaining    = service.max_capacity - bookedPeople

  if (!slot) {
    const result: AvailabilityCheckResult = {
      available: false,
      slot: null,
      bookedCount: bookedPeople,
      remaining,
      message: 'No availability slot defined for this date/time.',
    }
    return NextResponse.json({ data: result })
  }

  // Check if requested time falls within the slot window
  const slotStart = slot.start_time.slice(0, 5)
  const slotEnd   = slot.end_time.slice(0, 5)
  const inWindow  = timeHHMM >= slotStart && timeHHMM < slotEnd

  if (!inWindow) {
    const result: AvailabilityCheckResult = {
      available: false,
      slot,
      bookedCount: bookedPeople,
      remaining,
      message: `This time is outside the available window (${slotStart}–${slotEnd}).`,
    }
    return NextResponse.json({ data: result })
  }

  if (people > remaining) {
    const result: AvailabilityCheckResult = {
      available: false,
      slot,
      bookedCount: bookedPeople,
      remaining,
      message: `Only ${remaining} spot${remaining !== 1 ? 's' : ''} remaining for this time.`,
    }
    return NextResponse.json({ data: result })
  }

  const result: AvailabilityCheckResult = {
    available: true,
    slot,
    bookedCount: bookedPeople,
    remaining,
    message: `Available — ${remaining} of ${service.max_capacity} spots remaining.`,
  }
  return NextResponse.json({ data: result })
}
