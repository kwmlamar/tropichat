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
        leads = data.results.map((place: any) => {
          const bizName = place.name
          const address = place.formatted_address || "Bahamas"
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bizName)}+${encodeURIComponent(address)}`

          return {
            business_name: bizName,
            category: place.types && place.types[0] ? place.types[0].replace('_', ' ').charAt(0).toUpperCase() + place.types[0].replace('_', ' ').slice(1) : "Business",
            contact_phone: "Scan for phone...",
            external_link: mapsLink,
            notes: `Detected in ${address}. Rating: ${place.rating || 'N/A'}⭐`,
            source: "Google Maps Pro",
            status: "cold"
          }
        })
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
            contact_phone: "Scan for phone...",
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
    if (leads.length > 0) {
      for (const lead of leads) {
        // Check for duplicates
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .eq("business_name", lead.business_name)
          .maybeSingle()

        if (!existing) {
          const { error } = await supabase.from("leads").insert(lead)
          if (!error) count++
        }
      }
    }

    console.log(`✅ MISSION SUCCESS: Loaded ${count} new leads into pipeline.`)

    return NextResponse.json({ 
      success: true, 
      message: `Mission completed: ${count} new leads extracted.`,
      count 
    })

  } catch (error) {
    console.error("Scraper Route Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}
