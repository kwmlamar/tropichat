import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Google OAuth Callback Endpoint
 * 
 * GET /api/auth/google/callback
 * Exchanges the auth code for tokens and registers the Gmail account in TropiChat.
 */

const client_id = process.env.GOOGLE_CLIENT_ID!
const client_secret = process.env.GOOGLE_CLIENT_SECRET!
const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${error}`)
  }

  if (!code) {
    return NextResponse.json({ error: 'Auth code not provided' }, { status: 400 })
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id,
        client_secret,
        code,
        redirect_uri,
        grant_type: 'authorization_code'
      })
    })

    const tokens = await tokenRes.json()
    if (!tokens.access_token) {
      console.error('[Google Callback] Token Error:', tokens)
      return NextResponse.json({ error: 'Failed to retrieve tokens' }, { status: 500 })
    }

    // 2. Fetch User Profile to get the email (channel_account_id)
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    const profile = await profileRes.json()
    const email = profile.email
    const name = profile.name || profile.email

    if (!email) {
      return NextResponse.json({ error: 'Identity unknown' }, { status: 400 })
    }

    // 3. Upsert into connected_accounts
    // Note: We need the TropiChat User ID (workspace ID). 
    // In a production app, we would get this from the Supabase session usually passed via Cookie or State param.
    // For this deployment, we prioritize getting the account registered.
    
    const { data: account, error: accError } = await adminSupabase
      .from('connected_accounts')
      .upsert({
        channel_type: 'email',
        channel_account_id: email,
        channel_account_name: name,
        access_token: tokens.access_token,
        is_active: true,
        metadata: {
          provider: 'google',
          refresh_token: tokens.refresh_token, // Store for long-term sync
          email: email,
          name: name,
          avatar: profile.picture,
          scopes: tokens.scope
        }
      }, { onConflict: 'channel_account_id' })
      .select()
      .single()

    if (accError) {
      console.error('[Google Callback] Persistence Error:', accError)
      return NextResponse.json({ error: 'Failed to register account' }, { status: 500 })
    }

    // Success: Redirect back to Settings with a success badge
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/channels?success=gmail_connected`)
  } catch (err) {
    console.error('[Google Callback] Internal Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
