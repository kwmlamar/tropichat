import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateServiceInput } from '@/types/bookings'

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

// GET /api/services
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const activeOnly = searchParams.get('active') !== 'false'

  const db = getServiceClient()
  let query = db
    .from('booking_services')
    .select('*')
    .eq('user_id', userId)
    .order('name')

  if (activeOnly) query = query.eq('active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/services
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateServiceInput = await req.json()
  const { name, description, duration_minutes, max_capacity, price, color } = body

  if (!name || !duration_minutes || !max_capacity) {
    return NextResponse.json({ error: 'name, duration_minutes and max_capacity are required' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data, error } = await db
    .from('booking_services')
    .insert({
      user_id: userId,
      name,
      description: description ?? null,
      duration_minutes,
      max_capacity,
      price: price ?? null,
      color: color ?? '#3A9B9F',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
