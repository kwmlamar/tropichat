/**
 * Shared webhook processing logic for all Meta channels.
 * Used by per-channel route handlers and the unified handler.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { IncomingWebhookEvent, MessageStatusUpdate } from '@/types/unified-inbox'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceClient = SupabaseClient<any, 'public', any>

let _serviceClient: ServiceClient | null = null

export function getServiceClient(): ServiceClient {
  if (_serviceClient) return _serviceClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  }
  _serviceClient = createClient(url, serviceKey)
  return _serviceClient
}

/**
 * Verify Meta webhook signature using HMAC-SHA256.
 */
export async function verifyMetaSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const computed =
    'sha256=' +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  return computed === signature
}

/**
 * Process an incoming message webhook event:
 * - Find the connected account
 * - Find or create the conversation
 * - Insert the message
 */
export async function handleIncomingMessage(
  db: ServiceClient,
  event: IncomingWebhookEvent
): Promise<void> {
  // 1. Find the connected account
  const { data: account, error: accountError } = await db
    .from('connected_accounts')
    .select('id, user_id')
    .eq('channel_type', event.channel_type)
    .eq('channel_account_id', event.account_id)
    .eq('is_active', true)
    .single()

  if (accountError || !account) {
    console.warn(
      `[Webhook:${event.channel_type}] No connected account found for`,
      event.account_id
    )
    return
  }

  // 2. Find or create conversation
  const channelConvId = event.customer_id

  const { data: conversation } = await db
    .from('unified_conversations')
    .select('id')
    .eq('connected_account_id', account.id)
    .eq('channel_conversation_id', channelConvId)
    .single()

  let conversationDbId: string

  if (!conversation) {
    const { data: newConv, error: insertError } = await db
      .from('unified_conversations')
      .insert({
        connected_account_id: account.id,
        channel_type: event.channel_type,
        channel_conversation_id: channelConvId,
        customer_name: event.customer_name ?? null,
        customer_id: event.customer_id,
        last_message_at: event.message.timestamp,
        last_message_preview: event.message.content?.substring(0, 100) ?? null,
        unread_count: 1,
      })
      .select('id')
      .single()

    if (insertError || !newConv) {
      console.error(`[Webhook:${event.channel_type}] Failed to create conversation:`, insertError)
      return
    }
    conversationDbId = newConv.id
  } else {
    conversationDbId = conversation.id
  }

  // 3. Insert the message (DB trigger updates conversation stats)
  const { error: msgError } = await db.from('unified_messages').insert({
    conversation_id: conversationDbId,
    channel_message_id: event.message.id,
    sender_type: 'customer',
    content: event.message.content,
    message_type: event.message.type,
    sent_at: event.message.timestamp,
    status: 'delivered',
    metadata: event.message.metadata ?? {},
  })

  if (msgError) {
    console.error(`[Webhook:${event.channel_type}] Failed to insert message:`, msgError)
  }
}

/**
 * Process a message status update webhook event.
 */
export async function handleStatusUpdate(
  db: ServiceClient,
  status: MessageStatusUpdate
): Promise<void> {
  if (!status.channel_message_id) return

  const updates: Record<string, unknown> = { status: status.status }

  switch (status.status) {
    case 'delivered':
      updates.delivered_at = status.timestamp
      break
    case 'read':
      updates.read_at = status.timestamp
      break
    case 'failed':
      updates.failed_at = status.timestamp
      updates.error_message = status.error_message ?? null
      break
  }

  const { error } = await db
    .from('unified_messages')
    .update(updates)
    .eq('channel_message_id', status.channel_message_id)

  if (error) {
    console.error(`[Webhook:${status.channel_type}] Failed to update status:`, error)
  }
}
