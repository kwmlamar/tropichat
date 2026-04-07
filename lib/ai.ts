import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@supabase/supabase-js"
import type { BusinessBrief } from "@/lib/ai-schema"

/**
 * Sovereign AI Auto-Pilot Engine
 * 
 * Powered by Gemini 2.0 Flash.
 * Processes incoming messages and generates high-fidelity,
 * context-aware responses tailored for the Caribbean business market.
 */

// Initialize Gemini lazily to ensure environment variables are loaded
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

function getModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || apiKey === "mock_key") {
    return null;
  }
  
  if (!model) {
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      console.log("[AI Engine] Gemini 2.5 Flash initialized successfully.");
    } catch (err) {
      console.error("[AI Engine] Failed to initialize Gemini:", err);
      return null;
    }
  }
  return model;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

import { AIVoiceProfile, DEFAULT_VOICE_PROFILE, extractStyleFromSample } from "./ai-schema"

// Re-export them
export type { AIVoiceProfile }
export { DEFAULT_VOICE_PROFILE, extractStyleFromSample }

// ─── Styled Prompt Builder ──────────────────────────────────────

type ConversationTurn = { role: 'user' | 'ai'; content: string }

function buildStyledPrompt(params: {
  voiceProfile: AIVoiceProfile
  businessType: string
  services: string
  customerMessage: string
  history?: ConversationTurn[]
  brief?: BusinessBrief | null
}): string {
  const { voiceProfile: v, businessType, services, customerMessage, history = [], brief } = params

  const emojiInstruction =
    v.emojiUsage === "none" ? "Do NOT use any emojis." :
    v.emojiUsage === "light" ? "Use 1-2 emojis max, placed naturally." :
    "Use emojis freely and expressively like the sample."

  const conversationHistory = history.length > 0
    ? `CONVERSATION SO FAR:
${history.map(m => `${m.role === 'user' ? 'Customer' : 'You'}: ${m.content}`).join('\n')}
`
    : ""

  const goalText = brief?.aiGoal === 'book' ? 'Move every conversation toward booking an appointment.'
    : brief?.aiGoal === 'sell' ? 'Move every conversation toward closing a sale.'
    : brief?.aiGoal === 'capture' ? 'Capture lead info and express strong interest to drive action.'
    : 'Answer questions helpfully and move toward the next step.'

  const briefContext = brief ? `
Business type: ${brief.businessType}${brief.tagline ? ` — ${brief.tagline}` : ''}
Services & pricing: ${brief.services || services}
Payment methods: ${brief.paymentMethods?.join(', ') || 'Cash'}
${brief.hasDelivery ? 'Delivery/pickup: Available' : ''}
${brief.takesBookings ? `Bookings: Yes — via ${brief.bookingMethod}` : 'Walk-ins or inquiries welcome'}
Availability: ${brief.availability}
Goal: ${goalText}` : `
Services: ${services}
Goal: ${goalText}`

  return `You are replying to customers for a small Caribbean ${brief?.businessType || businessType} business using WhatsApp.
${briefContext}

How the owner writes: ${v.sampleReply ? `"${v.sampleReply}"` : 'Casual and friendly'}

Rules:
- Keep replies short (1-2 sentences max)
- Sound natural and human, not robotic
- NEVER restart the conversation or re-greet the customer
- Do NOT repeat pricing if you already mentioned it earlier in the conversation
- Move toward the goal above — ask for a date, time, group size, or next step
- If they show interest, suggest availability and move toward confirmation
- ${emojiInstruction}
- Never say you are an AI
- Return ONLY the reply text — no quotes, no labels

This is WhatsApp. Be casual.

${conversationHistory}Customer: "${customerMessage}"

You:`
}

// ─── Smart Fallback (Voice-Aware) ───────────────────────────────

