import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Twilio Inbound SMS Webhook
 * 
 * Processes incoming SMS/WhatsApp messages from Twilio and threads them into Unified Inbox.
 * Twilio sends data as application/x-www-form-urlencoded.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const data = Object.fromEntries(formData.entries()) as Record<string, string>
    
    console.log('[Twilio Webhook] Received:', JSON.stringify(data, null, 2))

    const from = data.From // e.g., +1234567890
    const to = data.To     // Our Twilio number
    const body = data.Body
    const smsSid = data.SmsSid

    if (!from || !to || !body) {
      return new Response('Missing Required Fields', { status: 200 })
    }

    // 1. Identify the connected account (which of our numbers received this?)
    const { data: account, error: accError } = await adminSupabase
      .from('connected_accounts')
      .select('id, user_id')
      .eq('channel_account_id', to)
      .eq('channel_type', 'sms')
      .single()

    if (accError || !account) {
      console.error('[Twilio Webhook] Connected account not found for number:', to)
      return new Response('Account Not Registered', { status: 200 })
    }

    // 2. Identify or create the customer (who sent this?)
    let { data: customer, error: custError } = await adminSupabase
      .from('customers')
      .select('id')
      .eq('phone', from)
      .single()

    if (!customer) {
      const { data: newCustomer, error: createError } = await adminSupabase
        .from('customers')
        .insert({
          phone: from,
          full_name: `SMS User (${from})`,
          channel_type: 'sms'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('[Twilio Webhook] Error creating customer:', createError)
        return new Response('Internal Error', { status: 200 })
      }
      customer = newCustomer as any
    }

    // 3. Find or create the conversation thread
    let { data: conversation, error: convError } = await adminSupabase
      .from('unified_conversations')
      .select('id')
      .eq('customer_id', customer?.id)
      .eq('connected_account_id', account.id)
      .single()

    if (!conversation && customer) {
      const { data: newConv, error: createConvError } = await adminSupabase
        .from('unified_conversations')
        .insert({
          customer_id: customer.id,
          connected_account_id: account.id,
          channel_type: 'sms',
          channel_conversation_id: from,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createConvError) {
        console.error('[Twilio Webhook] Error creating conversation:', createConvError)
        return new Response('Internal Error', { status: 200 })
      }
      conversation = newConv as any
    }

    if (!conversation) {
        return new Response('Failed to Route Conversation', { status: 200 })
    }

    // 4. Persist the message
    const { error: msgError } = await adminSupabase
      .from('unified_messages')
      .insert({
        conversation_id: conversation.id,
        channel_message_id: smsSid || `sms_${Date.now()}`,
        sender_type: 'customer',
        content: body,
        message_type: 'text',
        status: 'received',
        received_at: new Date().toISOString(),
        metadata: {
          twilio_data: data
        }
      })

    if (msgError) {
      console.error('[Twilio Webhook] Message persistence error:', msgError)
      return new Response('Internal Message Error', { status: 200 })
    }

    // 5. Update conversation status
    if (conversation) {
      await adminSupabase
        .from('unified_conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          last_message_preview: (body || '').substring(0, 100),
          unread_count: (conversation as any).unread_count ? (conversation as any).unread_count + 1 : 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id)
    }

    // Twilio expects a TwiML response (even empty)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('[Twilio Webhook] Catch Error:', error)
    return new Response('Internal Server Error', { status: 200 })
  }
}
