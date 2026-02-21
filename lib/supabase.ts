import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  Customer,
  Contact,
  Conversation,
  Message,
  MessageTemplate,
  AutomationRule,
  ConversationWithContact,
  Notification
} from '@/types/database'

// Waitlist type for landing page
export type WaitlistEntry = {
  id?: string
  name: string
  email: string
  business_type: string
  phone?: string
  created_at?: string
}

// Singleton browser client
let supabaseInstance: SupabaseClient | null = null

export const getSupabase = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const msg = 'Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. In production, add these to your hosting platform (Vercel, Netlify, etc.) environment variables.'
    if (typeof window !== 'undefined') {
      console.error(msg)
      // Don't use placeholder URL - it causes "Load failed" and CORS errors.
      // Throw so callers can handle missing config instead of failing silently.
      throw new Error(msg)
    }
    throw new Error(msg)
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Bypass navigator.locks which hangs in dev (React Strict Mode double-mount
      // causes the lock to never release). This no-op lock is safe for single-tab usage.
      lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn()
      },
    },
  })
  return supabaseInstance
}

// For backward compatibility with landing page
export const supabase = {
  from: (...args: Parameters<SupabaseClient['from']>) => getSupabase().from(...args)
}

// Create a fresh client (useful for server components)
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not set')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// ==================== AUTH FUNCTIONS ====================

export async function signUp(email: string, password: string, businessName: string) {
  const client = getSupabase()

  const { data: authData, error: authError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        business_name: businessName,
      },
    },
  })

  if (authError) {
    return { data: null, error: authError.message }
  }

  // Create customer record
  if (authData.user) {
    const { error: customerError } = await client
      .from('customers')
      .insert({
        id: authData.user.id,
        business_name: businessName,
        contact_email: email,
        status: 'trial',
        plan: 'free',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })

    if (customerError) {
      console.error('Error creating customer:', customerError)
    }
  }

  return { data: authData, error: null }
}

