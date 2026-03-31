/**
 * GET /api/bookings/handle  — Get the current user's booking handle + whatsapp_number
 * PUT /api/bookings/handle  — Set or update the current user's booking handle and/or whatsapp_number
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
    .select('id, handle, whatsapp_number')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    handle: profile?.handle ?? null,
    whatsapp_number: profile?.whatsapp_number ?? null,
  })
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

  // handle is optional — can update whatsapp_number without changing handle
  const rawHandle: string | undefined = body.handle
  const rawWhatsapp: string | null | undefined = body.whatsapp_number

  let handle: string | null = null
  if (rawHandle !== undefined) {
    handle = rawHandle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!handle) {
      return NextResponse.json({ error: 'Handle cannot be empty' }, { status: 400 })
    }
    if (handle.length < 2 || handle.length > 60) {
      return NextResponse.json({ error: 'Handle must be 2–60 characters' }, { status: 400 })
    }
  }

  const service = createServiceClient()

  if (handle) {
    // Check uniqueness (exclude this user's own profile)
    const { data: existing } = await service
      .from('business_profiles')
      .select('id, user_id')
      .eq('handle', handle)
      .single()

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json({ error: 'That handle is already taken' }, { status: 409 })
    }
  }

  // Build upsert payload
  const upsertPayload: Record<string, unknown> = { user_id: user.id }
  if (handle !== null) upsertPayload.handle = handle
  if (rawWhatsapp !== undefined) {
    upsertPayload.whatsapp_number = rawWhatsapp
      ? rawWhatsapp.trim().replace(/[^\d+]/g, '') || null
      : null
  }

  const { data: profile, error } = await service
    .from('business_profiles')
    .upsert(upsertPayload, { onConflict: 'user_id', ignoreDuplicates: false })
    .select('id, handle, whatsapp_number')
    .single()

  if (error) {
    console.error('Booking handle upsert error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({
    handle: profile.handle ?? null,
    whatsapp_number: profile.whatsapp_number ?? null,
  })
}
