/**
 * WhatsApp Cloud API Webhook Handler
 *
 * GET  → Meta webhook verification handshake
 * POST → Incoming WhatsApp messages and delivery status updates
 *
 * Configure in Meta App Dashboard → WhatsApp → Configuration:
 *   Callback URL: https://your-domain.com/api/webhooks/whatsapp
 *   Verify Token: (matches META_WEBHOOK_VERIFY_TOKEN env var)
 *   Subscribed fields: messages
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseWhatsAppWebhook } from '@/lib/meta/whatsapp'
import {
  getServiceClient,
  verifyMetaSignature,
  handleIncomingMessage,
  handleStatusUpdate,
} from '@/lib/meta/webhook-processor'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256')
  const appSecret = process.env.META_APP_SECRET

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Verify signature
  if (appSecret && signature) {
    const valid = await verifyMetaSignature(rawBody, signature, appSecret)
    if (!valid) {
      console.warn('[WhatsApp Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Respond 200 immediately, process asynchronously
  processWhatsAppWebhook(payload).catch((err) => {
    console.error('[WhatsApp Webhook] Processing error:', err)
  })

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

async function processWhatsAppWebhook(payload: unknown): Promise<void> {
  const { messages, statuses } = parseWhatsAppWebhook(payload)
  const db = getServiceClient()

  for (const event of messages) {
    await handleIncomingMessage(db, event)
  }

  for (const status of statuses) {
    await handleStatusUpdate(db, status)
  }
}
