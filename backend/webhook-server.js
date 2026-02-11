/**
 * TropiChat WhatsApp Webhook Server
 *
 * Handles:
 * - Incoming WhatsApp messages from Twilio
 * - Sending messages via Twilio
 * - Message status updates (sent, delivered, read)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

const app = express();

// Middleware
// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Supabase with service key (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Twilio WhatsApp number (sandbox or production)
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clean phone number to consistent format (+1XXXXXXXXXX)
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  // Remove whatsapp: prefix and any non-digit characters except +
  let cleaned = phone.replace('whatsapp:', '').trim();
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * Get or create a contact by phone number
 */
async function getOrCreateContact(phoneNumber, customerId) {
  const cleanedPhone = cleanPhoneNumber(phoneNumber);

  // Try to find existing contact
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('*')
    .eq('phone_number', cleanedPhone)
    .eq('customer_id', customerId)
    .single();

  if (existingContact) {
    console.log('📱 Found existing contact:', existingContact.id);
    return existingContact;
  }

  // Create new contact
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      customer_id: customerId,
      phone_number: cleanedPhone,
      name: null, // Will be updated later if they provide their name
      first_message_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      total_messages_received: 1,
      total_messages_sent: 0
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating contact:', error);
    throw error;
  }

  console.log('✨ Created new contact:', newContact.id);
  return newContact;
}

/**
 * Get or create a conversation between customer and contact
 */
