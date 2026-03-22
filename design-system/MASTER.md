# TropiChat — Master Design System

> **Source of Truth.** All pages inherit these rules. Page-specific overrides live in `design-system/pages/`.

---

## 1. Brand Philosophy

**"Less is more. The data is the design."**

TropiChat is a Caribbean-rooted messaging SaaS. The visual language should feel like **Vercel meets the tropics** — deep, matte, composed, with teal and coral used *sparingly* as signals, not decorations. Every element on screen should earn its place.

**Inspiration references:** Vercel dashboard, Linear app, Raycast, Stripe dashboard (dark mode)

**Anti-patterns to always avoid:**
- Neon glows, neon text shadows
- Multiple gradient orbs floating in background
- Busy cards with icons + badges + borders + gradients all at once
- Rounded corners above `rounded-2xl` (32px) — feels inflated, not premium
- More than 2 accent colors visible in any single section

---

## 2. Color Palette

### Brand (always the same, both modes)
| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-navy` | `#213138` | Sidebar, deep backgrounds (light mode) |
| `--brand-teal` | `#3A9B9F` | PRIMARY accent — CTAs, active states, focus rings, chart highlights |
| `--brand-coral` | `#FF8B66` | SECONDARY accent — received messages, donut segments, warnings |

### Dual-Mode Surface Tokens

| Role | Light Mode | Dark Mode | Tailwind pattern |
|------|------------|-----------|------------------|
| Page background | `#FAFAFA` | `#000000` | `bg-gray-50 dark:bg-black` |
| Card background | `#FFFFFF` | `#0C0C0C` | `bg-white dark:bg-[#0C0C0C]` |
| Elevated surface | `#F5F5F5` | `#111111` | `bg-gray-100 dark:bg-[#111111]` |
| Card border | `#E5E7EB` | `#1C1C1C` | `border-gray-200 dark:border-[#1C1C1C]` |
| Hover border | `#D1D5DB` | `#2A2A2A` | `hover:border-gray-300 dark:hover:border-[#2A2A2A]` |
| Divider | `#E5E7EB` | `#222222` | `border-gray-200 dark:border-[#222222]` |
| Chart bar inactive | `#F1F5F9` | `#1E1E1E` | `bg-slate-100 dark:bg-[#1E1E1E]` |
| Progress bar track | `#F1F5F9` | `#1A1A1A` | `bg-slate-100 dark:bg-[#1A1A1A]` |
| Segmented ctrl bg | `#F3F4F6` | `#111111` | `bg-gray-100 dark:bg-[#111111]` |
| Segmented active | `#FFFFFF` | `#1C1C1C` | `bg-white dark:bg-[#1C1C1C]` |

### Dual-Mode Text Tokens

| Role | Light Mode | Dark Mode | Tailwind pattern |
|------|------------|-----------|------------------|
| Primary text | `#111827` | `#FFFFFF` | `text-gray-900 dark:text-white` |
| Secondary text | `#374151` | `#A3A3A3` | `text-gray-700 dark:text-[#A3A3A3]` |
| Muted / labels | `#6B7280` | `#525252` | `text-gray-500 dark:text-[#525252]` |
| Heading text | `#213138` | `#FFFFFF` | `text-[#213138] dark:text-white` |
| Teal accent text | `#3A9B9F` | `#3A9B9F` | `text-[#3A9B9F]` (same both modes) |
| Coral accent text | `#FF8B66` | `#FF8B66` | `text-[#FF8B66]` (same both modes) |

### Accent Usage Rules
- **Teal** = primary action, first chart series, "sent" data, active navigation
- **Coral** = secondary data, "received" data, second chart series
- **Never use both at full opacity in the same card** — pick one, mute the other
- **Brand accent colors (`#3A9B9F` / `#FF8B66`) do NOT need dark: variants** — they work in both modes

---

## 3. Typography

| Role | Family | Weight | Size Range |
|------|--------|--------|------------|
| Page headings (h1) | Poppins | 700 | 28–36px |
| Section titles (h2–h3) | Poppins | 600 | 16–20px |
| Body text | Inter | 400 | 14px |
| Metric numbers | Poppins | 700–800 | 24–48px |
| Labels / metadata | Inter | 500 | 10–12px, uppercase, tracked |
| Muted text | Inter | 400 | 13px |

### Typography Rules
- All `h1`–`h6` use `font-[family-name:var(--font-poppins)]`
- Uppercase labels use `tracking-widest` and `text-[10px]` — no larger
- Metric numbers are the hero of data cards — give them vertical breathing room
- **Never use more than 3 font sizes in one card**

---

## 4. Spacing & Layout

| Context | Value |
|---------|-------|
| Page padding | `p-8` (32px) |
| Card padding | `p-6` (24px) — or `p-8` for hero stats |
| Card gap | `gap-6` (24px) |
| Section gap | `gap-8` or `mb-10` |
| Max content width | `max-w-7xl` |

