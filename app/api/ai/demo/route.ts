import { NextResponse } from "next/server"
import { generateAIDemoReply } from "@/lib/ai"
import type { AIVoiceProfile } from "@/lib/ai"
import type { BusinessBrief } from "@/lib/ai-schema"

/**
 * AI Demo API Route
 * Handles "Test My Agent" simulation requests.
 * Accepts full conversation history for multi-turn conversations.
 * Accepts business_brief for context-grounded responses.
 */
export async function POST(req: Request) {
  try {
    const { message, businessType, services, voiceProfile, history, brief } = await req.json()
    
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 })
    }

    const reply = await generateAIDemoReply({ 
      message, 
      businessType: businessType || "general", 
      services, 
      voiceProfile: voiceProfile as AIVoiceProfile | undefined,
      history: history || [],
      brief: brief as BusinessBrief | null | undefined
    })
    
    return NextResponse.json({ success: true, reply })
  } catch (error) {
    console.error("[AI Demo API] Error:", error)
    return NextResponse.json({ 
      success: true, 
      reply: "Let me check on that for you — what date were you thinking?" 
    })
  }
}
