/**
 * GET /api/meta/callback
 *
 * Meta OAuth callback. Exchanges the authorization code for a short-lived
 * token, then exchanges that for a long-lived token, then:
 *   1. Immediately stores a meta_connections row for every granted scope group
 *   2. Best-effort enriches each row with account details (WABA, Pages, IG)
 *
 * ⚠️  YOU MUST set META_APP_ID, META_APP_SECRET, NEXT_PUBLIC_APP_URL
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const META_GRAPH = 'https://graph.facebook.com/v19.0'

export async function GET(request: Request) {
  const META_APP_ID = process.env.META_APP_ID
  const META_APP_SECRET = process.env.META_APP_SECRET
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL

  if (!META_APP_ID || !META_APP_SECRET || !APP_URL) {
    return redirectWithError('Server configuration error')
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    const errorDesc = searchParams.get('error_description') || errorParam
    return redirectWithError(errorDesc)
  }

  if (!code || !stateParam) {
    return redirectWithError('Missing authorization code')
  }

  // Decode state to get user_id
  let userId: string
  try {
    const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    userId = state.user_id
    if (Date.now() - state.ts > 10 * 60 * 1000) {
      return redirectWithError('Authorization request expired')
    }
  } catch {
    return redirectWithError('Invalid state parameter')
  }

  const redirectUri = `${APP_URL}/api/meta/callback`

  try {
    // ── Step 1: Exchange code for short-lived token ──
    const tokenUrl = new URL(`${META_GRAPH}/oauth/access_token`)
    tokenUrl.searchParams.set('client_id', META_APP_ID)
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET)
    tokenUrl.searchParams.set('redirect_uri', redirectUri)
    tokenUrl.searchParams.set('code', code)

    const tokenRes = await fetch(tokenUrl.toString())
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('[meta/callback] Token exchange error:', tokenData.error)
      return redirectWithError(tokenData.error.message || 'Token exchange failed')
    }

    console.log('[meta/callback] Short-lived token obtained')

    // ── Step 2: Exchange for long-lived token ──
    const longLivedUrl = new URL(`${META_GRAPH}/oauth/access_token`)
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longLivedUrl.searchParams.set('client_id', META_APP_ID)
    longLivedUrl.searchParams.set('client_secret', META_APP_SECRET)
    longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token)

    const longLivedRes = await fetch(longLivedUrl.toString())
    const longLivedData = await longLivedRes.json()

    if (longLivedData.error) {
      console.error('[meta/callback] Long-lived token error:', longLivedData.error)
      return redirectWithError('Failed to get long-lived token')
    }

    const accessToken = longLivedData.access_token
    const expiresIn = longLivedData.expires_in
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null

    console.log('[meta/callback] Long-lived token obtained, expires_in:', expiresIn)

    // ── Step 3: Get granted scopes ──
    const debugUrl = new URL(`${META_GRAPH}/debug_token`)
    debugUrl.searchParams.set('input_token', accessToken)
    debugUrl.searchParams.set('access_token', `${META_APP_ID}|${META_APP_SECRET}`)

    const debugRes = await fetch(debugUrl.toString())
    const debugData = await debugRes.json()
    const grantedScopes: string[] = debugData.data?.scopes || []

    console.log('[meta/callback] Granted scopes:', grantedScopes)

    const supabase = createServiceClient()
    let savedCount = 0

    // ── Step 4: WhatsApp — always save if scope granted ──
    const hasWhatsApp = grantedScopes.includes('whatsapp_business_management')
    if (hasWhatsApp) {
      // Save the connection row immediately
      const { error: upsertErr } = await supabase.from('meta_connections').upsert(
        {
          user_id: userId,
          channel: 'whatsapp',
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          scopes: grantedScopes.filter(s => s.startsWith('whatsapp')),
          is_active: true,
          metadata: {},
        },
        { onConflict: 'user_id,channel' }
      )

      if (upsertErr) {
        console.error('[meta/callback] WhatsApp upsert error:', upsertErr)
      } else {
        savedCount++
        console.log('[meta/callback] WhatsApp base connection saved')
      }

      // Best-effort: enrich with WABA details
      // Strategy: try Graph API discovery, then phone-number reverse lookup, then env vars
      try {
        let wabaId: string | null = null
        let wabaName: string | null = null
        let phoneNumberId: string | null = null
        let phoneDisplay: string | null = null

        // ── Strategy 1: Discover via me/businesses ──
        try {
          const wabaRes = await fetch(
            `${META_GRAPH}/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}&access_token=${accessToken}`
          )
          const wabaData = await wabaRes.json()
          console.log('[meta/callback] WhatsApp businesses response:', JSON.stringify(wabaData).slice(0, 500))

          for (const biz of wabaData.data || []) {
            const wabas = biz.owned_whatsapp_business_accounts?.data || []
            for (const waba of wabas) {
              wabaId = waba.id
              wabaName = waba.name || biz.name
              const phones = waba.phone_numbers?.data || []
              if (phones.length > 0) {
                phoneNumberId = phones[0].id
                phoneDisplay = phones[0].display_phone_number
              }
              break
            }
            if (wabaId) break
          }
        } catch (e) {
          console.warn('[meta/callback] Strategy 1 (me/businesses) failed:', e)
        }

        // ── Strategy 2: Query the WHATSAPP_BUSINESS_ACCOUNT_ID env var directly ──
        // It might be a real WABA ID, or it might be a phone number ID (common mixup)
        if (!wabaId && process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
          try {
            const envId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
            // First, try it as a WABA ID (should have message_templates edge)
            const directRes = await fetch(
              `${META_GRAPH}/${envId}?fields=id,name,phone_numbers{id,display_phone_number,verified_name}&access_token=${accessToken}`
            )
            const directData = await directRes.json()
            console.log('[meta/callback] Direct env ID query response:', JSON.stringify(directData).slice(0, 500))

            if (directData.id && !directData.error) {
              // Check if it has phone_numbers — that means it's a real WABA
              if (directData.phone_numbers?.data) {
                wabaId = directData.id
                wabaName = directData.name || 'WhatsApp Business'
                const phones = directData.phone_numbers.data
                if (phones.length > 0) {
                  phoneNumberId = phones[0].id
                  phoneDisplay = phones[0].display_phone_number
                }
                console.log('[meta/callback] Env ID is a valid WABA:', wabaId)
              }
            }
          } catch (e) {
            console.warn('[meta/callback] Strategy 2 (direct WABA query) failed:', e)
          }
        }

        // ── Strategy 3: Reverse-lookup from phone number ID to find parent WABA ──
        // This handles the common case where WHATSAPP_BUSINESS_ACCOUNT_ID is actually a phone number ID
        if (!wabaId) {
          const phoneIdToTry = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
          if (phoneIdToTry) {
            try {
              const phoneRes = await fetch(
                `${META_GRAPH}/${phoneIdToTry}?fields=id,display_phone_number,verified_name&access_token=${accessToken}`
              )
              const phoneData = await phoneRes.json()
              console.log('[meta/callback] Phone number query response:', JSON.stringify(phoneData).slice(0, 500))

              if (phoneData.id && !phoneData.error) {
                // This is a valid phone number node — use it as the phone number ID
                phoneNumberId = phoneData.id
                phoneDisplay = phoneData.display_phone_number || null

                // Now find its parent WABA by querying the phone number's owner
                // The phone_number belongs to a WABA — we can get it via the edge
                try {
                  const ownerRes = await fetch(
                    `${META_GRAPH}/${phoneData.id}/owner?access_token=${accessToken}`
                  )
                  const ownerData = await ownerRes.json()
                  console.log('[meta/callback] Phone owner response:', JSON.stringify(ownerData).slice(0, 300))

                  if (ownerData.id && !ownerData.error) {
                    wabaId = ownerData.id
                    wabaName = ownerData.name || 'WhatsApp Business'
                    console.log('[meta/callback] Found parent WABA via phone owner:', wabaId)
                  }
                } catch (e) {
                  console.warn('[meta/callback] Phone owner lookup failed:', e)
                }

                // Alternative: try whatsapp_business_account edge on the phone number
                if (!wabaId) {
                  try {
                    const wabaEdgeRes = await fetch(
                      `${META_GRAPH}/${phoneData.id}?fields=whatsapp_business_account&access_token=${accessToken}`
                    )
                    const wabaEdgeData = await wabaEdgeRes.json()
                    console.log('[meta/callback] Phone WABA edge response:', JSON.stringify(wabaEdgeData).slice(0, 300))

                    if (wabaEdgeData.whatsapp_business_account?.id) {
                      wabaId = wabaEdgeData.whatsapp_business_account.id
                      wabaName = wabaEdgeData.whatsapp_business_account.name || 'WhatsApp Business'
                      console.log('[meta/callback] Found parent WABA via edge:', wabaId)
                    }
                  } catch (e) {
                    console.warn('[meta/callback] Phone WABA edge lookup failed:', e)
                  }
                }
              }
            } catch (e) {
              console.warn('[meta/callback] Strategy 3 (phone reverse lookup) failed:', e)
            }
          }
        }

        // ── Strategy 4: Try shared WABAs endpoint ──
        if (!wabaId) {
          try {
            const sharedRes = await fetch(
              `${META_GRAPH}/me?fields=whatsapp_business_accounts{id,name}&access_token=${accessToken}`
            )
            const sharedData = await sharedRes.json()
            console.log('[meta/callback] Shared WABA response:', JSON.stringify(sharedData).slice(0, 500))

            const sharedWabas = sharedData.whatsapp_business_accounts?.data || []
            if (sharedWabas.length > 0) {
              wabaId = sharedWabas[0].id
              wabaName = sharedWabas[0].name || 'WhatsApp Business'
              console.log('[meta/callback] Found WABA via shared accounts:', wabaId)
            }
          } catch (e) {
            console.warn('[meta/callback] Strategy 4 (shared WABAs) failed:', e)
          }
        }

        // ── Fallback: use phone number ID from env if we still don't have one ──
        if (!phoneNumberId && process.env.WHATSAPP_PHONE_NUMBER_ID) {
          phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
          console.log('[meta/callback] Using WHATSAPP_PHONE_NUMBER_ID env var as fallback:', phoneNumberId)
        }

        // ── Enrich meta_connections with WABA details (for templates) ──
        if (wabaId) {
          await supabase.from('meta_connections').update({
            account_id: wabaId,
            account_name: wabaName,
            metadata: { phone_number_id: phoneNumberId, phone_display: phoneDisplay },
          }).eq('user_id', userId).eq('channel', 'whatsapp')

          console.log('[meta/callback] WhatsApp enriched with WABA:', wabaId, wabaName)
        } else {
          console.warn('[meta/callback] Could not determine WABA ID — templates will not work until WHATSAPP_BUSINESS_ACCOUNT_ID env var is set to a valid WABA ID')
        }

        // ── Bridge: ALWAYS sync to connected_accounts so webhooks & inbox work ──
        // The bridge MUST use the phone_number_id (not WABA ID) because
        // incoming webhooks identify the account by phone_number_id.
        const bridgeAccountId = phoneNumberId || wabaId
        if (bridgeAccountId) {
          const { error: caErr } = await supabase.from('connected_accounts').upsert(
            {
              user_id: userId,
              channel_type: 'whatsapp',
              access_token: accessToken,
              token_expires_at: tokenExpiresAt,
              channel_account_id: bridgeAccountId,
              channel_account_name: wabaName || 'WhatsApp Business',
              metadata: { waba_id: wabaId, phone_number_id: phoneNumberId, phone_display: phoneDisplay },
              is_active: true,
            },
            { onConflict: 'channel_type,channel_account_id' }
          )
          if (caErr) {
            console.error('[meta/callback] WhatsApp connected_accounts sync error:', caErr)
          } else {
            console.log('[meta/callback] WhatsApp synced to connected_accounts, channel_account_id:', bridgeAccountId)
          }
        } else {
          console.error('[meta/callback] No phone_number_id or WABA ID found — connected_accounts NOT synced. Webhooks will not work.')
        }
      } catch (e) {
        console.error('[meta/callback] WhatsApp discovery error (non-fatal):', e)
      }
    }

    // ── Step 5: Messenger — always save if scope granted ──
    const hasMessenger = grantedScopes.includes('pages_messaging')
    if (hasMessenger) {
      const { error: upsertErr } = await supabase.from('meta_connections').upsert(
        {
          user_id: userId,
          channel: 'messenger',
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          scopes: grantedScopes.filter(s => s.startsWith('pages_')),
          is_active: true,
          metadata: {},
        },
        { onConflict: 'user_id,channel' }
      )

      if (upsertErr) {
        console.error('[meta/callback] Messenger upsert error:', upsertErr)
      } else {
        savedCount++
        console.log('[meta/callback] Messenger base connection saved')
      }

      // Best-effort: enrich with Page details
      try {
        const pagesRes = await fetch(
          `${META_GRAPH}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
        )
        const pagesData = await pagesRes.json()
        console.log('[meta/callback] Pages response:', JSON.stringify(pagesData).slice(0, 500))

        const page = pagesData.data?.[0]
        if (page) {
          await supabase.from('meta_connections').update({
            account_id: page.id,
            account_name: page.name,
            page_access_token: page.access_token,
          }).eq('user_id', userId).eq('channel', 'messenger')

          console.log('[meta/callback] Messenger enriched with page:', page.id, page.name)

          // ── Bridge: sync to connected_accounts so the inbox can use this token ──
          const { error: caErr } = await supabase.from('connected_accounts').upsert(
            {
              user_id: userId,
              channel_type: 'messenger',
              access_token: page.access_token || accessToken,
              token_expires_at: tokenExpiresAt,
              channel_account_id: page.id,
              channel_account_name: page.name,
              metadata: {},
              is_active: true,
            },
            { onConflict: 'channel_type,channel_account_id' }
          )
          if (caErr) {
            console.error('[meta/callback] Messenger connected_accounts sync error:', caErr)
          } else {
            console.log('[meta/callback] Messenger synced to connected_accounts, page_id:', page.id)
          }
        }
      } catch (e) {
        console.error('[meta/callback] Messenger discovery error (non-fatal):', e)
      }
    }

    // ── Step 6: Instagram — always save if scope granted ──
    const hasInstagram = grantedScopes.includes('instagram_basic')
    if (hasInstagram) {
      const { error: upsertErr } = await supabase.from('meta_connections').upsert(
        {
          user_id: userId,
          channel: 'instagram',
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
          scopes: grantedScopes.filter(s => s.startsWith('instagram')),
          is_active: true,
          metadata: {},
        },
        { onConflict: 'user_id,channel' }
      )

      if (upsertErr) {
        console.error('[meta/callback] Instagram upsert error:', upsertErr)
      } else {
        savedCount++
        console.log('[meta/callback] Instagram base connection saved')
      }

      // Best-effort: enrich with IG account details (request access_token — required for sending messages)
      try {
        const pagesRes = await fetch(
          `${META_GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${accessToken}`
        )
        const pagesData = await pagesRes.json()

        for (const page of pagesData.data || []) {
          const igAccount = page.instagram_business_account
          if (igAccount) {
            await supabase.from('meta_connections').update({
              account_id: igAccount.id,
              account_name: igAccount.username || igAccount.name,
              page_access_token: page.access_token || null,
              metadata: { ig_username: igAccount.username, page_id: page.id },
            }).eq('user_id', userId).eq('channel', 'instagram')

            console.log('[meta/callback] Instagram enriched with:', igAccount.username || igAccount.id)

            // ── Bridge: sync to connected_accounts so the inbox can use this token ──
            const pageToken = page.access_token || accessToken
            const { error: caErr } = await supabase.from('connected_accounts').upsert(
              {
                user_id: userId,
                channel_type: 'instagram',
                access_token: pageToken,
                token_expires_at: tokenExpiresAt,
                channel_account_id: igAccount.id,
                channel_account_name: igAccount.username || igAccount.name,
                metadata: {
                  ig_username: igAccount.username,
                  page_id: page.id,
                  page_access_token: page.access_token || undefined,
                },
                is_active: true,
              },
              { onConflict: 'channel_type,channel_account_id' }
            )
            if (caErr) {
              console.error('[meta/callback] Instagram connected_accounts sync error:', caErr)
            } else {
              console.log('[meta/callback] Instagram synced to connected_accounts, ig_id:', igAccount.id)
            }

            break
          }
        }
      } catch (e) {
        console.error('[meta/callback] Instagram discovery error (non-fatal):', e)
      }
    }

    // ── Step 7: Redirect based on actual result ──
    console.log(`[meta/callback] Done. Saved ${savedCount} connection(s) for user ${userId}`)

    if (savedCount > 0) {
      return NextResponse.redirect(
        `${APP_URL}/dashboard/settings?tab=integrations&meta=connected`
      )
    } else {
      return redirectWithError(
        grantedScopes.length === 0
          ? 'No permissions were granted. Please try again and accept all permissions.'
          : 'Permissions were granted but no connections could be saved. Check server logs.'
      )
    }

  } catch (e) {
    console.error('[meta/callback] Unexpected error:', e)
    return redirectWithError('An unexpected error occurred')
  }
}

function redirectWithError(message: string) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''
  return NextResponse.redirect(
    `${APP_URL}/dashboard/settings?tab=integrations&meta=error&message=${encodeURIComponent(message)}`
  )
}
