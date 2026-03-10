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
| Font Heading | Poppins (`var(--font-poppins)`) | All h1–h6 |
| Font Body | Inter (`var(--font-inter)`) | All body text |
| Text default | `#1e293b` (slate-900) | Body text |
| Text muted | `#475569` (slate-600) | Secondary text — minimum for 4.5:1 contrast |
| Border | `border-gray-100` / `border-gray-200` | Light mode borders |
| Radius | `rounded-xl` (12px) or `rounded-2xl` (16px) | Cards and interactive elements |

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

- [ ] No emojis used as icons — use Lucide icons only
- [ ] All clickable elements have `cursor-pointer` (globally handled in `globals.css`)
- [ ] Hover states provide visual feedback with smooth transitions (150–300ms)
- [ ] Focus states visible via brand teal ring (globally handled in `globals.css`)
- [ ] Light mode text contrast: **4.5:1 minimum** — use `text-gray-600` (`#475569`) or darker for muted text
- [ ] `prefers-reduced-motion` respected (globally handled in `globals.css`)
- [ ] Headings use Poppins (`font-[family-name:var(--font-poppins)]` if overriding)
- [ ] Body text uses Inter (default body font)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Brand colors used for interactive elements (teal for primary, coral for accents)
- [ ] Borders visible: `border-gray-200` in light mode
- [ ] Cards use `rounded-xl` or `rounded-2xl` with `shadow-sm`

---

## TropiChat Design Style (Established)

The current design follows **Soft UI Evolution + Glassmorphism** principles:
- Light, airy white backgrounds (`bg-white`, `bg-gray-50`)
- Subtle shadows: `shadow-[0_2px_12px_rgba(0,0,0,0.03)]`
- Rounded pill-like tabs with white active state + shadow
- Gradient outbound chat bubbles using brand teal
- Soft inbound chat bubbles with `bg-gray-50`
- Collapsible sidebar defaulting to collapsed state
- Segmented control-style tabs (not underline tabs)
- Clean card-less settings layout with section dividers
