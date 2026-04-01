import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Discovery Engine Credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const query = body.query || "Boutiques Nassau"
    const source = body.source || "google"

    console.log(`🛰️  DISCOVERY MISSION: Starting ${source} scan for '${query}'...`)

    let leads: any[] = []

    if (source === 'google') {
      // 🛰️ G-MAPS SCAN: Searching Google Maps for lead extraction
      const endpoint = "https://maps.googleapis.com/maps/api/place/textsearch/json"
      const response = await fetch(`${endpoint}?query=${encodeURIComponent(query + " Bahamas")}&key=${googleMapsKey}`)
      const data = await response.json()

      if (data.status === "OK") {
        const topResults = data.results.slice(0, 5) // Deep Recon limit for stability
        
        for (const place of topResults) {
          const bizName = place.name
          const address = place.formatted_address || "Bahamas"
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizName)}+${encodeURIComponent(address)}`
          
          let phoneNumber = "No Phone Protocol"
          let website = null
          let email = null
          let facebook = null
          let instagram = null
          
          // 🛰️ DEEP SCAN: Fetch Place Details for Phone & Website
          if (place.place_id) {
            const detailEndpoint = "https://maps.googleapis.com/maps/api/place/details/json"
            const fields = "formatted_phone_number,international_phone_number,website"
            const detailRes = await fetch(`${detailEndpoint}?place_id=${place.place_id}&fields=${fields}&key=${googleMapsKey}`)
            const detailData = await detailRes.json()
            
            if (detailData.status === "OK" && detailData.result) {
              phoneNumber = detailData.result.international_phone_number || detailData.result.formatted_phone_number || phoneNumber
              website = detailData.result.website || null
            }
          }

          // 🛰️ SOCIAL RECON: If website exists, extract Socials & Email
          if (website) {
            try {
              // Fetch the homepage with a timeout
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 4000) // 4s timeout
              const siteRes = await fetch(website, { signal: controller.signal })
              const html = await siteRes.text()
              clearTimeout(timeoutId)

              // Extract Email
              const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
              if (emailMatch) email = emailMatch[0]

              // Extract Facebook
              const fbMatch = html.match(/https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._%-]+/i)
              if (fbMatch) facebook = fbMatch[0]

              // Extract Instagram
              const igMatch = html.match(/https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9._%+-]+)/i)
              if (igMatch) instagram = igMatch[2]
            } catch (reconError) {
              console.log(`⚠️ RECON FAILED for ${bizName}: ${reconError instanceof Error ? reconError.message : "Timeout"}`)
            }
          }

          leads.push({
            business_name: bizName,
            category: place.types && place.types[0] ? place.types[0].replace(/_/g, ' ').charAt(0).toUpperCase() + place.types[0].replace(/_/g, ' ').slice(1) : "Business",
            contact_phone: phoneNumber,
            contact_email: email,
            facebook_page: facebook,
            instagram_handle: instagram,
            external_link: mapsLink,
            notes: `Detected in ${address}. Rating: ${place.rating || 'N/A'}⭐${website ? ` \nWebsite: ${website}` : ""}`,
            source: "Google Maps Pro",
            status: "cold"
          })
        }
      }
    } else {
      // 🛰️ SOCIAL PROXY SCAN: (Facebook/Instagram)
      const platform = source === 'facebook' ? 'Facebook' : 'Instagram'
      const proxyQuery = `${query} ${platform} Bahamas`
      const endpoint = "https://maps.googleapis.com/maps/api/place/textsearch/json"
      const response = await fetch(`${endpoint}?query=${encodeURIComponent(proxyQuery)}&key=${googleMapsKey}`)
      const data = await response.json()

      if (data.status === "OK") {
        leads = data.results.map((place: any) => {
          const bizName = place.name
          const link = source === 'facebook' 
            ? `https://www.facebook.com/search/pages/?q=${encodeURIComponent(bizName)}`
            : `https://www.instagram.com/explore/tags/${bizName.toLowerCase().replace(/\s/g, '')}/`

          return {
            business_name: bizName,
            category: `${platform} Lead`,
            contact_phone: "No Phone Protocol",
            external_link: link,
            instagram_handle: source === 'instagram' ? bizName.toLowerCase().replace(/\s/g, '') : null,
            source: `${platform} Discovery`,
            notes: `Socially detected in ${place.formatted_address || 'Bahamas'}. Potential reach: ${place.rating || 'N/A'}⭐`,
            status: "cold"
          }
        })
      }
    }

    // 🚀 INJECTING: Pushing leads to CRM Intelligence Hub
    let count = 0
    let enrichedCount = 0
    if (leads.length > 0) {
      for (const lead of leads) {
        // Check for existing lead by business name
        const { data: existing } = await supabase
          .from("leads")
          .select("id, contact_phone, contact_email, facebook_page, instagram_handle, notes")
          .eq("business_name", lead.business_name)
          .maybeSingle()

        if (!existing) {
          // New target identified
          const { error } = await supabase.from("leads").insert(lead)
          if (!error) count++
        } else {
          // Target exists - check for enrichment opportunities (Social, Email, Phone)
          const updates: any = {}
          
          // Phone Enrichment
          if (lead.contact_phone !== "No Phone Protocol" && 
              (!existing.contact_phone || existing.contact_phone === "Scan for phone..." || existing.contact_phone === "No Phone Protocol")) {
            updates.contact_phone = lead.contact_phone
          }
          
          // Email Enrichment
          if (lead.contact_email && !existing.contact_email) {
            updates.contact_email = lead.contact_email
          }
          
          // Facebook Enrichment
          if (lead.facebook_page && !existing.facebook_page) {
            updates.facebook_page = lead.facebook_page
          }
          
          // Instagram Enrichment
          if (lead.instagram_handle && !existing.instagram_handle) {
            updates.instagram_handle = lead.instagram_handle
          }
          
          if (Object.keys(updates).length > 0) {
            updates.notes = (existing.notes || "") + `\n(Social intel enriched via Discovery Mission: ${Object.keys(updates).join(', ')})`
            updates.updated_at = new Date().toISOString()
            
            const { error } = await supabase
              .from("leads")
              .update(updates)
              .eq("id", existing.id)
              
            if (!error) enrichedCount++
          }
        }
      }
    }

    console.log(`✅ MISSION SUCCESS: Loaded ${count} new leads, enriched ${enrichedCount} existing targets.`)

    return NextResponse.json({ 
      success: true, 
      message: `Mission completed: ${count} new targets found, ${enrichedCount} enriched.`,
      count,
      enrichedCount
    })

  } catch (error) {
    console.error("Scraper Route Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}
