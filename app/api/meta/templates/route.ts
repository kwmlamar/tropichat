/**
 * WhatsApp Message Template Management via Meta Graph API
 *
 * GET  /api/meta/templates         — List templates from Meta
 * POST /api/meta/templates         — Create a new template on Meta
 *
 * All routes require Authorization: Bearer <supabase_jwt>
 *
 * The user must have an active WhatsApp meta_connection with a waba_id
 * stored in account_id.
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const META_GRAPH = 'https://graph.facebook.com/v19.0'

/** Check if the access token is a demo/seed token (not a real Meta token) */
function isDemoToken(accessToken: string): boolean {
  return accessToken.startsWith('DEMO_')
}

/** Realistic demo templates for a Bahamian tour operator — shown when using demo tokens */
const DEMO_TEMPLATES = [
  {
    id: '900000000000001',
    name: 'booking_confirmation',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your booking for {{2}} on {{3}} is confirmed! Meet us at Paradise Island dock 15 minutes before departure. Questions? Reply to this message.',
      },
    ],
  },
  {
    id: '900000000000002',
    name: 'tour_reminder',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Reminder: Hi {{1}}, your {{2}} tour is tomorrow at {{3}}. Please bring sunscreen, a towel, and a sense of adventure! See you at the dock.',
      },
    ],
  },
  {
    id: '900000000000003',
    name: 'welcome_message',
    status: 'APPROVED',
    category: 'MARKETING',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Welcome to Simply Dave Nassau Tours! We offer snorkeling, sunset cruises, and island-hopping adventures. Reply TOURS to see our full lineup or BOOK to reserve your spot.',
      },
    ],
  },
  {
    id: '900000000000004',
    name: 'seasonal_promotion',
    status: 'APPROVED',
    category: 'MARKETING',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Spring Special! Book any tour before {{1}} and get 15% off for groups of 4+. Use code SPRING25 when booking. Limited spots available — reserve yours today!',
      },
    ],
  },
  {
    id: '900000000000005',
    name: 'payment_receipt',
    status: 'APPROVED',
    category: 'UTILITY',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Payment received! Hi {{1}}, we\'ve received your payment of {{2}} for {{3}}. Your confirmation number is {{4}}. Thank you for choosing Simply Dave Nassau Tours!',
      },
    ],
  },
  {
    id: '900000000000006',
    name: 'review_request',
    status: 'PENDING',
    category: 'MARKETING',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, thanks for joining us on the {{2}} tour! We\'d love to hear about your experience. Leave us a review and get 10% off your next booking: {{3}}',
      },
    ],
  },
  {
    id: '900000000000007',
    name: 'login_verification',
    status: 'APPROVED',
    category: 'AUTHENTICATION',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Your Simply Dave Nassau Tours verification code is {{1}}. This code expires in 10 minutes. Do not share this code with anyone.',
      },
    ],
  },
  {
    id: '900000000000008',
    name: 'last_minute_deal',
    status: 'REJECTED',
    category: 'MARKETING',
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'FLASH SALE! Empty seats on tomorrow\'s sunset cruise — 50% off! Only {{1}} spots left. Book NOW at {{2}} before midnight!',
      },
    ],
  },
]

/**
 * Resolve a WABA ID from a phone number ID by querying the Graph API.
 * Phone numbers in Meta's API don't directly expose their parent WABA in
 * all cases, so we try multiple approaches.
 */
