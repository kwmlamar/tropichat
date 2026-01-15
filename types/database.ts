// Database types for TropiChat Supabase schema

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'trial'
export type CustomerPlan = 'free' | 'starter' | 'professional' | 'enterprise'
export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'archived'
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export type TemplateCategory = 'marketing' | 'utility' | 'authentication'
export type TemplateApprovalStatus = 'pending' | 'approved' | 'rejected'
export type TriggerType = 'keyword' | 'new_conversation' | 'business_hours' | 'after_hours' | 'all_messages'
export type ActionType = 'send_message' | 'send_template' | 'add_tag' | 'assign_to' | 'mark_resolved'

// Business hours type
export interface BusinessHours {
  monday?: { start: string; end: string; enabled: boolean }
  tuesday?: { start: string; end: string; enabled: boolean }
  wednesday?: { start: string; end: string; enabled: boolean }
  thursday?: { start: string; end: string; enabled: boolean }
  friday?: { start: string; end: string; enabled: boolean }
  saturday?: { start: string; end: string; enabled: boolean }
  sunday?: { start: string; end: string; enabled: boolean }
}

// Customer (Business) table
export interface Customer {
  id: string
  business_name: string
  contact_email: string
  password_hash?: string
  status: CustomerStatus
  plan: CustomerPlan
  auto_reply_enabled: boolean
  auto_reply_message: string | null
  business_hours: BusinessHours | null
  timezone: string
  phone_number: string | null
  whatsapp_phone_id: string | null
  whatsapp_business_id: string | null
  created_at: string
  updated_at: string
}

// Contact table
export interface Contact {
  id: string
  customer_id: string
  phone_number: string
  name: string | null
  email: string | null
  tags: string[]
  notes: string | null
  first_message_at: string | null
  last_message_at: string | null
  total_messages_sent: number
  total_messages_received: number
  is_blocked: boolean
  opted_out: boolean
  created_at: string
  updated_at: string
}

// Conversation table
export interface Conversation {
  id: string
  customer_id: string
  contact_id: string
  status: ConversationStatus
  assigned_to: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  tags: string[]
  priority: ConversationPriority
  created_at: string
  updated_at: string
  // Joined relations
  contact?: Contact
  messages?: Message[]
}

// Message table
export interface Message {
  id: string
  conversation_id: string
  customer_id: string
  twilio_message_sid: string | null
  whatsapp_message_id: string | null
  direction: MessageDirection
  from_number: string
  to_number: string
  body: string | null
  media_url: string | null
  media_type: string | null
  status: MessageStatus
  template_name: string | null
  is_automated: boolean
  sent_by: string | null
  sent_at: string
  delivered_at: string | null
  read_at: string | null
  error_message: string | null
  created_at: string
}

// Message Template table
export interface MessageTemplate {
  id: string
  customer_id: string
  name: string
  category: TemplateCategory
  language: string
  body: string
  variables: string[]
  header_text: string | null
  footer_text: string | null
  buttons: TemplateButton[] | null
  approval_status: TemplateApprovalStatus
  rejection_reason: string | null
  times_used: number
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface TemplateButton {
  type: 'url' | 'phone' | 'quick_reply'
  text: string
  url?: string
  phone?: string
}

// Automation Rule table
export interface AutomationRule {
  id: string
  customer_id: string
  name: string
  is_enabled: boolean
  trigger_type: TriggerType
  trigger_value: string | null
  action_type: ActionType
  action_value: string
  priority: number
  times_triggered: number
  last_triggered_at: string | null
  created_at: string
  updated_at: string
}

// Team Member table (for future use)
export interface TeamMember {
  id: string
  customer_id: string
  user_id: string
  role: 'owner' | 'admin' | 'agent'
  name: string
  email: string
  is_active: boolean
  created_at: string
}

// Analytics types
export interface DailyStats {
  date: string
  messages_sent: number
  messages_received: number
  conversations_started: number
  conversations_resolved: number
  avg_response_time_seconds: number
}

export interface ConversationWithContact extends Conversation {
  contact: Contact
}

export interface MessageWithSender extends Message {
  sender_name?: string
}

// Form types for creating/updating
export interface CreateContactInput {
  phone_number: string
  name?: string
  email?: string
  tags?: string[]
  notes?: string
}

export interface UpdateContactInput {
  name?: string
  email?: string
  tags?: string[]
  notes?: string
  is_blocked?: boolean
}

export interface CreateTemplateInput {
  name: string
  category: TemplateCategory
  language: string
  body: string
  variables?: string[]
  header_text?: string
  footer_text?: string
}

export interface CreateAutomationInput {
  name: string
  trigger_type: TriggerType
  trigger_value?: string
  action_type: ActionType
  action_value: string
  is_enabled?: boolean
}

export interface SendMessageInput {
  conversation_id: string
  body: string
  template_name?: string
  media_url?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  hasMore: boolean
}
