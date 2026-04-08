import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateConversationIntelligence } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    const { conversationId } = await req.json()
    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Check existing summary to see if we really need to generate a new one
    // (This is a safety check: the client shouldn't call this if it already has a fresh cache,
    // but we can enforce it here if we want. For now, trusting the client to call when needed)

    // 2. Fetch history
    const { data: messages, error: msgError } = await supabase
      .from("unified_messages")
      .select("id, content, sender_type, sent_at")
      .eq("conversation_id", conversationId)
      .order("sent_at", { ascending: false })
      .limit(30)

    if (msgError || !messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages found" }, { status: 404 })
    }

    // 3. Generate Analysis
    const intelligence = await generateConversationIntelligence(messages)
    
    if (!intelligence) {
      return NextResponse.json({ error: "Failed to generate intelligence" }, { status: 500 })
    }

    // 4. Cache it in DB
    const now = new Date().toISOString()
    await supabase
      .from("unified_conversations")
      .update({
        ai_summary: intelligence,
        ai_summary_updated_at: now
      })
      .eq("id", conversationId)

    return NextResponse.json({ intelligence, updated_at: now })
  } catch (error) {
    console.error("[AI Intelligence API] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
