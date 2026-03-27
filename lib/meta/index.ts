/**
 * TropiChat Unified Meta API Client
 *
 * Single entry point for sending messages and parsing webhooks across
 * WhatsApp Cloud API, Instagram Messaging API, and Facebook Messenger.
 *
 * Usage:
 *   import { sendMessage, parseWebhook } from '@/lib/meta'
 */

export { MetaApiClientError, RateLimitError } from './client'

// Channel-specific exports
export {
  sendWhatsAppText,
  sendWhatsAppMedia,
  sendWhatsAppTemplate,
  markWhatsAppMessageRead,
  parseWhatsAppWebhook,
  getWhatsAppMediaUrl,
} from './whatsapp'

export {
  sendInstagramText,
  sendInstagramMedia,
  getInstagramConversations,
  getInstagramMessages,
  getInstagramUserProfile,
  parseInstagramWebhook,
} from './instagram'

export {
  sendMessengerText,
  sendMessengerMedia,
  sendMessengerButtonTemplate,
  getMessengerConversations,
  getMessengerMessages,
  getMessengerUserProfile,
  parseMessengerWebhook,
} from './messenger'

// Re-export types used by consumers
export type {
  ChannelType,
  IncomingWebhookEvent,
  MessageStatusUpdate,
  SendUnifiedMessageInput,
} from '@/types/unified-inbox'

// ==================== UNIFIED SEND ====================

import type { ChannelType, MetaSendResponse, MessageContentType } from '@/types/unified-inbox'
import { sendWhatsAppText, sendWhatsAppMedia } from './whatsapp'
import { sendInstagramText, sendInstagramMedia } from './instagram'
import { sendMessengerText, sendMessengerMedia } from './messenger'
import { Resend } from 'resend'
import { Twilio } from 'twilio'

const resend = new Resend(process.env.RESEND_API_KEY)
const twilio = new Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

export interface UnifiedSendOptions {
  channelType: ChannelType
  /** Platform account ID (phone_number_id / ig_user_id / page_id) */
  accountId: string
  /** The Facebook Page ID linked to the Instagram account (required for sending through Messenger API for Instagram) */
  pageId?: string
  accessToken: string
  /** Recipient ID (phone number / IG-scoped ID / PSID) */
  recipientId: string
  content: string
  messageType?: MessageContentType
  mediaUrl?: string
  /** When true, sends with HUMAN_AGENT tag for 7-day response window */
  humanAgentTag?: boolean
}

/**
 * Send a message through any channel with a single function call.
 * Routes to the correct platform API based on channelType.
 * When humanAgentTag is true, includes MESSAGE_TAG + HUMAN_AGENT for extended response window.
 */
export async function sendMessage(options: UnifiedSendOptions): Promise<MetaSendResponse> {
  const { channelType, accountId, accessToken, recipientId, content, messageType = 'text', mediaUrl, humanAgentTag } = options

  // Media message
  if (messageType !== 'text' && mediaUrl) {
    const mediaType = (['image', 'video', 'audio', 'file'] as const).includes(messageType as 'image' | 'video' | 'audio' | 'file')
      ? (messageType as 'image' | 'video' | 'audio' | 'file')
      : 'file'

    switch (channelType) {
      case 'whatsapp':
        return sendWhatsAppMedia({
          phoneNumberId: accountId,
          accessToken,
          to: recipientId,
          type: mediaType === 'file' ? 'document' : mediaType,
          mediaUrl,
          caption: content || undefined,
        })
      case 'instagram':
        return sendInstagramMedia({
          igUserId: accountId,
          pageId: options.pageId,
          accessToken,
          recipientId,
          type: mediaType,
          mediaUrl,
          humanAgentTag,
        })
      case 'messenger':
        return sendMessengerMedia({
          pageId: accountId,
          accessToken,
          recipientPsid: recipientId,
          type: mediaType,
          mediaUrl,
          humanAgentTag,
        })
      case 'email':
        // For email, we treat media as an attachment
        const emailMediaRes = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'outreach@tropichat.chat',
          to: recipientId,
          subject: `Media Message from TropiChat`,
          text: content || 'View attachment below',
          attachments: [{ filename: 'attachment', path: mediaUrl }],
          replyTo: process.env.RESEND_REPLY_TO_EMAIL,
        })
        return { message_id: emailMediaRes.data?.id || 'email_pending' }
      case 'sms':
        const smsMediaRes = await twilio.messages.create({
          body: content,
          from: process.env.TWILIO_PHONE_NUMBER || '+14155238886', // Primary SMS Gateway
          to: recipientId,
          mediaUrl: [mediaUrl],
        })
        return { message_id: smsMediaRes.sid }
      default:
        throw new Error(`Channel ${channelType} is not supported through Meta API for media messages.`)
    }
  }

  // Text message
  switch (channelType) {
    case 'whatsapp':
      return sendWhatsAppText({
        phoneNumberId: accountId,
        accessToken,
        to: recipientId,
        body: content,
        humanAgentTag,
      })
    case 'instagram':
      return sendInstagramText({
        igUserId: accountId,
        pageId: options.pageId,
        accessToken,
        recipientId,
        text: content,
        humanAgentTag,
      })
    case 'messenger':
      return sendMessengerText({
        pageId: accountId,
        accessToken,
        recipientPsid: recipientId,
        text: content,
        messagingType: humanAgentTag ? 'MESSAGE_TAG' : 'RESPONSE',
        tag: humanAgentTag ? 'HUMAN_AGENT' : undefined,
      })
    case 'email':
      const emailRes = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'outreach@tropichat.chat',
        to: recipientId,
        subject: `Re: Message from TropiChat`,
        text: content,
        replyTo: process.env.RESEND_REPLY_TO_EMAIL,
      })
      return { message_id: emailRes.data?.id || 'email_pending' }
    case 'sms':
      const smsRes = await twilio.messages.create({
        body: content,
        from: process.env.TWILIO_PHONE_NUMBER || '+14155238886',
        to: recipientId,
      })
      return { message_id: smsRes.sid }
    default:
      throw new Error(`Channel ${channelType} is not supported through Meta API for text messages.`)
  }
}

// ==================== UNIFIED WEBHOOK PARSER ====================

import { parseWhatsAppWebhook } from './whatsapp'
import { parseInstagramWebhook } from './instagram'
import { parseMessengerWebhook } from './messenger'
import type { IncomingWebhookEvent, MessageStatusUpdate } from '@/types/unified-inbox'

/**
 * Parse a webhook payload from any Meta platform.
 * Auto-detects the channel from the payload's `object` field.
 */
export function parseWebhook(payload: unknown): {
  messages: IncomingWebhookEvent[]
  statuses: MessageStatusUpdate[]
} {
  const obj = (payload as { object?: string })?.object

  switch (obj) {
    case 'whatsapp_business_account':
      return parseWhatsAppWebhook(payload)
    case 'instagram':
      return parseInstagramWebhook(payload)
    case 'page':
      return parseMessengerWebhook(payload)
    default:
      return { messages: [], statuses: [] }
  }
}
