# TropiChat Backend - WhatsApp Webhook Server

This Express server handles WhatsApp message routing between Twilio and Supabase.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase **service key** (not anon key!) - bypasses RLS
- `TWILIO_ACCOUNT_SID` - From Twilio Console
- `TWILIO_AUTH_TOKEN` - From Twilio Console
- `TWILIO_WHATSAPP_NUMBER` - Your WhatsApp-enabled Twilio number (e.g., +14155238886 for sandbox)
- `WEBHOOK_BASE_URL` - Your ngrok URL (e.g., https://xxxx.ngrok.io)

### 3. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 4. Expose with ngrok

In a separate terminal:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://xxxx-xx-xx.ngrok.io`)

### 5. Configure Twilio Webhooks

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Messaging > Try it out > Send a WhatsApp message**
3. Under **Sandbox Settings**, set:
   - **When a message comes in**: `https://your-ngrok-url.ngrok.io/whatsapp/incoming`
   - **Status callback URL**: `https://your-ngrok-url.ngrok.io/whatsapp/status`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/api/health` | GET | Detailed health check (Supabase + Twilio) |
| `/whatsapp/incoming` | POST | Receive incoming WhatsApp messages |
| `/whatsapp/status` | POST | Receive message status updates |
| `/api/messages/send` | POST | Send a WhatsApp message |

### Send Message API

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "your-customer-uuid",
    "conversation_id": "your-conversation-uuid",
    "to_number": "+12425551234",
    "body": "Hello from TropiChat!"
  }'
```

## Testing

### Test 1: Incoming Message Flow

1. Send a WhatsApp message to your Twilio number from your phone
2. Check server logs - should see "Message saved successfully"
3. Check Supabase dashboard - should see new row in `messages` table
4. Check frontend dashboard - message should appear in real-time

### Test 2: Outgoing Message Flow

1. Open dashboard, select a conversation
2. Type message and click Send
3. Check your phone - should receive WhatsApp message
4. Check Supabase - should see message with `direction='outbound'`
5. Message should appear in dashboard immediately

### Test 3: Status Updates

1. Send message from dashboard
2. Wait a few seconds
3. Check message status in dashboard (should update: sent → delivered)
4. Open message on phone
5. Check dashboard again (should update to: read)

## Troubleshooting

### Messages not appearing in Supabase

1. Check server logs for errors
2. Verify `SUPABASE_SERVICE_KEY` is the service key (not anon key)
3. Check if RLS policies are correct

### Twilio not sending webhooks

1. Verify ngrok is running and URL is correct
2. Check Twilio Console > Monitor > Logs > Messaging for errors
3. Ensure webhook URLs are HTTPS

### Messages not sending

1. Check Twilio Console for account balance
2. Verify phone number is opted into WhatsApp Sandbox
3. Check `TWILIO_AUTH_TOKEN` is correct

## Logs

The server logs detailed information:

```
📨 ========== INCOMING MESSAGE ==========
Timestamp: 2024-01-15T10:30:00.000Z
📱 From: +12425551234
📱 To: +14155238886
💬 Body: Hello!
🆔 MessageSid: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
👤 Customer: My Business (uuid)
✨ Created new contact: uuid
✨ Created new conversation: uuid
✅ Message saved: uuid
✅ ========== MESSAGE PROCESSED ==========
```
