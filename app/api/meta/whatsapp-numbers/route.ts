/**
 * GET  /api/meta/whatsapp-numbers — List phone numbers under the user's WhatsApp Business Account
 * POST /api/meta/whatsapp-numbers — Set the active WhatsApp phone number
 *
 * Uses the WhatsApp Business Management API to fetch registered phone numbers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export interface WhatsAppPhoneNumber {
  id: string          // Phone Number ID (used for sending)
  display_number: string
  verified_name: string
  quality_rating: string | null
  is_connected: boolean
}

// Demo phone numbers
const DEMO_WA_NUMBERS: WhatsAppPhoneNumber[] = [
  {
    id: process.env.WHATSAPP_PHONE_NUMBER_ID || '100000000000001',
    display_number: '+1 (242) 555-0199',
    verified_name: 'TropiChat Business',
    quality_rating: 'GREEN',
    is_connected: true,
  },
]

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the WhatsApp meta_connection
    const { data: connection } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'whatsapp')
      .eq('is_active', true)
      .single()

    // Get currently active phone number
    const { data: connectedAccount } = await supabase
      .from('connected_accounts')
      .select('channel_account_id')
      .eq('user_id', user.id)
      .eq('channel_type', 'whatsapp')
      .eq('is_active', true)
      .maybeSingle()

    const activePhoneId = connectedAccount?.channel_account_id
      || connection?.metadata?.phone_number_id
      || process.env.WHATSAPP_PHONE_NUMBER_ID

    // Demo / no connection fallback
    if (!connection || connection.access_token.startsWith('DEMO_')) {
      const numbers = DEMO_WA_NUMBERS.map((n) => ({
        ...n,
        is_connected: activePhoneId === n.id,
      }))
      return NextResponse.json({ numbers })
    }

    // Real Meta API: GET /{waba_id}/phone_numbers
    const wabaId = connection.account_id || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    if (!wabaId) {
      return NextResponse.json({ numbers: DEMO_WA_NUMBERS })
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating&access_token=${connection.access_token}`
      )
      const data = await res.json()

      if (data.error) {
        console.error('WhatsApp phone numbers API error:', data.error)
        return NextResponse.json({ numbers: DEMO_WA_NUMBERS })
      }

      const numbers: WhatsAppPhoneNumber[] = (data.data || []).map(
        (n: { id: string; display_phone_number: string; verified_name: string; quality_rating: string }) => ({
          id: n.id,
          display_number: n.display_phone_number,
          verified_name: n.verified_name,
          quality_rating: n.quality_rating || null,
          is_connected: activePhoneId === n.id,
        })
      )

      return NextResponse.json({ numbers })
    } catch (apiErr) {
      console.error('WhatsApp numbers fetch error:', apiErr)
      return NextResponse.json({ numbers: DEMO_WA_NUMBERS })
    }
  } catch (err) {
    console.error('WhatsApp numbers GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { phoneNumberId, displayNumber, verifiedName } = await request.json()
    if (!phoneNumberId) return NextResponse.json({ error: 'phoneNumberId is required' }, { status: 400 })

    // Get current WA connection for the access token
    const { data: conn } = await supabase
      .from('meta_connections')
      .select('access_token, account_id, metadata')
      .eq('user_id', user.id)
      .eq('channel', 'whatsapp')
      .maybeSingle()

    const accessToken = conn?.access_token || 'DEMO_ACCESS_TOKEN_WA'
    const wabaId = conn?.account_id || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

    // 1. Deactivate all existing WhatsApp connected_accounts for this user
    await supabase
      .from('connected_accounts')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('channel_type', 'whatsapp')

    // 2. Check if a row already exists for this phone number
    const { data: existing } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('channel_type', 'whatsapp')
      .eq('channel_account_id', phoneNumberId)
      .maybeSingle()

    const metadata = {
      waba_id: wabaId,
      phone_number_id: phoneNumberId,
      phone_display: displayNumber,
      ...(conn?.metadata || {}),
    }

    if (existing) {
      await supabase
        .from('connected_accounts')
        .update({ is_active: true, access_token: accessToken, metadata })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          channel_type: 'whatsapp',
          access_token: accessToken,
          channel_account_id: phoneNumberId,
          channel_account_name: verifiedName || displayNumber || 'WhatsApp Business',
          metadata,
          is_active: true,
        })
    }

    // 3. Update meta_connections to reflect the new active phone number
    await supabase
      .from('meta_connections')
      .update({
        metadata: { ...metadata, phone_number_id: phoneNumberId, phone_display: displayNumber },
      })
      .eq('user_id', user.id)
      .eq('channel', 'whatsapp')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('WhatsApp numbers POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
