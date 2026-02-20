/**
 * Supabase client functions for the Unified Inbox.
 *
 * Handles CRUD for connected_accounts, unified_conversations, unified_messages
 * plus real-time subscriptions.
 */

import { getSupabase, getUser } from './supabase'
import type {
  ConnectedAccount,
  UnifiedConversation,
  UnifiedMessage,
  ConversationWithAccount,
  ChannelType,
} from '@/types/unified-inbox'

// ==================== CONNECTED ACCOUNTS ====================

export async function getConnectedAccounts(): Promise<{
  data: ConnectedAccount[]
  error: string | null
}> {
  const client = getSupabase()
  const { user } = await getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await client
    .from('connected_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data: (data as ConnectedAccount[]) || [], error: error?.message || null }
}

export async function getConnectedAccount(id: string): Promise<{
  data: ConnectedAccount | null
  error: string | null
}> {
  const client = getSupabase()
  const { data, error } = await client
    .from('connected_accounts')
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as ConnectedAccount, error: error?.message || null }
}

// ==================== UNIFIED CONVERSATIONS ====================

export async function getUnifiedConversations(
  channelFilter?: ChannelType | 'all',
  search?: string,
  limit = 50,
  showArchived = false
): Promise<{ data: ConversationWithAccount[]; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  // First get user's connected account IDs
  const { data: accounts } = await client
    .from('connected_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!accounts || accounts.length === 0) {
    return { data: [], error: null }
  }

  const accountIds = accounts.map((a: { id: string }) => a.id)

  let query = client
    .from('unified_conversations')
    .select(`
      *,
      connected_account:connected_accounts(id, channel_type, channel_account_name)
    `)
    .in('connected_account_id', accountIds)
    .eq('is_archived', showArchived)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (channelFilter && channelFilter !== 'all') {
    query = query.eq('channel_type', channelFilter)
  }

  const { data, error } = await query

  let filteredData = (data as ConversationWithAccount[]) || []

  // Client-side search (customer name / last message)
  if (search) {
    const q = search.toLowerCase()
    filteredData = filteredData.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(q) ||
        c.customer_id?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q)
    )
  }

  return { data: filteredData, error: error?.message || null }
}

export async function getUnifiedConversation(id: string): Promise<{
  data: ConversationWithAccount | null
  error: string | null
}> {
  const client = getSupabase()
  const { data, error } = await client
    .from('unified_conversations')
    .select(`
      *,
      connected_account:connected_accounts(id, channel_type, channel_account_name, access_token, channel_account_id)
    `)
    .eq('id', id)
    .single()

  return { data: data as ConversationWithAccount, error: error?.message || null }
}

export async function updateUnifiedConversation(
  id: string,
  updates: Partial<Pick<UnifiedConversation, 'is_archived' | 'unread_count' | 'customer_name' | 'metadata' | 'human_agent_enabled' | 'human_agent_reason' | 'human_agent_marked_at'>>
) {
  const client = getSupabase()
  const { error } = await client
    .from('unified_conversations')
    .update(updates)
    .eq('id', id)

  return { error: error?.message || null }
}

export async function getUnreadUnifiedCount(): Promise<{
  count: number
  error: string | null
}> {
  const client = getSupabase()
  const { user } = await getUser()
  if (!user) return { count: 0, error: 'Not authenticated' }

  const { data: accounts } = await client
    .from('connected_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!accounts || accounts.length === 0) {
    return { count: 0, error: null }
  }

  const accountIds = accounts.map((a: { id: string }) => a.id)

  const { count, error } = await client
    .from('unified_conversations')
    .select('*', { count: 'exact', head: true })
    .in('connected_account_id', accountIds)
    .gt('unread_count', 0)
    .eq('is_archived', false)

  return { count: count || 0, error: error?.message || null }
}

// ==================== UNIFIED MESSAGES ====================

export async function getUnifiedMessages(
  conversationId: string,
  limit = 50,
  before?: string
): Promise<{ data: UnifiedMessage[]; error: string | null }> {
  const client = getSupabase()

  let query = client
    .from('unified_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('sent_at', before)
  }

  const { data, error } = await query

  // Return in chronological order for display
  return {
    data: ((data as UnifiedMessage[]) || []).reverse(),
    error: error?.message || null,
  }
}

// ==================== SEND MESSAGE (via API route) ====================

export async function sendUnifiedMessage(
  conversationId: string,
  content: string,
  messageType: 'text' | 'image' | 'video' | 'file' = 'text',
  mediaUrl?: string,
  humanAgentTag?: boolean
): Promise<{ data: UnifiedMessage | null; error: string | null }> {
  const client = getSupabase()
  const {
    data: { session },
  } = await client.auth.getSession()

  if (!session) {
    return { data: null, error: 'Not authenticated' }
  }

  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        message_type: messageType,
        media_url: mediaUrl,
        human_agent_tag: humanAgentTag || undefined,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { data: null, error: result.error || 'Failed to send message' }
    }

    return { data: result.message as UnifiedMessage, error: null }
  } catch {
    return { data: null, error: 'Failed to connect to messaging server' }
  }
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

/**
 * Subscribe to new & updated messages in a conversation.
 * Returns an unsubscribe function.
 */
export function subscribeToUnifiedMessages(
  conversationId: string,
  callback: (message: UnifiedMessage, eventType: 'INSERT' | 'UPDATE') => void
) {
  const client = getSupabase()

  const channel = client
    .channel(`unified_messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'unified_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => callback(payload.new as UnifiedMessage, 'INSERT')
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'unified_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => callback(payload.new as UnifiedMessage, 'UPDATE')
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Messages subscription active for ${conversationId}`)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[Realtime] Messages subscription ${status}:`, err)
      }
    })

  return () => {
    client.removeChannel(channel)
  }
}

/**
 * Subscribe to conversation list changes (new conversations, unread updates, etc.).
 * Listens on all conversations across user's connected accounts.
 * Returns an unsubscribe function.
 */
export function subscribeToUnifiedConversations(
  accountIds: string[],
  callback: (conversation: UnifiedConversation) => void
) {
  const client = getSupabase()

  // Subscribe to each account's conversations
  const channels = accountIds.map((accountId) => {
    return client
      .channel(`unified_conversations:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unified_conversations',
          filter: `connected_account_id=eq.${accountId}`,
        },
        (payload) => callback(payload.new as UnifiedConversation)
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Conversations subscription active for account ${accountId}`)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[Realtime] Conversations subscription ${status}:`, err)
        }
      })
  })

  return () => {
    channels.forEach((ch) => client.removeChannel(ch))
  }
}
