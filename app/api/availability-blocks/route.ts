import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateAvailabilityBlockInput } from '@/types/bookings'

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

// GET /api/availability-blocks — list all blocks for the authenticated merchant
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')  // optional: YYYY-MM-DD
  const to   = searchParams.get('to')    // optional: YYYY-MM-DD

  const db = getServiceClient()
  let query = db
    .from('availability_blocks')
    .select('*')
    .eq('user_id', userId)
    .order('block_date', { ascending: true })

  if (from) query = query.gte('block_date', from)
  if (to)   query = query.lte('block_date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/availability-blocks — create a new block
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateAvailabilityBlockInput = await req.json()
  const { block_date, start_time, end_time, reason } = body

  if (!block_date) {
    return NextResponse.json({ error: 'block_date is required' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(block_date)) {
    return NextResponse.json({ error: 'block_date must be YYYY-MM-DD' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data, error } = await db
    .from('availability_blocks')
    .insert({
      user_id: userId,
      block_date,
      start_time: start_time ?? null,
      end_time: end_time ?? null,
      reason: reason?.trim() ?? null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
