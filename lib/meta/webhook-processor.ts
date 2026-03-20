/**
 * Shared webhook processing logic for all Meta channels.
 * Used by per-channel route handlers and the unified handler.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { sendMessage } from '@/lib/meta'
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

// Initialize Web Push
const vPubKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vPrivKey = process.env.VAPID_PRIVATE_KEY

if (vPubKey && vPrivKey) {
  webpush.setVapidDetails(
    'mailto:contact@tropitechsolutions.com',
    vPubKey,
    vPrivKey
  )
} else {
  console.warn('[Push] Missing VAPID keys. Notifications will not be sent.')
}

/**
 * Fetch a Messenger user's name and profile pic using their PSID.
 * Requires a Page Access Token.
 */
async function fetchMessengerProfile(
  psid: string,
  pageAccessToken: string
): Promise<{ name: string | null; avatarUrl: string | null }> {
  if (!pageAccessToken?.trim()) {
    console.warn('[Webhook:messenger] Profile fetch skipped: no page access token')
    return { name: null, avatarUrl: null }
  }
  try {
    const url = `${META_GRAPH}/${psid}?fields=name,profile_pic&access_token=${pageAccessToken}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.warn('[Webhook:messenger] Profile fetch error:', data.error.code, data.error.message, data.error.error_user_msg ?? '')
      return { name: null, avatarUrl: null }
    }
    const name = data.name ?? null
    const avatarUrl = data.profile_pic ?? null
    if (!name) {
      console.warn('[Webhook:messenger] Profile returned no name for PSID:', psid)
    }
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
  if (!pageAccessToken?.trim()) {
    console.warn('[Webhook:instagram] Profile fetch skipped: no page access token')
    return { name: null, avatarUrl: null }
  }
  try {
    const url = `${META_GRAPH}/${igsid}?fields=name,username,profile_pic&access_token=${pageAccessToken}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.warn('[Webhook:instagram] Profile fetch error:', data.error.code, data.error.message, data.error.error_user_msg ?? '')
      return { name: null, avatarUrl: null }
    }
    const name = data.name ?? data.username ?? null
    const avatarUrl = data.profile_pic ?? null
    if (!name) {
      console.warn('[Webhook:instagram] Profile returned no name/username for IGSID:', igsid)
    }
    return { name, avatarUrl }
  } catch (e) {
    console.warn('[Webhook:instagram] Profile fetch failed:', e)
    return { name: null, avatarUrl: null }
  }
}

/**
 * Upsert a contact row for a unified inbox conversation.
 * Called for every channel (WhatsApp, Instagram, Messenger) when a message is received.
 * Uses (customer_id, channel_type, channel_id) as the unique key.
 * customer_id here is the business owner's user id; channel_id is the platform customer id.
 */
async function upsertChannelContact(
  db: ServiceClient,
  userId: string,
  channelType: string,
  channelId: string,
  name: string | null,
  avatarUrl: string | null,
  phoneNumber?: string | null
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
        phone_number: phoneNumber ?? (channelType === 'whatsapp' ? channelId : null),
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
 * Trigger a push notification for a new message.
 * Fetches all active subscriptions for the user and sends a web-push payload.
 */
async function triggerPushNotifications(
  db: ServiceClient,
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const { data: subs, error } = await db
      .from('push_subscriptions')
      .select('*')
      .eq('customer_id', userId)

    if (error || !subs || subs.length === 0) return

    const payload = JSON.stringify({
      title,
      body,
      url: data.url || '/dashboard',
      ...data
    })

    const pushPromises = subs.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }
      return webpush.sendNotification(pushConfig, payload).catch((err: any) => {
        // If the subscription is gone or expired, remove it from the DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('[Push] Removing expired subscription:', sub.id)
          return db.from('push_subscriptions').delete().eq('id', sub.id)
        }
        console.error('[Push] Error sending notification:', err)
      })
    })

    await Promise.allSettled(pushPromises)
  } catch (e) {
    console.error('[Push] Trigger exception:', e)
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
  let account: { id: string; user_id: string; channel_account_id: string; access_token: string; metadata: unknown } | null = null

  const { data: directMatch } = await db
    .from('connected_accounts')
    .select('id, user_id, channel_account_id, access_token, metadata')
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
      .select('id, user_id, channel_account_id, access_token, metadata')
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

  const pageAccessToken: string =
    (account.metadata as Record<string, unknown>)?.page_access_token as string
    ?? account.access_token
  const tokenSource = (account.metadata as Record<string, unknown>)?.page_access_token ? 'metadata.page_access_token' : 'account.access_token'

  if (!conversation) {
    // New conversation — fetch real name from Meta profile API
    if (event.channel_type === 'messenger' || event.channel_type === 'instagram') {
      console.log(`[Webhook:${event.channel_type}] Fetching profile for new conversation (token from ${tokenSource})`)
    }
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
    // Backfill: if conversation exists but name/avatar are null, try fetching profile now (e.g. after token was fixed)
    if ((event.channel_type === 'messenger' || event.channel_type === 'instagram') && !resolvedName?.trim()) {
      if (event.channel_type === 'messenger') {
        const profile = await fetchMessengerProfile(event.customer_id, pageAccessToken)
        if (profile.name || profile.avatarUrl) {
          resolvedName = profile.name
          resolvedAvatar = profile.avatarUrl
          await db
            .from('unified_conversations')
            .update({
              customer_name: resolvedName,
              customer_avatar_url: resolvedAvatar,
            })
            .eq('id', conversationDbId)
          console.log(`[Webhook:messenger] Backfilled profile for conversation ${conversationDbId}:`, resolvedName ?? '(no name)')
        }
      } else if (event.channel_type === 'instagram') {
        const profile = await fetchInstagramProfile(event.customer_id, pageAccessToken)
        if (profile.name || profile.avatarUrl) {
          resolvedName = profile.name
          resolvedAvatar = profile.avatarUrl
          await db
            .from('unified_conversations')
            .update({
              customer_name: resolvedName,
              customer_avatar_url: resolvedAvatar,
            })
            .eq('id', conversationDbId)
          console.log(`[Webhook:instagram] Backfilled profile for conversation ${conversationDbId}:`, resolvedName ?? '(no name)')
        }
      }
    }
  }

  // 3. Upsert contact into contacts table (WhatsApp, Instagram, Messenger)
  await upsertChannelContact(
    db,
    account.user_id,
    event.channel_type,
    event.customer_id,
    resolvedName,
    resolvedAvatar,
    event.channel_type === 'whatsapp' ? event.customer_id : undefined
  )

  // 4. Insert the message (DB trigger updates conversation stats)
  const { error: msgError } = await db.from('unified_messages').upsert({
    conversation_id: conversationDbId,
    channel_message_id: event.message.id,
    sender_type: 'customer',
    content: event.message.content,
    message_type: event.message.type,
    sent_at: event.message.timestamp,
    status: 'delivered',
    metadata: event.message.metadata ?? {},
  }, {
    onConflict: 'conversation_id,channel_message_id',
    ignoreDuplicates: true
  })

  if (msgError) {
    console.error(`[Webhook:${event.channel_type}] Failed to insert message:`, msgError)
  } else {
    // 5. Trigger push notification for browser/mobile
    const channelName = event.channel_type === 'whatsapp' ? 'WhatsApp' : 
                      event.channel_type === 'instagram' ? 'Instagram' : 'Facebook'
    
    await triggerPushNotifications(
      db,
      account.user_id,
      `${resolvedName ?? 'New Message'} on ${channelName}`,
      event.message.content?.substring(0, 100) || "Image or other attachment",
      {
        url: `/dashboard?conversation=${conversationDbId}`,
        conversationId: conversationDbId,
        channel: event.channel_type
      }
    )

    // 6. Process Automations (Gated by Professional plan)
    await processAutomations(db, account, conversationDbId, event)
  }
}

