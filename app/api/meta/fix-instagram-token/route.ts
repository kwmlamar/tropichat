/**
 * GET /api/meta/fix-instagram-token
 *
 * One-time fix: copies the page access token from the Messenger connected_account
 * row into the Instagram connected_account row's metadata, so the Instagram
 * webhook processor can use it for profile lookups.
 *
 * Also verifies the token works by calling the Graph API.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const META_GRAPH = 'https://graph.facebook.com/v19.0'

export async function GET() {
  const db = createServiceClient()

  // Get the Messenger row — it has a valid PAGE access token
  const { data: messengerAccount } = await db
    .from('connected_accounts')
    .select('channel_account_id, access_token, channel_account_name')
    .eq('channel_type', 'messenger')
    .eq('channel_account_id', '1078720298651277')
    .eq('is_active', true)
    .single()

  if (!messengerAccount) {
    return NextResponse.json({ error: 'No active Messenger account found for page 1078720298651277' }, { status: 404 })
  }

  const pageToken = messengerAccount.access_token
  const pageId = messengerAccount.channel_account_id

  // Verify the token works and get IG account linked to page
  const pageRes = await fetch(
    `${META_GRAPH}/${pageId}?fields=instagram_business_account{id,username,name}&access_token=${pageToken}`
  ).then(r => r.json())

  const igAccount = pageRes?.instagram_business_account
  if (!igAccount) {
    return NextResponse.json({
      error: 'No Instagram Business Account linked to page',
      pageResponse: pageRes,
    }, { status: 400 })
  }

  // Update the Instagram connected_accounts row with the page access token
  const { error: updateErr } = await db
    .from('connected_accounts')
    .update({
      metadata: {
        page_id: pageId,
        page_access_token: pageToken,
        ig_username: igAccount.username,
      },
    })
    .eq('channel_type', 'instagram')
    .eq('channel_account_id', igAccount.id)

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update Instagram row', detail: updateErr }, { status: 500 })
  }

  // Verify the token can fetch the IG user's profile
  const igProfileRes = await fetch(
    `${META_GRAPH}/${igAccount.id}?fields=id,username,name&access_token=${pageToken}`
  ).then(r => r.json())

  return NextResponse.json({
    success: true,
    pageId,
    igAccountId: igAccount.id,
    igUsername: igAccount.username,
    tokenWorks: !igProfileRes.error,
    igProfile: igProfileRes,
  })
}
