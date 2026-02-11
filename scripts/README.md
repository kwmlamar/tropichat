# Test Scripts

## Twilio WhatsApp Test

Test script to send WhatsApp messages via Twilio.

### Setup

1. Add your Twilio credentials to `.env.local`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+12425551234
```

2. Get your credentials from:
   - Twilio Console → Account Info → Account SID and Auth Token
   - The WhatsApp sandbox number is usually `whatsapp:+14155238886`
   - Your phone number should be in E.164 format: `whatsapp:+[country code][number]`

### Usage

Run the test script:

```bash
pnpm test:twilio
```

Or directly:

```bash
node scripts/test-twilio-whatsapp.js
```

### Notes

- Make sure your phone number is registered with the Twilio WhatsApp sandbox
- The sandbox number can only send to registered numbers
- For production, you'll need to get a Twilio WhatsApp Business number

---

## Webhook Server

Webhook server to receive incoming WhatsApp messages from Twilio.

### Setup

1. Make sure your `.env.local` has the Twilio credentials (same as above)

2. Install ngrok (for local testing):
   ```bash
   brew install ngrok  # Mac
   # or download from https://ngrok.com/
   ```

### Usage

1. **Start the webhook server:**
   ```bash
   pnpm webhook
   ```
   Or directly:
   ```bash
   node scripts/webhook-server.js
   ```

2. **In another terminal, expose it with ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the ngrok HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Configure Twilio:**
   - Go to Twilio Console → Messaging → Settings → WhatsApp Sandbox
   - Set "When a message comes in" to: `https://abc123.ngrok.io/whatsapp/incoming`
   - Save

5. **Test it:**
   - Send a WhatsApp message to your Twilio sandbox number
   - You should see the message in the webhook server console
   - The server will auto-reply

### Endpoints

- `POST /whatsapp/incoming` - Webhook endpoint for Twilio
- `GET /` - Health check endpoint

### Notes

- The server runs on port 3000 by default (or set `WEBHOOK_PORT` in `.env.local`)
- For production, deploy this server and use your production URL instead of ngrok
- The server auto-replies to all incoming messages (customize the logic in `webhook-server.js`)
