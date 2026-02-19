/**
 * GET /api/meta/business-profile — Fetch the WhatsApp Business Profile
 * PUT /api/meta/business-profile — Update the WhatsApp Business Profile
 *
 * Uses the local business_profiles table for demo, and optionally syncs
 * with Meta Graph API for production use.
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

  try {
    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the WhatsApp connected account
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_type', 'whatsapp')
      .eq('is_active', true)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }

    // Get business profile
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('connected_account_id', account.id)
      .single()

    return NextResponse.json({
      profile: profile || {
        connected_account_id: account.id,
        business_name: '',
        business_description: '',
        business_category: '',
        website_url: '',
        business_address: '',
        business_hours: '',
        contact_phone: '',
        contact_email: '',
        profile_picture_url: '',
      },
    })
  } catch (err) {
    console.error('Business profile GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Find the WhatsApp connected account
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_type', 'whatsapp')
      .eq('is_active', true)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }

    // Upsert business profile
    const profileData = {
      connected_account_id: account.id,
      business_name: body.business_name || '',
      business_description: body.business_description || '',
      business_category: body.business_category || '',
      website_url: body.website_url || '',
      business_address: body.business_address || '',
      business_hours: body.business_hours || '',
      contact_phone: body.contact_phone || '',
      contact_email: body.contact_email || '',
    }

    // Use service client for upsert to avoid RLS complexity with new rows
    const service = createServiceClient()

    const { data: existing } = await service
      .from('business_profiles')
      .select('id')
      .eq('connected_account_id', account.id)
      .single()

    let result
    if (existing) {
      result = await service
        .from('business_profiles')
        .update(profileData)
        .eq('connected_account_id', account.id)
        .select()
        .single()
    } else {
      result = await service
        .from('business_profiles')
        .insert(profileData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Business profile upsert error:', result.error)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: result.data, success: true })
  } catch (err) {
    console.error('Business profile PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
