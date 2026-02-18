/**
 * Unified Message Send API
 *
 * POST /api/messages/send
 *
 * Sends a message through any connected channel (WhatsApp, Instagram, Messenger).
 * Requires authentication via Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMessage } from '@/lib/meta'
import type { ChannelType, MessageContentType } from '@/types/unified-inbox'

interface SendRequestBody {
  conversation_id: string
  content: string
  message_type?: MessageContentType
  media_url?: string
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

  const { conversation_id, content, message_type = 'text', media_url } = body
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
      connected_account:connected_accounts(
        id, channel_type, channel_account_id, access_token
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
  }

  if (!account) {
    return NextResponse.json({ error: 'Connected account not found' }, { status: 404 })
  }

  try {
    // Send via Meta API
    const result = await sendMessage({
      channelType: account.channel_type,
      accountId: account.channel_account_id,
      accessToken: account.access_token,
      recipientId: conversation.customer_id,
      content,
      messageType: message_type,
      mediaUrl: media_url,
    })

    // Extract the platform message ID
    const channelMessageId =
      result.messages?.[0]?.id ??  // WhatsApp
      result.message_id ??         // Instagram / Messenger
      null

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
        metadata: media_url ? { media_url } : {},
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
      })
    }

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('[Send] Failed to send message:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