async function getOrCreateConversation(customerId, contactId) {
  // Try to find existing open conversation
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', customerId)
    .eq('contact_id', contactId)
    .in('status', ['open', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingConversation) {
    console.log('💬 Found existing conversation:', existingConversation.id);
    return existingConversation;
  }

  // Create new conversation
  const { data: newConversation, error } = await supabase
    .from('conversations')
    .insert({
      customer_id: customerId,
      contact_id: contactId,
      status: 'open',
      unread_count: 1,
      last_message_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating conversation:', error);
    throw error;
  }

  console.log('✨ Created new conversation:', newConversation.id);
  return newConversation;
}

/**
 * Get the default customer (for MVP - routes all messages to first customer)
 * In production, you'd route based on the Twilio number or other logic
 */
async function getDefaultCustomer() {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .limit(1)
    .single();

  if (error || !customer) {
    console.error('❌ No customer found in database');
    throw new Error('No customer configured');
  }

  return customer;
}

/**
 * Check and execute automation rules
 */
async function checkAutomations(customerId, conversationId, messageBody, isNewConversation) {
  // Get enabled automation rules for this customer
  const { data: automations } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_enabled', true);

  if (!automations || automations.length === 0) return;

  for (const rule of automations) {
    let shouldTrigger = false;

    switch (rule.trigger_type) {
      case 'new_conversation':
        shouldTrigger = isNewConversation;
        break;
      case 'keyword':
        if (rule.trigger_value && messageBody) {
          shouldTrigger = messageBody.toLowerCase().includes(rule.trigger_value.toLowerCase());
        }
        break;
      case 'all_messages':
        shouldTrigger = true;
        break;
      // Add more trigger types as needed
    }

    if (shouldTrigger) {
      console.log('🤖 Automation triggered:', rule.name);

      // Execute action
      if (rule.action_type === 'send_message' && rule.action_value) {
        // Get conversation details to find recipient
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*, contact:contacts(phone_number)')
          .eq('id', conversationId)
          .single();

        if (conversation?.contact?.phone_number) {
          // Send automated message via Twilio
          try {
            const twilioMessage = await twilioClient.messages.create({
              from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
              to: `whatsapp:${conversation.contact.phone_number}`,
              body: rule.action_value
            });

            // Save automated message to database
            await supabase.from('messages').insert({
              conversation_id: conversationId,
              customer_id: customerId,
              twilio_message_sid: twilioMessage.sid,
              direction: 'outbound',
              from_number: TWILIO_WHATSAPP_NUMBER,
              to_number: conversation.contact.phone_number,
              body: rule.action_value,
              status: 'sent',
              is_automated: true,
              automation_rule_id: rule.id,
              sent_at: new Date().toISOString()
            });

            console.log('✅ Automated message sent');
          } catch (err) {
            console.error('❌ Failed to send automated message:', err);
          }
        }
      }

      // Update automation stats
      await supabase
        .from('automation_rules')
        .update({
          times_triggered: (rule.times_triggered || 0) + 1,
          last_triggered_at: new Date().toISOString()
        })
        .eq('id', rule.id);
    }
  }
}

// ============================================
// WEBHOOK ENDPOINTS
// ============================================

/**
 * Health check endpoint
 */
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TropiChat webhook server running',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /whatsapp/incoming
 * Handle incoming WhatsApp messages from Twilio
 */
app.post('/whatsapp/incoming', async (req, res) => {
  console.log('\n📨 ========== INCOMING MESSAGE ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const {
    From,              // e.g., "whatsapp:+12425551234"
    To,                // e.g., "whatsapp:+14155238886"
    Body,              // Message text
    MessageSid,        // Twilio message ID
    NumMedia,          // Number of media attachments
    MediaUrl0,         // First media URL (if any)
    MediaContentType0, // Media type (if any)
    ProfileName        // WhatsApp profile name (if available)
  } = req.body;

  // Clean phone numbers
  const fromNumber = cleanPhoneNumber(From);
  const toNumber = cleanPhoneNumber(To);

  console.log('📱 From:', fromNumber);
  console.log('📱 To:', toNumber);
  console.log('💬 Body:', Body);
  console.log('🆔 MessageSid:', MessageSid);

  try {
    // STEP 1: Get the customer (MVP: use default customer)
    const customer = await getDefaultCustomer();
    console.log('👤 Customer:', customer.business_name, '(', customer.id, ')');

    // STEP 2: Get or create contact
    const contact = await getOrCreateContact(fromNumber, customer.id);

    // Update contact with profile name if available
    if (ProfileName && !contact.name) {
      await supabase
        .from('contacts')
        .update({ name: ProfileName })
        .eq('id', contact.id);
      console.log('📝 Updated contact name:', ProfileName);
    }

    // STEP 3: Get or create conversation
    const isNewConversation = !await supabase
      .from('conversations')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('contact_id', contact.id)
      .in('status', ['open', 'pending'])
      .single()
      .then(r => r.data);

    const conversation = await getOrCreateConversation(customer.id, contact.id);

    // STEP 4: Handle media attachments
    const mediaUrls = [];
    const numMedia = parseInt(NumMedia) || 0;
    for (let i = 0; i < numMedia; i++) {
      const urlKey = `MediaUrl${i}`;
      const typeKey = `MediaContentType${i}`;
      if (req.body[urlKey]) {
        mediaUrls.push({
          url: req.body[urlKey],
          contentType: req.body[typeKey] || 'application/octet-stream'
        });
      }
    }

    // STEP 5: Save message to database
    const messageData = {
      conversation_id: conversation.id,
      customer_id: customer.id,
      twilio_message_sid: MessageSid,
      direction: 'inbound',
      from_number: fromNumber,
      to_number: toNumber,
      body: Body || '',
      status: 'received',
      is_automated: false,
      sent_at: new Date().toISOString(),
      // Store media URLs in metadata if present
      ...(mediaUrls.length > 0 && {
        media_url: mediaUrls[0]?.url,
        media_type: mediaUrls[0]?.contentType?.split('/')[0] // 'image', 'video', 'audio', etc.
      })
    };

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) {
      console.error('❌ Error saving message:', messageError);
      throw messageError;
    }

    console.log('✅ Message saved:', message.id);

    // STEP 6: Update conversation metadata
    const messagePreview = Body ? Body.substring(0, 100) : (mediaUrls.length > 0 ? '[Media]' : '');

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: messagePreview,
        unread_count: conversation.unread_count + 1
      })
      .eq('id', conversation.id);

    // STEP 7: Update contact stats
    await supabase
      .from('contacts')
      .update({
        last_message_at: new Date().toISOString(),
        total_messages_received: (contact.total_messages_received || 0) + 1
      })
      .eq('id', contact.id);

    // STEP 8: Check automations (async - don't wait)
    checkAutomations(customer.id, conversation.id, Body, isNewConversation)
      .catch(err => console.error('Automation error:', err));

    console.log('✅ ========== MESSAGE PROCESSED ==========\n');

    // Always respond 200 to Twilio
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing incoming message:', error);
    // Still respond 200 to prevent Twilio retries
    res.status(200).send('Error logged');
  }
});

/**
 * POST /whatsapp/status
 * Handle message status updates from Twilio
 */
