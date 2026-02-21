-- ============================================================================
-- SEED DATA FOR META APP REVIEW DEMO VIDEOS
-- ============================================================================
-- Run this AFTER signing up a test user and connecting Meta accounts.
-- Replace USER_ID_HERE with the actual auth.users UUID from Supabase.
--
-- Usage:
--   1. Sign up at /signup with test credentials
--   2. Copy the user's UUID from Supabase Auth dashboard
--   3. Replace all occurrences of USER_ID_HERE below
--   4. Run this SQL in the Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Connected Accounts (WhatsApp, Instagram, Messenger)
-- ============================================================================

INSERT INTO connected_accounts (
  id, user_id, channel_type, access_token, channel_account_id,
  channel_account_name, metadata, is_active
) VALUES
-- WhatsApp Business Account
(
  'a0000000-0000-4000-a000-000000000001',
  'USER_ID_HERE',
  'whatsapp',
  'DEMO_ACCESS_TOKEN_WA',
  '100000000000001',
  'Simply Dave Nassau Tours',
  '{"phone_display": "+1 (242) 555-0199", "waba_id": "100000000000099", "phone_number_id": "100000000000001", "verified_name": "Simply Dave Nassau Tours"}'::jsonb,
  true
),
-- Instagram Business Account
(
  'a0000000-0000-4000-a000-000000000002',
  'USER_ID_HERE',
  'instagram',
  'DEMO_ACCESS_TOKEN_IG',
  '17841405309211844',
  'Simply Dave Nassau Tours',
  '{"ig_username": "@simplydavenassau", "account_type": "Instagram Business Account", "follower_count": 2847, "ig_user_id": "17841405309211844", "profile_picture_url": "https://ui-avatars.com/api/?name=SD&background=E4405F&color=fff&size=200"}'::jsonb,
  true
),
-- Facebook Messenger Page
(
  'a0000000-0000-4000-a000-000000000003',
  'USER_ID_HERE',
  'messenger',
  'DEMO_ACCESS_TOKEN_FB',
  '200000000000001',
  'Simply Dave Nassau Tours',
  '{"page_name": "Simply Dave Nassau Tours", "page_category": "Tour Operator", "follower_count": 1247, "page_id": "200000000000001", "profile_picture_url": "https://ui-avatars.com/api/?name=SD&background=0084FF&color=fff&size=200"}'::jsonb,
  true
)
ON CONFLICT (channel_type, channel_account_id) DO UPDATE
SET
  access_token = EXCLUDED.access_token,
  channel_account_name = EXCLUDED.channel_account_name,
  metadata = EXCLUDED.metadata,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- STEP 2: Meta Connections (token storage)
-- ============================================================================

INSERT INTO meta_connections (
  user_id, channel, access_token, account_id, account_name,
  metadata, scopes, is_active
) VALUES
(
  'USER_ID_HERE',
  'whatsapp',
  'DEMO_ACCESS_TOKEN_WA',
  '100000000000099',
  'Simply Dave Nassau Tours',
  '{"phone_number_id": "100000000000001", "phone_display": "+1 (242) 555-0199", "verified_name": "Simply Dave Nassau Tours"}'::jsonb,
  ARRAY['whatsapp_business_management', 'whatsapp_business_messaging'],
  true
),
(
  'USER_ID_HERE',
  'instagram',
  'DEMO_ACCESS_TOKEN_IG',
  '17841405309211844',
  'Simply Dave Nassau Tours',
  '{"ig_username": "@simplydavenassau", "account_type": "Instagram Business Account", "follower_count": 2847}'::jsonb,
  ARRAY['instagram_basic', 'instagram_manage_messages'],
  true
),
(
  'USER_ID_HERE',
  'messenger',
  'DEMO_ACCESS_TOKEN_FB',
  '200000000000001',
  'Simply Dave Nassau Tours',
  '{"page_name": "Simply Dave Nassau Tours", "page_category": "Tour Operator", "follower_count": 1247}'::jsonb,
  ARRAY['pages_messaging', 'pages_manage_metadata', 'pages_read_engagement', 'pages_show_list'],
  true
)
ON CONFLICT (user_id, channel) DO UPDATE
SET
  access_token = EXCLUDED.access_token,
  account_id = EXCLUDED.account_id,
  account_name = EXCLUDED.account_name,
  metadata = EXCLUDED.metadata,
  scopes = EXCLUDED.scopes,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- STEP 3: Business Profile (WhatsApp)
