// webhook-server.js
// Webhook server to receive WhatsApp messages from Twilio
// Usage: node scripts/webhook-server.js

const express = require('express');
const twilio = require('twilio');
require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(express.urlencoded({ extended: false }));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`\n📥 ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('   Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Get credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxxxxxxxxx';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here';
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

// Validate credentials
if (accountSid === 'ACxxxxxxxxxxxxxxxxxxxx' || authToken === 'your_auth_token_here') {
  console.error('❌ Error: Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.local');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Webhook endpoint - Twilio calls this when messages arrive
app.post('/whatsapp/incoming', async (req, res) => {
  const from = req.body.From;           // Who sent the message
  const body = req.body.Body;           // Message text
  const messageId = req.body.MessageSid;
  
  console.log('\n📩 New message received:');
  console.log('   From:', from);
  console.log('   Message:', body);
  console.log('   ID:', messageId);
  
  // Auto-reply example
  try {
    const reply = await client.messages.create({
      from: fromNumber,
      to: from,
      body: `Thanks for your message! You said: "${body}"\n\nThis is TropiChat auto-reply! 🚀`
      // Note: Not setting statusCallback to avoid the "none" URL error
      // If you need status callbacks later, set it to a valid URL
    });
    console.log('✅ Sent auto-reply:', reply.sid);
    console.log('   Status:', reply.status);
  } catch (error) {
    console.error('❌ Error sending reply:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    if (error.moreInfo) {
      console.error('   More Info:', error.moreInfo);
    }
  }
  
  // Always respond with 200 OK to acknowledge receipt
  res.status(200).send('OK');
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('TropiChat Webhook Server is running! 🚀\n\nWebhook URL: /whatsapp/incoming\n\nTimestamp: ' + new Date().toISOString());
});

// Test endpoint to verify webhook is accessible
app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook server is accessible!',
    timestamp: new Date().toISOString(),
    endpoint: '/whatsapp/incoming'
  });
});

// Get port from environment or default to 3001 (3000 is used by Next.js dev server)
const PORT = process.env.WEBHOOK_PORT || 3001;

app.listen(PORT, () => {
  console.log('🚀 TropiChat webhook server running!');
  console.log(`   Port: ${PORT}`);
  console.log(`   Webhook URL: http://localhost:${PORT}/whatsapp/incoming`);
  console.log(`   Health check: http://localhost:${PORT}/`);
  console.log('\n📝 Next steps:');
  console.log(`   1. Use ngrok or similar to expose this server: ngrok http ${PORT}`);
  console.log('   2. Copy the ngrok URL (e.g., https://abc123.ngrok.io)');
  console.log('   3. In Twilio Console → Messaging → Settings → WhatsApp Sandbox');
  console.log('   4. Set "When a message comes in" to: https://abc123.ngrok.io/whatsapp/incoming');
  console.log('\n✅ Ready to receive WhatsApp messages!');
  console.log('   (Press Ctrl+C to stop the server)\n');
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use!`);
    console.error(`   Please stop the other service or use a different port:`);
    console.error(`   WEBHOOK_PORT=3002 pnpm webhook`);
    process.exit(1);
  } else {
    console.error('❌ Error starting server:', error.message);
    process.exit(1);
  }
});
