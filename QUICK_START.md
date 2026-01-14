# TropiChat - Quick Start Card 🚀

## ⚡ Get Running in 3 Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure Supabase (see below)
# Edit .env.local with your credentials

# 3. Start the server
npm run dev
```

Open http://localhost:3000 🎉

---

## 🗄️ Supabase Setup (2 minutes)

1. **Create account:** [supabase.com](https://supabase.com) → "Start your project"
2. **Run SQL:** Copy `supabase-schema.sql` → Paste in SQL Editor → Run
3. **Get keys:** Settings → API → Copy URL + anon key
4. **Update `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## ✅ Test Checklist

- [ ] Page loads at localhost:3000
- [ ] Scroll through all sections (Hero → Problem → Solution → How It Works → Waitlist → Footer)
- [ ] Fill out waitlist form and submit
- [ ] See success message with green checkmark
- [ ] Check Supabase dashboard → Table Editor → waitlist (should see your entry)

---

## 🚀 Deploy to Vercel (5 minutes)

```bash
# Push to GitHub
git add .
git commit -m "TropiChat landing page"
git push

# Go to vercel.com
# Import your GitHub repo
# Add environment variables (same as .env.local)
# Deploy!
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main landing page |
| `components/hero-section.tsx` | Hero section |
| `components/waitlist-section.tsx` | Email signup form |
| `lib/supabase.ts` | Database connection |
| `.env.local` | Your Supabase credentials |
| `supabase-schema.sql` | Database setup script |

---

## 🎨 Quick Customizations

**Change headline:**
```tsx
// components/hero-section.tsx, line ~34
<h1>Your New Headline Here</h1>
```

**Change brand color:**
```tsx
// Replace all instances of #25D366 with your color
// Files: hero-section, solution-section, waitlist-section
```

**Update contact email:**
```tsx
// components/footer.tsx, line ~50
support@tropichat.com → your-email@example.com
```

---

## 🆘 Troubleshooting

**Build fails:** `rm -rf .next node_modules && npm install`

**Form doesn't work:** Check `.env.local` has correct Supabase credentials

**Supabase error:** Make sure you ran `supabase-schema.sql` in SQL Editor

---

## 📚 Full Documentation

- **Quick Setup:** See `SETUP.md`
- **Complete Guide:** See `README.md`
- **What's Built:** See `PROJECT_SUMMARY.md`

---

## 💡 Next Steps

1. Get 10 test signups from friends/family
2. Deploy to production
3. Share on social media
4. Drive traffic to your landing page
5. Watch signups roll in! 📈

---

**Need help?** → support@tropichat.com

Built with ❤️ by TropiTech Solutions 🇧🇸
