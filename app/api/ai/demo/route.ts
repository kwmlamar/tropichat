import { NextResponse } from "next/server"
import { generateAIDemoReply } from "@/lib/ai"
import type { AIVoiceProfile } from "@/lib/ai"

/**
 * AI Demo API Route
 * Handles "Test My Agent" simulation requests.
 * Now accepts voiceProfile for styled responses.
 */
export async function POST(req: Request) {
  try {
    const { message, businessType, services, voiceProfile } = await req.json()
    
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 })
    }

    const reply = await generateAIDemoReply({ 
      message, 
      businessType, 
      services, 
      voiceProfile: voiceProfile as AIVoiceProfile | undefined
    })
    
    return NextResponse.json({ success: true, reply })
  } catch (error) {
    console.error("[AI Demo API] Error:", error)
    return NextResponse.json({ 
      success: true, 
      reply: "Hey! Thanks for reaching out. How can I help you today? 😊" 
    })
  }
}
