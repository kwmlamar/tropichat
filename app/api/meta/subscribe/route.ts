/**
 * GET /api/meta/subscribe
 *
 * One-time setup: subscribes Facebook Pages and Instagram accounts to
 * the app webhook so that real DMs trigger webhook events.
 *
 * Hit this URL once after connecting accounts:
 *   https://www.tropichat.chat/api/meta/subscribe
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const META_GRAPH = 'https://graph.facebook.com/v19.0'
const APP_ID = process.env.META_APP_ID!

async function subscribePageToApp(pageId: string, pageAccessToken: string) {
  const res = await fetch(`${META_GRAPH}/${pageId}/subscribed_apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads,conversations,standby',
      access_token: pageAccessToken,
    }),
  })
  return res.json()
}

async function subscribeIgAccountToApp(igAccountId: string, pageAccessToken: string) {
  // Subscribe the Instagram Business Account directly to the app
  // This enables Instagram DM webhooks separately from page Messenger webhooks
  const res = await fetch(`${META_GRAPH}/${igAccountId}/subscribed_apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscribed_fields: 'messages',
      access_token: pageAccessToken,
    }),
  })
  return res.json()
}

export async function GET() {
  const db = createServiceClient()

  const { data: accounts } = await db
    .from('connected_accounts')
    .select('id, user_id, channel_type, channel_account_id, channel_account_name, access_token, metadata')
    .in('channel_type', ['messenger', 'instagram'])
    .eq('is_active', true)

  // Build lookup: page_id -> page_access_token from Messenger rows
  const messengerTokenByPageId: Record<string, string> = {}
  for (const account of accounts ?? []) {
    if (account.channel_type === 'messenger') {
      messengerTokenByPageId[account.channel_account_id] = account.access_token
    }
  }

  const results = []

  for (const account of accounts ?? []) {
    const meta = account.metadata as Record<string, string> | null

    if (account.channel_type === 'messenger') {
      // 1. Subscribe the Facebook Page (covers Messenger DMs)
      const pageData = await subscribePageToApp(account.channel_account_id, account.access_token)

      results.push({
        action: 'subscribe_page',
        account: account.channel_account_name,
        pageId: account.channel_account_id,
        status: pageData.success ? 'subscribed' : 'error',
        response: pageData,
      })

      // 2. Also subscribe the linked IG account directly using the PAGE token
      // First fetch the linked IG account ID
      try {
        const igRes = await fetch(
          `${META_GRAPH}/${account.channel_account_id}?fields=instagram_business_account&access_token=${account.access_token}`
        ).then(r => r.json())

        const igId = igRes?.instagram_business_account?.id
        if (igId) {
          const igSubData = await subscribeIgAccountToApp(igId, account.access_token)
          results.push({
            action: 'subscribe_ig_account',
            account: account.channel_account_name,
            igAccountId: igId,
            pageId: account.channel_account_id,
            status: igSubData.success ? 'subscribed' : 'error',
            response: igSubData,
          })
        } else {
          results.push({
            action: 'subscribe_ig_account',
            account: account.channel_account_name,
            status: 'skipped',
            reason: 'No linked Instagram account found on page',
            igResponse: igRes,
          })
        }
      } catch (e) {
        results.push({
          action: 'subscribe_ig_account',
          account: account.channel_account_name,
          status: 'exception',
          error: String(e),
        })
      }

    } else if (account.channel_type === 'instagram') {
      // Use the page token from the matching Messenger row
      const pageId = meta?.page_id ?? ''
      const pageToken = meta?.page_access_token ?? messengerTokenByPageId[pageId] ?? ''

      if (!pageId || !pageToken) {
        results.push({
          action: 'subscribe_ig_direct',
          account: account.channel_account_name,
          igAccountId: account.channel_account_id,
          status: 'skipped',
          reason: `No page_id (${pageId || 'missing'}) or page token`,
        })
        continue
      }

      const igSubData = await subscribeIgAccountToApp(account.channel_account_id, pageToken)
      results.push({
        action: 'subscribe_ig_direct',
        account: account.channel_account_name,
        igAccountId: account.channel_account_id,
        pageId,
        status: igSubData.success ? 'subscribed' : 'error',
        response: igSubData,
      })
    }
  }

  // Also ensure the app-level Instagram webhook subscription is set
  // This registers the callback URL with Meta for the Instagram product
  try {
    const appSecret = process.env.META_APP_SECRET!
    const appToken = `${APP_ID}|${appSecret}`
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/messenger`
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN!

    const appSubRes = await fetch(`${META_GRAPH}/${APP_ID}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        object: 'instagram',
        callback_url: webhookUrl,
        fields: 'messages',
        verify_token: verifyToken,
        access_token: appToken,
      }),
    }).then(r => r.json())

    results.push({
      action: 'app_instagram_subscription',
      webhookUrl,
      status: appSubRes.success ? 'subscribed' : 'error',
      response: appSubRes,
    })
  } catch (e) {
    results.push({
      action: 'app_instagram_subscription',
      status: 'exception',
      error: String(e),
    })
  }

  return NextResponse.json({ results }, { status: 200 })
}
