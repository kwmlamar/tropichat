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

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  for (const account of accounts ?? []) {
    const meta = account.metadata as Record<string, string> | null
    const token = account.access_token
    const pageId =
      account.channel_type === 'messenger'
        ? account.channel_account_id
        : meta?.page_id ?? null

    if (!token) {
      results[`${account.channel_type}:${account.channel_account_id}`] = {
        error: 'missing access_token',
        hasMetadataPageId: !!meta?.page_id,
        hasMetadataPageAccessToken: !!meta?.page_access_token,
      }
      continue
    }

    // Token debug (works for both user and page tokens)
    const debugRes = await fetch(
      `${META_GRAPH}/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`
    ).then(r => r.json()).catch(e => ({ fetch_error: String(e) }))

    const tokenType = debugRes?.data?.type as string | undefined
    const isPageToken = tokenType === 'PAGE'

    // For Instagram: sending messages requires a PAGE token. USER token → API #3.
    const sendCapable =
      account.channel_type === 'messenger'
        ? isPageToken
        : account.channel_type === 'instagram'
          ? isPageToken
          : true

    const entry: Record<string, unknown> = {
      pageId: pageId ?? null,
      tokenType,
      tokenAppId: debugRes?.data?.app_id,
      tokenScopes: debugRes?.data?.scopes,
      tokenExpiry: debugRes?.data?.expires_at,
      tokenIsValid: debugRes?.data?.is_valid,
      sendCapable,
      hint: account.channel_type === 'instagram' && !isPageToken
        ? 'Instagram send requires a PAGE token. Disconnect and re-connect Instagram in Settings so we store the page token.'
        : undefined,
    }

    if (pageId) {
      const subRes = await fetch(
        `${META_GRAPH}/${pageId}/subscribed_apps?access_token=${token}`
      ).then(r => r.json()).catch(e => ({ fetch_error: String(e) }))
      entry.subscribedApps = subRes?.data?.map((a: Record<string, unknown>) => ({
        id: a.id,
        name: a.name,
        subscribedFields: a.subscribed_fields,
      }))

      if (account.channel_type === 'messenger') {
        const igLinkRes = await fetch(
          `${META_GRAPH}/${pageId}?fields=instagram_business_account&access_token=${token}`
        ).then(r => r.json()).catch(e => ({ fetch_error: String(e) }))
        entry.igLinked = igLinkRes?.instagram_business_account ?? null
      }
    } else if (account.channel_type === 'instagram') {
      entry.hint = 'No page_id in metadata. Re-connect Instagram so we can link the Page and store its token.'
    }

    results[`${account.channel_type}:${account.channel_account_id}`] = entry
  }

  return NextResponse.json(results, { status: 200 })
}
