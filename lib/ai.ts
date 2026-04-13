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

/**
 * Result returned by processInboundWithAI.
 * usedFallback is true when the owner set fallback_behavior='hand_off'
 * and the AI couldn't generate a confident reply (mock mode, error, or empty output).
 */
export interface AIProcessResult {
  reply: string
  usedFallback: boolean
}

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

export async function processInboundWithAI(
  conversationId: string,
  incomingMessage: string
): Promise<AIProcessResult | null> {
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

    // Whether the owner wants AI to hand off to a human when it can't answer
    const isFallbackMode = voiceProfile.fallback_behavior === "hand_off"

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
      console.log("[AI Pilot] Mock Mode enabled — responding via smart fallback.")
      const reply = getSmartFallback(
        incomingMessage,
        businessBrief?.businessType || "business",
        businessBrief?.services || "general services",
        voiceProfile
      )
      return { reply, usedFallback: isFallbackMode }
    }

    try {
      const result = await ai.generateContent(prompt)
      const text = result.response.text().trim().replace(/^"/, "").replace(/"$/, "")

      if (!text) {
        console.log("[AI Pilot] Empty response from Gemini — using smart fallback.")
        const reply = getSmartFallback(
          incomingMessage,
          businessBrief?.businessType || "business",
          businessBrief?.services || "general services",
          voiceProfile
        )
        return { reply, usedFallback: isFallbackMode }
      }

      return { reply: text, usedFallback: false }
    } catch (geminiError) {
      console.error("[AI Pilot] Gemini error — using smart fallback:", geminiError)
      const reply = getSmartFallback(
        incomingMessage,
        businessBrief?.businessType || "business",
        businessBrief?.services || "general services",
        voiceProfile
      )
      return { reply, usedFallback: isFallbackMode }
    }
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

// ─── AI Intelligence Panel (Dashboard) ─────────────────────────

export interface AIIntelligenceSummary {
  headline: string;
  leadDetails: { label: string; value: string }[];
  strategicContext: string;
}

export async function generateConversationIntelligence(history: any[]): Promise<AIIntelligenceSummary | null> {
  const ai = getModel()
  if (!ai) return null

  const formattedHistory = history
    .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
    .map(m => `${m.sender_type === "business" ? "Agent" : "Customer"}: ${m.content}`)
    .join("\n")

  if (!formattedHistory) return null

  const prompt = `
    You are an expert sales analyst for a Caribbean business.
    Analyze the following conversation and extract key intelligence.

    CONVERSATION:
    ${formattedHistory}

    Return a JSON object with this exact structure:
    {
      "headline": "A punchy 1-sentence summary of the customer's intent (e.g., 'Customer wants to book a sunset cruise for 4 on Saturday.')",
      "leadDetails": [
        { "label": "Service Level", "value": "Details" },
        { "label": "Dates/Time", "value": "Details" },
        { "label": "Party Size", "value": "Details" },
        { "label": "Status", "value": "Pending / Ready to Book / Just Browsing" }
      ],
      "strategicContext": "2-3 sentences on what happened, any objections, and exactly what the Agent should do next to close the deal."
    }
  `

  try {
    const result = await ai.generateContent(prompt)
    const responseText = result.response.text().trim().replace(/^```json/, "").replace(/```$/, "")
    const parsed = JSON.parse(responseText)
    return parsed as AIIntelligenceSummary
  } catch (error) {
    console.error("[AI Intelligence] Failed to generate summary:", error)
    return null
  }
}

// ─── WhatsApp Template Re-Engagement Selector ───────────────────

export interface TemplateSelection {
  templateName: string
  languageCode: string
  /** Filled values for {{1}}, {{2}}, etc. in order */
  variables: string[]
}

/**
 * selectTemplateForReEngagement
 * Called when the 24-hour WhatsApp messaging window has closed.
 * Given a list of approved templates and the conversation history,
 * the AI picks the most contextually appropriate template and fills
 * any dynamic variables ({{1}}, {{2}}, ...) with relevant values.
 */
