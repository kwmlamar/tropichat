/**
 * GET  /api/meta/instagram-accounts — List Instagram Business Accounts linked to the user's Meta token
 * POST /api/meta/instagram-accounts — Set the active Instagram account
 *
 * Instagram Business Accounts are fetched via the Facebook Pages linked to the user's Meta token.
 * Each FB Page can have an attached instagram_business_account.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export interface InstagramAccount {
  id: string
  name: string
  username: string
  profile_picture_url: string | null
  follower_count: number
  is_connected: boolean
}

// Demo accounts for demo tokens
const DEMO_INSTAGRAM_ACCOUNTS: InstagramAccount[] = [
  {
    id: '17841400000000001',
    name: 'TropiTech Solutions',
    username: '@tropitech',
    profile_picture_url: 'https://ui-avatars.com/api/?name=TT&background=E1306C&color=fff&size=200',
    follower_count: 3210,
    is_connected: true,
  },
  {
    id: '17841400000000002',
    name: 'Nassau Water Sports',
    username: '@nassauwatersports',
    profile_picture_url: 'https://ui-avatars.com/api/?name=NW&background=C13584&color=fff&size=200',
    follower_count: 1847,
    is_connected: false,
  },
]

export async function GET(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the Meta connection for messenger (same token used for Instagram)
    const { data: connection } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel', 'messenger')
      .eq('is_active', true)
      .single()

    // Get currently connected Instagram account
    const { data: connectedAccount } = await supabase
      .from('connected_accounts')
      .select('channel_account_id')
      .eq('user_id', user.id)
      .eq('channel_type', 'instagram')
      .eq('is_active', true)
      .maybeSingle()

    // Demo token fallback
    if (!connection || connection.access_token.startsWith('DEMO_')) {
      const accounts = DEMO_INSTAGRAM_ACCOUNTS.map((a) => ({
        ...a,
        is_connected: connectedAccount?.channel_account_id === a.id,
      }))
      return NextResponse.json({ accounts })
    }

    // Real Meta API: fetch pages with their linked instagram_business_account
    try {
      const res = await fetch(
        `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account{id,name,username,profile_picture_url,followers_count}&access_token=${connection.access_token}`
      )
      const data = await res.json()

      if (data.error) {
        console.error('Meta Instagram accounts API error:', data.error)
        return NextResponse.json({ accounts: DEMO_INSTAGRAM_ACCOUNTS })
      }

      // Extract Instagram accounts from pages
      const accounts: InstagramAccount[] = []
      for (const page of data.data || []) {
        const iga = page.instagram_business_account
        if (!iga) continue
        accounts.push({
          id: iga.id,
          name: iga.name || page.name,
          username: iga.username ? `@${iga.username}` : `@${iga.id}`,
          profile_picture_url: iga.profile_picture_url || null,
          follower_count: iga.followers_count || 0,
          is_connected: connectedAccount?.channel_account_id === iga.id,
        })
      }

      return NextResponse.json({ accounts })
    } catch (apiErr) {
      console.error('Meta Instagram accounts fetch error:', apiErr)
      return NextResponse.json({ accounts: DEMO_INSTAGRAM_ACCOUNTS })
    }
  } catch (err) {
    console.error('Instagram accounts GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { accountId, accountName, profilePictureUrl, username } = await request.json()
    if (!accountId) return NextResponse.json({ error: 'accountId is required' }, { status: 400 })

    // Get access token for Instagram (uses same messenger token)
    const { data: conn } = await supabase
      .from('meta_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('channel', 'messenger')
      .maybeSingle()

    const accessToken = conn?.access_token || 'DEMO_ACCESS_TOKEN_IG'

    // 1. Deactivate all existing Instagram connected_accounts for this user
    await supabase
      .from('connected_accounts')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('channel_type', 'instagram')

    // 2. Check if a row already exists for this account
    const { data: existing } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('channel_type', 'instagram')
      .eq('channel_account_id', accountId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('connected_accounts')
        .update({
          is_active: true,
          access_token: accessToken,
          metadata: { ig_account_name: accountName, profile_picture_url: profilePictureUrl, username },
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          channel_type: 'instagram',
          access_token: accessToken,
          channel_account_id: accountId,
          channel_account_name: accountName || 'Instagram Account',
          metadata: { ig_account_name: accountName, profile_picture_url: profilePictureUrl, username },
          is_active: true,
        })
    }

    // 3. Update meta_connections instagram row to reflect active account
    await supabase
      .from('meta_connections')
      .update({ account_id: accountId, account_name: accountName })
      .eq('user_id', user.id)
      .eq('channel', 'instagram')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Instagram accounts POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