app.post('/whatsapp/status', async (req, res) => {
  console.log('\n📊 ========== STATUS UPDATE ==========');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const {
    MessageSid,
    MessageStatus, // queued, sent, delivered, read, failed, undelivered
    ErrorCode,
    ErrorMessage
  } = req.body;

  console.log('🆔 MessageSid:', MessageSid);
  console.log('📊 Status:', MessageStatus);

  if (ErrorCode) {
    console.error('❌ Error:', ErrorCode, ErrorMessage);
  }

  try {
    // Build update object based on status
    const updateData = {
      status: MessageStatus
    };

    // Add timestamps for specific statuses
    if (MessageStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (MessageStatus === 'read') {
      updateData.read_at = new Date().toISOString();
    } else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      updateData.error_code = ErrorCode;
      updateData.error_message = ErrorMessage;
    }

    // Update message in database
    const { error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('twilio_message_sid', MessageSid);

    if (error) {
      console.error('❌ Error updating message status:', error);
    } else {
      console.log('✅ Status updated successfully');
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing status update:', error);
    res.status(200).send('Error logged');
  }
});

/**
 * POST /api/messages/send
 * Send a WhatsApp message via Twilio
 */
app.post('/api/messages/send', async (req, res) => {
  console.log('\n📤 ========== SENDING MESSAGE ==========');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const {
    customer_id,
    conversation_id,
    to_number,
    body
  } = req.body;

  // Validate required fields
  if (!customer_id || !conversation_id || !to_number || !body) {
    console.error('❌ Missing required fields');
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: customer_id, conversation_id, to_number, body'
    });
  }

  const cleanedToNumber = cleanPhoneNumber(to_number);
  console.log('📱 To:', cleanedToNumber);
  console.log('💬 Body:', body);

  try {
    // STEP 1: Verify conversation belongs to customer
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .eq('customer_id', customer_id)
      .single();

    if (convError || !conversation) {
      console.error('❌ Conversation not found or access denied');
      return res.status(403).json({
        success: false,
        error: 'Conversation not found or access denied'
      });
    }

    // STEP 2: Send via Twilio
    console.log('📤 Sending via Twilio...');
    const twilioMessage = await twilioClient.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${cleanedToNumber}`,
      body: body,
      statusCallback: `${process.env.WEBHOOK_BASE_URL}/whatsapp/status`
    });

    console.log('✅ Twilio message sent:', twilioMessage.sid);

    // STEP 3: Save to database
    const messageData = {
      conversation_id,
      customer_id,
      twilio_message_sid: twilioMessage.sid,
      direction: 'outbound',
      from_number: TWILIO_WHATSAPP_NUMBER,
      to_number: cleanedToNumber,
      body: body,
      status: 'sent',
      is_automated: false,
      sent_at: new Date().toISOString()
    };

    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error saving message to database:', msgError);
      // Message was sent via Twilio but not saved - log this
      return res.status(500).json({
        success: false,
        error: 'Message sent but failed to save to database',
        twilio_sid: twilioMessage.sid
      });
    }

    console.log('✅ Message saved:', message.id);

    // STEP 4: Update conversation metadata
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: body.substring(0, 100),
        // Reset unread count when customer sends a message
        unread_count: 0
      })
      .eq('id', conversation_id);

    // STEP 5: Update contact stats
    const { data: contact } = await supabase
      .from('contacts')
      .select('total_messages_sent')
      .eq('id', conversation.contact_id)
      .single();

    if (contact) {
      await supabase
        .from('contacts')
        .update({
          last_message_at: new Date().toISOString(),
          total_messages_sent: (contact.total_messages_sent || 0) + 1
        })
        .eq('id', conversation.contact_id);
    }

    console.log('✅ ========== MESSAGE SENT ==========\n');

    res.json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
});

/**
 * GET /api/health
 * Detailed health check
 */
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      supabase: 'unknown',
      twilio: 'unknown'
    }
  };

  // Check Supabase
  try {
    const { data, error } = await supabase.from('customers').select('id').limit(1);
    health.services.supabase = error ? 'error' : 'ok';
  } catch (e) {
    health.services.supabase = 'error';
  }

  // Check Twilio
  try {
    await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    health.services.twilio = 'ok';
  } catch (e) {
    health.services.twilio = 'error';
  }

  const allOk = Object.values(health.services).every(s => s === 'ok');
  health.status = allOk ? 'ok' : 'degraded';

  res.status(allOk ? 200 : 503).json(health);
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ==========================================');
  console.log('   TropiChat Webhook Server');
  console.log('==========================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/`);
  console.log('');
  console.log('📥 Endpoints:');
  console.log(`   POST /whatsapp/incoming  - Receive messages`);
  console.log(`   POST /whatsapp/status    - Status updates`);
  console.log(`   POST /api/messages/send  - Send messages`);
  console.log(`   GET  /api/health         - Health check`);
  console.log('');
  console.log('⚙️  Configuration:');
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Supabase Key: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twilio SID:   ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twilio Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   WhatsApp #:   ${TWILIO_WHATSAPP_NUMBER}`);
  console.log('==========================================');
  console.log('');
});
