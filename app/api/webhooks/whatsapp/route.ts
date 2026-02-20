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
  console.log('[WhatsApp Webhook] ── POST received ──')

  const signature = request.headers.get('x-hub-signature-256')
  const appSecret = process.env.META_APP_SECRET

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  console.log('[WhatsApp Webhook] Payload size:', rawBody.length, 'bytes')
  console.log('[WhatsApp Webhook] Payload preview:', rawBody.slice(0, 500))

  // Verify signature
  if (appSecret && signature) {
    const valid = await verifyMetaSignature(rawBody, signature, appSecret)
    if (!valid) {
      console.warn('[WhatsApp Webhook] Invalid signature — dropping')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    console.log('[WhatsApp Webhook] Signature verified ✓')
  } else {
    console.warn('[WhatsApp Webhook] No signature verification — appSecret:', !!appSecret, 'signature:', !!signature)
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Process synchronously before responding — Vercel serverless functions
  // terminate after the response is sent, killing any async work.
  try {
    await processWhatsAppWebhook(payload)
  } catch (err) {
    console.error('[WhatsApp Webhook] Processing error:', err)
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

async function processWhatsAppWebhook(payload: unknown): Promise<void> {
  const { messages, statuses } = parseWhatsAppWebhook(payload)

  console.log(`[WhatsApp Webhook] Parsed: ${messages.length} message(s), ${statuses.length} status update(s)`)

  if (messages.length > 0) {
    console.log('[WhatsApp Webhook] First message account_id (phone_number_id):', messages[0].account_id)
    console.log('[WhatsApp Webhook] First message customer_id:', messages[0].customer_id)
  }

  const db = getServiceClient()

  for (const event of messages) {
    console.log(`[WhatsApp Webhook] Processing message from ${event.customer_id} for account ${event.account_id}`)
    await handleIncomingMessage(db, event)
  }

  for (const status of statuses) {
    await handleStatusUpdate(db, status)
  }

  console.log('[WhatsApp Webhook] ── Processing complete ──')
}
