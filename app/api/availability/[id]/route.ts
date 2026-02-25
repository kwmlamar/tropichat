import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UpdateAvailabilitySlotInput } from '@/types/bookings'

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

// PATCH /api/availability/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: UpdateAvailabilitySlotInput = await req.json()
  const db = getServiceClient()

  // Verify ownership through service
  const { data: existing } = await db
    .from('availability_slots')
    .select('id, service:booking_services(user_id)')
    .eq('id', id)
    .single()

  if (!existing || (existing.service as any)?.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await db
    .from('availability_slots')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/availability/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  const { data: existing } = await db
    .from('availability_slots')
    .select('id, service:booking_services(user_id)')
    .eq('id', id)
    .single()

  if (!existing || (existing.service as any)?.user_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await db.from('availability_slots').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
