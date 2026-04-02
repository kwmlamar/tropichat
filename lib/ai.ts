import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@supabase/supabase-js"

/**
 * Sovereign AI Auto-Pilot Engine
 * 
 * Powered by Gemini 2.0 Flash.
 * Processes incoming messages and generates high-fidelity,
 * context-aware responses tailored for the Caribbean business market.
 * 
 * Voice Training System:
 * Each business has an AIVoiceProfile that controls how the AI sounds.
 * One system → two surfaces (demo + production).
 */

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "mock_key")
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

import { AIVoiceProfile, DEFAULT_VOICE_PROFILE, extractStyleFromSample } from "./ai-schema"

// Re-export them so other files using them don't completely break,
// but client files should import directly from ai-schema.
export type { AIVoiceProfile }
export { DEFAULT_VOICE_PROFILE, extractStyleFromSample }

// ─── Styled Prompt Builder ──────────────────────────────────────

function buildStyledPrompt(params: {
  voiceProfile: AIVoiceProfile
  businessType: string
  services: string
  customerMessage: string
}): string {
  const { voiceProfile: v, businessType, services, customerMessage } = params
  
  const lengthInstruction = 
    v.responseLength === "short" ? "Keep it under 2 sentences. Be concise." :
    v.responseLength === "medium" ? "Use 2-4 sentences. Give enough detail." :
    "Be detailed but still conversational. Don't ramble."
  
  const emojiInstruction =
    v.emojiUsage === "none" ? "Do NOT use any emojis." :
    v.emojiUsage === "light" ? "Use 1-2 emojis max, placed naturally." :
    "Use emojis freely and expressively like the sample."
  
  return `You are a customer service assistant for a ${businessType} business.

=== HOW TO SOUND ===
Tone: ${v.tone}
${lengthInstruction}
${emojiInstruction}
${v.greeting ? `Typical greeting style: "${v.greeting}"` : ""}
${v.closer ? `Typical sign-off: "${v.closer}"` : ""}

Here is an example of how the business owner actually replies:
"${v.sampleReply}"

=== RULES ===
- Match this communication style exactly. Sound like the business owner, NOT a chatbot.
- Never say "I'm an AI" or "As an AI assistant" or anything similar.
- Focus on answering the question AND guiding toward a sale or booking.
- Write like a WhatsApp message, not an email.

=== BUSINESS CONTEXT ===
Services: ${services}

=== TASK ===
A customer just sent this message:
"${customerMessage}"

Reply as the business owner would. Return ONLY the reply text. No quotes, no labels, no explanations.`
}

// ─── Smart Fallback (Voice-Aware) ───────────────────────────────

function getSmartFallback(message: string, businessType: string, services: string, voice: AIVoiceProfile): string {
  const msg = message.toLowerCase()
  const biz = businessType || "our business"
  const svc = services || "our services"
  
  // Apply voice profile to fallback responses
  const emoji = voice.emojiUsage === "none" ? "" : voice.emojiUsage === "light" ? " 😊" : " 😊🙌"
  const greet = voice.greeting || "Hey there!"
  const close = voice.closer || "Let me know!"
  
  if (msg.includes("deliver") || msg.includes("shipping")) {
    return `${greet} Yes, we offer delivery!${emoji} ${svc.toLowerCase().includes("delivery") ? "We do island-wide delivery!" : "Let me check the options for you."} ${close}`
  }
  if (msg.includes("price") || msg.includes("cost") || msg.includes("how much") || msg.includes("rate")) {
    return `${greet} Pricing depends on what you're looking for — can you tell me more so I can give you an accurate quote?${emoji}`
  }
  if (msg.includes("open") || msg.includes("hours") || msg.includes("close") || msg.includes("time")) {
    return `We're typically open Monday to Saturday!${emoji} Send us a message anytime and we'll get back to you. ${close}`
  }
  if (msg.includes("book") || msg.includes("appointment") || msg.includes("schedule") || msg.includes("reserve")) {
    return `${greet} Absolutely! What date and time works best for you?${emoji}`
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("good")) {
    return `${greet} Welcome to ${biz}!${emoji} How can I help you today?`
  }
  if (msg.includes("tour") || msg.includes("trip") || msg.includes("excursion") || msg.includes("snorkel")) {
    return `${greet} We'd love to take you out!${emoji} What kind of experience are you looking for? We can customize something perfect for your group. ${close}`
  }
  if (msg.includes("available") || msg.includes("stock") || msg.includes("have")) {
    return `Let me check on that for you! What specifically are you looking for?${emoji}`
  }
  if (msg.includes("thank") || msg.includes("thanks")) {
    return `You're welcome! Don't hesitate to reach out if you need anything else.${emoji}`
  }
  return `${greet} Thanks for reaching out to ${biz}!${emoji} We offer ${svc}. How can I help you today?`
}

// ─── Demo Reply Generator ───────────────────────────────────────

export async function generateAIDemoReply(params: {
  message: string
  businessType: string
  services?: string
  voiceProfile?: AIVoiceProfile
}) {
  const { message, businessType, services = "General customer support" } = params
  const voice = params.voiceProfile || DEFAULT_VOICE_PROFILE

  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY === "mock_key") {
      console.log("[AI Demo] No API key. Using smart fallback.")
      return getSmartFallback(message, businessType, services, voice)
    }

    const prompt = buildStyledPrompt({
      voiceProfile: voice,
      businessType,
      services,
      customerMessage: message
    })

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim().replace(/^"/, "").replace(/"$/, "")
  } catch (error: any) {
    console.error("[AI Demo] Gemini unavailable, using smart fallback:", error?.message?.substring(0, 100))
    return getSmartFallback(message, businessType, services, voice)
  }
}