async function resolveWabaFromPhoneNumber(
  phoneNumberId: string,
  accessToken: string
): Promise<string | null> {
  // Try 1: query the phone number for its whatsapp_business_account edge
  try {
    const res = await fetch(
      `${META_GRAPH}/${phoneNumberId}?fields=whatsapp_business_account&access_token=${accessToken}`
    )
    const data = await res.json()
    if (data.whatsapp_business_account?.id) {
      console.log('[meta/templates] Resolved WABA from phone edge:', data.whatsapp_business_account.id)
      return data.whatsapp_business_account.id
    }
  } catch (e) {
    console.warn('[meta/templates] Phone WABA edge lookup failed:', e)
  }

  // Try 2: query the phone number's owner
  try {
    const res = await fetch(
      `${META_GRAPH}/${phoneNumberId}/owner?access_token=${accessToken}`
    )
    const data = await res.json()
    if (data.id && !data.error) {
      console.log('[meta/templates] Resolved WABA from phone owner:', data.id)
      return data.id
    }
  } catch (e) {
    console.warn('[meta/templates] Phone owner lookup failed:', e)
  }

  // Try 3: check me?fields=whatsapp_business_accounts for shared WABAs
  try {
    const res = await fetch(
      `${META_GRAPH}/me?fields=whatsapp_business_accounts{id,name}&access_token=${accessToken}`
    )
    const data = await res.json()
    const wabas = data.whatsapp_business_accounts?.data || []
    if (wabas.length > 0) {
      console.log('[meta/templates] Resolved WABA from shared accounts:', wabas[0].id)
      return wabas[0].id
    }
  } catch (e) {
    console.warn('[meta/templates] Shared WABAs lookup failed:', e)
  }

  return null
}

/**
 * Validate that an ID is a WABA (not a phone number or other node type)
 * by checking if it has the message_templates edge.
 */
