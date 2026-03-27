import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * STRATEGIC OUTREACH DISPATCH TERMINAL 🇧🇸🛰️
 * This route handles the high-volume, automated firing of "Bahamianized" scripts
 * to your prospect pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const { leadIds, scriptId, adminName = "Lamar" } = await req.json()

    if (!leadIds || !scriptId) {
      return NextResponse.json({ error: "Missing Target Intelligence (Leads or Script)" }, { status: 400 })
    }

    const supabase = getSupabase()

    // 1. Fetch Script Intelligence
    const { data: script, error: sErr } = await supabase
      .from('outreach_scripts')
      .select('*')
      .eq('id', scriptId)
      .single()

    if (sErr || !script) {
      return NextResponse.json({ error: "Failed to retrieve Strategic Script" }, { status: 404 })
    }

    // 2. Parse the Bahamian Script Structure (Segregating Subject and Body)
    const content = script.content
    let subject = "Quick question from TropiChat 🇧🇸"
    let body = content

    if (content.startsWith("Subject:")) {
      const parts = content.split("\n\n")
      subject = parts[0].replace("Subject:", "").trim()
      body = parts.slice(1).join("\n\n")
    }

    // 3. Fetch Target Lead Data
    const { data: leads, error: lErr } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)

    if (lErr || !leads || leads.length === 0) {
      return NextResponse.json({ error: "No target leads found for mission" }, { status: 404 })
    }

    const results = []

    // 4. Mission Execution: Multi-Lead Dispatch
    for (const lead of leads) {
      // 4a. Strategic Regional & Personalization Logic (Pan-Caribbean) 🇧🇸🇯🇲🛰️
      const busName = lead.business_name || ""
      const location = lead.location || "the Caribbean"
      const residentTag = location === "Bahamas" ? "Bahamian" 
                          : location === "Jamaica" ? "Jamaican"
                          : location === "Barbados" ? "Barbadian"
                          : "local"
      
      const nameFallback = busName ? `the team at ${busName}` : "there"
      
      const personalizedBody = body
        .replaceAll("[Name]", nameFallback)
        .replaceAll("[Business Name]", busName || "your business")
        .replaceAll("[Location]", location)
        .replaceAll("[Resident]", residentTag)
        .replaceAll("[Your Name]", adminName)
        // Clean up any double spaces that might occur during fallback
        .replace(/\s\s+/g, ' ')
      
      const targetEmail = lead.contact_email || "test@tropichat.com" // Safety fallback
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
      const replyToEmail = process.env.RESEND_REPLY_TO_EMAIL || "lamar@tropitech.org"

      try {
        const { data, error } = await resend.emails.send({
          from: `TropiChat <${fromEmail}>`,
          to: [targetEmail],
          replyTo: replyToEmail,
          subject: subject,
          text: personalizedBody,
          // If you have a verified domain, we can use it. Otherwise, it might use @resend.dev initially.
          tags: [
            { name: "category", value: script.category },
            { name: "industry", value: script.industry },
          ],
        })

        if (!error) {
          // 5. Intelligence Update: Mark as Contacted
          await supabase
            .from('leads')
            .update({ 
              status: 'contacted',
              updated_at: new Date().toISOString(),
              notes: (lead.notes || "") + `\n[${new Date().toLocaleDateString()}] Blasted with mission: ${script.title}`
            })
            .eq('id', lead.id)

          results.push({ leadId: lead.id, success: true, messageId: data?.id })
        } else {
          results.push({ leadId: lead.id, success: false, error: error.message })
        }
      } catch (err: any) {
        results.push({ leadId: lead.id, success: false, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      missionReport: results,
      stats: {
        total: leads.length,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error: any) {
    console.error("Outreach Dispatch Failure:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
