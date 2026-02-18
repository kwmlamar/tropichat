// Types for the TropiChat Unified Inbox (WhatsApp, Instagram, Messenger)

// ==================== ENUMS ====================

export type ChannelType = 'whatsapp' | 'instagram' | 'messenger'

export type SenderType = 'customer' | 'business'

export type MessageContentType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'location'
  | 'sticker'
  | 'template'
  | 'interactive'

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

// ==================== TABLE TYPES ====================

export interface ConnectedAccount {
  id: string
  user_id: string
  channel_type: ChannelType
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  channel_account_id: string
  channel_account_name: string | null
  metadata: ConnectedAccountMetadata
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UnifiedConversation {
  id: string
  connected_account_id: string
  channel_type: ChannelType
  channel_conversation_id: string
  customer_name: string | null
  customer_avatar_url: string | null
  customer_id: string
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  is_archived: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joined relations
  connected_account?: ConnectedAccount
  messages?: UnifiedMessage[]
}

export interface UnifiedMessage {
  id: string
  conversation_id: string
  channel_message_id: string | null
  sender_type: SenderType
  content: string | null
  message_type: MessageContentType
  sent_at: string
  delivered_at: string | null
  read_at: string | null
  failed_at: string | null
  status: MessageDeliveryStatus
  error_message: string | null
  metadata: MessageMetadata
  created_at: string
}

// ==================== METADATA TYPES ====================

export interface ConnectedAccountMetadata {
  // WhatsApp-specific
  waba_id?: string
  phone_number?: string
  // Instagram-specific
  ig_username?: string
  ig_user_id?: string
  // Messenger-specific
  page_access_token?: string
  page_name?: string
  [key: string]: unknown
}

export interface MessageMetadata {
  // Media attachments
  media_url?: string
  media_mime_type?: string
  media_filename?: string
  media_size?: number
  thumbnail_url?: string
  // Location messages
  latitude?: number
  longitude?: number
  location_name?: string
  location_address?: string
  // Template messages
  template_name?: string
  template_language?: string
  template_components?: TemplateComponent[]
  // Interactive messages (buttons, lists)
  interactive_type?: 'button' | 'list' | 'product' | 'product_list'
  interactive_body?: string
  interactive_buttons?: InteractiveButton[]
  // Reactions
  reaction_emoji?: string
  reacted_message_id?: string
  // Reply context
  reply_to_message_id?: string
  // Platform-specific raw payload (for debugging)
  raw_payload?: Record<string, unknown>
  [key: string]: unknown
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters: Array<{
    type: 'text' | 'image' | 'video' | 'document'
    text?: string
    image?: { link: string }
    video?: { link: string }
    document?: { link: string; filename?: string }
  }>
}

export interface InteractiveButton {
  type: 'reply' | 'url' | 'phone'
  title: string
  id?: string
  url?: string
  phone?: string
}

// ==================== JOIN TYPES ====================

export interface ConversationWithAccount extends UnifiedConversation {
  connected_account: ConnectedAccount
}

// ==================== INPUT / FORM TYPES ====================

export interface ConnectAccountInput {
  channel_type: ChannelType
  access_token: string
  refresh_token?: string
  token_expires_at?: string
  channel_account_id: string
  channel_account_name?: string
  metadata?: ConnectedAccountMetadata
}

export interface SendUnifiedMessageInput {
  conversation_id: string
  content: string
  message_type?: MessageContentType
  metadata?: Partial<MessageMetadata>
}

export interface CreateConversationInput {
  connected_account_id: string
  channel_type: ChannelType
  channel_conversation_id: string
  customer_name?: string
  customer_id: string
}

// ==================== WEBHOOK PAYLOAD TYPES ====================

/** Normalized webhook event that all channel parsers produce */
export interface IncomingWebhookEvent {
  channel_type: ChannelType
  /** Platform account receiving the message (phone_number_id, page_id, ig_user_id) */
  account_id: string
  /** Platform-specific customer identifier */
  customer_id: string
  customer_name?: string
  /** The message itself */
  message: {
    id: string
    type: MessageContentType
    content: string | null
    timestamp: string
    metadata?: Partial<MessageMetadata>
  }
}

/** Normalized status update from webhook */
export interface MessageStatusUpdate {
  channel_type: ChannelType
  channel_message_id: string
  status: MessageDeliveryStatus
  timestamp: string
  error_message?: string
}

// ==================== META GRAPH API TYPES ====================

/** WhatsApp Cloud API send message request */
export interface WhatsAppSendRequest {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'template' | 'interactive' | 'location'
  text?: { body: string; preview_url?: boolean }
  image?: { link: string; caption?: string }
  video?: { link: string; caption?: string }
  audio?: { link: string }
  document?: { link: string; caption?: string; filename?: string }
  template?: { name: string; language: { code: string }; components?: TemplateComponent[] }
  interactive?: Record<string, unknown>
  location?: { latitude: number; longitude: number; name?: string; address?: string }
}

/** Instagram / Messenger send message request */
export interface MetaSendRequest {
  recipient: { id: string }
  messaging_type: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG'
  message: {
    text?: string
    attachment?: {
      type: 'image' | 'video' | 'audio' | 'file' | 'template'
      payload: { url?: string; template_type?: string; elements?: unknown[] }
    }
  }
  tag?: string
}

/** Graph API error response */
export interface MetaApiError {
  error: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

/** Graph API success response for sent messages */
export interface MetaSendResponse {
  messaging_product?: string
  contacts?: Array<{ input: string; wa_id: string }>
  messages?: Array<{ id: string }>
  // Instagram/Messenger
  recipient_id?: string
  message_id?: string
}
