/**
 * Facebook Messenger Webhook Handler
 *
 * GET  → Meta webhook verification handshake
 * POST → Incoming Messenger messages, postbacks, and delivery receipts
 *
 * Configure in Meta App Dashboard → Messenger → Settings:
 *   Callback URL: https://your-domain.com/api/webhooks/messenger
 *   Verify Token: (matches META_WEBHOOK_VERIFY_TOKEN env var)
 *   Subscribed fields: messages, messaging_postbacks
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseMessengerWebhook } from '@/lib/meta/messenger'
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
    console.log('[Messenger Webhook] Verification successful')
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
      console.warn('[Messenger Webhook] Invalid signature')
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
  processMessengerWebhook(payload).catch((err) => {
    console.error('[Messenger Webhook] Processing error:', err)
  })

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

async function processMessengerWebhook(payload: unknown): Promise<void> {
  const { messages, statuses } = parseMessengerWebhook(payload)
  const db = getServiceClient()

  for (const event of messages) {
    await handleIncomingMessage(db, event)
  }

  for (const status of statuses) {
    await handleStatusUpdate(db, status)
  }
}