-- ============================================================================

INSERT INTO business_profiles (
  connected_account_id,
  business_name,
  business_description,
  business_category,
  website_url,
  business_address,
  business_hours,
  contact_phone,
  contact_email,
  profile_picture_url
) VALUES (
  'a0000000-0000-4000-a000-000000000001',
  'Simply Dave Nassau Tours',
  'Premier boat tours and water sports in Nassau, Bahamas. Experience crystal-clear waters, vibrant coral reefs, and unforgettable sunset cruises.',
  'Tour Operator',
  'www.simplydavenassau.com',
  'Paradise Island, Nassau, Bahamas',
  'Monday-Saturday 8:00 AM - 6:00 PM, Sunday Closed',
  '+1-242-555-0199',
  'info@simplydavenassau.com',
  NULL
)
ON CONFLICT (connected_account_id) DO UPDATE
SET
  business_name = EXCLUDED.business_name,
  business_description = EXCLUDED.business_description,
  business_category = EXCLUDED.business_category,
  website_url = EXCLUDED.website_url,
  business_address = EXCLUDED.business_address,
  business_hours = EXCLUDED.business_hours,
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email;

-- ============================================================================
-- STEP 4: Sample Conversations
-- ============================================================================

-- WhatsApp Conversations
INSERT INTO unified_conversations (
  id, connected_account_id, channel_type, channel_conversation_id,
  customer_name, customer_avatar_url, customer_id,
  last_message_at, last_message_preview, unread_count,
  human_agent_enabled, human_agent_reason, human_agent_marked_at
) VALUES
(
  'b0000000-0000-4000-a000-000000000001',
  'a0000000-0000-4000-a000-000000000001',
  'whatsapp',
  'wa_conv_maria_rodriguez',
  'Maria Rodriguez',
  'https://ui-avatars.com/api/?name=Maria+Rodriguez&background=25D366&color=fff&size=200',
  '+12425550123',
  NOW() - INTERVAL '12 minutes',
  'Hi! Do you have tours available for 6 people on Saturday?',
  2,
  false, NULL, NULL
),
(
  'b0000000-0000-4000-a000-000000000002',
  'a0000000-0000-4000-a000-000000000001',
  'whatsapp',
  'wa_conv_john_smith',
  'John Smith',
  'https://ui-avatars.com/api/?name=John+Smith&background=4CAF50&color=fff&size=200',
  '+12425550456',
  NOW() - INTERVAL '2 hours',
  'What time do sunset cruises depart?',
  1,
  false, NULL, NULL
),

-- Instagram Conversations
(
  'b0000000-0000-4000-a000-000000000003',
  'a0000000-0000-4000-a000-000000000002',
  'instagram',
  'ig_conv_sarah_johnson',
  'Sarah Johnson',
  'https://ui-avatars.com/api/?name=Sarah+Johnson&background=C13584&color=fff&size=200',
  '17841400000000001',
  NOW() - INTERVAL '45 minutes',
  'Do you offer snorkeling tours? What are prices for 2 people?',
  1,
  false, NULL, NULL
),
(
  'b0000000-0000-4000-a000-000000000004',
  'a0000000-0000-4000-a000-000000000002',
  'instagram',
  'ig_conv_mike_williams',
  'Mike Williams',
  'https://ui-avatars.com/api/?name=Mike+Williams&background=833AB4&color=fff&size=200',
  '17841400000000002',
  NOW() - INTERVAL '4 hours',
  'Are you open tomorrow?',
  0,
  false, NULL, NULL
),

