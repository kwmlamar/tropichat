/**
 * POST /api/meta/disconnect
 *
 * Disconnects a specific Meta channel by marking it inactive.
 * Body: { channel: 'whatsapp' | 'instagram' | 'messenger' }
 */

import { NextResponse } from 'next/server'
import { createServerClient, getWorkspaceIdServer } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { customerId, error: ctxErr } = await getWorkspaceIdServer(token)
  if (ctxErr || !customerId) {
    return NextResponse.json({ error: ctxErr || 'Workspace not found' }, { status: 404 })
  }

  const supabase = createServerClient(token)
  const body = await request.json()
  const { channel } = body

  if (!['whatsapp', 'instagram', 'messenger'].includes(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  }

  const { error } = await supabase
    .from('meta_connections')
    .update({ is_active: false, access_token: '' })
    .eq('user_id', customerId)
    .eq('channel', channel)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also deactivate the corresponding connected_accounts row
  // so the inbox/webhook system stops using this token
  await supabase
    .from('connected_accounts')
    .update({ is_active: false, access_token: '' })
    .eq('user_id', customerId)
    .eq('channel_type', channel)

  return NextResponse.json({ success: true })
}
