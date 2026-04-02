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
    
    console.log(`🛰️  UNIFIED MISSION START: Aggregating all platforms for '${query}'...`)

    // 📡 Step 1: Parallel Mission Launch (Google + Facebook Proxy + Instagram Proxy)
    const [googleData, fbData, igData] = await Promise.all([
      fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " Bahamas")}&key=${googleMapsKey}`).then(r => r.json()),
      fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " Facebook Bahamas")}&key=${googleMapsKey}`).then(r => r.json()),
      fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " Instagram Bahamas")}&key=${googleMapsKey}`).then(r => r.json())
    ])

    const leadMap = new Map<string, any>()

    // 🎯 Process Google Results (Main Source for Phone/Address)
    if (googleData.status === "OK") {
      const topResults = googleData.results.slice(0, 5)
      for (const place of topResults) {
        const id = place.place_id
        leadMap.set(place.name.toLowerCase(), {
          business_name: place.name,
          place_id: id,
          category: place.types && place.types[0] ? place.types[0].replace(/_/g, ' ').charAt(0).toUpperCase() + place.types[0].replace(/_/g, ' ').slice(1) : "Business",
          address: place.formatted_address,
          rating: place.rating,
          source: "Unified Discovery",
          status: "cold",
          notes: `Detected in ${place.formatted_address}. Rating: ${place.rating || 'N/A'}⭐`
        })
      }
    }

    // 🎯 Process Facebook Proxy Results
    if (fbData.status === "OK") {
      fbData.results.slice(0, 5).forEach((place: any) => {
        const key = place.name.toLowerCase()
        const existing = leadMap.get(key)
        const fbUrl = `https://www.facebook.com/search/pages/?q=${encodeURIComponent(place.name)}`
        
        if (existing) {
          existing.facebook_page = fbUrl
        } else {
          leadMap.set(key, {
            business_name: place.name,
            facebook_page: fbUrl,
            category: "Social Lead",
            source: "Unified Discovery",
            status: "cold",
            notes: `Socially detected via Facebook proxy.`
          })
        }
      })
    }

    // 🎯 Process Instagram Proxy Results
    if (igData.status === "OK") {
      igData.results.slice(0, 5).forEach((place: any) => {
        const key = place.name.toLowerCase()
        const existing = leadMap.get(key)
        const handle = place.name.toLowerCase().replace(/\s/g, '')
        const igUrl = handle
        
        if (existing) {
          existing.instagram_handle = igUrl
        } else {
          leadMap.set(key, {
            business_name: place.name,
            instagram_handle: igUrl,
            category: "Social Lead",
            source: "Unified Discovery",
            status: "cold",
            notes: `Socially detected via Instagram proxy.`
          })
        }
      })
    }

    const aggregatedLeads = Array.from(leadMap.values())
    const finalizedLeads: any[] = []

    // 🔬 Step 2: Deep Recon (Phones, Websites, Emails) for top candidates
    for (const lead of aggregatedLeads) {
      let phoneNumber = "No Phone Protocol"
      let website = null
      let email = null

      // Deep scan via Place ID if it exists
      if (lead.place_id) {
        const detailRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${lead.place_id}&fields=formatted_phone_number,international_phone_number,website&key=${googleMapsKey}`).then(r => r.json())
        if (detailRes.status === "OK" && detailRes.result) {
          phoneNumber = detailRes.result.international_phone_number || detailRes.result.formatted_phone_number || phoneNumber
          website = detailRes.result.website || null
        }
      }

      // Scraping Website for Email/Socials if website found
      if (website) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          const siteRes = await fetch(website, { signal: controller.signal })
          const html = await siteRes.text()
          clearTimeout(timeoutId)

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
        } catch (e) {
          console.log(`⚠️ Recon failed for ${lead.business_name}`)
        }
      }

      finalizedLeads.push({
        business_name: lead.business_name,
        category: lead.category,
        contact_phone: phoneNumber,
        contact_email: email,
        facebook_page: lead.facebook_page,
        instagram_handle: lead.instagram_handle,
        external_link: lead.place_id ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.business_name)}` : lead.facebook_page,
        notes: lead.notes + (website ? ` \nWebsite: ${website}` : ""),
        source: "Unified Intelligence",
        status: "cold"
      })
    }

    // 🚀 Step 3: Injection & Enrichment
    let count = 0
    let enrichedCount = 0
    for (const lead of finalizedLeads) {
      const { data: existing } = await supabase
        .from("leads")
        .select("id, contact_phone, contact_email, facebook_page, instagram_handle, notes")
        .eq("business_name", lead.business_name)
        .maybeSingle()

      if (!existing) {
        const { error } = await supabase.from("leads").insert(lead)
        if (!error) count++
      } else {
        const updates: any = {}
        if (lead.contact_phone !== "No Phone Protocol" && (!existing.contact_phone || existing.contact_phone === "No Phone Protocol")) updates.contact_phone = lead.contact_phone
        if (lead.contact_email && !existing.contact_email) updates.contact_email = lead.contact_email
        if (lead.facebook_page && !existing.facebook_page) updates.facebook_page = lead.facebook_page
        if (lead.instagram_handle && !existing.instagram_handle) updates.instagram_handle = lead.instagram_handle
        
        if (Object.keys(updates).length > 0) {
          updates.notes = (existing.notes || "") + `\n(Unified intel enriched: ${Object.keys(updates).join(', ')})`
          updates.updated_at = new Date().toISOString()
          const { error } = await supabase.from("leads").update(updates).eq("id", existing.id)
          if (!error) enrichedCount++
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Unified Mission Complete: ${count} New, ${enrichedCount} Enriched.`,
      count,
      enrichedCount
    })

  } catch (error) {
    console.error("Unified Scraper Error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
