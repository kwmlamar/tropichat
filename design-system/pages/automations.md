# Automations Page — Design Overrides

> Extends `design-system/MASTER.md`. These rules are automations-specific.

---

## Page Identity

Automations is a **logic/workflow** page — not a data display page. The `IF → DO` pipeline connector is the visual signature of this page. It should be immediately recognizable and feel distinct from the analytics charts or settings list. Lean into that structure.

## Layout

- Max width: `max-w-7xl`
- Stats row: 3-col with `border-l-2` accents (same as analytics metric cards)
- Automation cards: `grid sm:grid-cols-2 xl:grid-cols-3 gap-5`
- Modal: uses existing `<Modal size="lg">`

## Automation Card

- Base: `bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-5`
- Disabled: `opacity-60` — the card fades but doesn't disappear
- No icon boxes with colored backgrounds. Use an inline icon next to the trigger label only.

## IF → DO Pipeline (signature element)

This is the heart of the card. Rules:

- `IF` pill: `w-7 h-7 rounded-md bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A]` — muted, reads as a step token
- Connector: `border-l border-dashed border-gray-200 dark:border-[#222]` — thin, quiet
- `DO` pill: `w-7 h-7 rounded-md bg-[#3A9B9F]` — teal, the payoff of the rule. Same in both modes.
- Labels above each step: `text-[10px] uppercase tracking-widest text-gray-400 dark:text-[#525252]`
- Values: `text-[13px] text-gray-700 dark:text-[#A3A3A3] truncate`

**Never** make the IF and DO pills the same color — the contrast between muted (IF) and teal (DO) is intentional.

## Empty State

The empty state teases the pipeline design before the user creates anything. Show a mini static `IF → DO` example to communicate the concept instantly. No illustrations, no large icons.

## Paywall

- `border-l-2 border-l-[#FF8B66]` — coral accent distinguishes it from normal cards
- Small icon: `w-12 h-12 rounded-xl bg-[#FF8B66]/10` with coral Zap icon
- CTA: `bg-[#213138] dark:bg-[#3A9B9F]` — brand navy in light, teal in dark