// ─── Smart Reply Suggestion (Production) ────────────────────────

export async function generateSmartReplySuggestion(conversationId: string) {
  try {
    // 1. Fetch conversation context
    const { data: conversation, error: convError } = await adminSupabase
      .from("unified_conversations")
      .select(`
        id, channel_type,
        customer_name,
        connected_account_id,
        messages:unified_messages(content, sender_type, sent_at)
      `)
      .eq("id", conversationId)
      .single()

    if (convError || !conversation) {
      console.error("[AI Smart Reply] Context recovery failed:", convError)
      return null
    }

    // 2. Fetch voice profile for this business
    let voiceProfile = DEFAULT_VOICE_PROFILE
    try {
      const { data: account } = await adminSupabase
        .from("connected_accounts")
        .select("user_id")
        .eq("id", conversation.connected_account_id)
        .single()
      
      if (account?.user_id) {
        const { data: customer } = await adminSupabase
          .from("customers")
          .select("ai_voice_profile")
          .eq("id", account.user_id)
          .single()
        
        if (customer?.ai_voice_profile) {
          voiceProfile = customer.ai_voice_profile as AIVoiceProfile
        }
      }
    } catch {
      // Use default if lookup fails
    }

    // 3. Synthesize history
    const history = (conversation.messages as any[]) || []
    const lastFewMessages = history
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      .slice(-10)
      .map((m) => `${m.sender_type === "business" ? "Agent" : "Customer"}: ${m.content}`)
      .join("\n")

    if (lastFewMessages.length === 0) return null

    // 4. Build voice-aware prompt
    const v = voiceProfile
    const lengthHint = v.responseLength === "short" ? "1-2 sentences" : v.responseLength === "medium" ? "2-3 sentences" : "3-4 sentences"
    const emojiHint = v.emojiUsage === "none" ? "No emojis." : v.emojiUsage === "light" ? "1-2 emojis max." : "Use emojis freely."
    
    const systemPrompt = `
      You are suggesting a reply for a business on ${conversation.channel_type}.
      
      VOICE: ${v.tone}. ${lengthHint}. ${emojiHint}
      Example of how they write: "${v.sampleReply}"
      
      Customer name: ${conversation.customer_name || "there"}
      
      CONVERSATION:
      ${lastFewMessages}
      
      Suggest ONE reply (${lengthHint}). Sound like the business owner, not a chatbot. Return ONLY the text.
    `

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return `${v.greeting || "Hi!"} How can I help you today?`
    }

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    return response.text().trim().replace(/^"/, "").replace(/"$/, "")
  } catch (error) {
    console.error("[AI Smart Reply] Error:", error)
    return null
  }
}

// ─── Automatic Pilot (Production) ───────────────────────────────

export async function processInboundWithAI(conversationId: string, incomingMessage: string) {
  try {
    const { data: conversation, error: convError } = await adminSupabase
      .from("unified_conversations")
      .select(`
        id, channel_type, customer_name, connected_account_id,
        messages:unified_messages(content, sender_type, sent_at)
      `)
      .eq("id", conversationId)
      .single()

    if (convError || !conversation) return null

    // Fetch voice profile
    let voiceProfile = DEFAULT_VOICE_PROFILE
    try {
      const { data: account } = await adminSupabase
        .from("connected_accounts")
        .select("user_id")
        .eq("id", conversation.connected_account_id)
        .single()
      
      if (account?.user_id) {
        const { data: customer } = await adminSupabase
          .from("customers")
          .select("ai_voice_profile")
          .eq("id", account.user_id)
          .single()
        
        if (customer?.ai_voice_profile) {
          voiceProfile = customer.ai_voice_profile as AIVoiceProfile
        }
      }
    } catch {
      // Use default
    }

    const history = (conversation.messages as any[]) || []
    const lastFewMessages = history
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      .slice(-5)
      .map((m) => `${m.sender_type === "business" ? "Business" : "Customer"}: ${m.content}`)
      .join("\n")

    const v = voiceProfile
    const systemPrompt = `
      You are responding on behalf of a business on ${conversation.channel_type}.
      
      VOICE: ${v.tone}. ${v.responseLength === "short" ? "Max 2 sentences." : v.responseLength === "medium" ? "2-4 sentences." : "Be detailed."}
      ${v.emojiUsage === "none" ? "No emojis." : v.emojiUsage === "light" ? "1-2 emojis." : "Emojis welcome."}
      Example of how they write: "${v.sampleReply}"
      
      Customer: ${conversation.customer_name || "there"}
      
      HISTORY:
      ${lastFewMessages}
      
      NEW MESSAGE: "${incomingMessage}"
      
      Reply as the business owner (max 2 sentences). Sound human.
    `

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log("[AI Pilot] Mock Mode.")
      return getSmartFallback(incomingMessage, "business", "general services", voiceProfile)
    }

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    return response.text().trim()
  } catch (error) {
    console.error("[AI Pilot] Error:", error)
    return null
  }
}

// ─── Dispatch AI Response ───────────────────────────────────────

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
