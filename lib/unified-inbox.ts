/**
 * Supabase client functions for the Unified Inbox.
 *
 * Handles CRUD for connected_accounts, unified_conversations, unified_messages
 * plus real-time subscriptions.
 */

import { getSupabase, getUser, getWorkspaceId } from './supabase'
import type {
  ConnectedAccount,
  UnifiedConversation,
  UnifiedMessage,
  ConversationWithAccount,
  ChannelType,
  Tag,
} from '@/types/unified-inbox'
import type { Contact } from '@/types/database'

// ==================== CONNECTED ACCOUNTS ====================

export async function getConnectedAccounts(): Promise<{
  data: ConnectedAccount[]
  error: string | null
}> {
  const client = getSupabase()
  const { customerId, error: ctxErr } = await getWorkspaceId()
  if (ctxErr || !customerId) return { data: [], error: ctxErr || 'Workspace not found' }

  const { data, error } = await client
    .from('connected_accounts')
    .select('*')
    .eq('user_id', customerId)
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
  showArchived = false,
  tagId?: string | null
): Promise<{ data: ConversationWithAccount[]; error: string | null }> {
  const client = getSupabase()
  const { customerId, error: ctxErr } = await getWorkspaceId()
  if (ctxErr || !customerId) return { data: [], error: ctxErr || 'Workspace not found' }

  // First get workspace's connected account IDs
  const { data: accounts } = await client
    .from('connected_accounts')
    .select('id')
    .eq('user_id', customerId)
    .eq('is_active', true)

  if (!accounts || accounts.length === 0) {
    return { data: [], error: null }
  }

  const accountIds = accounts.map((a: { id: string }) => a.id)

  let query = client
    .from('unified_conversations')
    .select(`
      *,
      connected_account:connected_accounts(id, channel_type, channel_account_name),
      tags:conversation_tags(
        tag:tags(*)
      )
    `)
    .in('connected_account_id', accountIds)
    .eq('is_archived', showArchived)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (channelFilter && channelFilter !== 'all') {
    query = query.eq('channel_type', channelFilter)
  }

  // Server-side tag filter: fetch matching conversation IDs first
  if (tagId) {
    const { data: taggedRows } = await client
      .from('conversation_tags')
      .select('conversation_id')
      .eq('tag_id', tagId)
    const taggedIds = (taggedRows || []).map((r: { conversation_id: string }) => r.conversation_id)
    if (taggedIds.length === 0) return { data: [], error: null }
    query = query.in('id', taggedIds)
  }

  const { data, error } = await query

  const rawData = (data as any[]) || []
  
  // Transform the nested tags data for cleaner frontend usage
  let transformedData: ConversationWithAccount[] = rawData.map(conv => ({
    ...conv,
    tags: conv.tags?.map((t: any) => t.tag).filter(Boolean) || []
  }))

  // Client-side search (customer name / last message)
  if (search) {
    const q = search.toLowerCase()
    transformedData = transformedData.filter(
      (c) =>
        c.customer_name?.toLowerCase().includes(q) ||
        c.customer_id?.toLowerCase().includes(q) ||
        c.last_message_preview?.toLowerCase().includes(q)
    )
  }

  return { data: transformedData, error: error?.message || null }
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
  updates: Partial<Pick<UnifiedConversation, 'is_archived' | 'unread_count' | 'status' | 'customer_name' | 'metadata' | 'human_agent_enabled' | 'human_agent_reason' | 'human_agent_marked_at'>>
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
  const { customerId, error: ctxErr } = await getWorkspaceId()
  if (ctxErr || !customerId) return { count: 0, error: ctxErr || 'Workspace not found' }

  const { data: accounts } = await client
    .from('connected_accounts')
    .select('id')
    .eq('user_id', customerId)
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

// ==================== TAGS ====================

export async function getUnifiedTags(): Promise<{
  data: Tag[]
  error: string | null
}> {
  const client = getSupabase()
  const { customerId, error: ctxErr } = await getWorkspaceId()
  if (ctxErr || !customerId) return { data: [], error: ctxErr || 'Workspace not found' }

  const { data, error } = await client
    .from('tags')
    .select('*')
    .eq('customer_id', customerId)
    .order('name', { ascending: true })

  return { data: (data as Tag[]) || [], error: error?.message || null }
}

export async function createUnifiedTag(name: string, color: string): Promise<{
  data: Tag | null
  error: string | null
}> {
  const client = getSupabase()
  const { customerId, error: ctxErr } = await getWorkspaceId()
  if (ctxErr || !customerId) return { data: null, error: ctxErr || 'Workspace not found' }

  const { data, error } = await client
    .from('tags')
    .insert({
      customer_id: customerId,
      name,
      color
    })
    .select()
    .single()

  return { data: data as Tag, error: error?.message || null }
}

export async function deleteUnifiedTag(id: string) {
  const client = getSupabase()
  const { error } = await client
    .from('tags')
    .delete()
    .eq('id', id)

  return { error: error?.message || null }
}

export async function addTagToConversation(conversationId: string, tagId: string) {
  const client = getSupabase()
  const { error } = await client
    .from('conversation_tags')
    .insert({
      conversation_id: conversationId,
      tag_id: tagId
    })

  if (!error) {
    // Sync to contact
    const { data: conv } = await client.from('unified_conversations').select('customer_id').eq('id', conversationId).single()
    if (conv) {
      const { data: contact } = await client.from('contacts').select('id').eq('channel_id', conv.customer_id).single()
      if (contact) {
        await client.from('contact_tags').insert({ contact_id: contact.id, tag_id: tagId })
        await syncContactTags(contact.id, tagId, 'add')
      }
    }
  }

  return { error: error?.message || null }
}

export async function removeTagFromConversation(conversationId: string, tagId: string) {
  const client = getSupabase()
  const { error } = await client
    .from('conversation_tags')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('tag_id', tagId)

  if (!error) {
    // Sync to contact
    const { data: conv } = await client.from('unified_conversations').select('customer_id').eq('id', conversationId).single()
    if (conv) {
      const { data: contact } = await client.from('contacts').select('id').eq('channel_id', conv.customer_id).single()
      if (contact) {
        await client.from('contact_tags').delete().eq('contact_id', contact.id).eq('tag_id', tagId)
        await syncContactTags(contact.id, tagId, 'remove')
      }
    }
  }

  return { error: error?.message || null }
}

async function syncContactTags(contactId: string, tagId: string, action: 'add' | 'remove') {
  const client = getSupabase()
  
  // Get all existing tags for the contact from join table
  const { data: ctData } = await client
    .from('contact_tags')
    .select('tag:tags(name)')
    .eq('contact_id', contactId)
  
  const existingTagNames = ctData?.map((item: any) => item.tag.name) || []
  
  // Get the name of the tag being modified
  const { data: tag } = await client.from('tags').select('name').eq('id', tagId).single()
  if (!tag) return

  let newTags = [...existingTagNames]
  if (action === 'add') {
    if (!newTags.includes(tag.name)) newTags.push(tag.name)
  } else {
    newTags = newTags.filter(n => n !== tag.name)
  }

  // Update the contacts array
  await client.from('contacts').update({ tags: newTags }).eq('id', contactId)
}

export async function getContactTags(contactId: string): Promise<{ data: Tag[]; error: string | null }> {
  const client = getSupabase()
  const { data, error } = await client
    .from('contact_tags')
    .select('tag:tags(*)')
    .eq('contact_id', contactId)
  
  return { data: data?.map((item: any) => item.tag) || [], error: error?.message || null }
}

export async function addTagToContact(contactId: string, tagId: string) {
  const client = getSupabase()
  const { error } = await client
    .from('contact_tags')
    .insert({ contact_id: contactId, tag_id: tagId })
  
  if (!error) {
    await syncContactTags(contactId, tagId, 'add')
    
    // Sync to all open conversations for this contact
    const { data: contact } = await client.from('contacts').select('channel_id').eq('id', contactId).single()
    if (contact) {
      const { data: convs } = await client.from('unified_conversations').select('id').eq('customer_id', contact.channel_id)
      if (convs) {
        for (const conv of convs) {
          await client.from('conversation_tags').upsert({ conversation_id: conv.id, tag_id: tagId })
        }
      }
    }
  }
  
  return { error: error?.message || null }
}

export async function removeTagFromContact(contactId: string, tagId: string) {
  const client = getSupabase()
  const { error } = await client
    .from('contact_tags')
    .delete()
    .eq('contact_id', contactId)
    .eq('tag_id', tagId)

  if (!error) {
    await syncContactTags(contactId, tagId, 'remove')
    
    // Sync to all open conversations for this contact
    const { data: contact } = await client.from('contacts').select('channel_id').eq('id', contactId).single()
    if (contact) {
      const { data: convs } = await client.from('unified_conversations').select('id').eq('customer_id', contact.channel_id)
      if (convs) {
        for (const conv of convs) {
          await client.from('conversation_tags').delete().eq('conversation_id', conv.id).eq('tag_id', tagId)
        }
      }
    }
  }

  return { error: error?.message || null }
}

export async function updateContactWithTags(contactId: string, updates: Partial<Contact>) {
  const client = getSupabase()
  
  // 1. Update basic info first
  const { error: updateError } = await client
    .from('contacts')
    .update({ 
      name: updates.name, 
      email: updates.email, 
      notes: updates.notes,
      updated_at: new Date().toISOString() 
    })
    .eq('id', contactId)
  
  if (updateError) return { error: updateError.message }

  // 2. If tags are provided, sync them
  if (updates.tags) {
    // Get current relational tags to find differences
    const { data: currentTags } = await client
      .from('contact_tags')
      .select('tag:tags(id, name)')
      .eq('contact_id', contactId)
    
    const currentTagIds = (currentTags as any[])?.map(t => t.tag.id) || []
    const currentTagNames = (currentTags as any[])?.map(t => t.tag.name) || []
    
    // Get all available tags to map names to IDs
    const { data: allTags } = await client.from('tags').select('id, name')
    if (allTags) {
      // Find tags to add
      for (const tagName of updates.tags) {
        if (!currentTagNames.includes(tagName)) {
          const tag = allTags.find(t => t.name === tagName)
          if (tag) await addTagToContact(contactId, tag.id)
        }
      }
      
      // Find tags to remove
      for (const tag of currentTags as any[]) {
        if (!updates.tags.includes(tag.tag.name)) {
          await removeTagFromContact(contactId, tag.tag.id)
        }
      }
    }
  }

  return { error: null }
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

// ==================== AI FEATURES ====================

/**
 * Fetch an AI-generated smart reply suggestion for a conversation.
 */
export async function getAIResponseSuggestion(conversationId: string): Promise<{
  suggestion: string | null
  error: string | null
}> {
  const client = getSupabase()
  const { data: { session } } = await client.auth.getSession()

  if (!session) {
    return { suggestion: null, error: 'Not authenticated' }
  }

  try {
    const response = await fetch('/api/ai/smart-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ conversationId }),
    })

    const data = await response.json()
    if (!response.ok) return { suggestion: null, error: data.error || 'Failed to get suggestion' }

    return { suggestion: data.suggestion, error: null }
  } catch {
    return { suggestion: null, error: 'Failed to connect to AI server' }
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
        const msg = err?.message ?? (status === 'CHANNEL_ERROR' ? 'Connection closed or subscription failed.' : 'Subscription timed out.')
        console.warn(`[Realtime] Messages subscription ${status}:`, msg)
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
          const msg = err?.message ?? (status === 'CHANNEL_ERROR' ? 'Connection closed or subscription failed.' : 'Subscription timed out.')
          console.warn(`[Realtime] Conversations subscription ${status}:`, msg)
        }
      })
  })

  return () => {
    channels.forEach((ch) => client.removeChannel(ch))
  }
}
