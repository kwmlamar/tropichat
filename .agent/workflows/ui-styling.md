---
description: How to approach any UI/UX or styling work on TropiChat
---

# UI Styling Workflow

**MANDATORY**: Always follow this workflow before making ANY UI/UX or styling decision. Never design from scratch without querying the skill database first.

## Brand Tokens (Source of Truth)

| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#213138` | Primary brand, sidebar background |
| Teal | `#3A9B9F` | Primary CTA, active states, focus rings |
| Coral | `#FF8B66` | Accents, upgrade prompts, warnings |
| Font Heading | Poppins (`var(--font-lexend)`) | All h1–h6 |
| Font Body | Inter (`var(--font-lexend)`) | All body text |
| Text default | `#1e293b` (slate-900) | Body text |
| Text muted | `#475569` (slate-600) | Secondary text — minimum for 4.5:1 contrast |
| Border | `border-gray-100` / `border-gray-200` | Light mode borders |
| Radius | `rounded-xl` (12px) or `rounded-2xl` (16px) | Cards and interactive elements |

---

## Step 0: Read the Master Design System (REQUIRED)

Before ANY styling work, always read:

```
view_file design-system/MASTER.md
```

If working on a specific page, also check for a page override:

```
view_file design-system/pages/<page-name>.md
```

If the page override doesn't exist yet, create it after completing the work.

**The design system encodes the agreed TropiChat visual philosophy:**
> *"Less is more. The data is the design."*
> Inspired by Vercel, Linear, Raycast — matte OLED black, thin borders, lots of white space, teal + coral used as signals not decorations. No glowing orbs, no neon, no inflated rounded corners.

---

## Step 1: Read the Skill

Before starting any styling work, read the skill instructions:

```
view_file .agent/skills/ui-ux-pro-max/SKILL.md
```

## Step 2: Generate Design System

Run with `--design-system` for the component or page you're working on:

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "SaaS messaging dashboard Caribbean <your keywords>" --design-system -p "TropiChat" -f markdown
```

## Step 3: Domain-Specific Searches (as needed)

Supplement with targeted searches depending on what you're building:

```bash
# UX best practices (animations, accessibility, focus states)
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "animation accessibility hover" --domain ux -n 5

# Style options (glassmorphism, soft UI, minimalism)
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<style keywords>" --domain style -n 4

# Typography alternatives
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<mood keywords>" --domain typography -n 3

# Chart/data visualisation guidance
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<chart type>" --domain chart -n 3
```

## Step 4: Stack Guidelines

Always get Next.js + shadcn specific guidance:

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<component type>" --stack shadcn
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<feature area>" --stack nextjs
```

## Step 5: Apply with Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] **Read MASTER.md** — all rules inherited
- [ ] **Read page override** (if exists) — applied on top
- [ ] **DUAL-MODE: every surface has both light + dark class** — e.g. `bg-white dark:bg-[#0C0C0C]` (no exceptions)
- [ ] **DUAL-MODE: every text color has both light + dark class** — e.g. `text-gray-900 dark:text-white`
- [ ] **DUAL-MODE: every border has both light + dark class** — e.g. `border-gray-200 dark:border-[#1C1C1C]`
- [ ] Brand accent colors (`#3A9B9F` / `#FF8B66`) do NOT need dark: variants — they work in both modes
- [ ] No emojis used as icons — use Lucide icons only
- [ ] All clickable elements have `cursor-pointer` (globally handled in `globals.css`)
- [ ] Hover states provide visual feedback with smooth transitions (150–300ms)
- [ ] Focus states visible via brand teal ring (globally handled in `globals.css`)
- [ ] Light mode text contrast: **4.5:1 minimum** — use `text-gray-600` (`#475569`) or darker for muted text
- [ ] `prefers-reduced-motion` respected (globally handled in `globals.css`)
- [ ] Headings use Poppins (`` if overriding)
- [ ] Body text uses Inter (default body font)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Brand colors used for interactive elements (teal for primary, coral for accents)
- [ ] Cards use `rounded-xl` or `rounded-2xl` max — never larger
- [ ] **No floating background orbs** (animate-float large blur divs are banned)
- [ ] **No neon glow effects** — neutral shadows only
- [ ] **Less is more** — if an element doesn't carry information, remove it

---

## TropiChat Design Style (Established)

### Dual-Mode Quick Reference (ALWAYS use both)

| Element | Light | Dark | Tailwind pattern |
|---------|-------|------|------------------|
| Page bg | `#FAFAFA` | `#000000` | `bg-gray-50 dark:bg-black` |
| Card bg | `#FFFFFF` | `#0C0C0C` | `bg-white dark:bg-[#0C0C0C]` |
| Card border | `#E5E7EB` | `#1C1C1C` | `border-gray-200 dark:border-[#1C1C1C]` |
| Hover border | `#D1D5DB` | `#2A2A2A` | `hover:border-gray-300 dark:hover:border-[#2A2A2A]` |
| Heading | `#213138` | `#FFFFFF` | `text-[#213138] dark:text-white` |
| Body text | `#374151` | `#A3A3A3` | `text-gray-700 dark:text-[#A3A3A3]` |
| Muted text | `#6B7280` | `#525252` | `text-gray-500 dark:text-[#525252]` |
| Chart bar | `#F1F5F9` | `#1E1E1E` | `bg-slate-100 dark:bg-[#1E1E1E]` |
| Bar track | `#F1F5F9` | `#1A1A1A` | `bg-slate-100 dark:bg-[#1A1A1A]` |
| Seg. ctrl bg | `#F3F4F6` | `#111111` | `bg-gray-100 dark:bg-[#111111]` |
| Seg. active | `#FFFFFF` | `#1C1C1C` | `bg-white dark:bg-[#1C1C1C]` |
| Teal accent | `#3A9B9F` | `#3A9B9F` | `text-[#3A9B9F]` or `bg-[#3A9B9F]` |
| Coral accent | `#FF8B66` | `#FF8B66` | `text-[#FF8B66]` or `bg-[#FF8B66]` |

### Dark Mode Surface Rules
- Background: `dark:bg-black`
- Cards: `dark:bg-[#0C0C0C]` with `dark:border-[#1C1C1C]`
- Accent cards: always `border-l-2 border-l-[#3A9B9F]` or `border-l-[#FF8B66]` (same both modes)

### Light Mode Surface Rules
- Background: `bg-gray-50` or `bg-white`
- Cards: `bg-white border-gray-200 rounded-2xl` — clean, no blur unless floating
- Headings: `text-[#213138]`
- Chat bubbles: outbound uses brand teal gradient
- Tabs: segmented control-style (not underline)
- Settings: card-less layout with section dividers
