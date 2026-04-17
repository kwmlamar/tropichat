import { NextResponse } from "next/server"
import { createServerClient, createServiceClient, getWorkspaceIdServer } from "@/lib/supabase-server"

/**
 * AI Auto-Pilot Toggle
 * POST: toggle ai_autopilot_enabled for the authenticated user
 * GET:  return current autopilot status
 */
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

    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from("customers")
      .select("ai_autopilot_enabled")
      .eq("id", customerId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ enabled: data?.ai_autopilot_enabled ?? false })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

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

    const { enabled } = await request.json()

    const { customerId, error: wsError } = await getWorkspaceIdServer(token)
    if (wsError || !customerId) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from("customers")
      .update({ ai_autopilot_enabled: enabled })
      .eq("id", customerId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    console.log(`[AI Auto-Pilot] User ${user.id} turned auto-pilot ${enabled ? "ON" : "OFF"}`)
    return NextResponse.json({ success: true, enabled })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
