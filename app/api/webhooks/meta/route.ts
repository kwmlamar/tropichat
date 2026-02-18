/**
 * Unified Meta Platform Webhook Handler
 *
 * Single endpoint for WhatsApp, Instagram, AND Messenger webhooks.
 * Auto-detects channel from payload. Use this OR the per-channel routes — not both.
 *
 * GET  → Webhook verification (subscribe handshake)
 * POST → Incoming messages and status updates
 *
 * Configure this URL in Meta App Dashboard:
 *   https://your-domain.com/api/webhooks/meta
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseWebhook } from '@/lib/meta'
import {
  getServiceClient,
  verifyMetaSignature,
  handleIncomingMessage,
  handleStatusUpdate,
} from '@/lib/meta/webhook-processor'

// ==================== WEBHOOK VERIFICATION (GET) ====================

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[Webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn('[Webhook] Verification failed', { mode, tokenMatch: token === process.env.META_WEBHOOK_VERIFY_TOKEN })
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// ==================== INCOMING WEBHOOKS (POST) ====================

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-hub-signature-256')
  const appSecret = process.env.META_APP_SECRET

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (appSecret && signature) {
    const valid = await verifyMetaSignature(rawBody, signature, appSecret)
    if (!valid) {
      console.warn('[Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Always respond 200 quickly to avoid webhook retries
  processWebhook(payload).catch((err) => {
    console.error('[Webhook] Processing error:', err)
  })

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

async function processWebhook(payload: unknown): Promise<void> {
  const { messages, statuses } = parseWebhook(payload)
  const db = getServiceClient()

  for (const event of messages) {
    await handleIncomingMessage(db, event)
  }

  for (const status of statuses) {
    await handleStatusUpdate(db, status)
  }
}
