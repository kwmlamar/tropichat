/**
 * GET /api/bookings/handle  — Get the current user's booking handle
 * PUT /api/bookings/handle  — Set or update the current user's booking handle
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: profile } = await service
    .from('business_profiles')
    .select('id, handle')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ handle: profile?.handle ?? null })
}

export async function PUT(request: NextRequest) {
  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const handle: string = (body.handle ?? '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')

  if (!handle) {
    return NextResponse.json({ error: 'Handle is required' }, { status: 400 })
  }
  if (handle.length < 2 || handle.length > 60) {
    return NextResponse.json({ error: 'Handle must be 2–60 characters' }, { status: 400 })
  }

  const service = createServiceClient()

  // Check uniqueness (exclude this user's own profile)
  const { data: existing } = await service
    .from('business_profiles')
    .select('id, user_id')
    .eq('handle', handle)
    .single()

  if (existing && existing.user_id !== user.id) {
    return NextResponse.json({ error: 'That handle is already taken' }, { status: 409 })
  }

  // Upsert by user_id
  const { data: profile, error } = await service
    .from('business_profiles')
    .upsert(
      { user_id: user.id, handle },
      { onConflict: 'user_id', ignoreDuplicates: false }
    )
    .select('id, handle')
    .single()

  if (error) {
    console.error('Booking handle upsert error:', error)
    return NextResponse.json({ error: 'Failed to save handle' }, { status: 500 })
  }

  return NextResponse.json({ handle: profile.handle })
}
