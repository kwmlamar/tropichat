/**
 * GET /api/bookings/handle/check?handle=x
 * Returns { available: boolean } — used for real-time handle availability checks in the UI.
 * Public endpoint — no auth required, read-only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get('handle')?.trim().toLowerCase()

  if (!handle) {
    return NextResponse.json({ available: false, error: 'Handle is required' }, { status: 400 })
  }

  if (handle.length < 2 || handle.length > 60) {
    return NextResponse.json({ available: false, error: 'Handle must be 2–60 characters' })
  }

  if (!/^[a-z0-9_-]+$/.test(handle)) {
    return NextResponse.json({ available: false, error: 'Handle may only contain letters, numbers, hyphens, and underscores' })
  }

  const service = createServiceClient()
  const { data: existing } = await service
    .from('business_profiles')
    .select('id')
    .eq('handle', handle)
    .maybeSingle()

  return NextResponse.json({ available: existing === null })
}
