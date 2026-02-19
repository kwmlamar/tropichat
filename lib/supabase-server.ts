/**
 * Server-side Supabase clients for use in API routes.
 *
 * - createServiceClient(): uses the service role key, bypasses RLS.
 *   Only use for server-to-server operations (e.g. storing OAuth tokens).
 *
 * - createServerClient(accessToken): creates a client authenticated as
 *   a specific user via their JWT. Respects RLS.
 */

import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server-side Supabase client'
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function createServerClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