export async function signIn(email: string, password: string) {
  const client = getSupabase()

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function signOut() {
  const client = getSupabase()
  const { error } = await client.auth.signOut()
  return { error: error?.message || null }
}

export async function getSession() {
  const client = getSupabase()
  const { data: { session }, error } = await client.auth.getSession()
  return { session, error: error?.message || null }
}

export async function getUser() {
  const client = getSupabase()
  const { data: { user }, error } = await client.auth.getUser()
  return { user, error: error?.message || null }
}

export type OAuthProvider = 'google'

export async function signInWithOAuth(provider: OAuthProvider) {
  const client = getSupabase()

  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function resetPassword(email: string) {
  const client = getSupabase()
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { error: error?.message || null }
}

export async function changePassword(newPassword: string) {
  const client = getSupabase()
  const { error } = await client.auth.updateUser({ password: newPassword })
  return { error: error?.message || null }
}

// ==================== CUSTOMER FUNCTIONS ====================

export async function getCurrentCustomer(): Promise<{ data: Customer | null; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await client
    .from('customers')
    .select('*')
    .eq('id', user.id)
    .single()

  return { data, error: error?.message || null }
}

export async function updateCustomer(updates: Partial<Customer>) {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await client
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  return { error: error?.message || null }
}

// ==================== CONVERSATION FUNCTIONS ====================

export async function getConversations(
  status?: string,
  search?: string,
  limit = 50
): Promise<{ data: ConversationWithContact[]; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: [], error: 'Not authenticated' }
  }

  let query = client
    .from('conversations')
    .select(`
      *,
      contact:contacts(*)
    `)
    .eq('customer_id', user.id)
    .order('last_message_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  // Filter by search if provided
  let filteredData = data || []
  if (search && filteredData.length > 0) {
    const searchLower = search.toLowerCase()
    filteredData = filteredData.filter((conv: ConversationWithContact) =>
      conv.contact?.name?.toLowerCase().includes(searchLower) ||
      conv.contact?.phone_number?.includes(search) ||
      conv.last_message_preview?.toLowerCase().includes(searchLower)
    )
  }

  return { data: filteredData as ConversationWithContact[], error: error?.message || null }
}

export async function getConversation(id: string): Promise<{ data: ConversationWithContact | null; error: string | null }> {
  const client = getSupabase()

  const { data, error } = await client
    .from('conversations')
    .select(`
      *,
      contact:contacts(*)
    `)
    .eq('id', id)
    .single()

  return { data: data as ConversationWithContact, error: error?.message || null }
}

export async function updateConversation(id: string, updates: Partial<Conversation>) {
  const client = getSupabase()

  const { error } = await client
    .from('conversations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message || null }
}

// ==================== MESSAGE FUNCTIONS ====================

export async function getMessages(
  conversationId: string,
  limit = 50,
  before?: string
): Promise<{ data: Message[]; error: string | null }> {
  const client = getSupabase()

  let query = client
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('sent_at', before)
  }

  const { data, error } = await query

  // Return in ascending order for display
  return {
    data: (data || []).reverse(),
    error: error?.message || null
  }
}

export async function sendMessage(
  conversationId: string,
  body: string,
  customerId: string
): Promise<{ data: Message | null; error: string | null }> {
  const client = getSupabase()

  // Get conversation to find contact phone
  const { data: conversation } = await client
    .from('conversations')
    .select('contact:contacts(phone_number)')
    .eq('id', conversationId)
    .single()

  const contactData = conversation?.contact as unknown as { phone_number: string } | null
  const toNumber = contactData?.phone_number || ''

  if (!toNumber) {
    return { data: null, error: 'Contact phone number not found' }
  }

  // Send message via backend API (which sends via Twilio)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

  try {
    const response = await fetch(`${backendUrl}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: customerId,
        conversation_id: conversationId,
        to_number: toNumber,
        body: body
      })
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { data: null, error: result.error || 'Failed to send message' }
    }

    return { data: result.message, error: null }
  } catch (err) {
    console.error('Error sending message:', err)
    return { data: null, error: 'Failed to connect to messaging server' }
  }
}

// ==================== CONTACT FUNCTIONS ====================

export async function getContacts(
  search?: string,
  tags?: string[],
  limit = 100
): Promise<{ data: Contact[]; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: [], error: 'Not authenticated' }
  }

  let query = client
    .from('contacts')
    .select('*')
    .eq('customer_id', user.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (tags && tags.length > 0) {
    query = query.contains('tags', tags)
  }

  const { data, error } = await query

  return { data: data || [], error: error?.message || null }
}

export async function getContact(id: string): Promise<{ data: Contact | null; error: string | null }> {
  const client = getSupabase()

  const { data, error } = await client
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error: error?.message || null }
}

export async function updateContact(id: string, updates: Partial<Contact>) {
  const client = getSupabase()

  const { error } = await client
    .from('contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message || null }
}

// ==================== TEMPLATE FUNCTIONS ====================

export async function getTemplates(
  category?: string,
  status?: string
): Promise<{ data: MessageTemplate[]; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: [], error: 'Not authenticated' }
  }

  let query = client
    .from('message_templates')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (status) {
    query = query.eq('approval_status', status)
  }

  const { data, error } = await query

  return { data: data || [], error: error?.message || null }
}

export async function createTemplate(template: Partial<MessageTemplate>) {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await client
    .from('message_templates')
    .insert({
      ...template,
      customer_id: user.id,
      approval_status: 'pending',
      times_used: 0,
    })
    .select()
    .single()

  return { data, error: error?.message || null }
}

export async function updateTemplate(id: string, updates: Partial<MessageTemplate>) {
  const client = getSupabase()

  const { error } = await client
    .from('message_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message || null }
}

export async function deleteTemplate(id: string) {
  const client = getSupabase()

  const { error } = await client
    .from('message_templates')
    .delete()
    .eq('id', id)

  return { error: error?.message || null }
}

// ==================== AUTOMATION FUNCTIONS ====================

export async function getAutomations(): Promise<{ data: AutomationRule[]; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: [], error: 'Not authenticated' }
  }

  const { data, error } = await client
    .from('automation_rules')
    .select('*')
    .eq('customer_id', user.id)
    .order('priority', { ascending: true })

  return { data: data || [], error: error?.message || null }
}

export async function createAutomation(automation: Partial<AutomationRule>) {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await client
    .from('automation_rules')
    .insert({
      ...automation,
      customer_id: user.id,
      times_triggered: 0,
    })
    .select()
    .single()

  return { data, error: error?.message || null }
}

export async function updateAutomation(id: string, updates: Partial<AutomationRule>) {
  const client = getSupabase()

  const { error } = await client
    .from('automation_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  return { error: error?.message || null }
}

export async function deleteAutomation(id: string) {
  const client = getSupabase()

  const { error } = await client
    .from('automation_rules')
    .delete()
    .eq('id', id)

  return { error: error?.message || null }
}

// ==================== ANALYTICS FUNCTIONS ====================

export async function getAnalytics(startDate: string, endDate: string) {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Get message counts
  const { data: messages, error: messagesError } = await client
    .from('messages')
    .select('direction, sent_at, status')
    .eq('customer_id', user.id)
    .gte('sent_at', startDate)
    .lte('sent_at', endDate)

  // Get conversation counts
  const { data: conversations, error: convsError } = await client
    .from('conversations')
    .select('status, created_at')
    .eq('customer_id', user.id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Get active contacts
  const { count: activeContacts } = await client
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .gte('last_message_at', startDate)

  if (messagesError || convsError) {
    return { data: null, error: messagesError?.message || convsError?.message || null }
  }

  const sent = messages?.filter(m => m.direction === 'outbound').length || 0
  const received = messages?.filter(m => m.direction === 'inbound').length || 0
  const totalConversations = conversations?.length || 0
  const resolvedConversations = conversations?.filter(c => c.status === 'resolved').length || 0

  return {
    data: {
      messagesSent: sent,
      messagesReceived: received,
      totalConversations,
      resolvedConversations,
      activeContacts: activeContacts || 0,
      messages: messages || [],
      conversations: conversations || [],
    },
    error: null,
  }
}

// ==================== UNREAD CONVERSATIONS ====================

export async function getUnreadConversationCount(): Promise<{ count: number; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { count: 0, error: 'Not authenticated' }
  }

  const { count, error } = await client
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .gt('unread_count', 0)

  return { count: count || 0, error: error?.message || null }
}

// ==================== NOTIFICATION FUNCTIONS ====================

export async function getNotifications(
  limit = 20,
  offset = 0
): Promise<{ data: Notification[]; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { data: [], error: 'Not authenticated' }
  }

  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data: data || [], error: error?.message || null }
}

export async function getUnreadNotificationCount(): Promise<{ count: number; error: string | null }> {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { count: 0, error: 'Not authenticated' }
  }

  const { count, error } = await client
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .eq('read', false)

  return { count: count || 0, error: error?.message || null }
}

export async function markNotificationAsRead(notificationId: string) {
  const client = getSupabase()

  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  return { error: error?.message || null }
}

export async function markAllNotificationsAsRead() {
  const client = getSupabase()
  const { user } = await getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await client
    .from('notifications')
    .update({ read: true })
    .eq('customer_id', user.id)
    .eq('read', false)

  return { error: error?.message || null }
}

export function subscribeToNotifications(
  customerId: string,
  callback: (notification: Notification) => void
) {
  const client = getSupabase()

  const channel = client
    .channel(`notifications:${customerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        callback(payload.new as Notification)
      }
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

// ==================== REALTIME SUBSCRIPTIONS ====================

export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message, eventType: 'INSERT' | 'UPDATE') => void
) {
  const client = getSupabase()

  const channel = client
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message, 'INSERT')
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message, 'UPDATE')
      }
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

export function subscribeToConversations(
  customerId: string,
  callback: (conversation: Conversation) => void
) {
  const client = getSupabase()

  const channel = client
    .channel(`conversations:${customerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `customer_id=eq.${customerId}`,
      },
      (payload) => {
        callback(payload.new as Conversation)
      }
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}
