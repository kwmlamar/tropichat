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

const META_GRAPH = 'https://graph.facebook.com/v19.0'

/**
 * Fetch a Messenger user's name and profile pic using their PSID.
 * Requires a Page Access Token.
 */
async function fetchMessengerProfile(
  psid: string,
  pageAccessToken: string
): Promise<{ name: string | null; avatarUrl: string | null }> {
  try {
    const url = `${META_GRAPH}/${psid}?fields=name,profile_pic&access_token=${pageAccessToken}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.warn('[Webhook:messenger] Profile fetch error:', data.error.message)
      return { name: null, avatarUrl: null }
    }
    const name = data.name ?? null
    const avatarUrl = data.profile_pic ?? null
    return { name, avatarUrl }
  } catch (e) {
    console.warn('[Webhook:messenger] Profile fetch failed:', e)
    return { name: null, avatarUrl: null }
  }
}

/**
 * Fetch an Instagram user's name/username using their IGSID.
 * Requires a Page Access Token (linked to the IG account).
 */
async function fetchInstagramProfile(
  igsid: string,
  pageAccessToken: string
): Promise<{ name: string | null; avatarUrl: string | null }> {
  try {
    const url = `${META_GRAPH}/${igsid}?fields=name,username,profile_pic&access_token=${pageAccessToken}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.warn('[Webhook:instagram] Profile fetch error:', data.error.message)
      return { name: null, avatarUrl: null }
    }
    const name = data.name ?? data.username ?? null
    const avatarUrl = data.profile_pic ?? null
    return { name, avatarUrl }
  } catch (e) {
    console.warn('[Webhook:instagram] Profile fetch failed:', e)
    return { name: null, avatarUrl: null }
  }
}

/**
 * Upsert a contact row for a unified inbox conversation.
 * Uses (customer_id/user_id, channel_type, channel_id) as the unique key.
 */
async function upsertChannelContact(
  db: ServiceClient,
  userId: string,
  channelType: string,
  channelId: string,
  name: string | null,
  avatarUrl: string | null
): Promise<void> {
  try {
    const now = new Date().toISOString()
    const { error } = await db.from('contacts').upsert(
      {
        customer_id: userId,
        channel_type: channelType,
        channel_id: channelId,
        name: name ?? null,
        avatar_url: avatarUrl ?? null,
        phone_number: null,
        last_message_at: now,
        first_message_at: now,
        total_messages_received: 1,
        total_messages_sent: 0,
        is_blocked: false,
        opted_out: false,
        tags: [],
      },
      {
        onConflict: 'customer_id,channel_type,channel_id',
        ignoreDuplicates: false,
      }
    )
    if (error) {
      console.error(`[Webhook:${channelType}] Failed to upsert contact:`, error)
    } else {
      console.log(`[Webhook:${channelType}] Contact upserted for ${channelId} (${name ?? 'no name'})`)
    }
  } catch (e) {
    console.error(`[Webhook:${channelType}] Contact upsert exception:`, e)
  }
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
 * - Find or create the conversation (fetching profile name for new ones)
 * - Upsert the contact into the contacts table
 * - Insert the message
 */
export async function handleIncomingMessage(
  db: ServiceClient,
  event: IncomingWebhookEvent
): Promise<void> {
  // 1. Find the connected account (include access_token for profile lookups)
  // For Instagram, recipient.id in the webhook may be the IGID OR the Facebook Page ID,
  // so we try both: first by channel_account_id, then by metadata->page_id.
  let account: { id: string; user_id: string; access_token: string; metadata: unknown } | null = null

  const { data: directMatch } = await db
    .from('connected_accounts')
    .select('id, user_id, access_token, metadata')
    .eq('channel_type', event.channel_type)
    .eq('channel_account_id', event.account_id)
    .eq('is_active', true)
    .single()

  account = directMatch

  // Fallback: for instagram, try matching by metadata->page_id
  if (!account && event.channel_type === 'instagram') {
    console.log(`[Webhook:instagram] Direct match failed for ${event.account_id}, trying page_id fallback`)
    const { data: pageMatch } = await db
      .from('connected_accounts')
      .select('id, user_id, access_token, metadata')
      .eq('channel_type', 'instagram')
      .eq('is_active', true)
      .filter('metadata->>page_id', 'eq', event.account_id)
      .single()
    account = pageMatch
  }

  if (!account) {
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
    .select('id, customer_name')
    .eq('connected_account_id', account.id)
    .eq('channel_conversation_id', channelConvId)
    .single()

  let conversationDbId: string
  let resolvedName: string | null = event.customer_name ?? null
  let resolvedAvatar: string | null = null

  if (!conversation) {
    // New conversation — fetch real name from Meta profile API
    const pageAccessToken: string =
      (account.metadata as Record<string, unknown>)?.page_access_token as string
      ?? account.access_token

    if (event.channel_type === 'messenger') {
      const profile = await fetchMessengerProfile(event.customer_id, pageAccessToken)
      resolvedName = profile.name
      resolvedAvatar = profile.avatarUrl
    } else if (event.channel_type === 'instagram') {
      const profile = await fetchInstagramProfile(event.customer_id, pageAccessToken)
      resolvedName = profile.name
      resolvedAvatar = profile.avatarUrl
    }

    const { data: newConv, error: insertError } = await db
      .from('unified_conversations')
      .insert({
        connected_account_id: account.id,
        channel_type: event.channel_type,
        channel_conversation_id: channelConvId,
        customer_name: resolvedName,
        customer_avatar_url: resolvedAvatar,
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
    resolvedName = conversation.customer_name
  }

  // 3. Upsert contact (Messenger/Instagram) into contacts table
  if (event.channel_type === 'messenger' || event.channel_type === 'instagram') {
    await upsertChannelContact(
      db,
      account.user_id,
      event.channel_type,
      event.customer_id,
      resolvedName,
      resolvedAvatar
    )
  }

  // 4. Insert the message (DB trigger updates conversation stats)
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
