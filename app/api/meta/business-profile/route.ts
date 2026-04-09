/**
 * GET /api/meta/business-profile — Fetch the WhatsApp Business Profile
 * PUT /api/meta/business-profile — Update the WhatsApp Business Profile
 *
 * Uses the local business_profiles table for demo, and optionally syncs
 * with Meta Graph API for production use.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient, getWorkspaceIdServer } from '@/lib/supabase-server'

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

    const { customerId, error: ctxErr } = await getWorkspaceIdServer(token)
    if (ctxErr || !customerId) {
      return NextResponse.json({ error: ctxErr || 'Workspace not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const forceSync = searchParams.get('sync') === 'true'

    // 1. Find the WhatsApp connected account
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', customerId)
      .eq('channel_type', 'whatsapp')
      .eq('is_active', true)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
    }

    // 2. Get business profile from local DB
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('connected_account_id', account.id)
      .maybeSingle()

    // 3. IF profile is missing, name is default, or user requested FORCED sync
    const isDefault = !profile || !profile.business_name || profile.business_name === 'My Business' || profile.business_name === 'TropiChat Business'
    if (isDefault || forceSync) {
      const { data: connection } = await supabase
        .from('meta_connections')
        .select('access_token, account_id, metadata')
        .eq('user_id', customerId)
        .eq('channel', 'whatsapp')
        .single()

      if (connection && connection.access_token && !connection.access_token.startsWith('DEMO_')) {
        const phoneId = connection.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID
        
        try {
          // 1. Fetch Profile Data (Description, Bio, etc.)
          const profileRes = await fetch(
            `https://graph.facebook.com/v22.0/${phoneId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical&access_token=${connection.access_token}`
          )
          const profileData = await profileRes.json()

          // 2. Fetch Phone Number Data (for the actual VERIFIED NAME)
          const phoneRes = await fetch(
            `https://graph.facebook.com/v22.0/${phoneId}?fields=verified_name,display_phone_number&access_token=${connection.access_token}`
          )
          const phoneData = await phoneRes.json()

          if (!profileData.error && profileData.data?.[0]) {
            const m = profileData.data[0]
            const syncData = {
              connected_account_id: account.id,
              business_name: phoneData.verified_name || m.verified_name || user.user_metadata?.full_name || 'TropiChat Business',
              business_description: m.description || m.about || '',
              business_category: m.vertical || '',
              website_url: m.websites?.[0] || '',
              business_address: m.address || '',
              contact_email: m.email || '',
              profile_picture_url: m.profile_picture_url || '',
            }

            // Save synced data
            const service = createServiceClient()
            const { data: savedProfile } = await service
              .from('business_profiles')
              .upsert(syncData, { onConflict: 'connected_account_id' })
              .select()
              .single()

            return NextResponse.json({ profile: savedProfile })
          }
        } catch (apiErr) {
          console.error('Meta Profile Sync Error:', apiErr)
        }
      }
    }

    return NextResponse.json({
      profile: profile || {
        connected_account_id: account.id,
        business_name: user.user_metadata?.full_name || 'My Business',
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

    const { customerId } = await getWorkspaceIdServer(token)

    // Find the WhatsApp connected account
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', customerId)
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

    // 2. Synchronize with Meta Graph API
    const { data: connection } = await supabase
      .from('meta_connections')
      .select('access_token, metadata')
      .eq('user_id', customerId)
      .eq('channel', 'whatsapp')
      .single()

    if (connection && connection.access_token && !connection.access_token.startsWith('DEMO_')) {
      const phoneId = connection.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID
      try {
        await fetch(`https://graph.facebook.com/v22.0/${phoneId}/whatsapp_business_profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${connection.access_token}`
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            description: body.business_description || '',
            address: body.business_address || '',
            email: body.contact_email || '',
            websites: body.website_url ? [body.website_url] : [],
            vertical: body.business_category || 'OTHER'
          })
        })
      } catch (apiErr) {
        console.error('Meta Profile Update Sync Error:', apiErr)
      }
    }

    // 3. Upsert local database
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
