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
}

export async function sendInstagramText(options: InstagramSendTextOptions): Promise<MetaSendResponse> {
  const { igUserId, accessToken, recipientId, text } = options

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${igUserId}/messages`,
    accessToken,
    body: {
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { text },
    } as MetaSendRequest,
  })
}

export interface InstagramSendMediaOptions {
  igUserId: string
  accessToken: string
  recipientId: string
  type: 'image' | 'video' | 'audio' | 'file'
  mediaUrl: string
}

export async function sendInstagramMedia(options: InstagramSendMediaOptions): Promise<MetaSendResponse> {
  const { igUserId, accessToken, recipientId, type, mediaUrl } = options

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${igUserId}/messages`,
    accessToken,
    body: {
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: {
        attachment: {
          type,
          payload: { url: mediaUrl },
        },
      },
    } as MetaSendRequest,
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
 */
interface InstagramWebhookPayload {
  object: string
  entry: Array<{
    id: string
    time: number
    messaging: Array<{
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

  if (data.object !== 'instagram') {
    return { messages, statuses }
  }

  for (const entry of data.entry) {
    const igUserId = entry.id

    for (const event of entry.messaging) {
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
          account_id: igUserId,
          customer_id: event.sender.id,
          message: {
            id: msg.mid,
            type,
            content,
            timestamp: new Date(event.timestamp).toISOString(),
            metadata,
          },
        })
      }

      // Read receipt
      if (event.read) {
        statuses.push({
          channel_type: 'instagram',
          channel_message_id: '', // IG read receipts use watermark, not specific message ID
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
