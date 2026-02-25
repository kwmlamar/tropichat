import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UpdateServiceInput } from '@/types/bookings'

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

// GET /api/services/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()
  const { data, error } = await db
    .from('booking_services')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/services/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: UpdateServiceInput = await req.json()
  const db = getServiceClient()

  const { data, error } = await db
    .from('booking_services')
    .update(body)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/services/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getServiceClient()

  // Soft delete: set active = false
  const { error } = await db
    .from('booking_services')
    .update({ active: false })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
