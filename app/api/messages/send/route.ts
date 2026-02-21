/**
 * Unified Message Send API
 *
 * POST /api/messages/send
 *
 * Sends a message through any connected channel (WhatsApp, Instagram, Messenger).
 * Supports human_agent tag for extended 7-day response window.
 * Requires authentication via Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage, MetaApiClientError } from '@/lib/meta'
import type { ChannelType, MessageContentType } from '@/types/unified-inbox'

interface SendRequestBody {
  conversation_id: string
  content: string
  message_type?: MessageContentType
  media_url?: string
  human_agent_tag?: boolean
}

export async function POST(request: NextRequest) {
  // Authenticate using the Authorization header (Supabase JWT)
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SendRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { conversation_id, content, message_type = 'text', media_url, human_agent_tag } = body
  if (!conversation_id || !content) {
    return NextResponse.json({ error: 'conversation_id and content are required' }, { status: 400 })
  }

  // Fetch conversation + connected account (RLS ensures user ownership)
  const { data: conversation, error: convError } = await supabase
    .from('unified_conversations')
    .select(`
      id,
      channel_type,
      channel_conversation_id,
      customer_id,
      connected_account_id,
      human_agent_enabled,
      connected_account:connected_accounts(
        id, channel_type, channel_account_id, access_token, metadata
      )
    `)
    .eq('id', conversation_id)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const account = conversation.connected_account as unknown as {
    id: string
    channel_type: ChannelType
    channel_account_id: string
    access_token: string
    metadata: Record<string, string> | null
  }

  if (!account) {
    return NextResponse.json({ error: 'Connected account not found' }, { status: 404 })
  }

  // For Instagram/Messenger, prefer the page access token stored in metadata
  // over the user access token — page tokens are required for sending messages
  const accessToken =
    account.metadata?.page_access_token ?? account.access_token

  // Determine if we should use human_agent tag
  // Use it only if explicitly passed or conversation has human_agent_enabled.
  // Normal Messenger messages use RESPONSE type (valid within 24h of user message).
  const useHumanAgentTag =
    human_agent_tag ||
    conversation.human_agent_enabled

  // Instagram demo mode: simulate sending without hitting the Meta API.
  // Only active when NEXT_PUBLIC_INSTAGRAM_DEMO_MODE=true AND channel is instagram.
  // WhatsApp and Messenger are never affected.
  if (
    account.channel_type === 'instagram' &&
    process.env.NEXT_PUBLIC_INSTAGRAM_DEMO_MODE === 'true'
  ) {
    const demoMessageId = `demo_${Date.now()}`
    const metadata: Record<string, unknown> = {}
    if (media_url) metadata.media_url = media_url
    if (useHumanAgentTag) metadata.human_agent_tag = true

    const { data: message, error: insertError } = await supabase
      .from('unified_messages')
      .insert({
        conversation_id,
        channel_message_id: demoMessageId,
        sender_type: 'business',
        content,
        message_type,
        status: 'sending',
        sent_at: new Date().toISOString(),
        metadata,
      })
      .select()
      .single()

    if (insertError || !message) {
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 })
    }

    // Fire-and-forget status progression — simulates real delivery timeline
    const progressStatus = async () => {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await new Promise(r => setTimeout(r, 300))
      await adminSupabase
        .from('unified_messages')
        .update({ status: 'sent', delivered_at: new Date().toISOString() })
        .eq('id', message.id)

      await new Promise(r => setTimeout(r, 700))
      await adminSupabase
        .from('unified_messages')
        .update({ status: 'delivered' })
        .eq('id', message.id)

      await new Promise(r => setTimeout(r, 1000))
      await adminSupabase
        .from('unified_messages')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', message.id)
    }
    progressStatus()

    return NextResponse.json({
      success: true,
      message,
      human_agent_tag: useHumanAgentTag,
    })
  }

  try {
    // Send via Meta API
    const result = await sendMessage({
      channelType: account.channel_type,
      accountId: account.channel_account_id,
      accessToken,
      recipientId: conversation.customer_id,
      content,
      messageType: message_type,
      mediaUrl: media_url,
      humanAgentTag: useHumanAgentTag,
    })

    // Extract the platform message ID
    const channelMessageId =
      result.messages?.[0]?.id ??  // WhatsApp
      result.message_id ??         // Instagram / Messenger
      null

    // Build metadata
    const metadata: Record<string, unknown> = {}
    if (media_url) metadata.media_url = media_url
    if (useHumanAgentTag) metadata.human_agent_tag = true

    // Store the message in our database
    const { data: message, error: insertError } = await supabase
      .from('unified_messages')
      .insert({
        conversation_id,
        channel_message_id: channelMessageId,
        sender_type: 'business',
        content,
        message_type,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Send] Failed to store message:', insertError)
      // Message was sent successfully via API, just failed to store
      return NextResponse.json({
        success: true,
        message: null,
        warning: 'Message sent but failed to store locally',
        channel_message_id: channelMessageId,
        human_agent_tag: useHumanAgentTag,
      })
    }

    return NextResponse.json({
      success: true,
      message,
      human_agent_tag: useHumanAgentTag,
    })
  } catch (error) {
    const metaError = error instanceof MetaApiClientError ? error : null
    console.error('[Send] Failed to send message:', {
      channel: account.channel_type,
      human_agent_tag: useHumanAgentTag,
      conversation_id: conversation_id,
      fbtrace_id: metaError?.fbtraceId,
      code: metaError?.code,
      message: error instanceof Error ? error.message : String(error),
    })
    console.error(error)

    // Meta API error #3 = app missing capability/permission for this API
    if (error instanceof MetaApiClientError && error.code === 3) {
      return NextResponse.json(
        {
          error: 'Application does not have the capability to make this API call.',
          code: 'META_CAPABILITY_REQUIRED',
          hint: 'In Meta for Developers: add the correct product (WhatsApp / Instagram / Messenger), request the required permissions (e.g. whatsapp_business_messaging, instagram_manage_messages, pages_messaging), and ensure Advanced Access or App Review approval if the app is in Live mode. Use a Page access token for sending messages.',
        },
        { status: 403 }
      )
    }

    // Meta API error #1 = generic/unknown; include fbtrace_id and common causes
    if (error instanceof MetaApiClientError && error.code === 1) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'META_UNKNOWN_ERROR',
          fbtrace_id: error.fbtraceId,
          hint: 'Check: (1) Recipient ID format (e.g. WhatsApp: E.164 without +; Instagram/Messenger: PSID). (2) Use a Page access token for sending. (3) 24h messaging window or approved message tag (e.g. HUMAN_AGENT). (4) Meta for Developers > Tools > API Debugger and search by fbtrace_id for details.',
        },
        { status: 500 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
