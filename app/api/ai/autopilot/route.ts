import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase"

/**
 * AI Auto-Pilot Toggle
 * POST: toggle ai_autopilot_enabled for the authenticated user
 * GET:  return current autopilot status
 */
export async function GET() {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await serviceClient
      .from("customers")
      .select("ai_autopilot_enabled")
      .eq("id", user.id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ enabled: data?.ai_autopilot_enabled ?? false })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { enabled } = await req.json()

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await serviceClient
      .from("customers")
      .update({ ai_autopilot_enabled: enabled })
      .eq("id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    console.log(`[AI Auto-Pilot] User ${user.id} turned auto-pilot ${enabled ? "ON" : "OFF"}`)
    return NextResponse.json({ success: true, enabled })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
