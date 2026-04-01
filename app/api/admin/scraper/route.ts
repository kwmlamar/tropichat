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
        const topResults = data.results.slice(0, 10) // Limit for speed/cost
        
        for (const place of topResults) {
          const bizName = place.name
          const address = place.formatted_address || "Bahamas"
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizName)}+${encodeURIComponent(address)}`
          
          let phoneNumber = "No Phone Protocol"
          
          // 🛰️ DEEP SCAN: Fetch Place Details for the phone number
          if (place.place_id) {
            const detailEndpoint = "https://maps.googleapis.com/maps/api/place/details/json"
            const detailRes = await fetch(`${detailEndpoint}?place_id=${place.place_id}&fields=formatted_phone_number,international_phone_number&key=${googleMapsKey}`)
            const detailData = await detailRes.json()
            
            if (detailData.status === "OK" && detailData.result) {
              phoneNumber = detailData.result.international_phone_number || detailData.result.formatted_phone_number || phoneNumber
            }
          }

          leads.push({
            business_name: bizName,
            category: place.types && place.types[0] ? place.types[0].replace(/_/g, ' ').charAt(0).toUpperCase() + place.types[0].replace(/_/g, ' ').slice(1) : "Business",
            contact_phone: phoneNumber,
            external_link: mapsLink,
            notes: `Detected in ${address}. Rating: ${place.rating || 'N/A'}⭐`,
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
          .select("id, contact_phone")
          .eq("business_name", lead.business_name)
          .maybeSingle()

        if (!existing) {
          // New target identified
          const { error } = await supabase.from("leads").insert(lead)
          if (!error) count++
        } else if (
          lead.contact_phone !== "No Phone Protocol" && 
          (!existing.contact_phone || 
           existing.contact_phone === "Scan for phone..." || 
           existing.contact_phone === "No Phone Protocol")
        ) {
          // Target exists but phone intel is missing - perform enrichment
          const { error } = await supabase
            .from("leads")
            .update({ 
               contact_phone: lead.contact_phone,
               notes: lead.notes + " (Phone protocol enriched via Discovery Mission)",
               updated_at: new Date().toISOString()
            })
            .eq("id", existing.id)
            
          if (!error) enrichedCount++
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
