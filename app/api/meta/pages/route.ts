/**
 * GET /api/meta/pages — List Facebook Pages the user manages
 *
 * Calls GET /me/accounts on Meta Graph API to retrieve pages.
 * Falls back to demo data if token is a demo token.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

// Demo pages for when using demo tokens
const DEMO_PAGES = [
  {
    id: '200000000000001',
    name: 'Simply Dave Nassau Tours',
    category: 'Tour Operator',
    profile_picture_url: 'https://ui-avatars.com/api/?name=SD&background=0084FF&color=fff&size=200',
    follower_count: 1247,
    is_connected: true,
  },
  {
    id: '200000000000002',
    name: 'Nassau Water Sports',
    category: 'Sports & Recreation',
    profile_picture_url: 'https://ui-avatars.com/api/?name=NW&background=1877F2&color=fff&size=200',
    follower_count: 856,
    is_connected: false,
  },
  {
    id: '200000000000003',
    name: 'Caribbean Island Eats',
    category: 'Restaurant',
    profile_picture_url: 'https://ui-avatars.com/api/?name=CE&background=4267B2&color=fff&size=200',
    follower_count: 2103,
    is_connected: false,
  },
]

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pageId, pageName, profilePictureUrl } = await request.json()
    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    // Get the meta_connections row for messenger (has the user access token)
    const { data: conn } = await supabase
      .from('meta_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('channel', 'messenger')
      .maybeSingle()

    const isDemoToken = !conn || conn.access_token.startsWith('DEMO_')

    // For real tokens, fetch the page-specific access token from Meta API.
    // Messenger's Send API requires a Page access token, not a user token.
    let pageAccessToken = conn?.access_token || 'DEMO_ACCESS_TOKEN_FB'

    if (!isDemoToken) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v22.0/me/accounts?fields=id,access_token&access_token=${conn!.access_token}`
        )
        const data = await res.json()
        const page = (data.data || []).find((p: { id: string }) => p.id === pageId)
        if (page?.access_token) {
          pageAccessToken = page.access_token
        }
      } catch (e) {
        console.error('Failed to fetch page token from Meta:', e)
      }
    }

    // 1. Deactivate all messenger connected_accounts for this user
    await supabase
      .from('connected_accounts')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('channel_type', 'messenger')

    // 2. Check if a row already exists for this page
    const { data: existing } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('channel_type', 'messenger')
      .eq('channel_account_id', pageId)
      .maybeSingle()

    if (existing) {
      // Reactivate and update the token
      await supabase
        .from('connected_accounts')
        .update({
          is_active: true,
          access_token: pageAccessToken,
          metadata: {
            page_name: pageName,
            profile_picture_url: profilePictureUrl,
            page_id: pageId,
            page_access_token: pageAccessToken,
          },
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          channel_type: 'messenger',
          access_token: pageAccessToken,
          channel_account_id: pageId,
          channel_account_name: pageName || 'Facebook Page',
          metadata: {
            page_name: pageName,
            profile_picture_url: profilePictureUrl,
            page_id: pageId,
            page_access_token: pageAccessToken,
          },
          is_active: true,
        })
    }

    // 3. Keep meta_connections in sync
    const metaUpdate: Record<string, unknown> = { account_id: pageId }
    if (!isDemoToken) {
      metaUpdate.page_access_token = pageAccessToken
    }
    await supabase
      .from('meta_connections')
      .update(metaUpdate)
      .eq('user_id', user.id)
      .eq('channel', 'messenger')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Pages POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the Meta connection for messenger
    const { data: connection } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'messenger')
      .eq('is_active', true)
      .single()

    // If no connection or demo token, return demo data
    if (!connection || connection.access_token.startsWith('DEMO_')) {
      // Check which page is currently connected
      const { data: connectedAccount } = await supabase
        .from('connected_accounts')
        .select('channel_account_id')
        .eq('user_id', user.id)
        .eq('channel_type', 'messenger')
        .eq('is_active', true)
        .single()

      const pages = DEMO_PAGES.map((page) => ({
        ...page,
        is_connected: connectedAccount?.channel_account_id === page.id,
      }))

      return NextResponse.json({ pages })
    }

    // Real Meta API call
    try {
      const res = await fetch(
        `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,category,picture,fan_count,access_token&access_token=${connection.access_token}`
      )
      const data = await res.json()

      if (data.error) {
        console.error('Meta pages API error:', data.error)
        return NextResponse.json({ pages: DEMO_PAGES })
      }

      // Check which page is currently connected
      const { data: connectedAccount } = await supabase
        .from('connected_accounts')
        .select('channel_account_id')
        .eq('user_id', user.id)
        .eq('channel_type', 'messenger')
        .eq('is_active', true)
        .single()

      const pages = (data.data || []).map((page: Record<string, unknown>) => ({
        id: page.id,
        name: page.name,
        category: page.category || 'Unknown',
        profile_picture_url: (page.picture as Record<string, Record<string, string>>)?.data?.url || null,
        follower_count: page.fan_count || 0,
        is_connected: connectedAccount?.channel_account_id === page.id,
      }))

      return NextResponse.json({ pages })
    } catch (apiErr) {
      console.error('Meta pages fetch error:', apiErr)
      return NextResponse.json({ pages: DEMO_PAGES })
    }
  } catch (err) {
    console.error('Pages GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
