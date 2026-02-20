/**
 * GET /api/meta/subscribe
 *
 * One-time setup: subscribes Facebook Pages to the app webhook so that
 * real Instagram DMs and Messenger messages trigger webhook events.
 *
 * This calls POST /{page-id}/subscribed_apps with the page access token
 * for every active Messenger/Instagram connected account.
 *
 * Hit this URL once after connecting accounts:
 *   https://www.tropichat.chat/api/meta/subscribe
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const META_GRAPH = 'https://graph.facebook.com/v19.0'

export async function GET() {
  const db = createServiceClient()

  // Fetch all active messenger + instagram connected accounts
  const { data: accounts, error } = await db
    .from('connected_accounts')
    .select('id, channel_type, channel_account_id, channel_account_name, access_token, metadata')
    .in('channel_type', ['messenger', 'instagram'])
    .eq('is_active', true)

  if (error || !accounts) {
    return NextResponse.json({ error: 'Failed to fetch accounts', detail: error }, { status: 500 })
  }

  const results = []

  for (const account of accounts) {
    const meta = account.metadata as Record<string, string> | null

    // For Instagram accounts, the page access token is stored in metadata.page_access_token
    // For Messenger, the access_token on the row is already the page access token
    const pageAccessToken =
      meta?.page_access_token ?? account.access_token

    // For Instagram, we need the Facebook Page ID (stored in metadata.page_id)
    // For Messenger, channel_account_id IS the page ID
    const pageId =
      account.channel_type === 'instagram'
        ? (meta?.page_id ?? account.channel_account_id)
        : account.channel_account_id

    if (!pageId || !pageAccessToken) {
      results.push({
        account: account.channel_account_name,
        channel: account.channel_type,
        status: 'skipped',
        reason: 'Missing page_id or page_access_token',
      })
      continue
    }

    // Subscribe fields differ by channel
    const subscribedFields =
      account.channel_type === 'instagram'
        ? 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'
        : 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'

    try {
      const res = await fetch(
        `${META_GRAPH}/${pageId}/subscribed_apps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscribed_fields: subscribedFields,
            access_token: pageAccessToken,
          }),
        }
      )
      const data = await res.json()

      if (data.error) {
        results.push({
          account: account.channel_account_name,
          channel: account.channel_type,
          pageId,
          status: 'error',
          error: data.error.message,
        })
      } else {
        results.push({
          account: account.channel_account_name,
          channel: account.channel_type,
          pageId,
          status: data.success ? 'subscribed' : 'unknown',
          response: data,
        })
      }
    } catch (e) {
      results.push({
        account: account.channel_account_name,
        channel: account.channel_type,
        pageId,
        status: 'exception',
        error: String(e),
      })
    }
  }

  return NextResponse.json({ results }, { status: 200 })
}
