# TropiChat - WhatsApp Business Management Landing Page

A high-converting landing page for TropiChat, a WhatsApp Business management tool designed specifically for Caribbean small businesses.

## 🚀 Features

- **Modern, Responsive Design** - Mobile-first approach with Tailwind CSS 4
- **Smooth Animations** - Powered by Framer Motion for engaging user experience
- **Email Waitlist Collection** - Integrated with Supabase for storing early access signups
- **Form Validation** - React Hook Form with Zod schema validation
- **SEO Optimized** - Comprehensive meta tags and semantic HTML
- **Toast Notifications** - User feedback with Sonner
- **Fast Performance** - Optimized Next.js 15 with App Router

## 📋 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/ui
- **Animations**: Framer Motion
- **Form Management**: React Hook Form + Zod
- **Database**: Supabase
- **Icons**: Lucide React

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works fine)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL schema from `supabase-schema.sql`:

```sql
-- Copy and paste the contents of supabase-schema.sql
```

This will create:
- `waitlist` table with proper columns
- Indexes for better performance
- Row Level Security policies
- Public access policies for form submissions

### 3. Configure Environment Variables

1. Copy `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase project settings under **API**.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## 📁 Project Structure

```
tropichat/
├── app/
│   ├── layout.tsx          # Root layout with SEO metadata
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Shadcn/ui components
│   ├── hero-section.tsx    # Hero section with CTA
│   ├── problem-section.tsx # Pain points grid
│   ├── solution-section.tsx # Feature cards
│   ├── how-it-works-section.tsx # Steps timeline
│   ├── waitlist-section.tsx # Email signup form
│   └── footer.tsx          # Footer component
├── lib/
│   ├── utils.ts            # Utility functions
│   └── supabase.ts         # Supabase client config
├── supabase-schema.sql     # Database schema
└── .env.local              # Environment variables
```

## 🎨 Design System

### Colors

- **Primary (WhatsApp Green)**: `#25D366`
- **Secondary Green**: `#20BD5B` (hover states)
- **Background**: White, Gray-50
- **Text**: Gray-900, Gray-600

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: Bold, tracking-tight
- **Body**: Regular, leading-relaxed

### Components

All UI components are built with Shadcn/ui and customized for the brand:
- Button
- Input
- Label
- Select
- Card

## 📧 Waitlist Form

The waitlist form collects:
- **Name** (required)
- **Email** (required, validated)
- **Business Type** (required, dropdown: Restaurant, Retail, Services, Other)
- **Phone** (optional)

### Form Features

- Real-time validation with Zod
- Duplicate email detection
- Success/error toast notifications
- Success state with confirmation message
- Smooth scrolling to form from hero CTA

## 🎯 Page Sections

1. **Hero Section**
   - Attention-grabbing headline
   - Clear value proposition
   - Primary CTA button
   - Trust indicator badge
   - Visual dashboard mockup

2. **Problem Section**
   - 4 relatable pain points
   - Icons and descriptions
   - Hover animations

3. **Solution Section**
   - 4 key features with icons
   - Benefit-focused descriptions
   - Stats showcase

4. **How It Works**
   - 3-step process
   - Timeline visualization
   - Setup time indicator

5. **Waitlist Section**
   - Email capture form
   - Early access incentive
   - Success confirmation

6. **Footer**
   - Brand information
   - Legal links
   - Contact information
   - Social media icons

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Production

Make sure to add these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔒 Security Notes

- Supabase RLS policies are enabled
- Form submissions are rate-limited by Supabase
- Email validation prevents malformed submissions
- ANON key is safe to expose (read-only access)

## 📊 Analytics (Optional)

To add analytics tracking:

1. Add Google Analytics or Plausible
2. Track form submissions
3. Monitor conversion rates
4. A/B test different headlines

## 🎨 Customization

### Change Brand Colors

Edit the Tailwind config or components directly:
- Replace `#25D366` with your brand color
- Update gradient colors in solution cards
- Modify background colors for sections

### Update Copy

All copy is in the component files:
- `components/hero-section.tsx` - Headlines and CTAs
- `components/problem-section.tsx` - Pain points
- `components/solution-section.tsx` - Features
- `components/how-it-works-section.tsx` - Process steps

### Add Images

Replace placeholder mockups:
1. Add images to `public/` folder
2. Use Next.js `<Image>` component
3. Optimize images (use WebP format)

## 🐛 Troubleshooting

### Supabase Connection Issues

- Verify environment variables are correct
- Check if RLS policies are enabled
- Ensure the table exists in your database

### Form Not Submitting

- Check browser console for errors
- Verify Supabase credentials
- Test with Supabase dashboard SQL editor

### Styling Issues

- Clear `.next` cache: `rm -rf .next`
- Restart dev server
- Check Tailwind CSS configuration

## 📝 TODO / Future Enhancements

- [ ] Add og:image for social sharing
- [ ] Implement email confirmation flow
- [ ] Add admin dashboard to view signups
- [ ] Create email sequences for waitlist
- [ ] Add testimonials section
- [ ] Implement A/B testing
- [ ] Add blog for SEO
- [ ] Create video demo

## 📄 License

Built by TropiTech Solutions 🇧🇸

## 🤝 Support

For questions or issues:
- Email: support@tropichat.com
- Open an issue on GitHub

---

Built with ❤️ for Caribbean small businesses
