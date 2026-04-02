import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

/**
 * Voice Profile API
 * Save and load AI voice training profiles.
 */

// GET — Load saved voice profile
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

    const { data: customer } = await supabase
      .from("customers")
      .select("ai_voice_profile")
      .eq("id", user.id)
      .single()

    return NextResponse.json({ 
      success: true, 
      voiceProfile: customer?.ai_voice_profile || null 
    })
  } catch (error) {
    console.error("[Voice Profile GET] Error:", error)
    return NextResponse.json({ success: false, voiceProfile: null })
  }
}

// POST — Save voice profile
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

    const { voiceProfile } = await request.json()
    
    if (!voiceProfile) {
      return NextResponse.json({ error: "Missing voiceProfile" }, { status: 400 })
    }

    // Stamp it
    voiceProfile.trainedAt = new Date().toISOString()
    voiceProfile.version = 1

    const { error } = await supabase
      .from("customers")
      .update({ ai_voice_profile: voiceProfile })
      .eq("id", user.id)

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