**Rule:** When in doubt, add more space. Compression = clutter. White space = premium.

---

## 5. Card Design

**The canonical dual-mode card (ALWAYS write both light + dark):**
```
bg-white dark:bg-[#0C0C0C]
border border-gray-200 dark:border-[#1C1C1C]
rounded-2xl
p-6
hover:border-gray-300 dark:hover:border-[#2A2A2A]
transition-colors duration-200
```

**Accent left border variant (for stat cards — same color works both modes):**
```
border-l-2 border-l-[#3A9B9F]   ← teal variant
border-l-2 border-l-[#FF8B66]   ← coral variant
```

**Section title inside card:**
```
text-[15px] font-semibold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)]
```

**Muted subtitle inside card:**
```
text-[13px] text-gray-500 dark:text-[#525252] mt-0.5
```

**Metric number (hero):**
```
text-3xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-poppins)] tabular-nums
```

**Metric label:**
```
text-[11px] text-gray-500 dark:text-[#525252] uppercase tracking-widest font-medium
```

**Never add:**
- `shadow-xl` with colorful glows
- Multiple layered box shadows
- `backdrop-blur` on cards that aren't floating over content
- Large colored icon boxes inside stat cards
- Hardcoded dark hex values without a light mode counterpart (`dark:` prefix required)

---

## 6. Charts & Data Visualization

### Bar Charts
- Inactive bars: `bg-slate-100 dark:bg-[#1E1E1E]`
- Active/latest bar: `bg-[#3A9B9F]` — same both modes
- Bar width: `flex-1`, slim with `gap-1.5` between
- Rounded tops: `rounded-t-sm` — not `rounded-t-xl`
- No grid lines unless essential
- Axis labels: `text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-wider`

### Donut Charts
- Segments: teal (primary), coral (secondary), `#D1D5DB` light / `#333333` dark (neutral)
- Track ring: `#F1F5F9` light / `#1A1A1A` dark
- Stroke width: keep tight
- Center: `text-gray-900 dark:text-white` number only
- Legend dots + text: `text-gray-500 dark:text-[#A3A3A3]`

### Progress Bars
- Track: `bg-slate-100 dark:bg-[#1A1A1A]`
- Fill: `bg-[#3A9B9F]` — same both modes
- Height: `h-1.5` — thin is premium
- Time label: `text-gray-500 dark:text-[#A3A3A3]`
- Count: `text-gray-900 dark:text-white font-semibold tabular-nums`

---

## 7. Interactive Elements

### Segmented Controls (Date Range)
```
bg-gray-100 dark:bg-[#111111]
border border-gray-200 dark:border-[#1C1C1C]
rounded-xl p-1

Button active:   bg-white dark:bg-[#1C1C1C]  text-gray-900 dark:text-white  font-semibold rounded-lg  shadow-sm dark:shadow-none
Button inactive: text-gray-400 dark:text-[#525252]  hover:text-gray-700 dark:hover:text-[#A3A3A3]
```

### Buttons
- Primary: `bg-[#3A9B9F] text-white hover:bg-[#2F8488] rounded-xl` (same both modes)
- Ghost: `border border-gray-200 dark:border-[#222222] text-gray-600 dark:text-[#A3A3A3] hover:border-[#3A9B9F] hover:text-[#3A9B9F] dark:hover:text-white`
- All transitions: `transition-all duration-200`

---

## 8. Motion & Animations

**Principle: Motion should inform, not entertain.**

| Use | Value |
|-----|-------|
| Page enter | `opacity-0 → 1`, `y: 12 → 0`, `duration: 0.4s` |
| Stagger children | `delay: i * 0.06s` max |
| Bar chart fill | `height: 0 → %`, `duration: 0.8s`, `ease: [0.22, 1, 0.36, 1]` |
| Hover transitions | `duration: 150–200ms` |
| Background orbs | **REMOVED** — do not use floating ambient orbs |
| Pulse animations | Only for live/real-time status indicators |

---

## 9. What NOT to Do

- ❌ **Hardcoded dark-only hex without a light equivalent** — every surface color needs `bg-X dark:bg-Y` pattern. No exceptions.
- ❌ Floating background orbs (`animate-float-slow` large blur divs)
- ❌ `rounded-[40px]` or larger — feels bubbly, not premium
- ❌ Icon boxes that are larger than the text they accompany
- ❌ Shadow colors (`shadow-teal-500/20`) — use neutral shadows only
- ❌ Gradient text (`bg-clip-text text-transparent`)
- ❌ More than one animated element visible at the same time
- ❌ `ring-1 ring-black/5` stacked on top of `border` — pick one
- ❌ Full-opacity teal or coral backgrounds on cards
- ❌ Writing a page and only testing one color mode — always check both

---

## 10. Page-Specific Overrides

Page overrides live in `design-system/pages/`. If a page file exists, its rules **extend** (not replace) this MASTER. Always read MASTER first.

Available page overrides:
- `design-system/pages/analytics.md`
