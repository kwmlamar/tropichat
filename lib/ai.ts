import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

/**
 * Sovereign AI Auto-Pilot Engine
 * 
 * Processes incoming messages and generates high-fidelity,
 * context-aware responses tailored for the Caribbean business market.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock_key'
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

export async function processInboundWithAI(conversationId: string, incomingMessage: string) {
  try {
    // 1. Fetch conversation context (prospect info, channel, history)
    const { data: conversation, error: convError } = await adminSupabase
      .from('unified_conversations')
      .select(`
        id, channel_type,
        customer:customers(full_name, email, phone, metadata),
        messages:unified_messages(content, sender_type, created_at)
      `)
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      console.error('[AI Pilot] Context recovery failed:', convError)
      return null
    }

    // 2. Synthesize Context
    const history = (conversation.messages as any[]) || []
    const lastFewMessages = history.slice(-5).map(m => 
      `${m.sender_type === 'business' ? 'TropiChat' : 'Prospect'}: ${m.content}`
    ).join('\n')

    const customerName = (conversation.customer as any)?.full_name || 'Prospect'
    
    // 3. System Prompt - TropiChat Brand Identity
    const systemPrompt = `
      You are TropiChat AI, a powerful business intelligence and communication assistant for TropiTech Solutions.
      Your mission is to help Caribbean businesses scale through omni-channel automation.
      
      TONE: Professional, visionary, friendly, and strategic.
      CONTEXT: You are responding to a prospect named ${customerName} on ${conversation.channel_type}.
      GOAL: Guide them towards connecting their business or upgrading their communication workflow.
      
      CONVERSATION HISTORY:
      ${lastFewMessages}
      
      NEW MESSAGE FROM PROSPECT:
      "${incomingMessage}"
      
      OBJECTIVE: Provide a concise, helpful response (under 3 sentences if possible).
      If they ask about pricing: Mention the $29/mo Founder's Rate for Pro.
    `

    // 4. Generate Response (Mock check first)
    if (!process.env.OPENAI_API_KEY) {
      console.log('[AI Pilot] Mock Mode: No API Key. Returning default response.')
      return `Hey ${customerName}! Thanks for reaching out. I've received your message about "${incomingMessage.slice(0, 20)}..." and our team (or my AI core) will get back to you in just a moment. Would you like to see our Pro features in the meantime?`
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: incomingMessage }
      ],
      max_tokens: 150,
      temperature: 0.7
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('[AI Pilot] Error:', error)
    return null
  }
}

/**
 * Dispatch AI Response
 * 
 * Sends the generated response back through the originating channel.
 */
export async function dispatchAIResponse(conversationId: string, aiContent: string) {
    // This will hit our existing /api/messages/send logic via internal fetch or direct lib call
    // For now, we'll use a direct internal import or fetch call to /api/messages/send
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
    
    // Using service role for internal dispatch bypass
    const response = await fetch(`${baseUrl}/api/messages/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
            conversation_id: conversationId,
            content: aiContent,
            message_type: 'text'
        })
    })

    return response.json()
}
