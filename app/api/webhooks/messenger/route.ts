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
import { parseInstagramWebhook } from '@/lib/meta/instagram'
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

  // Detect object type and route accordingly.
  // Instagram DMs are delivered to the Messenger webhook when both channels
  // share the same Facebook Page subscription.
  const objectType = (payload as Record<string, unknown>)?.object
  console.log('[Messenger Webhook] Payload object type:', objectType, '| preview:', JSON.stringify(payload).slice(0, 300))

  // Respond 200 immediately, process asynchronously
  if (objectType === 'instagram') {
    processInstagramViaMessengerWebhook(payload).catch((err) => {
      console.error('[Messenger Webhook] Instagram processing error:', err)
    })
  } else {
    processMessengerWebhook(payload).catch((err) => {
      console.error('[Messenger Webhook] Processing error:', err)
    })
  }

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

// Instagram DMs sometimes arrive at the Messenger webhook endpoint
// when both share the same Facebook Page subscription.
async function processInstagramViaMessengerWebhook(payload: unknown): Promise<void> {
  console.log('[Messenger Webhook] Routing Instagram DM payload to Instagram processor')
  const { messages, statuses } = parseInstagramWebhook(payload)
  const db = getServiceClient()

  for (const event of messages) {
    await handleIncomingMessage(db, event)
  }

  for (const status of statuses) {
    await handleStatusUpdate(db, status)
  }
}