export async function selectTemplateForReEngagement(params: {
  approvedTemplates: Array<{ name: string; language: string; body: string }>
  customerName: string | null
  conversationSummary: string
  businessType: string
}): Promise<TemplateSelection | null> {
  const { approvedTemplates, customerName, conversationSummary, businessType } = params

  if (approvedTemplates.length === 0) return null

  const ai = getModel()
  if (!ai) {
    // Fallback: use the first approved template with no variables
    const t = approvedTemplates[0]
    return { templateName: t.name, languageCode: t.language, variables: [] }
  }

  const templateList = approvedTemplates
    .map((t, i) => `${i + 1}. Name: "${t.name}" | Language: ${t.language}\n   Body: ${t.body}`)
    .join('\n')

  const prompt = `You are selecting a WhatsApp re-engagement template to send to a customer for a Caribbean ${businessType} business.
The 24-hour messaging window has closed, so only pre-approved templates can be sent.

Customer name: ${customerName ?? 'Unknown'}
Conversation context: ${conversationSummary}

APPROVED TEMPLATES:
${templateList}

Choose the single most contextually appropriate template from the list above.
Fill in any {{1}}, {{2}}, {{3}} variables with natural, relevant values based on the conversation context and customer name.

Return ONLY a JSON object with this exact shape (no markdown, no extra text):
{
  "templateName": "exact_template_name",
  "languageCode": "en",
  "variables": ["value for {{1}}", "value for {{2}}"]
}
If the template has no variables, return an empty array for variables.`

  try {
    const result = await ai.generateContent(prompt)
    const raw = result.response.text().trim().replace(/^```json/, '').replace(/```$/, '')
    const parsed = JSON.parse(raw) as TemplateSelection
    // Validate the selected template actually exists
    const exists = approvedTemplates.some(t => t.name === parsed.templateName)
    if (!exists) {
      const fallback = approvedTemplates[0]
      return { templateName: fallback.name, languageCode: fallback.language, variables: [] }
    }
    return parsed
  } catch (err) {
    console.error('[AI Template Selector] Failed to parse response:', err)
    const fallback = approvedTemplates[0]
    return { templateName: fallback.name, languageCode: fallback.language, variables: [] }
  }
}

/**
 * generateStrategicScrapeQuery
 * Dynamically picks a novel target industry/niche and location in the Bahamas,
 * avoiding previous queries.
 */
export async function generateStrategicScrapeQuery(history: string[] = []): Promise<string> {
  const aiModel = getModel()
  if (!aiModel) return "Plumbers Nassau"

  const prompt = `You are the lead generation engine for TropiChat, an AI WhatsApp automation tool.
Our target audience is service-based businesses in the Bahamas.

STRATEGY: Island-Hopping Discovery
We need to fill our daily call queue with 20 WhatsApp-verified leads.
Cycle through these islands: Nassau, Freeport, Eleuthera, Exuma, Abaco, Bimini, Harbour Island, Long Island.

PRIORITIZED INDUSTRIES:
1. Tour Operators / Boat Tours / Excursions
2. Car Rentals / Transportation Services
3. Activity Providers (Scuba, Jet Ski, Island Experiences)
4. Event Services (Weddings, Party Planners, DJs, Equipment Rental)

We need a fresh Google Search query to scrape leads.
Past queries used:
${history.length > 0 ? history.map((q) => "- " + q).join("\n") : "None."}

Generate EXACTLY ONE new, highly relevant search query targeting one of the industries AND a specific island from the list above. 
Pick an island that hasn't been targeted recently.
Return ONLY the raw query string — no quotes, no markdown, no explanation.
Examples: "Jet Ski Rentals Nassau", "Boat Tours Exuma", "Wedding Planners Freeport", "Car Rentals Abaco".`

  try {
    const res = await aiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 20,
        temperature: 0.7,
      }
    })
    
    let text = res.response.text() || "Boutiques Nassau"
    text = text.replace(/["']/g, "").trim()
    return text
  } catch (error) {
    console.error("[generateStrategicScrapeQuery] Error:", error)
    return "Contractors Nassau"
  }
}

/**
 * generateAssistantResponse
 * The "Notion AI" for TropiChat.
 * Answers business owner's questions about their data, chats, and strategies.
 */
export async function generateAssistantResponse(params: {
  query: string
  brief: BusinessBrief | null
  dataContext?: string
  history?: ConversationTurn[]
}) {
  const { query, brief, dataContext = "", history = [] } = params
  const ai = getModel()
  if (!ai) return "I'm having trouble connecting to my brain right now. Please try again in a moment."

  const systemPrompt = `
    You are the Tropi AI Sales Assistant. You are talking to the OWNER of the business.
    Your job is to help them manage their business, analyze their customer chats, and grow their sales.
    
    BUSINESS CONTEXT:
    Name: ${brief?.businessType || 'Your Business'}
    Services: ${brief?.services || 'General Services'}
    Goal: ${brief?.aiGoal || 'Growth'}
    
    REAL-TIME DATA CONTEXT:
    ${dataContext || 'No specific conversation data provided for this query.'}
    
    PREVIOUS ASSISTANT CHAT:
    ${history.map(m => `${m.role === 'user' ? 'Owner' : 'Assistant'}: ${m.content}`).join('\n')}
    
    RULES:
    1. Be concise, professional, and strategic.
    2. Use data from the REAL-TIME DATA CONTEXT to answer specifically if available.
    3. If the owner asks to "summarize", focus on customer intent and outcome.
    4. If the owner asks to "draft", write a high-fidelity message they can copy-paste.
    5. Always maintain a "Sales First" mindset.
    6. Return ONLY the markdown response text.
    
    OWNER QUERY: "${query}"
    
    ASSISTANT RESPONSE:
  `

  try {
    const result = await ai.generateContent(systemPrompt)
    return result.response.text().trim()
  } catch (error) {
    console.error("[AI Assistant] Error:", error)
    return "I ran into an error while processing that. Could you try rephrasing?"
  }
}
