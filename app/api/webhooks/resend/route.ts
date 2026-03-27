import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Resend Inbound Email Webhook
 * 
 * Processes incoming emails and threads them into Unified Inbox.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log('[Resend Webhook] Received:', JSON.stringify(payload, null, 2))

    const { type, data } = payload

    // We only care about received emails
    if (type !== 'email.received') {
      return NextResponse.json({ received: true })
    }

    const { from, to, subject, text, html, last_message_id } = data
    const fromEmail = from.split('<').pop()?.replace('>', '').trim() || from
    const toEmail = to[0] // Primary recipient

    // 1. Identify the connected account (which of our domain emails received this?)
    const { data: account, error: accError } = await adminSupabase
      .from('connected_accounts')
      .select('id, user_id')
      .eq('channel_account_id', toEmail)
      .eq('channel_type', 'email')
      .single()

    if (accError || !account) {
      console.error('[Resend Webhook] Connected account not found for:', toEmail)
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // 2. Identify or create the customer (who sent this?)
    let { data: customer, error: custError } = await adminSupabase
      .from('customers')
      .select('id')
      .eq('email', fromEmail)
      .single()

    if (!customer) {
      const { data: newCustomer, error: createError } = await adminSupabase
        .from('customers')
        .insert({
          email: fromEmail,
          full_name: from.split('<')[0]?.trim() || fromEmail,
          channel_type: 'email'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('[Resend Webhook] Error creating customer:', createError)
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
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
          channel_type: 'email',
          channel_conversation_id: fromEmail,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createConvError) {
        console.error('[Resend Webhook] Error creating conversation:', createConvError)
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      conversation = newConv as any
    }

    if (!conversation) {
        return NextResponse.json({ error: 'Failed to identify conversation' }, { status: 500 })
    }

    // 4. Persist the message
    const { error: msgError } = await adminSupabase
      .from('unified_messages')
      .insert({
        conversation_id: conversation.id,
        channel_message_id: last_message_id || `email_${Date.now()}`,
        sender_type: 'customer',
        content: text || html || '',
        message_type: 'text',
        status: 'received',
        received_at: new Date().toISOString(),
        metadata: {
          subject,
          is_html: !!html,
          from_full: from,
          to_full: to
        }
      })

    if (msgError) {
      console.error('[Resend Webhook] Message persistence error:', msgError)
      return NextResponse.json({ error: 'Failed to persist message' }, { status: 500 })
    }

    // 5. Update conversation status
    await adminSupabase
      .from('unified_conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        last_message_preview: (text || html || '').substring(0, 100),
        unread_count: (conversation as any).unread_count ? (conversation as any).unread_count + 1 : 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    return NextResponse.json({ success: true, conversation_id: conversation.id })
  } catch (error) {
    console.error('[Resend Webhook] Internal Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
