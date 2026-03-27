import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

const client_id = process.env.GOOGLE_CLIENT_ID
const client_secret = process.env.GOOGLE_CLIENT_SECRET

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch all connected Google accounts
    const { data: accounts, error: accError } = await adminSupabase
      .from('connected_accounts')
      .select('*')
      .eq('channel_type', 'email')
    
    if (accError || !accounts || accounts.length === 0) {
      console.log('[Gmail Sync] No accounts found to sync');
      return NextResponse.json({ message: 'No Google accounts to sync', syncedCount: 0 })
    }

    let totalSynced = 0

    for (const account of accounts) {
      const metadata = account.metadata as any
      const refreshToken = account.refresh_token || metadata?.refresh_token

      if (!refreshToken) {
        console.log(`[Gmail Sync] No refresh token for ${account.channel_account_id}`);
        continue
      }

      // 2. Refresh Access Token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: client_id!,
          client_secret: client_secret!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      const tokens = await tokenRes.json()
      if (!tokens.access_token) {
        console.error(`[Gmail Sync] Token Refresh Failed for ${account.channel_account_id}:`, tokens)
        continue
      }

      // 3. Fetch recent messages (Last 10 for high-fidelity testing)
      const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=label:INBOX', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      })
      const listData = await listRes.json()
      console.log(`[Gmail Sync] RAW LIST for ${account.channel_account_id}:`, JSON.stringify(listData));

      if (!listData.messages || listData.messages.length === 0) {
        console.log(`[Gmail Sync] No messages in list for ${account.channel_account_id}`);
        continue
      }

      for (const msgRef of listData.messages) {
        // 4. Fetch Message Content
        const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`, {
          headers: { Authorization: `Bearer ${tokens.access_token}` }
        })
        const msg = await msgRes.json()
        console.log(`[Gmail Sync] RAW MESSAGE ${msg.id}:`, msg.snippet);
        
        // Skip if already synced (Check metadata for snippet matching or ID)
        const { data: existing } = await adminSupabase
          .from('unified_messages')
          .select('id')
          .eq('channel_message_id', msg.id)
          .maybeSingle()
        
        if (existing) continue

        // 5. Parse High-Fidelity Details
        const headers = msg.payload.headers as any[]
        const fromHeader = headers.find(h => h.name === 'From')?.value || 'Unknown'
        const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject'
        const dateStr = headers.find(h => h.name === 'Date')?.value
        
        // Simple body extraction (Snippet is reliable for HUD preview)
        const bodyContent = msg.snippet || 'No content'

        // 6. Thread into Unified HUD
        // Find existing conversation or create new
        const fromEmailMatch = fromHeader.match(/<([^>]+)>/)
        const senderEmail = fromEmailMatch ? fromEmailMatch[1] : fromHeader
        const senderName = fromHeader.split('<')[0].trim() || senderEmail

        // UPSERT CONVERSATION
        const { data: conversation, error: convError } = await adminSupabase
          .from('unified_conversations')
          .upsert({
            connected_account_id: account.id,
            channel_type: 'email',
            channel_conversation_id: senderEmail, // Thread by email
            customer_name: senderName,
            customer_id: senderEmail,
            last_message_preview: bodyContent,
            last_message_at: new Date(dateStr || Date.now()).toISOString(),
            unread_count: 1 // Lamar will see this update
          }, { onConflict: 'connected_account_id,channel_conversation_id' })
          .select()
          .single()

        console.log(`[Gmail Sync] UPSERTED CONV for ${senderEmail}:`, conversation?.id);

        if (convError || !conversation) {
          console.error('[Gmail Sync] Conversation Error:', convError)
          continue
        }

        // INSERT MESSAGE
        const { error: msgError } = await adminSupabase
          .from('unified_messages')
          .insert({
            conversation_id: conversation.id,
            channel_message_id: msg.id,
            sender_type: 'customer',
            content: bodyContent,
            message_type: 'text',
            sent_at: new Date(dateStr || Date.now()).toISOString(),
            status: 'delivered',
            metadata: {
              subject: subject,
              full_from: fromHeader,
              gmail_id: msg.id,
              thread_id: msg.threadId
            }
          })

        if (msgError) {
          console.error('[Gmail Sync] Message Insert Error:', msgError)
        } else {
          console.log(`[Gmail Sync] SAVED MESSAGE ${msg.id}`);
          totalSynced++
        }

        // 7. Mark as Read on Google? (Optional, let's keep it unread for testing visibility)
        /*
        await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
        })
        */
      }
    }

    return NextResponse.json({ 
      message: 'Gmail synchronization surge complete', 
      syncedCount: totalSynced 
    })
  } catch (err) {
    console.error('[Gmail Sync] Internal Error:', err)
    return NextResponse.json({ error: 'Internal Sync Error' }, { status: 500 })
  }
}
