import { NextResponse } from "next/server"
import { createServerClient, getWorkspaceIdServer } from "@/lib/supabase-server"

/**
 * Voice Profile + Business Brief API
 * Save and load AI training data.
 */

// GET — Load saved voice profile + business brief
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const { customerId, error: wsError } = await getWorkspaceIdServer(token)
    if (wsError || !customerId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("ai_voice_profile, business_brief")
      .eq("id", customerId)
      .single()

    return NextResponse.json({ 
      success: true, 
      voiceProfile: customer?.ai_voice_profile || null,
      businessBrief: customer?.business_brief || null
    })
  } catch (error) {
    console.error("[Voice Profile GET] Error:", error)
    return NextResponse.json({ success: false, voiceProfile: null, businessBrief: null })
  }
}

// POST — Save voice profile and/or business brief
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const body = await request.json()
    const { voiceProfile, businessBrief } = body
    
    if (!voiceProfile && !businessBrief) {
      return NextResponse.json({ error: "Missing voiceProfile or businessBrief" }, { status: 400 })
    }

    // Build update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {}

    if (voiceProfile) {
      voiceProfile.trainedAt = new Date().toISOString()
      voiceProfile.version = (voiceProfile.version || 0) + 1
      updatePayload.ai_voice_profile = voiceProfile
    }

    if (businessBrief) {
      updatePayload.business_brief = businessBrief
    }

    const { customerId, error: wsError } = await getWorkspaceIdServer(token)
    if (wsError || !customerId) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from("customers")
      .update(updatePayload)
      .eq("id", customerId)

    if (error) {
      console.error("[Voice Profile POST] DB Error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Voice Profile POST] Error:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
