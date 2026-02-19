/**
 * DELETE /api/meta/templates/:name
 *
 * Deletes a WhatsApp message template by name from Meta's API.
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const META_GRAPH = 'https://graph.facebook.com/v19.0'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
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

  const { data: connection } = await supabase
    .from('meta_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('channel', 'whatsapp')
    .eq('is_active', true)
    .single()

  if (!connection) {
    return NextResponse.json(
      { error: 'WhatsApp not connected. Please connect via Settings > Integrations.' },
      { status: 400 }
    )
  }

  // Demo token — simulate successful deletion without calling Meta API
  if (connection.access_token.startsWith('DEMO_')) {
    console.log('[meta/templates] Demo token detected — simulating template deletion:', name)
    return NextResponse.json({ success: true })
  }

  // Resolve WABA ID — use DB value, fall back to env var
  const wabaId = connection.account_id || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
  if (!wabaId) {
    return NextResponse.json(
      { error: 'No WhatsApp Business Account found. Reconnect your Meta account.' },
      { status: 400 }
    )
  }

  try {
    const url = `${META_GRAPH}/${wabaId}/message_templates?name=${encodeURIComponent(name)}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    })

    const data = await res.json()

    if (data.error) {
      console.error('Meta template delete error:', data.error)
      return NextResponse.json(
        { error: data.error.message || 'Failed to delete template' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Template delete error:', e)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
