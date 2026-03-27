import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Google OAuth Login Endpoint
 * 
 * GET /api/auth/google/login
 * Redirects the user to Google to authorize TropiChat for Gmail access.
 */

const client_id = process.env.GOOGLE_CLIENT_ID
const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

export async function GET() {
  if (!client_id) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 })
  }

  // Scopes: 
  // - gmail.modify (Read/Write/Modify) is best for a "Chat-ified" experience.
  // - userinfo.email/profile for identity.
  const scopes = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/user.emails.read',
    'profile',
    'email'
  ].join(' ')

  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline', // CRITICAL: Get refresh_token!
    prompt: 'consent'       // Ensure refresh_token is returned every time during setup
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  
  return NextResponse.redirect(authUrl)
}
