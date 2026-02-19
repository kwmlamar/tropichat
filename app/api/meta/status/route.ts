/**
 * GET /api/meta/status
 *
 * Returns the connection status for each Meta channel (WhatsApp, Instagram, Messenger).
 * Also performs self-healing: if connected_accounts is missing or has wrong
 * channel_account_id for WhatsApp, it auto-fixes using the meta_connections data.
 *
 * Requires the user's Supabase JWT in the Authorization header.
 */

import { NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = createServerClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const { data: connections, error } = await supabase
    .from('meta_connections')
    .select('id, channel, account_id, account_name, access_token, is_active, scopes, metadata, token_expires_at, updated_at')
    .eq('user_id', user.id)
    .order('channel')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Self-healing: ensure connected_accounts is in sync for WhatsApp ──
  const waConn = connections?.find(c => c.channel === 'whatsapp' && c.is_active)
  if (waConn && waConn.access_token) {
    try {
      const serviceDb = createServiceClient()
      const phoneNumberId = waConn.metadata?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID
      const wabaId = waConn.account_id || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

      if (phoneNumberId) {
        // Check if connected_accounts has a row with the correct phone_number_id
        const { data: existingCA } = await serviceDb
          .from('connected_accounts')
          .select('id, channel_account_id')
          .eq('user_id', user.id)
          .eq('channel_type', 'whatsapp')
          .eq('is_active', true)
          .single()

        const needsFix = !existingCA || existingCA.channel_account_id !== phoneNumberId

        if (needsFix) {
          console.log('[meta/status] Self-healing: connected_accounts WhatsApp row', existingCA ? 'has wrong channel_account_id' : 'is missing')
          console.log('[meta/status] Expected channel_account_id:', phoneNumberId, '| Got:', existingCA?.channel_account_id || 'none')

          // If there's an existing row with wrong ID (e.g., WABA ID), deactivate it first
          if (existingCA && existingCA.channel_account_id !== phoneNumberId) {
            await serviceDb.from('connected_accounts')
              .update({ is_active: false })
              .eq('id', existingCA.id)
            console.log('[meta/status] Deactivated old connected_accounts row with wrong ID:', existingCA.channel_account_id)
          }

          // Upsert the correct row
          const { error: upsertErr } = await serviceDb.from('connected_accounts').upsert(
            {
              user_id: user.id,
              channel_type: 'whatsapp',
              access_token: waConn.access_token,
              token_expires_at: waConn.token_expires_at,
              channel_account_id: phoneNumberId,
              channel_account_name: waConn.account_name || 'WhatsApp Business',
              metadata: { waba_id: wabaId, phone_number_id: phoneNumberId, phone_display: waConn.metadata?.phone_display },
              is_active: true,
            },
            { onConflict: 'channel_type,channel_account_id' }
          )

          if (upsertErr) {
            console.error('[meta/status] Self-healing upsert error:', upsertErr)
          } else {
            console.log('[meta/status] Self-healing complete: connected_accounts synced with channel_account_id:', phoneNumberId)
          }
        }
      }
    } catch (e) {
      console.error('[meta/status] Self-healing error (non-fatal):', e)
    }
  }

  // Build a status map for each channel
  const channels = ['whatsapp', 'instagram', 'messenger'] as const
  const status = Object.fromEntries(
    channels.map(ch => {
      const conn = connections?.find(c => c.channel === ch)
      return [ch, conn
        ? {
            connected: conn.is_active,
            account_id: conn.account_id,
            account_name: conn.account_name,
            scopes: conn.scopes,
            metadata: conn.metadata,
            token_expires_at: conn.token_expires_at,
            updated_at: conn.updated_at,
          }
        : { connected: false }
      ]
    })
  )

  return NextResponse.json({ status })
}
