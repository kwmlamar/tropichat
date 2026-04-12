import { NextRequest, NextResponse } from "next/server"
import { createServerClient, createServiceClient } from "@/lib/supabase-server"
import { generateAssistantResponse } from "@/lib/ai"
import type { BusinessBrief } from "@/lib/ai-schema"

/**
 * Conversation-scoped AI assistant.
 * Uses the specific conversation's messages as context — not all chats.
 * POST /api/ai/assistant/conversation
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { conversationId, query, history } = await req.json()
    if (!conversationId || !query) {
      return NextResponse.json({ error: "Missing conversationId or query" }, { status: 400 })
    }

    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const service = createServiceClient()

    // Verify ownership: the conversation must belong to one of the user's connected accounts
    const { data: conversation } = await service
      .from("unified_conversations")
      .select(`
        id, customer_name, channel_type,
        connected_account:connected_accounts!inner(user_id),
        messages:unified_messages(content, sender_type, sent_at)
      `)
      .eq("id", conversationId)
      .single()

    if (!conversation || (conversation.connected_account as any)?.user_id !== user.id) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Build conversation transcript
    const sorted = ((conversation.messages as any[]) || [])
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())

    const transcript = sorted
      .map((m) => `[${new Date(m.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] ${m.sender_type === "business" ? "Agent" : "Customer"}: ${m.content}`)
      .join("\n")

    const dataContext = `CONVERSATION WITH ${conversation.customer_name || "Customer"} (${conversation.channel_type}):
---
${transcript || "No messages yet."}
---`

    // Fetch business brief for context
    const { data: customer } = await service
      .from("customers")
      .select("business_brief")
      .eq("id", user.id)
      .single()

    const response = await generateAssistantResponse({
      query,
      brief: (customer?.business_brief as BusinessBrief) || null,
      dataContext,
      history: history || [],
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error("[Conversation AI] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
