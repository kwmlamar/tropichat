/**
 * Client-side functions for interacting with the Meta OAuth and
 * WhatsApp Template API routes.
 */

import { getSupabase } from './supabase'
import type { WhatsAppMetaTemplate, MetaChannel } from '@/types/database'

async function getAccessToken(): Promise<string | null> {
  const client = getSupabase()
  const { data: { session } } = await client.auth.getSession()
  return session?.access_token || null
}

// ==================== META CONNECTION STATUS ====================

export interface ChannelStatus {
  connected: boolean
  account_id?: string
  account_name?: string
  scopes?: string[]
  metadata?: Record<string, unknown>
  token_expires_at?: string
  updated_at?: string
}

export type MetaStatus = Record<MetaChannel, ChannelStatus>

export async function getMetaStatus(): Promise<{
  data: MetaStatus | null
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (!res.ok) {
      return { data: null, error: data.error || 'Failed to get status' }
    }

    return { data: data.status, error: null }
  } catch {
    return { data: null, error: 'Failed to connect to server' }
  }
}

// ==================== META CONNECT / DISCONNECT ====================

export async function initiateMetaConnect(): Promise<{
  url: string | null
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { url: null, error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/connect', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (!res.ok) {
      return { url: null, error: data.error || 'Failed to initiate connection' }
    }

    return { url: data.url, error: null }
  } catch {
    return { url: null, error: 'Failed to connect to server' }
  }
}

export async function disconnectChannel(channel: MetaChannel): Promise<{
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/disconnect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel }),
    })
    const data = await res.json()

    if (!res.ok) {
      return { error: data.error || 'Failed to disconnect' }
    }

    return { error: null }
  } catch {
    return { error: 'Failed to connect to server' }
  }
}

// ==================== WHATSAPP TEMPLATES ====================

export async function fetchMetaTemplates(): Promise<{
  data: WhatsAppMetaTemplate[]
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { data: [], error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/templates', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (!res.ok) {
      return { data: [], error: data.error || 'Failed to fetch templates' }
    }

    return { data: data.templates || [], error: null }
  } catch {
    return { data: [], error: 'Failed to connect to server' }
  }
}

export async function createMetaTemplate(template: {
  name: string
  category: string
  language: string
  body: string
}): Promise<{
  data: { id: string; name: string; status: string; category: string; language: string } | null
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(template),
    })
    const data = await res.json()

    if (!res.ok) {
      return { data: null, error: data.error || 'Failed to create template' }
    }

    return { data: data.template, error: null }
  } catch {
    return { data: null, error: 'Failed to connect to server' }
  }
}

export async function deleteMetaTemplate(name: string): Promise<{
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { error: 'Not authenticated' }

  try {
    const res = await fetch(`/api/meta/templates/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (!res.ok) {
      return { error: data.error || 'Failed to delete template' }
    }

    return { error: null }
  } catch {
    return { error: 'Failed to connect to server' }
  }
}

// ==================== WHATSAPP BUSINESS PROFILE ====================

export interface BusinessProfile {
  id?: string
  connected_account_id: string
  business_name: string
  business_description: string
  business_category: string
  website_url: string
  business_address: string
  business_hours: string
  contact_phone: string
  contact_email: string
  profile_picture_url: string
  updated_at?: string
}

export async function fetchBusinessProfile(): Promise<{
  data: BusinessProfile | null
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/business-profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (!res.ok) {
      return { data: null, error: data.error || 'Failed to fetch profile' }
    }

    return { data: data.profile, error: null }
  } catch {
    return { data: null, error: 'Failed to connect to server' }
  }
}

export async function updateBusinessProfile(profile: Partial<BusinessProfile>): Promise<{
  data: BusinessProfile | null
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { data: null, error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/business-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    })
    const data = await res.json()

    if (!res.ok) {
      return { data: null, error: data.error || 'Failed to update profile' }
    }

    return { data: data.profile, error: null }
  } catch {
    return { data: null, error: 'Failed to connect to server' }
  }
}

// ==================== FACEBOOK PAGES ====================

export interface FacebookPage {
  id: string
  name: string
  category: string
  profile_picture_url: string | null
  follower_count: number
  is_connected: boolean
}

export async function selectFacebookPage(page: {
  pageId: string
  pageName?: string
  profilePictureUrl?: string
}): Promise<{ error: string | null }> {
  const token = await getAccessToken()
  if (!token) return { error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(page),
    })
    const data = await res.json()

    if (!res.ok) {
      return { error: data.error || 'Failed to connect page' }
    }

    return { error: null }
  } catch {
    return { error: 'Failed to connect to server' }
  }
}

export async function fetchFacebookPages(): Promise<{
  data: FacebookPage[]
  error: string | null
}> {
  const token = await getAccessToken()
  if (!token) return { data: [], error: 'Not authenticated' }

  try {
    const res = await fetch('/api/meta/pages', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (!res.ok) {
      return { data: [], error: data.error || 'Failed to fetch pages' }
    }

    return { data: data.pages || [], error: null }
  } catch {
    return { data: [], error: 'Failed to connect to server' }
  }
}
