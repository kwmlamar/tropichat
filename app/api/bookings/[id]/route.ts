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
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()
  const { data, error } = await db
    .from('bookings')
    .select('*, service:booking_services(*)')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/bookings/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: UpdateBookingInput = await req.json()
  const db = getServiceClient()

  const updates: Record<string, unknown> = { ...body }
  if (body.status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString()
  }

  const { data, error } = await db
    .from('bookings')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', userId)
    .select('*, service:booking_services(*)')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/bookings/[id] — hard delete (usually use PATCH status=cancelled instead)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()
  const { error } = await db
    .from('bookings')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
