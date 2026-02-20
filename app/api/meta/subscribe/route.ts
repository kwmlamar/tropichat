/**
 * GET /api/meta/subscribe
 *
 * One-time setup: subscribes Facebook Pages to the app webhook so that
 * real Instagram DMs and Messenger messages trigger webhook events.
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
    .select('id, user_id, channel_type, channel_account_id, channel_account_name, access_token, metadata')
    .in('channel_type', ['messenger', 'instagram'])
    .eq('is_active', true)

  if (error || !accounts) {
    return NextResponse.json({ error: 'Failed to fetch accounts', detail: error }, { status: 500 })
  }

  // Build a lookup: user_id -> page_id -> page_access_token from Messenger rows
  // (Messenger rows store the page access token directly as access_token)
  const messengerTokenByPageId: Record<string, string> = {}
  for (const account of accounts) {
    if (account.channel_type === 'messenger') {
      messengerTokenByPageId[account.channel_account_id] = account.access_token
    }
  }

  const results = []

  // Process only unique page subscriptions (dedupe by pageId)
  const subscribedPageIds = new Set<string>()

  for (const account of accounts) {
    const meta = account.metadata as Record<string, string> | null

    let pageId: string
    let pageAccessToken: string

    if (account.channel_type === 'messenger') {
      pageId = account.channel_account_id
      pageAccessToken = account.access_token
    } else {
      // Instagram: page_id is in metadata, token comes from the matching Messenger row
      pageId = meta?.page_id ?? ''
      // Try: metadata.page_access_token first, then matching Messenger row, then own token
      pageAccessToken =
        meta?.page_access_token ??
        messengerTokenByPageId[pageId] ??
        account.access_token
    }

    if (!pageId) {
      results.push({
        account: account.channel_account_name,
        channel: account.channel_type,
        status: 'skipped',
        reason: 'No page_id found',
      })
      continue
    }

    // Skip non-PAGE tokens — only PAGE tokens can subscribe fields
    // The Messenger row always has a PAGE token; use it for both channels
    if (account.channel_type === 'instagram') {
      results.push({
        account: account.channel_account_name,
        channel: account.channel_type,
        pageId,
        status: 'skipped',
        reason: 'Instagram uses same page subscription as Messenger row',
      })
      continue
    }

    // Skip if we already subscribed this page
    if (subscribedPageIds.has(pageId)) {
      results.push({
        account: account.channel_account_name,
        channel: account.channel_type,
        pageId,
        status: 'skipped',
        reason: 'Page already subscribed via another account row',
      })
      continue
    }

    if (!pageAccessToken) {
      results.push({
        account: account.channel_account_name,
        channel: account.channel_type,
        pageId,
        status: 'skipped',
        reason: 'No page access token found',
      })
      continue
    }

    try {
      const res = await fetch(
        `${META_GRAPH}/${pageId}/subscribed_apps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads,instagram_manage_messages',
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
          errorCode: data.error.code,
        })
      } else {
        subscribedPageIds.add(pageId)
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
