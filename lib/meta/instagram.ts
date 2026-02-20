/**
 * Instagram Messaging API client.
 * Handles sending DMs and parsing webhook payloads.
 *
 * API Reference: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging
 */

import { metaApiRequest } from './client'
import type {
  MetaSendRequest,
  MetaSendResponse,
  MessageContentType,
  IncomingWebhookEvent,
  MessageStatusUpdate,
  MessageDeliveryStatus,
  MessageMetadata,
} from '@/types/unified-inbox'

// ==================== SEND MESSAGES ====================

export interface InstagramSendTextOptions {
  igUserId: string
  accessToken: string
  recipientId: string
  text: string
  /** When true, sends with HUMAN_AGENT tag for 7-day response window */
  humanAgentTag?: boolean
}

export async function sendInstagramText(options: InstagramSendTextOptions): Promise<MetaSendResponse> {
  const { igUserId, accessToken, recipientId, text, humanAgentTag } = options

  const body: MetaSendRequest = {
    recipient: { id: recipientId },
    messaging_type: humanAgentTag ? 'MESSAGE_TAG' : 'RESPONSE',
    message: { text },
  }
  if (humanAgentTag) body.tag = 'HUMAN_AGENT'

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${igUserId}/messages`,
    accessToken,
    body: body as MetaSendRequest,
  })
}

export interface InstagramSendMediaOptions {
  igUserId: string
  accessToken: string
  recipientId: string
  type: 'image' | 'video' | 'audio' | 'file'
  mediaUrl: string
  /** When true, sends with HUMAN_AGENT tag for 7-day response window */
  humanAgentTag?: boolean
}

export async function sendInstagramMedia(options: InstagramSendMediaOptions): Promise<MetaSendResponse> {
  const { igUserId, accessToken, recipientId, type, mediaUrl, humanAgentTag } = options

  const body: MetaSendRequest = {
    recipient: { id: recipientId },
    messaging_type: humanAgentTag ? 'MESSAGE_TAG' : 'RESPONSE',
    message: {
      attachment: {
        type,
        payload: { url: mediaUrl },
      },
    },
  }
  if (humanAgentTag) body.tag = 'HUMAN_AGENT'

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${igUserId}/messages`,
    accessToken,
    body: body as MetaSendRequest,
  })
}

// ==================== CONVERSATION MANAGEMENT ====================

export interface InstagramConversation {
  id: string
  updated_time: string
  participants: { data: Array<{ id: string; username: string }> }
}

export interface InstagramConversationsResponse {
  data: InstagramConversation[]
  paging?: { cursors: { before: string; after: string }; next?: string }
}

export async function getInstagramConversations(
  igUserId: string,
  accessToken: string,
  after?: string
): Promise<InstagramConversationsResponse> {
  const params: Record<string, string> = {
    fields: 'id,updated_time,participants',
    limit: '20',
  }
  if (after) params.after = after

  return metaApiRequest<InstagramConversationsResponse>({
    method: 'GET',
    path: `${igUserId}/conversations`,
    accessToken,
    params,
  })
}

// ==================== WEBHOOK PARSING ====================

/**
 * Instagram webhook payload structure.
 * https://developers.facebook.com/docs/instagram-platform/webhooks
 *
 * Instagram sends webhooks in two formats depending on the product config:
 *
 * Format A — "messaging" array (Messenger Platform for Instagram):
 *   entry[].messaging[].{ sender, recipient, timestamp, message, read, delivery }
 *   entry[].id = Instagram Business Account ID
 *
 * Format B — "changes" array (Instagram Webhooks product):
 *   entry[].changes[].{ field: "messages", value: { sender, recipient, timestamp, message } }
 *   entry[].id = "0" (placeholder); real account ID is in value.recipient.id
 */