-- Messenger Conversations
(
  'b0000000-0000-4000-a000-000000000005',
  'a0000000-0000-4000-a000-000000000003',
  'messenger',
  'fb_conv_lisa_brown',
  'Lisa Brown',
  'https://ui-avatars.com/api/?name=Lisa+Brown&background=0084FF&color=fff&size=200',
  '300000000000001',
  NOW() - INTERVAL '30 minutes',
  'I''m interested in booking a sunset cruise for 4 people this Saturday. What''s your availability and pricing?',
  3,
  true,
  'Complex booking requiring coordination with boat captain and catering',
  NOW() - INTERVAL '25 minutes'
),
(
  'b0000000-0000-4000-a000-000000000006',
  'a0000000-0000-4000-a000-000000000003',
  'messenger',
  'fb_conv_david_chen',
  'David Chen',
  'https://ui-avatars.com/api/?name=David+Chen&background=1877F2&color=fff&size=200',
  '300000000000002',
  NOW() - INTERVAL '6 hours',
  'Do you have vegetarian options for catering?',
  0,
  false, NULL, NULL
),

-- Extra conversations for volume
(
  'b0000000-0000-4000-a000-000000000007',
  'a0000000-0000-4000-a000-000000000001',
  'whatsapp',
  'wa_conv_emma_thompson',
  'Emma Thompson',
  'https://ui-avatars.com/api/?name=Emma+Thompson&background=2E7D32&color=fff&size=200',
  '+12425550789',
  NOW() - INTERVAL '1 day',
  'Thanks for the amazing tour yesterday! Can we book again for next week?',
  0,
  false, NULL, NULL
),
(
  'b0000000-0000-4000-a000-000000000008',
  'a0000000-0000-4000-a000-000000000002',
  'instagram',
  'ig_conv_alex_rivera',
  'Alex Rivera',
  'https://ui-avatars.com/api/?name=Alex+Rivera&background=E91E63&color=fff&size=200',
  '17841400000000003',
  NOW() - INTERVAL '3 days',
  'Your sunset cruise photos look incredible! How far in advance should we book?',
  0,
  false, NULL, NULL
)
ON CONFLICT (connected_account_id, channel_conversation_id) DO UPDATE
SET
  customer_name = EXCLUDED.customer_name,
  customer_avatar_url = EXCLUDED.customer_avatar_url,
  last_message_at = EXCLUDED.last_message_at,
  last_message_preview = EXCLUDED.last_message_preview,
  unread_count = EXCLUDED.unread_count,
  human_agent_enabled = EXCLUDED.human_agent_enabled,
  human_agent_reason = EXCLUDED.human_agent_reason,
  human_agent_marked_at = EXCLUDED.human_agent_marked_at;

-- ============================================================================
-- STEP 5: Sample Messages for each conversation
-- ============================================================================

-- Maria Rodriguez (WhatsApp) - active inquiry
INSERT INTO unified_messages (conversation_id, channel_message_id, sender_type, content, message_type, sent_at, status) VALUES
('b0000000-0000-4000-a000-000000000001', 'wamid_001', 'customer', 'Hello! I found you on Google. We''re a group of 6 visiting Nassau next Saturday.', 'text', NOW() - INTERVAL '15 minutes', 'read'),
('b0000000-0000-4000-a000-000000000001', 'wamid_002', 'business', 'Welcome! We''d love to have your group. Saturday is a great day for tours. What kind of experience are you looking for?', 'text', NOW() - INTERVAL '14 minutes', 'delivered'),
('b0000000-0000-4000-a000-000000000001', 'wamid_003', 'customer', 'We''d love a snorkeling trip and maybe a sunset cruise if possible.', 'text', NOW() - INTERVAL '13 minutes', 'read'),
('b0000000-0000-4000-a000-000000000001', 'wamid_004', 'business', 'Perfect! Our snorkeling tour is $85 per person and includes all equipment. The sunset cruise is $100 per person with complimentary drinks.', 'text', NOW() - INTERVAL '13 minutes', 'delivered'),
('b0000000-0000-4000-a000-000000000001', 'wamid_005', 'customer', 'Hi! Do you have tours available for 6 people on Saturday?', 'text', NOW() - INTERVAL '12 minutes', 'delivered');

