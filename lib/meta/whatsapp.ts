/**
 * WhatsApp Cloud API client.
 * Handles sending messages, managing media, and parsing webhook payloads.
 *
 * API Reference: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import { metaApiRequest } from './client'
import type {
  WhatsAppSendRequest,
  MetaSendResponse,
  MessageContentType,
  IncomingWebhookEvent,
  MessageStatusUpdate,
  MessageDeliveryStatus,
  MessageMetadata,
} from '@/types/unified-inbox'

// ==================== SEND MESSAGES ====================

export interface WhatsAppSendTextOptions {
  phoneNumberId: string
  accessToken: string
  to: string
  body: string
  previewUrl?: boolean
}

export async function sendWhatsAppText(options: WhatsAppSendTextOptions): Promise<MetaSendResponse> {
  const { phoneNumberId, accessToken, to, body, previewUrl } = options

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${phoneNumberId}/messages`,
    accessToken,
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body, preview_url: previewUrl ?? false },
    } as WhatsAppSendRequest,
  })
}

export interface WhatsAppSendMediaOptions {
  phoneNumberId: string
  accessToken: string
  to: string
  type: 'image' | 'video' | 'audio' | 'document'
  mediaUrl: string
  caption?: string
  filename?: string
}

export async function sendWhatsAppMedia(options: WhatsAppSendMediaOptions): Promise<MetaSendResponse> {
  const { phoneNumberId, accessToken, to, type, mediaUrl, caption, filename } = options

  const mediaPayload: Record<string, unknown> = { link: mediaUrl }
  if (caption) mediaPayload.caption = caption
  if (filename && type === 'document') mediaPayload.filename = filename

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${phoneNumberId}/messages`,
    accessToken,
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type,
      [type]: mediaPayload,
    } as unknown as WhatsAppSendRequest,
  })
}

export interface WhatsAppSendTemplateOptions {
  phoneNumberId: string
  accessToken: string
  to: string
  templateName: string
  languageCode: string
  components?: WhatsAppSendRequest['template'] extends { components?: infer C } ? C : never
}

export async function sendWhatsAppTemplate(options: WhatsAppSendTemplateOptions): Promise<MetaSendResponse> {
  const { phoneNumberId, accessToken, to, templateName, languageCode, components } = options

  return metaApiRequest<MetaSendResponse>({
    method: 'POST',
    path: `${phoneNumberId}/messages`,
    accessToken,
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    } as unknown as WhatsAppSendRequest,
  })
}

export interface WhatsAppMarkReadOptions {
  phoneNumberId: string
  accessToken: string
  messageId: string
}

export async function markWhatsAppMessageRead(options: WhatsAppMarkReadOptions): Promise<void> {
  const { phoneNumberId, accessToken, messageId } = options

  await metaApiRequest({
    method: 'POST',
    path: `${phoneNumberId}/messages`,
    accessToken,
    body: {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    },
  })
}

// ==================== WEBHOOK PARSING ====================

/**
 * Raw WhatsApp webhook payload structure (subset of fields we care about).
 * Full spec: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
 */
interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: { display_phone_number: string; phone_number_id: string }
        contacts?: Array<{ profile: { name: string }; wa_id: string }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: { body: string }
          image?: { id: string; mime_type: string; caption?: string; sha256: string }
          video?: { id: string; mime_type: string; caption?: string }
          audio?: { id: string; mime_type: string }
          document?: { id: string; mime_type: string; filename?: string; caption?: string }
          sticker?: { id: string; mime_type: string }
          location?: { latitude: number; longitude: number; name?: string; address?: string }
          reaction?: { message_id: string; emoji: string }
          context?: { from: string; id: string }
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
          errors?: Array<{ code: number; title: string }>
        }>
      }
      field: string
    }>
  }>
}

function mapWhatsAppMessageType(type: string): MessageContentType {
  const typeMap: Record<string, MessageContentType> = {
    text: 'text',
    image: 'image',
    video: 'video',
    audio: 'audio',
    document: 'file',
    sticker: 'sticker',
    location: 'location',
    interactive: 'interactive',
    button: 'interactive',
    template: 'template',
  }
  return typeMap[type] ?? 'text'
}

