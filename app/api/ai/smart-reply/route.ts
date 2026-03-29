import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { generateSmartReplySuggestion } from "@/lib/ai"

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

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    const suggestion = await generateSmartReplySuggestion(conversationId)

    if (!suggestion) {
      return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 })
    }

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error("[API Smart Reply] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
