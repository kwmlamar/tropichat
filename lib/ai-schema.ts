export interface AIVoiceProfile {
  tone: "casual" | "professional" | "direct" | "expressive"
  responseLength: "short" | "medium" | "detailed"
  emojiUsage: "none" | "light" | "heavy"
  greeting: string
  closer: string
  sampleReply: string
  trainedAt: string
  version: number
}

export interface BusinessBrief {
  businessType: string        // "Boutique", "Salon", "Tours", "Restaurant", etc.
  tagline: string             // one-sentence description of what they sell/do
  services: string            // free-text: "Women's cuts $50, Blowout $35, Braids from $80"
  paymentMethods: string[]    // ["Cash", "Zelle", "Card", "Wire"]
  hasDelivery: boolean
  takesBookings: boolean
  bookingMethod: string       // "WhatsApp", "Walk-in", "Online link", "Phone"
  availability: string        // "Usually same week", "Book 24hrs ahead", "Walk-ins welcome"
  aiGoal: "book" | "sell" | "capture" | "faq"  // what the AI should try to do
}

export const DEFAULT_VOICE_PROFILE: AIVoiceProfile = {
  tone: "casual",
  responseLength: "short",
  emojiUsage: "light",
  greeting: "Hey there!",
  closer: "Let me know!",
  sampleReply: "Hey! Thanks for reaching out 😊 We'd love to help. What are you looking for?",
  trainedAt: new Date().toISOString(),
  version: 1
}

export const DEFAULT_BUSINESS_BRIEF: BusinessBrief = {
  businessType: "General Business",
  tagline: "",
  services: "",
  paymentMethods: ["Cash"],
  hasDelivery: false,
  takesBookings: false,
  bookingMethod: "WhatsApp",
  availability: "Available during business hours",
  aiGoal: "capture"
}

/**
 * Extract style signals from a sample reply.
 * No ML. No NLP. Just regex + string logic.
 */
export function extractStyleFromSample(sampleReply: string): Pick<AIVoiceProfile, "emojiUsage" | "greeting"> {
  const emojiRegex = /[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu
  const emojis = sampleReply.match(emojiRegex) || []
  
  const emojiUsage: AIVoiceProfile["emojiUsage"] = 
    emojis.length === 0 ? "none" : emojis.length <= 2 ? "light" : "heavy"
  
  const firstChunk = sampleReply.split(/[.!?\n]/)[0]?.trim() || ""
  const greeting = firstChunk.length < 40 ? firstChunk : ""
  
  return { emojiUsage, greeting }
}