async function validateWabaId(
  wabaId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${META_GRAPH}/${wabaId}/message_templates?limit=1&access_token=${accessToken}`
    )
    const data = await res.json()
    // If we get an error about InvalidID or nonexisting field, it's not a WABA
    if (data.error) {
      console.log('[meta/templates] ID validation failed:', data.error.message)
      return false
    }
    return true
  } catch {
    return false
  }
}

async function getWhatsAppConnection(token: string) {
  const supabase = createServerClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated', status: 401, connection: null }
  }

  const { data: connection } = await supabase
    .from('meta_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('channel', 'whatsapp')
    .eq('is_active', true)
    .single()

  if (!connection) {
    return { error: 'WhatsApp not connected. Please connect via Settings > Integrations.', status: 400, connection: null }
  }

  // Determine the WABA ID to use for template operations
  let wabaId = connection.account_id

  // If account_id is missing, try to use the WHATSAPP_BUSINESS_ACCOUNT_ID env var
  if (!wabaId) {
    wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || null
    if (wabaId) {
      console.log('[meta/templates] No account_id in DB, trying WHATSAPP_BUSINESS_ACCOUNT_ID env var:', wabaId)
    }
  }

  // Validate the WABA ID is actually a WABA (not a phone number ID)
  if (wabaId) {
    const isValid = await validateWabaId(wabaId, connection.access_token)
    if (!isValid) {
      console.log('[meta/templates] ID', wabaId, 'is not a valid WABA — attempting reverse lookup from phone number')
      // The ID might be a phone number ID — try to resolve the real WABA
      const resolvedWaba = await resolveWabaFromPhoneNumber(wabaId, connection.access_token)
      if (resolvedWaba) {
        wabaId = resolvedWaba
        // Cache the resolved WABA ID back to the DB so we don't re-resolve every time
        await supabase.from('meta_connections').update({
          account_id: resolvedWaba,
        }).eq('user_id', user.id).eq('channel', 'whatsapp')
        console.log('[meta/templates] Cached resolved WABA ID to meta_connections:', resolvedWaba)
      } else {
        // Also try the WHATSAPP_PHONE_NUMBER_ID env var for reverse lookup
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
        if (phoneId && phoneId !== wabaId) {
          const resolvedFromPhone = await resolveWabaFromPhoneNumber(phoneId, connection.access_token)
          if (resolvedFromPhone) {
            wabaId = resolvedFromPhone
            await supabase.from('meta_connections').update({
              account_id: resolvedFromPhone,
            }).eq('user_id', user.id).eq('channel', 'whatsapp')
            console.log('[meta/templates] Cached resolved WABA ID (from phone) to meta_connections:', resolvedFromPhone)
          } else {
            return {
              error: 'Could not find your WhatsApp Business Account. Please verify WHATSAPP_BUSINESS_ACCOUNT_ID in your environment is set to a valid WABA ID (not a phone number ID). You can find this in Meta Business Suite > WhatsApp > API Setup.',
              status: 400,
              connection: null,
            }
          }
        } else {
          return {
            error: 'Could not find your WhatsApp Business Account. Please verify WHATSAPP_BUSINESS_ACCOUNT_ID in your environment is set to a valid WABA ID (not a phone number ID). You can find this in Meta Business Suite > WhatsApp > API Setup.',
            status: 400,
            connection: null,
          }
        }
      }
    }
  } else {
    return { error: 'No WhatsApp Business Account found. Reconnect your Meta account.', status: 400, connection: null }
  }

  // Use the resolved WABA ID
  connection.account_id = wabaId

  return { error: null, status: 200, connection }
}

/**
 * GET /api/meta/templates
 * Fetches all message templates from the user's WABA.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check for demo token before attempting real Meta API calls
  const supabase = createServerClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('channel', 'whatsapp')
    .eq('is_active', true)
    .single()

  if (conn && isDemoToken(conn.access_token)) {
    console.log('[meta/templates] Demo token detected — returning demo templates')
    return NextResponse.json({ templates: DEMO_TEMPLATES })
  }

  // Real path: resolve WABA and fetch from Meta Graph API
  const { error, status, connection } = await getWhatsAppConnection(token)
  if (error || !connection) {
    return NextResponse.json({ error }, { status })
  }

  try {
    const url = `${META_GRAPH}/${connection.account_id}/message_templates?fields=name,language,status,category,id,components&limit=100&access_token=${connection.access_token}`
    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      console.error('Meta templates fetch error:', data.error)
      return NextResponse.json(
        { error: data.error.message || 'Failed to fetch templates' },
        { status: 502 }
      )
    }

    return NextResponse.json({ templates: data.data || [] })
  } catch (e) {
    console.error('Templates fetch error:', e)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

/**
 * POST /api/meta/templates
 * Creates a new message template on the user's WABA.
 *
 * Body: { name, category, language, body }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { name, category, language, body: templateBody } = body

  if (!name || !category || !language || !templateBody) {
    return NextResponse.json(
      { error: 'name, category, language, and body are required' },
      { status: 400 }
    )
  }

  // Validate template name: lowercase, underscores only
  const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  // Check for demo token — simulate creation without calling Meta API
  const supabase = createServerClient(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('channel', 'whatsapp')
    .eq('is_active', true)
    .single()

  if (conn && isDemoToken(conn.access_token)) {
    console.log('[meta/templates] Demo token detected — simulating template creation:', cleanName)
    return NextResponse.json({
      template: {
        id: `demo_${Date.now()}`,
        name: cleanName,
        status: 'PENDING',
        category: category.toUpperCase(),
        language,
      },
    })
  }

  // Real path: create template on Meta Graph API
  const { error, status, connection } = await getWhatsAppConnection(token)
  if (error || !connection) {
    return NextResponse.json({ error }, { status })
  }

  // Extract {{n}} variables and generate example values for Meta
  const varMatches = templateBody.match(/\{\{(\d+)\}\}/g) || []
  const uniqueVars = [...new Set(varMatches)]
  const exampleValues = uniqueVars.map((_, i) => `sample_value_${i + 1}`)

  // Build BODY component — Meta requires example values when body has variables
  const bodyComponent: Record<string, unknown> = {
    type: 'BODY',
    text: templateBody,
  }
  if (uniqueVars.length > 0) {
    bodyComponent.example = {
      body_text: [exampleValues],
    }
  }

  try {
    const url = `${META_GRAPH}/${connection.account_id}/message_templates`
    const requestBody = {
      name: cleanName,
      category: category.toUpperCase(), // MARKETING, UTILITY, AUTHENTICATION
      language,
      allow_category_change: true,
      components: [bodyComponent],
    }

    console.log('[meta/templates] Creating template:', JSON.stringify(requestBody))

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${connection.access_token}`,
      },
      body: JSON.stringify(requestBody),
    })

    const data = await res.json()

    if (data.error) {
      console.error('Meta template create error:', JSON.stringify(data.error, null, 2))
      const errorMsg = data.error.error_user_msg
        || data.error.message
        || 'Failed to create template'
      return NextResponse.json(
        { error: errorMsg, details: data.error },
        { status: 502 }
      )
    }

    return NextResponse.json({
      template: {
        id: data.id,
        name: cleanName,
        status: data.status || 'PENDING',
        category: category.toUpperCase(),
        language,
      },
    })
  } catch (e) {
    console.error('Template create error:', e)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
