import { NextResponse } from 'next/server'
import { getWorkspaceIdServer, createServiceClient } from '@/lib/supabase-server'
import { getInstagramConversations, getInstagramMessages, getInstagramUserProfile } from '@/lib/meta/instagram'
import { getMessengerConversations, getMessengerMessages, getMessengerUserProfile } from '@/lib/meta/messenger'
import type { Customer } from '@/types/database'

export async function POST(request: Request) {
  // 1. Auth check
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customerId, error: ctxErr } = await getWorkspaceIdServer(token)
  if (ctxErr || !customerId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { connectionId } = await request.json()
  if (!connectionId) return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })

  // Use service client to bypass RLS for deep sync operations
  const supabase = createServiceClient()

  // 2. Fetch connection details
  const { data: connection, error: connErr } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('id', connectionId)
    .eq('user_id', customerId) // Security: Ensure it belongs to this workspace
    .single()

  if (connErr || !connection) return NextResponse.json({ error: 'Connection not found or access denied' }, { status: 404 })

  const { channel_type, access_token, channel_account_id } = connection

  // 3. Logic based on channel
  if (channel_type === 'whatsapp') {
    return NextResponse.json({ error: 'WhatsApp history sync not supported by Meta Cloud API' }, { status: 400 })
  }

  console.log(`[Sync] Starting history sync for ${channel_type} account ${channel_account_id}`)

  try {
    let conversations: any[] = []
    if (channel_type === 'instagram') {
      const res = await getInstagramConversations(channel_account_id, access_token)
      conversations = res.data
    } else if (channel_type === 'messenger') {
      const res = await getMessengerConversations(channel_account_id, access_token)
      conversations = res.data
    }

    const results = []

    for (const conv of conversations) {
      // Find the participant that is NOT the account itself
      const participant = conv.participants.data.find((p: any) => p.id !== channel_account_id)
      if (!participant) continue

      let customerName = (participant as any).name || (participant as any).username || 'Customer'
      let customerAvatarUrl = null

      // Fetch profile for better name/avatar
      try {
        if (channel_type === 'instagram') {
          const profile = await getInstagramUserProfile(participant.id, access_token)
          customerName = profile.name || profile.username || customerName
          customerAvatarUrl = profile.profile_pic
        } else if (channel_type === 'messenger') {
          const profile = await getMessengerUserProfile(participant.id, access_token)
          customerName = `${profile.first_name} ${profile.last_name}`.trim()
          customerAvatarUrl = profile.profile_pic
        }
      } catch (err) {
        console.warn(`[Sync] Failed to fetch profile for participant ${participant.id}:`, err)
      }

      // Upsert conversation
      const { data: conversation, error: convUpsertErr } = await supabase
        .from('unified_conversations')
        .upsert({
          connected_account_id: connectionId,
          channel_type,
          channel_conversation_id: conv.id,
          customer_id: participant.id,
          customer_name: customerName,
          customer_avatar_url: customerAvatarUrl,
          last_message_at: conv.updated_time,
          last_message_preview: (conv as any).snippet || '',
        }, { onConflict: 'connected_account_id,channel_conversation_id' })
        .select()
        .single()

      if (convUpsertErr || !conversation) {
        console.error(`[Sync] Failed to upsert conversation ${conv.id}:`, convUpsertErr)
        continue
      }

      // Fetch recent messages
      let metaMessages: any[] = []
      try {
        if (channel_type === 'instagram') {
          const res = await getInstagramMessages(conv.id, access_token, 15)
          metaMessages = res.data
        } else if (channel_type === 'messenger') {
          const res = await getMessengerMessages(conv.id, access_token, 15)
          metaMessages = res.data
        }
      } catch (err) {
        console.error(`[Sync] Failed to fetch messages for conv ${conv.id}:`, err)
      }

      // Upsert messages
      let syncedCount = 0
      for (const msg of metaMessages) {
        const isFromBusiness = msg.from.id === channel_account_id
        
        // Map attachments if present
        const attachments = msg.attachments?.data || []
        const rawType = attachments.length > 0 ? attachments[0].type : 'text'
        const mediaUrl = attachments.length > 0 ? attachments[0].payload.url : null

        // Map Meta types to TropiChat types
        let messageType: any = 'text'
        if (rawType === 'image') messageType = 'image'
        else if (rawType === 'video' || rawType === 'video_share') messageType = 'video'
        else if (rawType === 'audio') messageType = 'audio'
        else if (rawType === 'file') messageType = 'file'

        const { error: msgErr } = await supabase
          .from('unified_messages')
          .upsert({
            conversation_id: conversation.id,
            channel_message_id: msg.id,
            sender_type: isFromBusiness ? 'business' : 'customer',
            content: msg.message || (attachments.length > 0 ? `[${rawType}]` : ''),
            message_type: messageType,
            sent_at: msg.created_time,
            status: 'read',
            metadata: mediaUrl ? { media_url: mediaUrl } : {}
          }, { onConflict: 'conversation_id,channel_message_id' })

        if (!msgErr) syncedCount++
      }
      
      results.push({ 
        conversationId: conversation.id, 
        customer: customerName,
        messagesSynced: syncedCount 
      })
    }

    console.log(`[Sync] Finished sync for account ${channel_account_id}. Synced ${results.length} conversations.`)

    return NextResponse.json({ 
      success: true, 
      account_id: channel_account_id,
      conversations_synced: results.length,
      details: results 
    })
  } catch (err: any) {
    console.error('[Sync] Global failure:', err)
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}
