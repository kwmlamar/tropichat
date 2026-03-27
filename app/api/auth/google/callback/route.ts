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
  const state = searchParams.get('state') // This is our userId
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

    // 3. Register or Update the account
    // We try to find if it already exists to avoid upsert conflict issues
    const { data: existingAccount } = await adminSupabase
      .from('connected_accounts')
      .select('id')
      .eq('channel_type', 'email')
      .eq('channel_account_id', email)
      .maybeSingle()

    const accountData = {
      user_id: state !== 'anonymous' ? state : null,
      channel_type: 'email',
      channel_account_id: email,
      channel_account_name: name,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      status: 'active',
      is_active: true,
      metadata: {
        provider: 'google',
        email: email,
        name: name,
        avatar: profile.picture,
        scopes: tokens.scope
      }
    }

    let result;
    if (existingAccount) {
      result = await adminSupabase
        .from('connected_accounts')
        .update(accountData)
        .eq('id', existingAccount.id)
        .select()
        .single()
    } else {
      result = await adminSupabase
        .from('connected_accounts')
        .insert(accountData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('[Google Callback] Persistence Error:', result.error)
      // Provide more detail for debugging locally
      return NextResponse.json({ 
        error: 'Failed to register account', 
        details: result.error.message,
        hint: result.error.hint
      }, { status: 500 })
    }

    // 4. Success — Redirect back to settings
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=integrations&email=connected&account=${email}`)
  } catch (err) {
    console.error('[Google Callback] Internal Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