function mapWhatsAppStatus(status: string): MessageDeliveryStatus {
  const statusMap: Record<string, MessageDeliveryStatus> = {
    sent: 'sent',
    delivered: 'delivered',
    read: 'read',
    failed: 'failed',
  }
  return statusMap[status] ?? 'sent'
}

function extractWhatsAppContent(msg: NonNullable<WhatsAppWebhookPayload['entry'][0]['changes'][0]['value']['messages']>[0]): {
  content: string | null
  metadata: Partial<MessageMetadata>
} {
  const metadata: Partial<MessageMetadata> = {}

  if (msg.context) {
    metadata.reply_to_message_id = msg.context.id
  }

  if (msg.reaction) {
    metadata.reaction_emoji = msg.reaction.emoji
    metadata.reacted_message_id = msg.reaction.message_id
    return { content: msg.reaction.emoji, metadata }
  }

  switch (msg.type) {
    case 'text':
      return { content: msg.text?.body ?? null, metadata }
    case 'image':
      if (msg.image) {
        metadata.media_mime_type = msg.image.mime_type
        metadata.media_url = msg.image.id // Media ID, needs download via API
      }
      return { content: msg.image?.caption ?? null, metadata }
    case 'video':
      if (msg.video) {
        metadata.media_mime_type = msg.video.mime_type
        metadata.media_url = msg.video.id
      }
      return { content: msg.video?.caption ?? null, metadata }
    case 'audio':
      if (msg.audio) {
        metadata.media_mime_type = msg.audio.mime_type
        metadata.media_url = msg.audio.id
      }
      return { content: null, metadata }
    case 'document':
      if (msg.document) {
        metadata.media_mime_type = msg.document.mime_type
        metadata.media_url = msg.document.id
        metadata.media_filename = msg.document.filename
      }
      return { content: msg.document?.caption ?? null, metadata }
    case 'sticker':
      if (msg.sticker) {
        metadata.media_mime_type = msg.sticker.mime_type
        metadata.media_url = msg.sticker.id
      }
      return { content: null, metadata }
    case 'location':
      if (msg.location) {
        metadata.latitude = msg.location.latitude
        metadata.longitude = msg.location.longitude
        metadata.location_name = msg.location.name
        metadata.location_address = msg.location.address
      }
      return { content: msg.location?.name ?? null, metadata }
    default:
      return { content: null, metadata }
  }
}

/**
 * Parse a WhatsApp Cloud API webhook payload into normalized events.
 * Returns separate arrays for incoming messages and status updates.
 */
export function parseWhatsAppWebhook(payload: unknown): {
  messages: IncomingWebhookEvent[]
  statuses: MessageStatusUpdate[]
} {
  const data = payload as WhatsAppWebhookPayload
  const messages: IncomingWebhookEvent[] = []
  const statuses: MessageStatusUpdate[] = []

  if (data.object !== 'whatsapp_business_account') {
    return { messages, statuses }
  }

  for (const entry of data.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue
      const value = change.value
      const phoneNumberId = value.metadata.phone_number_id

      // Process incoming messages
      if (value.messages) {
        for (const msg of value.messages) {
          const contact = value.contacts?.find((c) => c.wa_id === msg.from)
          const { content, metadata } = extractWhatsAppContent(msg)

          messages.push({
            channel_type: 'whatsapp',
            account_id: phoneNumberId,
            customer_id: msg.from,
            customer_name: contact?.profile?.name,
            message: {
              id: msg.id,
              type: mapWhatsAppMessageType(msg.type),
              content,
              timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
              metadata,
            },
          })
        }
      }

      // Process status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          statuses.push({
            channel_type: 'whatsapp',
            channel_message_id: status.id,
            status: mapWhatsAppStatus(status.status),
            timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
            error_message: status.errors?.[0]?.title,
          })
        }
      }
    }
  }

  return { messages, statuses }
}

// ==================== MEDIA HELPERS ====================

export interface WhatsAppMediaUrlResponse {
  url: string
  mime_type: string
  sha256: string
  file_size: number
}

/** Get the download URL for a WhatsApp media ID */
export async function getWhatsAppMediaUrl(
  mediaId: string,
  accessToken: string
): Promise<WhatsAppMediaUrlResponse> {
  return metaApiRequest<WhatsAppMediaUrlResponse>({
    method: 'GET',
    path: mediaId,
    accessToken,
  })
}
