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
      .maybeSingle()

    if (insertError || !newConv) {
      // If insert failed (likely due to race condition where another webhook created it), try finding it once more
      const { data: altConv } = await db
        .from('unified_conversations')
        .select('id, customer_name')
        .eq('connected_account_id', account.id)
        .eq('channel_conversation_id', channelConvId)
        .single()
      
      if (!altConv) {
        console.error(`[Webhook:${event.channel_type}] Failed to create or find conversation:`, insertError)
        return
      }
      conversationDbId = altConv.id
      resolvedName = altConv.customer_name
    } else {
      conversationDbId = newConv.id
    }
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

  // 4. Insert message (ignore echoes we already manually logged)
  const senderType = event.sender_type || 'customer'

  if (senderType === 'business') {
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString()
    const { data: existing } = await db
      .from('unified_messages')
      .select('id')
      .eq('conversation_id', conversationDbId)
      .eq('sender_type', 'business')
      .eq('content', event.message.content)
      .gte('sent_at', tenSecondsAgo)
      .maybeSingle()

    if (existing) {
      console.log(`[Webhook:${event.channel_type}] De-duped echo message: already exists in DB`)
      return
    }
  }

  const { data: insertedMsg, error: msgError } = await db.from('unified_messages').insert({
    conversation_id: conversationDbId,
    channel_message_id: event.message.id,
    sender_type: senderType,
    content: event.message.content,
    message_type: event.message.type,
    sent_at: event.message.timestamp,
    status: 'delivered',
    metadata: event.message.metadata ?? {},
  }).select('id').maybeSingle()

  if (msgError && msgError.code !== '23505') {
    console.error(`[Webhook:${event.channel_type}] Failed to insert message:`, msgError)
    return
  }

  const isNewMessage = !!insertedMsg

  // Track whether this message belongs to a brand-new conversation (new lead milestone)
  const isNewConversation = !conversation

  // Only run side effects (notifications, automations) for NEW messages from CUSTOMERS
  if (isNewMessage && senderType === 'customer') {
    // 5. Fetch notification preferences and gate push notification
    const channelAbbr = event.channel_type === 'whatsapp' ? 'WA' :
                        event.channel_type === 'instagram' ? 'IG' : 'Messenger'

    const { data: notifCustomer } = await db
      .from('customers')
      .select('ai_autopilot_enabled, notification_level')
      .eq('id', account.user_id)
      .maybeSingle()

    const notifLevel = notifCustomer?.notification_level ?? 'all'
    const autopilotOn = notifCustomer?.ai_autopilot_enabled ?? false

    // Push when: user wants all messages, OR autopilot is off, OR it's a fresh lead
    const shouldNotify = notifLevel === 'all' || !autopilotOn || isNewConversation

    if (shouldNotify) {
      await triggerPushNotifications(
        db,
        account.user_id,
        isNewConversation
          ? `New lead: ${resolvedName ?? 'Someone new'} (${channelAbbr})`
          : `${resolvedName ?? 'New Message'} (${channelAbbr})`,
        event.message.content?.substring(0, 100) || "Image or other attachment",
        {
          url: `/dashboard?conversation=${conversationDbId}`,
          conversationId: conversationDbId,
          channel: event.channel_type,
          ...(isNewConversation ? { milestoneType: 'new_lead' } : {}),
        }
      )
    }

    // 6. Process Automations (Gated by Professional plan)
    await processAutomations(db, account, conversationDbId, event)

    // 7. Process Auto-Reply (Offline Message)
    await processAutoReply(db, account, conversationDbId, event)

    // 8. Process AI Auto-Pilot (all channels: WhatsApp, Instagram, Messenger)
    await processAIAutoPilot(db, account, conversationDbId, event, resolvedName, notifCustomer)
  } else if (isNewMessage && senderType === 'business') {
    console.log(`[Webhook:${event.channel_type}] Recorded echo message (sent via external app)`)
  } else if (!isNewMessage) {
    console.log(`[Webhook:${event.channel_type}] Skipping duplicate notification for ${event.message.id}`)
  }
}

