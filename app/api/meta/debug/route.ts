/**
 * GET /api/meta/debug
 * Diagnostic endpoint — checks page subscriptions, IG account linkage, and token validity.
 * Remove or protect this route before going to production.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const META_GRAPH = 'https://graph.facebook.com/v19.0'

export async function GET() {
  const db = createServiceClient()

  // Get all connected accounts
  const { data: accounts } = await db
    .from('connected_accounts')
    .select('channel_type, channel_account_id, channel_account_name, access_token, metadata')
    .in('channel_type', ['messenger', 'instagram'])
    .eq('is_active', true)

  const results: Record<string, unknown> = {}

  for (const account of accounts ?? []) {
    const meta = account.metadata as Record<string, string> | null
    const pageAccessToken = account.access_token
    const pageId =
      account.channel_type === 'messenger'
        ? account.channel_account_id
        : meta?.page_id ?? null

    if (!pageId || !pageAccessToken) {
      results[`${account.channel_type}:${account.channel_account_id}`] = {
        error: 'missing pageId or token',
        pageId,
        hasToken: !!pageAccessToken,
      }
      continue
    }

    // 1. Check subscribed apps on this page
    const subRes = await fetch(
      `${META_GRAPH}/${pageId}/subscribed_apps?access_token=${pageAccessToken}`
    ).then(r => r.json()).catch(e => ({ fetch_error: String(e) }))

    // 2. Check token debug info
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const debugRes = await fetch(
      `${META_GRAPH}/debug_token?input_token=${pageAccessToken}&access_token=${appId}|${appSecret}`
    ).then(r => r.json()).catch(e => ({ fetch_error: String(e) }))

    // 3. For Instagram: check the IG account is linked to the page
    let igLinkRes = null
    if (account.channel_type === 'messenger') {
      igLinkRes = await fetch(
        `${META_GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      ).then(r => r.json()).catch(e => ({ fetch_error: String(e) }))
    }

    results[`${account.channel_type}:${account.channel_account_id}`] = {
      pageId,
      tokenType: debugRes?.data?.type,
      tokenAppId: debugRes?.data?.app_id,
      tokenScopes: debugRes?.data?.scopes,
      tokenExpiry: debugRes?.data?.expires_at,
      tokenIsValid: debugRes?.data?.is_valid,
      subscribedApps: subRes?.data?.map((a: Record<string,unknown>) => ({
        id: a.id,
        name: a.name,
        subscribedFields: a.subscribed_fields,
      })),
      igLinked: igLinkRes?.instagram_business_account ?? null,
    }
  }

  return NextResponse.json(results, { status: 200 })
}