interface MessagingEvent {
  sender: { id: string }
  recipient: { id: string }
  timestamp: number
  message?: {
    mid: string
    text?: string
    attachments?: Array<{
      type: 'image' | 'video' | 'audio' | 'file' | 'share' | 'story_mention'
      payload: { url: string }
    }>
    is_echo?: boolean
    reply_to?: { mid: string }
  }
  read?: { watermark: number }
  delivery?: { mids: string[]; watermark: number }
}

interface InstagramWebhookPayload {
  object: string
  entry: Array<{
    id: string
    time: number
    // Format A
    messaging?: MessagingEvent[]
    // Format B
    changes?: Array<{
      field: string
      value: MessagingEvent
    }>
  }>
}

function mapInstagramAttachmentType(type: string): MessageContentType {
  const typeMap: Record<string, MessageContentType> = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    file: 'file',
    share: 'text',
    story_mention: 'text',
  }
  return typeMap[type] ?? 'text'
}

/**
 * Parse an Instagram webhook payload into normalized events.
 */
export function parseInstagramWebhook(payload: unknown): {
  messages: IncomingWebhookEvent[]
  statuses: MessageStatusUpdate[]
} {
  const data = payload as InstagramWebhookPayload
  const messages: IncomingWebhookEvent[] = []
  const statuses: MessageStatusUpdate[] = []

  // Meta can send Instagram DMs with object = 'instagram' OR 'page'
  // (Messenger Platform API for Instagram uses 'instagram'; some app configs use 'page')
  if (data.object !== 'instagram' && data.object !== 'page') {
    console.warn('[parseInstagramWebhook] Unexpected object type:', data.object)
    return { messages, statuses }
  }

  console.log('[parseInstagramWebhook] Processing payload, object:', data.object, 'entries:', data.entry?.length)

  for (const entry of data.entry) {
    // Collect messaging events from whichever format this entry uses.
    // Format A: entry.messaging[]
    // Format B: entry.changes[].value (field === 'messages')
    const events: Array<{ event: MessagingEvent; accountId: string }> = []

    if (entry.messaging && entry.messaging.length > 0) {
      // Format A — account ID is on the entry itself
      for (const event of entry.messaging) {
        events.push({ event, accountId: entry.id })
      }
    } else if (entry.changes && entry.changes.length > 0) {
      // Format B — account ID is the recipient ID inside the change value
      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value) {
          events.push({ event: change.value, accountId: change.value.recipient.id })
        }
      }
    }

    for (const { event, accountId } of events) {
      // Skip echo messages (messages sent by us)
      if (event.message?.is_echo) continue

      // Incoming message
      if (event.message) {
        const msg = event.message
        const metadata: Partial<MessageMetadata> = {}
        let content: string | null = msg.text ?? null
        let type: MessageContentType = 'text'

        if (msg.reply_to) {
          metadata.reply_to_message_id = msg.reply_to.mid
        }

        if (msg.attachments && msg.attachments.length > 0) {
          const attachment = msg.attachments[0]
          type = mapInstagramAttachmentType(attachment.type)
          metadata.media_url = attachment.payload.url
          if (!content) content = `[${attachment.type}]`
        }

        messages.push({
          channel_type: 'instagram',
          account_id: accountId,
          customer_id: event.sender.id,
          message: {
            id: msg.mid,
            type,
            content,
            timestamp: new Date(Number(event.timestamp) * (String(event.timestamp).length <= 10 ? 1000 : 1)).toISOString(),
            metadata,
          },
        })
      }

      // Read receipt
      if (event.read) {
        statuses.push({
          channel_type: 'instagram',
          channel_message_id: '',
          status: 'read' as MessageDeliveryStatus,
          timestamp: new Date(event.read.watermark).toISOString(),
        })
      }

      // Delivery receipt
      if (event.delivery) {
        for (const mid of event.delivery.mids ?? []) {
          statuses.push({
            channel_type: 'instagram',
            channel_message_id: mid,
            status: 'delivered' as MessageDeliveryStatus,
            timestamp: new Date(event.delivery.watermark).toISOString(),
          })
        }
      }
    }
  }

  return { messages, statuses }
}