/**
 * Executes matching automations for an incoming message.
 * ONLY runs for non-'free' plan users.
 */
async function processAutomations(
  db: ServiceClient,
  account: { id: string; user_id: string; access_token: string; metadata: unknown; channel_account_id?: string },
  conversationId: string,
  event: IncomingWebhookEvent
) {
  try {
    console.log(`[Automations] Processing rules for user ${account.user_id}...`)
    // 1. Gate check: Verify user is not on free plan
    const { data: customer } = await db
      .from('customers')
      .select('plan')
      .eq('id', account.user_id)
      .single()

    console.log(`[Automations] Customer plan: ${customer?.plan || 'unknown'}`)

    if (!customer || customer.plan === 'free') {
      console.log(`[Automations] Skipping: User is on ${customer?.plan || 'no'} plan`)
      return // Paywall enforced
    }

    // 2. Fetch enabled automations
    const { data: autoRules } = await db
      .from('automation_rules')
      .select('*')
      .eq('customer_id', account.user_id)
      .eq('is_enabled', true)

    console.log(`[Automations] Found ${autoRules?.length || 0} enabled rules`)

    if (!autoRules || autoRules.length === 0) return

    // 3. Evaluate each rule
    for (const rule of autoRules) {
      let isMatch = false
      const msgContent = event.message.content?.toLowerCase().trim() || ''
      const ruleTrigger = rule.trigger_value?.toLowerCase().trim() || ''
      
      console.log(`[Automations] Evaluating rule "${rule.name}" against content: "${msgContent}" (Trigger: "${ruleTrigger}")`)

      if (rule.trigger_type === 'all_messages') {
        isMatch = true
      } else if (rule.trigger_type === 'keyword' && rule.trigger_value) {
        if (msgContent.includes(ruleTrigger)) {
          isMatch = true
        }
      } else if (rule.trigger_type === 'new_conversation') {
        // Technically evaluating if it's new by looking at unread count, but let's assume always true for now if that's what's chosen
        isMatch = true 
      }

      // If matched, execute action
      if (isMatch) {
        console.log(`[Automations] Triggering rule "${rule.name}" (${rule.id}) for conversation ${conversationId}`)
        
        try {
          if (rule.action_type === 'send_message' && rule.action_value) {
            // Send automated reply
            const metaOptions = account.metadata as Record<string, any>
            
            await sendMessage({
              channelType: event.channel_type,
              accountId: account.channel_account_id || (metaOptions?.page_id) || '',
              pageId: metaOptions?.page_id,
              accessToken: metaOptions?.page_access_token || account.access_token,
              recipientId: event.customer_id,
              content: rule.action_value,
              humanAgentTag: true
            })

            // Log the automated outbound message back to the DB
            await db.from('unified_messages').insert({
              conversation_id: conversationId,
              channel_message_id: `auto_${Date.now()}`,
              sender_type: 'business',
              content: rule.action_value,
              message_type: 'text',
              sent_at: new Date().toISOString(),
              status: 'sent',
              is_automated: true,
              metadata: { automation_rule_id: rule.id }
            })
          }
          
          // Log the trigger count up
          await db.from('automation_rules')
            .update({ times_triggered: (rule.times_triggered || 0) + 1 })
            .eq('id', rule.id)

        } catch (execErr) {
          console.error(`[Automations] Error executing rule ${rule.name}:`, execErr)
        }

        // Only process the first matching rule to avoid spam loops
        break 
      }
    }
  } catch (err) {
    console.error('[Automations] Failed during processing:', err)
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
