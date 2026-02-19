# Meta App Review - Demo Setup & Testing Guide

## Quick Setup for Demo Recording

### 1. Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Meta Platform
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_webhook_token
NEXT_PUBLIC_APP_URL=http://localhost:3000

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
```

### 2. Database Setup

Run these in order in the Supabase SQL Editor:

1. Run migration: `supabase/migrations/20250220_business_profiles_and_seed.sql`
2. Edit `supabase/seed-demo-data.sql`:
   - Replace all `USER_ID_HERE` with your test user's UUID
3. Run the seed data SQL

### 3. Start the App

```bash
npm install
npm run dev
```

### 4. Test Credentials

- **Email**: your test user email
- **Password**: your test user password
- **URL**: http://localhost:3000/login

---

## Demo Video Recording Checklist

### Demo 1: Login & Dashboard (30 sec)

- [ ] Navigate to http://localhost:3000/login
- [ ] Enter test email and password
- [ ] Click "Sign In" - redirects to dashboard
- [ ] Show Overview Dashboard at /dashboard/overview
  - Connected channels with Active/Disconnected status
  - Total conversations count
  - Unread messages count
  - Quick action cards

### Demo 2: Unified Inbox (30 sec)

- [ ] Navigate to /dashboard (Inbox)
- [ ] Show conversation list with all 3 channels visible
- [ ] Point out channel icons on each conversation:
  - Green circle = WhatsApp
  - Pink/purple circle = Instagram
  - Blue circle = Messenger
- [ ] Show customer names and profile pictures
- [ ] Show last message preview and timestamps
- [ ] Show unread count badges
- [ ] Use channel filter buttons (All, WhatsApp, Instagram, Messenger)
- [ ] Click a conversation to open it

### Demo 3: Send Message (45 sec)

- [ ] Open a WhatsApp conversation (e.g., Maria Rodriguez)
- [ ] Show the message thread with bubble styling
  - Customer messages: left, gray bubbles
  - Business messages: right, teal bubbles
- [ ] Show timestamps and delivery status icons
- [ ] Type a message in the compose box
- [ ] Click Send button
- [ ] Message appears with "sending" clock icon
- [ ] Status updates to "sent" checkmark

### Demo 4: Receive Message (45 sec)

- [ ] Show inbox with conversations
- [ ] (Trigger a test webhook or use Supabase to insert a message)
- [ ] New message appears in real-time
- [ ] Unread badge updates on the conversation
- [ ] Click to view the new message

### Demo 5: WhatsApp Features (90 sec)

**Message Templates:**
- [ ] Navigate to /dashboard/templates (sidebar: "Templates")
- [ ] Show template list with:
  - Template names
  - Status badges (Approved/Pending/Rejected)
  - Category and language
  - Template body text preview
- [ ] Click "Create Template" button
- [ ] Show template creation modal
- [ ] Fill in template name, category, body with {{1}} variables
- [ ] Show preview
- [ ] Click "Submit to Meta"

**Business Profile:**
- [ ] Navigate to /dashboard/settings?tab=whatsapp (Settings > "WhatsApp Profile" tab)
- [ ] Show "Connected" badge
- [ ] Show pre-filled form fields:
  - Business Name: Simply Dave Nassau Tours
  - Description, Category, Address, Hours
  - Phone, Email, Website
- [ ] Edit a field (e.g., update business hours)
- [ ] Click "Save Changes"
- [ ] Show success confirmation

### Demo 6: Instagram Account (30 sec)

- [ ] Navigate to /dashboard/settings?tab=integrations
- [ ] Scroll to "Connected Account Details"
- [ ] Show Instagram account card:
  - Instagram gradient avatar
  - Username: @simplydavenassau
  - Badge: "Instagram Business Account"
  - Account ID (partially visible)
  - Follower count
  - Green "Connected" checkmark

### Demo 7: Page Selection (45 sec)

- [ ] Navigate to /dashboard/page-selection (sidebar: "Page Selection")
- [ ] Show list of Facebook Pages:
  - Page profile pictures
  - Page names and categories
  - Follower counts
  - Currently connected badge
- [ ] Click a different Page (radio selection)
- [ ] Click "Connect Selected Page"
- [ ] Show connection confirmation

### Demo 8: Human Agent (60 sec)

- [ ] Open Lisa Brown's Messenger conversation (has Human Agent enabled)
- [ ] Show amber "Human Agent Mode" banner at top
  - Shows "X days remaining" countdown
  - Shows reason text
- [ ] Show Human Agent badge in conversation list
- [ ] Click the person icon to show toggle panel
- [ ] Show "Enable Human Agent Response" UI
- [ ] Type a message and send
- [ ] Show amber-colored sent message with "Human Agent" tag
- [ ] Show success toast: "Sent with Human Agent tag (7-day window)"

**For a conversation WITHOUT Human Agent:**
- [ ] Open a different conversation
- [ ] Click the Human Agent toggle button
- [ ] Show the setup panel with optional reason field
- [ ] Enter reason: "Complex inquiry requiring coordination"
- [ ] Click "Enable Human Agent Mode"
- [ ] Show banner appears with countdown

### Demo 9: Customer Profiles (30 sec)

- [ ] Open a conversation
- [ ] Show customer profile sidebar (right panel):
  - Large profile picture
  - Customer name
  - Channel type icon and label
  - Customer ID (phone/PSID/IG ID)
  - Connected Account name
  - Statistics: First Message date, Message count
- [ ] Show conversation list with customer names and pictures

### Demo 10: Webhook Status (15 sec)

- [ ] Navigate to /dashboard/settings?tab=integrations
- [ ] Scroll to "Webhook Subscriptions" section
- [ ] Show:
  - Green "Active" status indicator
  - Subscribed events list
  - Webhook URL
  - Verification status: "Verified"
  - Last webhook received timestamp

---

## Permission-to-Feature Mapping

| Permission | Where to Demo | Feature Shown |
|------------|---------------|---------------|
| whatsapp_business_messaging | Inbox: Send/receive WhatsApp messages | Send message, receive message, delivery status |
| whatsapp_business_management | Templates page + Settings > WhatsApp Profile tab | Template CRUD, profile management |
| instagram_manage_messages | Inbox: Send/receive Instagram DMs | Send/receive IG messages |
| instagram_basic | Settings > Integrations | IG account display with username, ID, followers |
| pages_messaging | Inbox: Send/receive Messenger messages | Send/receive FB messages |
| pages_read_engagement | Settings > Integrations | Page details, follower count |
| pages_show_list | Page Selection page | List of managed Pages with selection |
| pages_manage_metadata | Settings > Webhooks section | Webhook subscription status |
| Business Asset User Profile Access | Contact details sidebar + conversation list | Customer names, pictures, IDs |
| Human Agent | Conversation view toggle + banner | Toggle, 7-day window, message tagging |
| public_profile | Settings > Connected Account Details | Account names, profile info |

---

## Troubleshooting

### No conversations showing?
1. Make sure seed data SQL was run with correct USER_ID
2. Check Supabase tables: `connected_accounts`, `unified_conversations`, `unified_messages`

### Templates page shows "WhatsApp Not Connected"?
1. Ensure seed data includes `meta_connections` row for whatsapp
2. Check `connected_accounts` has whatsapp with `is_active = true`

### Login not working?
1. Create a test user at /signup first
2. Copy the auth.users UUID for seed data

### Business Profile not loading?
1. Run the `20250220_business_profiles_and_seed.sql` migration
2. Run seed data SQL to populate business_profiles table
