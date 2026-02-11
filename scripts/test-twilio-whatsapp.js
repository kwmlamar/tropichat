// test-twilio-whatsapp.js
// Test script to send a WhatsApp message via Twilio
// Usage: node scripts/test-twilio-whatsapp.js

const twilio = require('twilio');
require('dotenv').config({ path: '.env.local' });

// Get credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxxxxxxxxx';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here';
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox number
const toNumber = process.env.TWILIO_WHATSAPP_TO || 'whatsapp:+12425551234'; // YOUR phone (replace!)

// Debug: Check if credentials are loaded (show partial values for verification)
console.log('🔍 Checking credentials...');
if (accountSid === 'ACxxxxxxxxxxxxxxxxxxxx' || authToken === 'your_auth_token_here') {
  console.error('\n❌ Error: Credentials not found in .env.local');
  console.error('   Please set the following in .env.local:');
  console.error('   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx');
  console.error('   TWILIO_AUTH_TOKEN=your_auth_token_here');
  console.error('   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 (optional)');
  console.error('   TWILIO_WHATSAPP_TO=whatsapp:+12425551234 (optional)');
  console.error('\n   Get these from: Twilio Console → Account Info');
  process.exit(1);
}

// Show partial credentials for verification (first 4 and last 4 chars)
const maskedSid = accountSid.length > 8 
  ? `${accountSid.substring(0, 4)}...${accountSid.substring(accountSid.length - 4)}`
  : accountSid;
const maskedToken = authToken.length > 8
  ? `${authToken.substring(0, 4)}...${authToken.substring(authToken.length - 4)}`
  : authToken;

console.log(`   Account SID: ${maskedSid}`);
console.log(`   Auth Token: ${maskedToken.length > 0 ? '✓ Set' : '✗ Missing'}`);
console.log('');

const client = twilio(accountSid, authToken);

console.log('📱 Sending WhatsApp message via Twilio...');
console.log(`   From: ${fromNumber}`);
console.log(`   To: ${toNumber}`);

client.messages
  .create({
    from: fromNumber,
    to: toNumber,
    body: '🎉 TropiChat API test successful! I can send messages programmatically.'
  })
  .then(message => {
    console.log('\n✅ Message sent successfully!');
    console.log('   Message SID:', message.sid);
    console.log('   Status:', message.status);
    console.log('   Date Created:', message.dateCreated);
  })
  .catch(error => {
    console.error('\n❌ Error sending message:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    if (error.moreInfo) {
      console.error('   More Info:', error.moreInfo);
    }
    process.exit(1);
  });
