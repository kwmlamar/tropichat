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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(req: NextRequest) {
  if (!client_id) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 })
  }

  // Get current session to link user_id
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const authHeader = req.headers.get('Authorization')
  // Note: Since this is a redirect, we better check the cookie session
  // For local/testing we can use the state param to passthrough the user context
  
  // We'll use the searchParams foruserId if provided or session
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  // Scopes: 
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
    access_type: 'offline', 
    prompt: 'consent',
    state: userId || 'anonymous' // PASS USER ID
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  
  return NextResponse.redirect(authUrl)
}