function getSmartFallback(message: string, businessType: string, services: string, voice: AIVoiceProfile): string {
  const msg = message.toLowerCase()
  const biz = businessType || "our business"
  const svc = services || "our services"
  
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
  history?: ConversationTurn[]
  brief?: BusinessBrief | null
}) {
  const { message, businessType, services = "General customer support", history = [], brief } = params
  const voice = params.voiceProfile || DEFAULT_VOICE_PROFILE

  try {
    const ai = getModel()
    if (!ai) {
      console.log("[AI Demo] No valid API key. Using smart fallback.")
      return getSmartFallback(message, brief?.businessType || businessType, brief?.services || services, voice)
    }

    const prompt = buildStyledPrompt({
      voiceProfile: voice,
      businessType: brief?.businessType || businessType,
      services: brief?.services || services,
      customerMessage: message,
      history,
      brief
    })

    const result = await ai.generateContent(prompt)
    const response = await result.response
    return response.text().trim().replace(/^"/,  "").replace(/"$/, "")
  } catch (error: any) {
    console.error("[AI Demo] Gemini error:", error?.message?.substring(0, 150))
    return getSmartFallback(message, brief?.businessType || businessType, brief?.services || services, voice)
  }
}

// ─── Smart Reply Suggestion (Production) ────────────────────────

export async function generateSmartReplySuggestion(conversationId: string) {
  try {
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

    if (convError || !conversation) return null

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
    } catch { }

    const history = (conversation.messages as any[]) || []
    const lastFewMessages = history
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      .slice(-10)
      .map((m) => `${m.sender_type === "business" ? "Agent" : "Customer"}: ${m.content}`)
      .join("\n")

    if (lastFewMessages.length === 0) return null

    const v = voiceProfile
    const emojiHint = v.emojiUsage === "none" ? "No emojis." : v.emojiUsage === "light" ? "1-2 emojis max." : "Use emojis freely."

    const systemPrompt = `
      You are replying to customers for a small Caribbean business on ${conversation.channel_type}.
      Your goal is to turn this conversation into a booking.

      Voice: ${v.tone}. ${emojiHint}
      ${v.sampleReply ? `Example of how they write: "${v.sampleReply}"` : ""}
      Customer name: ${conversation.customer_name || "there"}

      Rules:
      - Keep it to 1-2 sentences max
      - Sound natural and human, not robotic
      - Never restart the conversation or re-greet the customer
      - Do NOT repeat pricing if it was already mentioned in the conversation
      - Move toward booking: ask for a date, time, or number of people
      - If they show interest, suggest availability and ask to confirm
      - This is ${conversation.channel_type}, not email — be casual
      - Return ONLY the reply text, no labels or quotes

      CONVERSATION:
      ${lastFewMessages}

      Suggest the next reply:
    `

    const ai = getModel()
    if (!ai) return null

    const result = await ai.generateContent(systemPrompt)
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

    let voiceProfile = DEFAULT_VOICE_PROFILE
    let businessBrief: BusinessBrief | null = null
    try {
      const { data: account } = await adminSupabase
        .from("connected_accounts")
        .select("user_id")
        .eq("id", conversation.connected_account_id)
        .single()
      
      if (account?.user_id) {
        const { data: customer } = await adminSupabase
          .from("customers")
          .select("ai_voice_profile, business_brief")
          .eq("id", account.user_id)
          .single()
        
        if (customer?.ai_voice_profile) {
          voiceProfile = customer.ai_voice_profile as AIVoiceProfile
        }
        if (customer?.business_brief) {
          businessBrief = customer.business_brief as BusinessBrief
        }
      }
    } catch { }

    const rawHistory = ((conversation.messages as any[]) || [])
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      .slice(-8)
      .map(m => ({ role: m.sender_type === "business" ? "ai" as const : "user" as const, content: m.content }))

    const prompt = buildStyledPrompt({
      voiceProfile,
      businessType: businessBrief?.businessType || "general",
      services: businessBrief?.services || "General services",
      customerMessage: incomingMessage,
      history: rawHistory,
      brief: businessBrief
    })

    const ai = getModel()
    if (!ai) {
      console.log("[AI Pilot] Mock Mode enabled — responding via fallback.")
      return getSmartFallback(incomingMessage, businessBrief?.businessType || "business", businessBrief?.services || "general services", voiceProfile)
    }

    const result = await ai.generateContent(prompt)
    const response = await result.response
    return response.text().trim().replace(/^"/, "").replace(/"$/, "")
  } catch (error) {
    console.error("[AI Pilot] Error:", error)
    return null
  }
}

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
