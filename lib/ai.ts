import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@supabase/supabase-js"

/**
 * Sovereign AI Auto-Pilot Engine
 * 
 * Powered by Gemini 1.5 Flash.
 * Processes incoming messages and generates high-fidelity,
 * context-aware responses tailored for the Caribbean business market.
 */

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "mock_key")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Generate a smart reply suggestion for a human agent.
 * This is used for the "Smart Reply" feature in the inbox.
 */
export async function generateSmartReplySuggestion(conversationId: string) {
  try {
    // 1. Fetch conversation context
    const { data: conversation, error: convError } = await adminSupabase
      .from("unified_conversations")
      .select(`
        id, channel_type,
        customer_name,
        messages:unified_messages(content, sender_type, sent_at)
      `)
      .eq("id", conversationId)
      .single()

    if (convError || !conversation) {
      console.error("[AI Smart Reply] Context recovery failed:", convError)
      return null
    }

    // 2. Synthesize history
    const history = (conversation.messages as any[]) || []
    // Get last 10 messages for context
    const lastFewMessages = history
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      .slice(-10)
      .map((m) => `${m.sender_type === "business" ? "Agent" : "Customer"}: ${m.content}`)
      .join("\n")

    if (lastFewMessages.length === 0) return null

    // 3. System Prompt for Suggestion
    const systemPrompt = `
      You are an expert customer service assistant for a business called "TropiChat". 
      Your goal is to suggest a helpful, concise, and professional reply for an agent to send to a customer on ${conversation.channel_type}.
      
      TONE: Helpful, friendly, efficient. 
      CONTEXT: The customer's name is ${conversation.customer_name || "there"}.
      
      CONVERSATION HISTORY:
      ${lastFewMessages}
      
      TASK: Suggest ONE reply that the agent can send next. 
      - Keep it under 2 sentences.
      - Don't use bullet points.
      - If the customer just sent a greeting, suggest a friendly "How can I help you today?".
      - If the customer asked a question, answer it based on the history or ask for clarification.
      - Return ONLY the suggested text, no commentary.
    `

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return "Hi! How can I help you with TropiChat today?"
    }

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    return response.text().trim().replace(/^"/, "").replace(/"$/, "")
  } catch (error) {
    console.error("[AI Smart Reply] Error:", error)
    return null
  }
}

/**
 * Automatic Pilot - Process inbound message and potentially respond
 */
export async function processInboundWithAI(conversationId: string, incomingMessage: string) {
  try {
    const { data: conversation, error: convError } = await adminSupabase
      .from("unified_conversations")
      .select(`
        id, channel_type, customer_name,
        messages:unified_messages(content, sender_type, sent_at)
      `)
      .eq("id", conversationId)
      .single()

    if (convError || !conversation) return null

    const history = (conversation.messages as any[]) || []
    const lastFewMessages = history
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      .slice(-5)
      .map((m) => `${m.sender_type === "business" ? "TropiChat" : "Prospect"}: ${m.content}`)
      .join("\n")

    const systemPrompt = `
      You are TropiChat AI, a powerful business automation assistant.
      Your mission is to help Caribbean businesses scale through omni-channel automation.
      
      TONE: Professional, visionary, friendly, and strategic.
      CONTEXT: You are responding to a prospect named ${conversation.customer_name || "there"} on ${conversation.channel_type}.
      
      CONVERSATION HISTORY:
      ${lastFewMessages}
      
      NEW MESSAGE: "${incomingMessage}"
      
      OBJECTIVE: Provide a concise, helpful response (max 2 sentences).
      Mention that Pro starts at $29/mo if they ask about cost.
    `

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log("[AI Pilot] Mock Mode. Returning default.")
      return `Hey! Thanks for messaging. I've received your inquiry and our team will get back to you soon. Want to see our Pro features ($29/mo)?`
    }

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error("[AI Pilot] Error:", error)
    return null
  }
}

/**
 * Dispatch AI Response back through the channel
 */
export async function dispatchAIResponse(conversationId: string, aiContent: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
  
  const response = await fetch(`${baseUrl}/api/messages/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      content: aiContent,
      message_type: "text"
    })
  })

  return response.json()
}
