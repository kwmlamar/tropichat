# TropiChat Landing Page - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project" (it's free!)
   - Create a new organization and project

2. **Run the Database Schema**
   - In your Supabase dashboard, go to the **SQL Editor** (left sidebar)
   - Click "New Query"
   - Copy the entire contents of `supabase-schema.sql` from this project
   - Paste it into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

   You should see: "Success. No rows returned"

3. **Get Your API Credentials**
   - In your Supabase dashboard, go to **Settings** → **API**
   - Copy the **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy the **anon public** key (the long string under "Project API keys")

### Step 3: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verify Everything Works

1. **Check the Landing Page Loads**
   - You should see the TropiChat hero section with the headline "Stop Losing Customers in WhatsApp Chaos"

2. **Test the Waitlist Form**
   - Scroll down to the green "Join the Waitlist" section
   - Fill in the form with test data:
     - Name: Test User
     - Email: test@example.com
     - Business Type: Restaurant
   - Click "Get Early Access"
   - You should see a success toast notification
   - The form should show a success message with confetti icon

3. **Verify Data in Supabase**
   - Go back to your Supabase dashboard
   - Navigate to **Table Editor** → **waitlist**
   - You should see your test entry in the table

## 🎨 Customization

### Change Brand Colors
All WhatsApp green colors (`#25D366`) can be found and replaced in:
- `components/hero-section.tsx`
- `components/solution-section.tsx`
- `components/waitlist-section.tsx`
- `app/layout.tsx`

### Update Copy
Edit the text directly in each component file:
- `components/hero-section.tsx` - Hero headline and subheadline
- `components/problem-section.tsx` - Pain point descriptions
- `components/solution-section.tsx` - Feature descriptions
- `components/how-it-works-section.tsx` - Process steps
- `components/waitlist-section.tsx` - Form title and incentive

### Add Your Logo
1. Add your logo file to the `public/` folder (e.g., `logo.png`)
2. In `components/hero-section.tsx`, import Next.js Image:
   ```tsx
   import Image from "next/image"
   ```
3. Replace the placeholder with:
   ```tsx
   <Image src="/logo.png" alt="TropiChat" width={200} height={50} />
   ```

## 🚀 Deployment to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial TropiChat landing page"
   git remote add origin https://github.com/yourusername/tropichat.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Add Environment Variables in Vercel**
   - In the deployment settings, find "Environment Variables"
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts and add your environment variables when asked.

## 🔧 Troubleshooting

### "Module not found" errors
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Form not submitting
- Check browser console for errors (F12 → Console tab)
- Verify `.env.local` has correct Supabase credentials
- Make sure you ran the SQL schema in Supabase
- Check Supabase dashboard logs: **Logs** → **API**

### Supabase "relation does not exist" error
- You didn't run the SQL schema yet
- Go to SQL Editor in Supabase and run `supabase-schema.sql`

### Duplicate email error is correct behavior
- The form prevents the same email from signing up twice
- This is working as intended!

### Styling looks broken
- Make sure Tailwind CSS is working
- Clear cache: `rm -rf .next`
- Restart dev server

## 📊 View Your Waitlist Signups

### In Supabase Dashboard
1. Go to **Table Editor** → **waitlist**
2. You'll see all signups with:
   - Name
   - Email
   - Business Type
   - Phone (if provided)
   - Timestamp (created_at)

### Export to CSV
1. In Supabase Table Editor, click the **Download as CSV** button (top right)
2. Open in Excel or Google Sheets

### Query with SQL
```sql
-- Get all signups
SELECT * FROM waitlist ORDER BY created_at DESC;

-- Count by business type
SELECT business_type, COUNT(*) as count
FROM waitlist
GROUP BY business_type;

-- Recent signups (last 24 hours)
SELECT * FROM waitlist
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🎯 Next Steps

Now that your landing page is running:

1. **Add Google Analytics**
   - Get your GA4 tracking ID
   - Add to `app/layout.tsx`

2. **Create Social Share Image**
   - Design a 1200x630px image
   - Add to `public/og-image.png`
   - Update metadata in `app/layout.tsx`

3. **Set Up Email Notifications**
   - Use Supabase database webhooks
   - Send yourself an email when someone joins waitlist
   - Tools: Zapier, Make.com, or Supabase Edge Functions

4. **A/B Test Headlines**
   - Try different headlines in `components/hero-section.tsx`
   - Track which converts better

5. **Add Testimonials**
   - Create a new section component
   - Add real customer quotes

## 🤝 Need Help?

- Email: support@tropichat.com
- Check the main README.md for more details
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)

---

**You're all set! 🎉 Your TropiChat landing page is ready to collect waitlist signups.**
