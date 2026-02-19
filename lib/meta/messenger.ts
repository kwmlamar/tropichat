/**
 * Facebook Messenger Platform API client.
 * Handles sending messages and parsing webhook payloads.
 *
 * API Reference: https://developers.facebook.com/docs/messenger-platform
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

export interface MessengerSendTextOptions {
  pageId: string
  accessToken: string
  recipientPsid: string
  text: string
  messagingType?: MetaSendRequest['messaging_type']
  tag?: string
}

export async function sendMessengerText(options: MessengerSendTextOptions): Promise<MetaSendResponse> {
  const { pageId, accessToken, recipientPsid, text, messagingType = 'RESPONSE', tag } = options

  const body: MetaSendRequest = {
    recipient: { id: recipientPsid },
    messaging_type: messagingType,
    message: { text },
  }
  if (tag) body.tag = tag

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${pageId}/messages`,
    accessToken,
    body: body as MetaSendRequest,
  })
}

export interface MessengerSendMediaOptions {
  pageId: string
  accessToken: string
  recipientPsid: string
  type: 'image' | 'video' | 'audio' | 'file'
  mediaUrl: string
  /** When true, sends with HUMAN_AGENT tag for 7-day response window */
  humanAgentTag?: boolean
}

export async function sendMessengerMedia(options: MessengerSendMediaOptions): Promise<MetaSendResponse> {
  const { pageId, accessToken, recipientPsid, type, mediaUrl, humanAgentTag } = options

  const body: MetaSendRequest = {
    recipient: { id: recipientPsid },
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
    path: `${pageId}/messages`,
    accessToken,
    body: body as MetaSendRequest,
  })
}

export interface MessengerSendButtonTemplateOptions {
  pageId: string
  accessToken: string
  recipientPsid: string
  text: string
  buttons: Array<{
    type: 'web_url' | 'postback' | 'phone_number'
    title: string
    url?: string
    payload?: string
  }>
}

export async function sendMessengerButtonTemplate(options: MessengerSendButtonTemplateOptions): Promise<MetaSendResponse> {
  const { pageId, accessToken, recipientPsid, text, buttons } = options

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${pageId}/messages`,
    accessToken,
    body: {
      recipient: { id: recipientPsid },
      messaging_type: 'RESPONSE',
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text,
            buttons,
          },
        },
      },
    },
  })
}

// ==================== CONVERSATION MANAGEMENT ====================

export interface MessengerConversation {
  id: string
  updated_time: string
  participants: { data: Array<{ id: string; name: string }> }
  snippet: string
}

export interface MessengerConversationsResponse {
  data: MessengerConversation[]
  paging?: { cursors: { before: string; after: string }; next?: string }
}

export async function getMessengerConversations(
  pageId: string,
  accessToken: string,
  after?: string
): Promise<MessengerConversationsResponse> {
  const params: Record<string, string> = {
    fields: 'id,updated_time,participants,snippet',
    limit: '20',
  }
  if (after) params.after = after

  return metaApiRequest<MessengerConversationsResponse>({
    method: 'GET',
    path: `${pageId}/conversations`,
    accessToken,
    params,
  })
}

/** Get the user profile for a PSID (Page-Scoped ID) */
export async function getMessengerUserProfile(
  psid: string,
  accessToken: string
): Promise<{ first_name: string; last_name: string; profile_pic: string }> {
  return metaApiRequest({
    method: 'GET',
    path: psid,
    accessToken,
    params: { fields: 'first_name,last_name,profile_pic' },
  })
}

// ==================== WEBHOOK PARSING ====================

/**
 * Messenger webhook payload structure.
 * https://developers.facebook.com/docs/messenger-platform/webhooks
 */
interface MessengerWebhookPayload {
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
          type: 'image' | 'video' | 'audio' | 'file' | 'template' | 'fallback'
          payload: { url?: string; title?: string; sticker_id?: number }
        }>
        is_echo?: boolean
        reply_to?: { mid: string }
        quick_reply?: { payload: string }
      }
      postback?: {
        mid: string
        title: string
        payload: string
      }
      read?: { watermark: number }
      delivery?: { mids: string[]; watermark: number }
    }>
  }>
}

function mapMessengerAttachmentType(type: string): MessageContentType {
  const typeMap: Record<string, MessageContentType> = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    file: 'file',
    template: 'template',
    fallback: 'text',
  }
  return typeMap[type] ?? 'text'
}

/**
 * Parse a Messenger webhook payload into normalized events.
 */
export function parseMessengerWebhook(payload: unknown): {
  messages: IncomingWebhookEvent[]
  statuses: MessageStatusUpdate[]
} {
  const data = payload as MessengerWebhookPayload
  const messages: IncomingWebhookEvent[] = []
  const statuses: MessageStatusUpdate[] = []

  if (data.object !== 'page') {
    return { messages, statuses }
  }

  for (const entry of data.entry) {
    const pageId = entry.id

    for (const event of entry.messaging) {
      // Skip echo messages (messages sent by our page)
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

        if (msg.quick_reply) {
          metadata.raw_payload = { quick_reply: msg.quick_reply }
        }

        if (msg.attachments && msg.attachments.length > 0) {
          const attachment = msg.attachments[0]
          type = mapMessengerAttachmentType(attachment.type)
          if (attachment.payload.url) {
            metadata.media_url = attachment.payload.url
          }
          // Sticker detection
          if (attachment.payload.sticker_id) {
            type = 'sticker'
          }
          if (!content) content = attachment.payload.title ?? `[${attachment.type}]`
        }

        messages.push({
          channel_type: 'messenger',
          account_id: pageId,
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

      // Postback (button tap)
      if (event.postback) {
        messages.push({
          channel_type: 'messenger',
          account_id: pageId,
          customer_id: event.sender.id,
          message: {
            id: event.postback.mid,
            type: 'interactive',
            content: event.postback.title,
            timestamp: new Date(event.timestamp).toISOString(),
            metadata: { raw_payload: { postback: event.postback } },
          },
        })
      }

      // Read receipt
      if (event.read) {
        statuses.push({
          channel_type: 'messenger',
          channel_message_id: '',
          status: 'read' as MessageDeliveryStatus,
          timestamp: new Date(event.read.watermark).toISOString(),
        })
      }

      // Delivery receipt
      if (event.delivery) {
        for (const mid of event.delivery.mids ?? []) {
          statuses.push({
            channel_type: 'messenger',
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
