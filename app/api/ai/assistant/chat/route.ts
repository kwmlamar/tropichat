import { NextRequest, NextResponse } from "next/server"
import { createServerClient, createServiceClient } from "@/lib/supabase-server"
import { generateAssistantResponse } from "@/lib/ai"
import type { BusinessBrief } from "@/lib/ai-schema"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { query, category, history } = await req.json()
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 })
    }

    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const serviceClient = createServiceClient()

    // 1. Fetch context data if needed
    // For now, we'll fetch the last 100 messages across all conversations to give the AI some ground truth
    const { data: recentMessages } = await serviceClient
      .from("unified_messages")
      .select("content, sender_type, sent_at")
      .order("sent_at", { ascending: false })
      .limit(100)

    const dataContext = recentMessages 
      ? `RECENT MESSAGES ACROSS ALL CHATS:\n${recentMessages.map(m => `[${new Date(m.sent_at).toLocaleDateString()}] ${m.sender_type}: ${m.content}`).join('\n')}`
      : "No recent messages found."

    // 2. Fetch business brief
    const { data: customer } = await serviceClient
      .from("customers")
      .select("business_brief")
      .eq("id", user.id)
      .single()

    // 3. Generate AI Response
    const response = await generateAssistantResponse({
      query,
      brief: customer?.business_brief as BusinessBrief || null,
      dataContext,
      history: history || []
    })

    // 4. Log the interaction
    const { error: logError } = await serviceClient
      .from("ai_assistant_logs")
      .insert({
        user_id: user.id,
        query,
        response,
        category: category || 'general'
      })
    if (logError) {
      console.error("[AI Assistant] Failed to log interaction:", logError.message)
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("[AI Assistant Chat API] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createServerClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const serviceClient = createServiceClient()
    const { data: logs, error: logsError } = await serviceClient
      .from("ai_assistant_logs")
      .select("id, query, response, category, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (logsError) throw logsError

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[AI Assistant Chat API] GET Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
