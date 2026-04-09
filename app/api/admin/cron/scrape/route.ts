import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStrategicScrapeQuery } from "@/lib/ai"
import { verifyWhatsAppContact } from "@/lib/meta"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY!

// GET = Vercel cron trigger, POST = manual trigger from admin UI
export async function GET(req: Request) {
  return handleRun(req, false)
}

export async function POST(req: Request) {
  return handleRun(req, true)
}

async function handleRun(req: Request, isManual: boolean) {
  // Verify cron secret on automated runs (set CRON_SECRET in Vercel env vars)
  if (!isManual) {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const auth = req.headers.get("authorization")
      if (auth !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
  }

  // Load schedule settings
  const { data: settingsRow } = await (supabase
    .from("admin_settings") as any)
    .select("value")
    .eq("key", "scrape_schedule")
    .maybeSingle()

  const settings = settingsRow?.value || {
    enabled: false,
    days: ["tuesday", "wednesday", "thursday"],
    query: "Tour Operators Nassau"
  }

  // On automated runs, check if enabled and today is a scheduled day
  if (!isManual) {
    if (!settings.enabled) {
      return NextResponse.json({ skipped: true, reason: "Schedule disabled" })
    }
    const todayName = new Date()
      .toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Chicago" })
      .toLowerCase()
    if (!(settings.days || []).includes(todayName)) {
      return NextResponse.json({ skipped: true, reason: `Not scheduled for ${todayName}` })
    }
  }

  // Today's date in YYYY-MM-DD (Central Time)
  const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" })

  // 1. Fetch WA Access Token for the primary phone number
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  let waAccessToken: string | null = null
  
  if (waPhoneId) {
    const { data: acc } = await (supabase
      .from("connected_accounts") as any)
      .select("access_token")
      .eq("channel_account_id" as any, waPhoneId)
      .maybeSingle()
    waAccessToken = acc?.access_token || null
  }

  // 1. Instantly purge any unqualified leads from the Call Today queue (safeguard)
  await (supabase
    .from("leads") as any)
    .update({ call_today_date: null } as any)
    .is("contact_phone" as any, null)
    .lte("call_today_date" as any, todayDate)
    .is("called_at" as any, null)

  // 2. See how many qualified leads are currently queued
  const getQueuedCount = async () => {
    const { count } = await (supabase
      .from("leads") as any)
      .select("*", { count: "exact", head: true })
      .lte("call_today_date" as any, todayDate)
      .is("called_at" as any, null)
      .neq("contact_phone" as any, "")
      .not("contact_phone" as any, "is", null)
    return count || 0
  }

  let uncalledCount = await getQueuedCount()
  let history = settings.query_history || []
  let totalNewLeads = 0
  let loops = 0
  const MAX_LOOPS = 4 // Safe limit to prevent server timeouts

  // 3. Keep generating queries and scraping until we hit 20 actionable leads
  while (uncalledCount < 20 && loops < MAX_LOOPS) {
    loops++
    const query = await generateStrategicScrapeQuery(history)
    history = [query, ...history].slice(0, 100)
    
    // Save history immediately so it doesn't get lost
    await (supabase
      .from("admin_settings") as any)
      .upsert({
        key: "scrape_schedule",
        value: { ...settings, query_history: history },
        updated_at: new Date().toISOString()
      }, { onConflict: "key" })

    const newLeads = await runScraper(query)
    totalNewLeads += newLeads.length

    // Assign statuses, but only set call_today_date if they have a VERIFIED WhatsApp number
    for (const lead of newLeads) {
      const rawPhone = lead.contact_phone || ""
      const cleanPhone = rawPhone.replace(/\D/g, "")
      
      let finalStatus = "no_phone"
      let waId = null
      let isVerified = false

      if (cleanPhone && waAccessToken && waPhoneId) {
        // Real-time verification via Cloud API
        const verifiedId = await verifyWhatsAppContact({
          phoneNumberId: waPhoneId,
          accessToken: waAccessToken,
          to: cleanPhone
        })
        
        if (verifiedId) {
          finalStatus = "verified"
          waId = verifiedId
          isVerified = true
        } else {
          finalStatus = "likely" // Fallback if API check fails or says no, but we still have a number
        }
      } else if (cleanPhone) {
        finalStatus = "likely"
      }

      await (supabase
        .from("leads") as any)
        .update({
          whatsapp_status: finalStatus,
          whatsapp_number: waId,
          // ONLY add to call today if it was EXPLICITLY verified on WA
          ...(isVerified ? { call_today_date: todayDate } : { call_today_date: null })
        } as any)
        .eq("id" as any, lead.id)
    }
    
    uncalledCount = await getQueuedCount()
  }



  // 4. If STILL short after all scrapes, backfill using old cold leads
  const needed = Math.max(0, 20 - uncalledCount)
  if (needed > 0) {
    const { data: coldLeads } = await (supabase
      .from("leads") as any)
      .select("id, contact_phone, whatsapp_number, whatsapp_status")
      .eq("status" as any, "cold")
      .is("call_today_date" as any, null)
      .neq("contact_phone" as any, "")
      .not("contact_phone" as any, "is", null)
      .limit(needed)

    for (const lead of coldLeads || []) {
      const rawPhone = lead.contact_phone || ""
      const cleanPhone = rawPhone.replace(/\D/g, "")
      
      let finalStatus = "likely"
      let waId = lead.whatsapp_number
      let isVerified = false

      if (cleanPhone && waAccessToken && waPhoneId) {
        const verifiedId = await verifyWhatsAppContact({
          phoneNumberId: waPhoneId,
          accessToken: waAccessToken,
          to: cleanPhone
        })
        
        if (verifiedId) {
          finalStatus = "verified"
          waId = verifiedId
          isVerified = true
        }
      }

      await (supabase
        .from("leads") as any)
        .update({ 
          whatsapp_status: finalStatus, 
          whatsapp_number: waId,
          // Only put on Call Today if it's actually verified
          ...(isVerified ? { call_today_date: todayDate } : {}) 
        } as any)
        .eq("id" as any, lead.id)
    }
  }

  return NextResponse.json({
    success: true,
    newLeads: totalNewLeads,
    todayDate
  })
}

// Determine WhatsApp status without calling an external API.
// If you have WhatsApp Business Cloud API credentials, add the check here.
// For now: if whatsapp_number is set it's verified; if a phone exists it's likely on WhatsApp
// (most Bahamian business numbers are on WhatsApp); otherwise no phone.
function resolveWhatsAppStatus(lead: any): string {
  if (lead.whatsapp_number) return "verified"
  if (!lead.contact_phone || lead.contact_phone === "") return "no_phone"
  return "likely"
}

// Full scraper — runs the unified discovery and returns newly inserted leads with their IDs
async function runScraper(query: string): Promise<any[]> {
  try {
    const [googleData, fbData, igData] = await Promise.all([
      fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " Bahamas")}&key=${googleMapsKey}`).then(r => r.json()),
      fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " Facebook Bahamas")}&key=${googleMapsKey}`).then(r => r.json()),
      fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " Instagram Bahamas")}&key=${googleMapsKey}`).then(r => r.json())
    ])

    const leadMap = new Map<string, any>()

    if (googleData.status === "OK") {
      for (const place of googleData.results.slice(0, 5)) {
        leadMap.set(place.name.toLowerCase(), {
          business_name: place.name,
          place_id: place.place_id,
          category: place.types?.[0]?.replace(/_/g, " ") || "Business",
          address: place.formatted_address,
          rating: place.rating,
          source: "Scheduled Discovery",
          status: "cold",
          notes: `Detected in ${place.formatted_address}. Rating: ${place.rating || "N/A"}⭐`
        })
      }
    }

    if (fbData.status === "OK") {
      fbData.results.slice(0, 5).forEach((place: any) => {
        const key = place.name.toLowerCase()
        const fbUrl = `https://www.facebook.com/search/pages/?q=${encodeURIComponent(place.name)}`
        const existing = leadMap.get(key)
        if (existing) {
          existing.facebook_page = fbUrl
        } else {
          leadMap.set(key, { business_name: place.name, facebook_page: fbUrl, category: "Social Lead", source: "Scheduled Discovery", status: "cold", notes: "Socially detected via Facebook proxy." })
        }
      })
    }

    if (igData.status === "OK") {
      igData.results.slice(0, 5).forEach((place: any) => {
        const key = place.name.toLowerCase()
        const handle = place.name.toLowerCase().replace(/\s/g, "")
        const existing = leadMap.get(key)
        if (existing) {
          existing.instagram_handle = handle
        } else {
          leadMap.set(key, { business_name: place.name, instagram_handle: handle, category: "Social Lead", source: "Scheduled Discovery", status: "cold", notes: "Socially detected via Instagram proxy." })
        }
      })
    }

    const finalizedLeads: any[] = []

    for (const lead of Array.from(leadMap.values())) {
      let phoneNumber = null
      let website = null
      let email = null

      if (lead.place_id) {
        const detail = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${lead.place_id}&fields=formatted_phone_number,international_phone_number,website&key=${googleMapsKey}`).then(r => r.json())
        if (detail.status === "OK" && detail.result) {
          phoneNumber = detail.result.international_phone_number || detail.result.formatted_phone_number || phoneNumber
          website = detail.result.website || null
        }
      }

      if (website) {
        try {
          const ctrl = new AbortController()
          const tid = setTimeout(() => ctrl.abort(), 3000)
          const html = await fetch(website, { signal: ctrl.signal }).then(r => r.text())
          clearTimeout(tid)
          const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
          if (emailMatch) email = emailMatch[0]
          if (!lead.facebook_page) {
            const fbMatch = html.match(/https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._%-]+/i)
            if (fbMatch) lead.facebook_page = fbMatch[0]
          }
          if (!lead.instagram_handle) {
            const igMatch = html.match(/https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9._%+-]+)/i)
            if (igMatch) lead.instagram_handle = igMatch[2]
          }
        } catch {
          // Website scrape timeout — skip
        }
      }

      finalizedLeads.push({
        business_name: lead.business_name,
        category: lead.category,
        contact_phone: phoneNumber,
        contact_email: email,
        facebook_page: lead.facebook_page || null,
        instagram_handle: lead.instagram_handle || null,
        external_link: lead.place_id ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.business_name)}` : lead.facebook_page,
        notes: (lead.notes || "") + (website ? ` \nWebsite: ${website}` : ""),
        source: "Scheduled Intelligence",
        status: "cold"
      })
    }

    // Insert new leads and return those that were actually created (with IDs)
    const inserted: any[] = []
    for (const lead of finalizedLeads) {
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("business_name", lead.business_name)
        .maybeSingle()

      if (!existing) {
        const { data: newLead, error } = await (supabase
          .from("leads") as any)
          .insert(lead)
          .select("id, contact_phone, whatsapp_number")
          .single()
        if (!error && newLead) inserted.push(newLead)
      }
    }

    return inserted
  } catch (err) {
    console.error("Scheduled scraper error:", err)
    return []
  }
}
