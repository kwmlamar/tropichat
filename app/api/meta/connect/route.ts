/**
 * GET /api/meta/connect
 *
 * Initiates the Meta OAuth flow. Builds the Facebook Login URL with
 * all required permission scopes for WhatsApp, Instagram, and Messenger,
 * then redirects the user to it.
 *
 * Query params:
 *   - None (user must be authenticated via Supabase session)
 *
 * ⚠️  YOU MUST set META_APP_ID and NEXT_PUBLIC_APP_URL in your .env
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// All scopes needed across the three channels
const SCOPES = [
  // WhatsApp Business
  'whatsapp_business_management',
  'whatsapp_business_messaging',
  // Instagram
  'instagram_basic',
  'instagram_manage_messages',
  // Facebook Messenger (Pages)
  'pages_messaging',
  'pages_manage_metadata',
  'pages_read_engagement',
].join(',')

export async function GET(request: Request) {
  const META_APP_ID = process.env.META_APP_ID
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL

  if (!META_APP_ID || !APP_URL) {
    return NextResponse.json(
      { error: 'META_APP_ID or NEXT_PUBLIC_APP_URL not configured' },
      { status: 500 }
    )
  }

  // Verify the user is authenticated by checking for the Supabase access token
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Validate the token
  const supabase = createServerClient(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  // Build state param with user ID to verify on callback
  const state = Buffer.from(JSON.stringify({
    user_id: user.id,
    ts: Date.now(),
  })).toString('base64url')

  const redirectUri = `${APP_URL}/api/meta/callback`

  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  authUrl.searchParams.set('client_id', META_APP_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return NextResponse.json({ url: authUrl.toString() })
}