-- John Smith (WhatsApp) - quick question
INSERT INTO unified_messages (conversation_id, channel_message_id, sender_type, content, message_type, sent_at, status) VALUES
('b0000000-0000-4000-a000-000000000002', 'wamid_010', 'customer', 'Hey, quick question - what time do your sunset cruises usually leave?', 'text', NOW() - INTERVAL '2 hours', 'read'),
('b0000000-0000-4000-a000-000000000002', 'wamid_011', 'business', 'Hi John! Our sunset cruises depart at 5:00 PM and return around 7:30 PM. We recommend arriving 15 minutes early.', 'text', NOW() - INTERVAL '1 hour 55 minutes', 'delivered'),
('b0000000-0000-4000-a000-000000000002', 'wamid_012', 'customer', 'What time do sunset cruises depart?', 'text', NOW() - INTERVAL '2 hours', 'delivered');

-- Sarah Johnson (Instagram) - pricing inquiry
INSERT INTO unified_messages (conversation_id, channel_message_id, sender_type, content, message_type, sent_at, status) VALUES
('b0000000-0000-4000-a000-000000000003', 'igmid_001', 'customer', 'Hey! I saw your snorkeling photos on IG - they look amazing!', 'text', NOW() - INTERVAL '50 minutes', 'read'),
('b0000000-0000-4000-a000-000000000003', 'igmid_002', 'business', 'Thank you Sarah! We love sharing the beauty of Nassau''s reefs. Are you planning a visit?', 'text', NOW() - INTERVAL '48 minutes', 'read'),
('b0000000-0000-4000-a000-000000000003', 'igmid_003', 'customer', 'Yes! My boyfriend and I are coming in March. Do you offer snorkeling tours? What are prices for 2 people?', 'text', NOW() - INTERVAL '45 minutes', 'delivered');

-- Mike Williams (Instagram) - resolved inquiry
INSERT INTO unified_messages (conversation_id, channel_message_id, sender_type, content, message_type, sent_at, status) VALUES
('b0000000-0000-4000-a000-000000000004', 'igmid_010', 'customer', 'Are you open tomorrow?', 'text', NOW() - INTERVAL '4 hours', 'read'),
('b0000000-0000-4000-a000-000000000004', 'igmid_011', 'business', 'Hi Mike! Yes, we''re open Monday through Saturday, 8 AM to 6 PM. Tomorrow we have several tours available. Would you like to see our schedule?', 'text', NOW() - INTERVAL '3 hours 50 minutes', 'read'),
('b0000000-0000-4000-a000-000000000004', 'igmid_012', 'customer', 'That''s great, I''ll check the schedule online. Thanks!', 'text', NOW() - INTERVAL '3 hours 45 minutes', 'read');