/**
 * AI Auto-Pilot: Generates and sends AI replies for all channels.
 * Only fires when ai_autopilot_enabled = true on the customer record.
 * Skips if a human agent replied in the last 2 minutes (cooldown guard).
 */
async function processAIAutoPilot(
  db: ServiceClient,
  account: { id: string; user_id: string; access_token: string; metadata: unknown; channel_account_id?: string },
  conversationId: string,
  event: IncomingWebhookEvent,
  resolvedName: string | null,
  prefetchedCustomer?: { ai_autopilot_enabled: boolean; notification_level: string } | null
) {
  try {
    // 1. Check if auto-pilot is enabled — use prefetched data to avoid a second DB read
    const autopilotEnabled = prefetchedCustomer?.ai_autopilot_enabled ?? false
    if (!autopilotEnabled) {
      // If no prefetched data, fall back to a fresh query
      if (!prefetchedCustomer) {
        const { data: customer, error: custError } = await db
          .from('customers')
          .select('ai_autopilot_enabled, plan')
          .eq('id', account.user_id)
          .single()
        if (custError || !customer?.ai_autopilot_enabled) {
          if (customer && !customer.ai_autopilot_enabled) {
            console.log(`[AI Auto-Pilot] Skipped: auto-pilot OFF for user ${account.user_id}`)
          }
          return
        }
      } else {
        console.log(`[AI Auto-Pilot] Skipped: auto-pilot OFF for user ${account.user_id}`)
        return
      }
    }

    // 2. Skip if a human has taken over this conversation
    const { data: convState } = await db
      .from('unified_conversations')
      .select('human_agent_enabled')
      .eq('id', conversationId)
      .maybeSingle()

    if (convState?.human_agent_enabled) {
      console.log(`[AI Auto-Pilot] Skipped: human agent active for conversation ${conversationId}`)
      return
    }

    // 3. Cooldown guard: skip if a HUMAN (not automated) replied in the last 2 minutes
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: recentHumanReply } = await db
      .from('unified_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'business')
      .gte('sent_at', twoMinsAgo)
      .not('metadata->>is_ai_reply', 'eq', 'true')
      .not('metadata->>is_auto_reply', 'eq', 'true')
      .not('metadata->>is_automated', 'eq', 'true')
      .limit(1)
      .maybeSingle()

    if (recentHumanReply) {
      console.log(`[AI Auto-Pilot] Skipped: human replied within last 2 minutes (${conversationId})`)
      return
    }

    console.log(`[AI Auto-Pilot] Generating reply for conversation ${conversationId} on ${event.channel_type}`)

    // 3. Dynamically import to avoid circular deps
    const { processInboundWithAI, selectTemplateForReEngagement } = await import('@/lib/ai')
    const metaOptions = account.metadata as Record<string, any>

    // ── 24-hour window check (WhatsApp only) ────────────────────────────────
    // After 24h since the last inbound customer message, WhatsApp blocks free-form
    // messages. We must fall back to a pre-approved template instead.
    if (event.channel_type === 'whatsapp') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentInbound } = await db
        .from('unified_messages')
        .select('sent_at')
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'customer')
        .gte('sent_at', twentyFourHoursAgo)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const windowOpen = !!recentInbound

      if (!windowOpen) {
        console.log(`[AI Auto-Pilot] 24h window closed for ${conversationId} — switching to template mode`)

        // Fetch this user's approved WhatsApp templates
        const { data: templateRows } = await db
          .from('whatsapp_meta_templates')
          .select('name, language, components')
          .eq('customer_id', account.user_id)
          .eq('status', 'APPROVED')

        if (!templateRows || templateRows.length === 0) {
          console.log(`[AI Auto-Pilot] No approved templates for user ${account.user_id} — skipping 24h re-engagement`)
          return
        }

        // Extract body text from template components
        const approvedTemplates = templateRows.map((t: any) => {
          const bodyComp = Array.isArray(t.components)
            ? t.components.find((c: any) => c.type === 'BODY')
            : null
          return {
            name: t.name as string,
            language: t.language as string,
            body: (bodyComp?.text as string) ?? '',
          }
        })

        // Get the last few messages as summary context for the AI
        const { data: recentMsgs } = await db
          .from('unified_messages')
          .select('content, sender_type')
          .eq('conversation_id', conversationId)
          .order('sent_at', { ascending: false })
          .limit(6)

        const summary = (recentMsgs ?? [])
          .reverse()
          .map((m: any) => `${m.sender_type === 'customer' ? 'Customer' : 'Business'}: ${m.content}`)
          .join('\n')

        // Fetch business type for context
        const { data: bizCustomer } = await db
          .from('customers')
          .select('business_brief')
          .eq('id', account.user_id)
          .maybeSingle()
        const brief = bizCustomer?.business_brief as any
        const bizType = brief?.businessType ?? 'service business'

        const selection = await selectTemplateForReEngagement({
          approvedTemplates,
          customerName: resolvedName,
          conversationSummary: summary,
          businessType: bizType,
        })

        if (!selection) {
          console.log(`[AI Auto-Pilot] Template selection failed — skipping`)
          return
        }

        // Build template components for the Meta API call
        const components: any[] = []
        if (selection.variables.length > 0) {
          components.push({
            type: 'body',
            parameters: selection.variables.map(v => ({ type: 'text', text: v })),
          })
        }

        const { sendWhatsAppTemplate } = await import('@/lib/meta')
        await sendWhatsAppTemplate({
          phoneNumberId: account.channel_account_id || '',
          accessToken: metaOptions?.page_access_token || account.access_token,
          to: event.customer_id,
          templateName: selection.templateName,
          languageCode: selection.languageCode,
          components: components.length > 0 ? (components as any) : undefined,
        })

        // Resolve body text with filled variables for DB logging
        const selectedTemplate = approvedTemplates.find(t => t.name === selection.templateName)
        let loggedContent = selectedTemplate?.body ?? `[Template: ${selection.templateName}]`
        selection.variables.forEach((v, i) => {
          loggedContent = loggedContent.replace(`{{${i + 1}}}`, v)
        })

        await db.from('unified_messages').insert({
          conversation_id: conversationId,
          channel_message_id: `ai_tpl_${Date.now()}`,
          sender_type: 'business',
          content: loggedContent,
          message_type: 'template',
          sent_at: new Date().toISOString(),
          status: 'sent',
          metadata: {
            is_ai_reply: true,
            is_template_message: true,
            template_name: selection.templateName,
            channel: event.channel_type,
          },
        })

        console.log(`[AI Auto-Pilot] ✓ Sent template "${selection.templateName}" to ${event.customer_id}`)
        return
      }
    }
    // ── End 24h window check ────────────────────────────────────────────────

    const aiResult = await processInboundWithAI(conversationId, event.message.content || '')

    if (!aiResult) {
      console.log(`[AI Auto-Pilot] No reply generated for ${conversationId}`)
      return
    }

    const { reply: aiReply, usedFallback } = aiResult

    // 4. Send the reply on the correct channel
    await sendMessage({
      channelType: event.channel_type,
      accountId: account.channel_account_id || metaOptions?.page_id || '',
      pageId: metaOptions?.page_id,
      accessToken: metaOptions?.page_access_token || account.access_token,
      recipientId: event.customer_id,
      content: aiReply,
    })

    // 5. Log AI reply to the messages table
    await db.from('unified_messages').insert({
      conversation_id: conversationId,
      channel_message_id: `ai_${Date.now()}`,
      sender_type: 'business',
      content: aiReply,
      message_type: 'text',
      sent_at: new Date().toISOString(),
      status: 'sent',
      metadata: { is_ai_reply: true, channel: event.channel_type }
    })

    console.log(`[AI Auto-Pilot] ✓ Replied on ${event.channel_type} to ${event.customer_id}: "${aiReply.substring(0, 80)}"`)

    // 6. If AI hit a hand-off fallback, mark conversation and fire a milestone notification
    if (usedFallback) {
      await db
        .from('unified_conversations')
        .update({
          human_agent_enabled: true,
          human_agent_reason: 'Tropi AI reached hand-off fallback',
          human_agent_marked_at: new Date().toISOString(),
        })
        .eq('id', conversationId)

      const channelAbbr = event.channel_type === 'whatsapp' ? 'WA' :
                          event.channel_type === 'instagram' ? 'IG' : 'Messenger'

      // Always push this milestone — it requires human action regardless of notification_level
      await triggerPushNotifications(
        db,
        account.user_id,
        `Tropi AI needs your help (${channelAbbr})`,
        `${resolvedName ?? 'A customer'} asked something Tropi AI couldn't handle.`,
        {
          url: `/dashboard?conversation=${conversationId}`,
          conversationId,
          channel: event.channel_type,
          milestoneType: 'ai_needs_human',
        }
      )

      console.log(`[AI Auto-Pilot] Hand-off triggered — human takeover marked for ${conversationId}`)
    }
  } catch (err) {
    console.error('[AI Auto-Pilot] Failed:', err)
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
    console.log(`[Automations] DEBUG: Checking rules for user ${account.user_id}`)
    console.log(`[Automations] DEBUG: Incoming content: "${event.message.content}"`)

    // 1. Gate check: Verify user is not on free plan
    const { data: customer, error: custError } = await db
      .from('customers')
      .select('plan')
      .eq('id', account.user_id)
      .single()

    if (custError) {
      console.error(`[Automations] Error fetching customer:`, custError)
      return
    }

    console.log(`[Automations] DEBUG: Customer plan: ${customer?.plan || 'unknown'}`)

    if (!customer || customer.plan === 'free') {
      console.log(`[Automations] Skipping: User is on ${customer?.plan || 'no'} plan`)
      return // Paywall enforced
    }

    // 2. Fetch enabled automations
    const { data: autoRules, error: rulesError } = await db
      .from('automation_rules')
      .select('*')
      .eq('customer_id', account.user_id)
      .eq('is_enabled', true)

    if (rulesError) {
      console.error(`[Automations] Error fetching rules:`, rulesError)
      return
    }

    console.log(`[Automations] DEBUG: Found ${autoRules?.length || 0} enabled rules for user`)

    if (!autoRules || autoRules.length === 0) return

    // 3. Evaluate each rule
    for (const rule of autoRules) {
      let isMatch = false
      const msgContent = (event.message.content || '').toLowerCase().trim()
      const ruleTrigger = (rule.trigger_value || '').toLowerCase().trim()
      
      console.log(`[Automations] DEBUG: Comparing "${msgContent}" to "${ruleTrigger}" (Type: ${rule.trigger_type})`)

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
            // Legacy: send a free-form message (kept for backward compat with existing rules)
            const metaOptions = account.metadata as Record<string, any>
            await sendMessage({
              channelType: event.channel_type,
              accountId: account.channel_account_id || (metaOptions?.page_id) || '',
              pageId: metaOptions?.page_id,
              accessToken: metaOptions?.page_access_token || account.access_token,
              recipientId: event.customer_id,
              content: rule.action_value,
            })
            await db.from('unified_messages').insert({
              conversation_id: conversationId,
              channel_message_id: `auto_${Date.now()}`,
              sender_type: 'business',
              content: rule.action_value,
              message_type: 'text',
              sent_at: new Date().toISOString(),
              status: 'sent',
              metadata: { automation_rule_id: rule.id, is_automated: true }
            })

          } else if (rule.action_type === 'add_tag' && rule.action_value) {
            // Append tag to contact record (idempotent via array concat + dedup)
            const tag = rule.action_value.trim()
            const { data: contact } = await db
              .from('contacts')
              .select('id, tags')
              .eq('customer_id', account.user_id)
              .eq('channel_type', event.channel_type)
              .eq('channel_id', event.customer_id)
              .maybeSingle()

            if (contact) {
              const existingTags: string[] = Array.isArray(contact.tags) ? contact.tags : []
              if (!existingTags.includes(tag)) {
                await db.from('contacts')
                  .update({ tags: [...existingTags, tag] })
                  .eq('id', contact.id)
                console.log(`[Automations] Added tag "${tag}" to contact ${event.customer_id}`)
              }
            }

          } else if (rule.action_type === 'mark_resolved') {
            await db.from('unified_conversations')
              .update({ status: 'resolved', resolved_at: new Date().toISOString() })
              .eq('id', conversationId)
            console.log(`[Automations] Marked conversation ${conversationId} as resolved`)

          } else if (rule.action_type === 'assign_to_human') {
            await db.from('unified_conversations')
              .update({
                human_agent_enabled: true,
                human_agent_reason: `Automation rule: ${rule.name}`,
                human_agent_marked_at: new Date().toISOString(),
              })
              .eq('id', conversationId)
            console.log(`[Automations] Handed off conversation ${conversationId} to human agent`)
          }

          // Log the trigger count up
          await db.from('automation_rules')
            .update({
              times_triggered: (rule.times_triggered || 0) + 1,
              last_triggered_at: new Date().toISOString()
            })
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
 * Checks if current time is within business hours and sends an offline message if enabled.
 */
async function processAutoReply(
  db: ServiceClient,
  account: { user_id: string; access_token: string; metadata: unknown; channel_account_id?: string },
  conversationId: string,
  event: IncomingWebhookEvent
) {
  try {
    // 1. Fetch auto-reply settings
    const { data: customer, error } = await db
      .from('customers')
      .select('auto_reply_enabled, auto_reply_message, business_hours, timezone')
      .eq('id', account.user_id)
      .single()

    if (error || !customer || !customer.auto_reply_enabled || !customer.auto_reply_message) {
      return
    }

    // 2. Check if within business hours
    const isClosed = !isWithinBusinessHours(
      customer.business_hours as any,
      customer.timezone || 'America/Nassau'
    )

    if (isClosed) {
      console.log(`[Auto-Reply] Business is closed. Sending offline message to ${event.customer_id}`)
      
      const metaOptions = account.metadata as Record<string, any>
      
      await sendMessage({
        channelType: event.channel_type,
        accountId: account.channel_account_id || (metaOptions?.page_id) || '',
        pageId: metaOptions?.page_id,
        accessToken: metaOptions?.page_access_token || account.access_token,
        recipientId: event.customer_id,
        content: customer.auto_reply_message,
      })

      // Log the automated outbound message
      await db.from('unified_messages').insert({
        conversation_id: conversationId,
        channel_message_id: `offline_${Date.now()}`,
        sender_type: 'business',
        content: customer.auto_reply_message,
        message_type: 'text',
        sent_at: new Date().toISOString(),
        status: 'sent',
        metadata: { is_auto_reply: true }
      })
    }
  } catch (err) {
    console.error('[Auto-Reply] Failed to process:', err)
  }
}

/**
 * Utility to check if a Date is within business hours.
 */
function isWithinBusinessHours(
  businessHours: Record<string, { start: string; end: string; enabled: boolean }> | null,
  timezone: string
): boolean {
  if (!businessHours) return true

  const now = new Date()
  
  // Get current day and time in target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  })
  
  const parts = formatter.formatToParts(now)
  const dayName = parts.find(p => p.type === 'weekday')?.value.toLowerCase() || ''
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  const currentTimeInMinutes = hour * 60 + minute

  const schedule = businessHours[dayName]
  if (!schedule || !schedule.enabled) return false

  const [startH, startM] = schedule.start.split(':').map(Number)
  const [endH, endM] = schedule.end.split(':').map(Number)
  
  const startInMinutes = startH * 60 + startM
  const endInMinutes = endH * 60 + endM

  return currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes
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
