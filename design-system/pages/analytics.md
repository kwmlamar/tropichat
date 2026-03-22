# Analytics Page — Design Overrides

> Extends `design-system/MASTER.md`. These rules are analytics-specific.

---

## Layout Override

- Page uses a single-column layout with max-width `max-w-7xl`
- 4-column metric grid collapses to 2-col on tablet, 1-col on mobile
- Chart panels are 2-col equal split, collapse to 1-col on mobile
- Bottom row: 2-col, `1fr 2fr` ratio (stat card left, peak hours right)

## Metric Cards

- Use `border-l-2` accent: teal for sent/conversations, coral for received/contacts
- No icon boxes — the number is the hero
- Change indicator: small text only, no badge/chip. Format: `+12%` in `text-[#3A9B9F]`
- Number: `text-4xl font-bold text-white font-[family-name:var(--font-poppins)]`
- Label: `text-[11px] text-[#525252] uppercase tracking-widest mb-2`

## Bar Chart (Message Volume)

- All bars: `bg-[#1E1E1E]` (inactive)
- Current/latest bar: `bg-[#3A9B9F]` (teal highlight only)
- Bar height animates from 0 on mount
- No tooltip unless hover — show value above bar on hover only
- X-axis: short day labels (Mon, Tue…), `text-[10px]`, muted

## Donut Chart (Conversations)

- Use SVG strokeDasharray approach (already implemented)
- Segment colors: Open → `#3A9B9F`, Pending → `#FF8B66`, Resolved → `#333333`
- Center text: white total number only
- Legend: horizontal row below chart, small colored dots

## Responsiveness Stat Card

- Large typographic number: `text-5xl font-bold` in white
- No icon box. No rotation. No glow.
- Subtitle: single line, `text-[#525252]`

## Peak Hours

- Each row: `flex justify-between items-center gap-4`
- Time label: `text-sm text-[#A3A3A3]`
- Bar track: `flex-1 h-1.5 bg-[#1A1A1A] rounded-full`
- Bar fill: teal, animate width on mount
- Count: `text-sm font-semibold text-white tabular-nums`