-- Lisa Brown (Messenger) - complex booking with Human Agent
INSERT INTO unified_messages (conversation_id, channel_message_id, sender_type, content, message_type, sent_at, status, metadata) VALUES
('b0000000-0000-4000-a000-000000000005', 'fbmid_001', 'customer', 'Hi there! I''m planning a special birthday celebration and would love to book a sunset cruise.', 'text', NOW() - INTERVAL '35 minutes', 'read', '{}'),
('b0000000-0000-4000-a000-000000000005', 'fbmid_002', 'business', 'Happy upcoming birthday! A sunset cruise is a wonderful way to celebrate. How many guests are you expecting?', 'text', NOW() - INTERVAL '33 minutes', 'read', '{}'),
('b0000000-0000-4000-a000-000000000005', 'fbmid_003', 'customer', 'There will be 4 of us. We''d also love to have some food and drinks. Do you offer any catering options?', 'text', NOW() - INTERVAL '32 minutes', 'read', '{}'),
('b0000000-0000-4000-a000-000000000005', 'fbmid_004', 'business', 'We do! Let me check with our catering partner for Saturday availability. I''ll enable extended response mode so I can get back to you with full details.', 'text', NOW() - INTERVAL '30 minutes', 'delivered', '{"human_agent_tag": true}'),
('b0000000-0000-4000-a000-000000000005', 'fbmid_005', 'customer', 'I''m interested in booking a sunset cruise for 4 people this Saturday. What''s your availability and pricing?', 'text', NOW() - INTERVAL '30 minutes', 'delivered', '{}');

-- David Chen (Messenger) - catering question
INSERT INTO unified_messages (conversation_id, channel_message_id, sender_type, content, message_type, sent_at, status) VALUES
('b0000000-0000-4000-a000-000000000006', 'fbmid_010', 'customer', 'Hi! I have a dietary restriction question.', 'text', NOW() - INTERVAL '6 hours', 'read'),
('b0000000-0000-4000-a000-000000000006', 'fbmid_011', 'business', 'Of course! We''re happy to accommodate dietary needs. What can we help with?', 'text', NOW() - INTERVAL '5 hours 55 minutes', 'read'),
('b0000000-0000-4000-a000-000000000006', 'fbmid_012', 'customer', 'Do you have vegetarian options for catering?', 'text', NOW() - INTERVAL '6 hours', 'read'),
('b0000000-0000-4000-a000-000000000006', 'fbmid_013', 'business', 'Absolutely! Our catering menu includes vegetarian platters with fresh tropical fruits, grilled vegetables, and rice dishes. We can also do vegan options on request.', 'text', NOW() - INTERVAL '5 hours 45 minutes', 'read');

-- Emma Thompson (WhatsApp) - returning customer
INSERT INTO unified_messages (conversation_id, channel_message_id, sender_type, content, message_type, sent_at, status) VALUES
('b0000000-0000-4000-a000-000000000007', 'wamid_020', 'customer', 'We had the BEST time on the snorkeling tour yesterday! The kids loved it.', 'text', NOW() - INTERVAL '1 day', 'read'),
('b0000000-0000-4000-a000-000000000007', 'wamid_021', 'business', 'That makes us so happy to hear, Emma! Your kids were naturals in the water. We''d love to see you again!', 'text', NOW() - INTERVAL '23 hours', 'read'),
('b0000000-0000-4000-a000-000000000007', 'wamid_022', 'customer', 'Thanks for the amazing tour yesterday! Can we book again for next week?', 'text', NOW() - INTERVAL '1 day', 'read');

-- Alex Rivera (Instagram) - advance booking
INSERT INTO unified_messages (conversation_id, channel_message_id, sender_type, content, message_type, sent_at, status) VALUES
('b0000000-0000-4000-a000-000000000008', 'igmid_020', 'customer', 'Your sunset cruise photos look incredible! How far in advance should we book?', 'text', NOW() - INTERVAL '3 days', 'read'),
('b0000000-0000-4000-a000-000000000008', 'igmid_021', 'business', 'Thank you Alex! For peak season (December-April), we recommend booking at least 2 weeks in advance. When are you planning to visit?', 'text', NOW() - INTERVAL '2 days 23 hours', 'read'),
('b0000000-0000-4000-a000-000000000008', 'igmid_022', 'customer', 'We''re looking at mid-March. I''ll book soon!', 'text', NOW() - INTERVAL '2 days 22 hours', 'read');

-- ============================================================================
-- DONE! Your demo data is ready.
-- ============================================================================
