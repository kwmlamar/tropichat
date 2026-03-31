"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Check, X, CircleNotch } from "@phosphor-icons/react"

export type PlanTier = "coconut" | "tropic" | "island_pro"
export type BillingInterval = "monthly" | "annual"

interface PricingCardFeature {
  label: string
  included: boolean
}

interface PricingCardProps {
  tier: PlanTier
  isHighlighted?: boolean
  isCurrentPlan?: boolean
  billingInterval: BillingInterval
  isUpgrading?: boolean
  onUpgrade: (tier: PlanTier) => void
}

const TIER_CONFIG: Record<
  PlanTier,
  {
    emoji: string
    name: string
    price: { monthly: number; annual: number }
    features: PricingCardFeature[]
    accentClass: string
    bgClass: string
    borderClass: string
    badgeLabel?: string
  }
> = {
  coconut: {
    emoji: "🥥",
    name: "COCONUT",
    price: { monthly: 0, annual: 0 },
    features: [
      { label: "20 bookings / month", included: true },
      { label: "1 service", included: true },
      { label: "Public booking page", included: true },
      { label: "WhatsApp + Instagram inbox", included: true },
      { label: "Custom booking link", included: false },
      { label: "Analytics dashboard", included: false },
      { label: "Multi-staff accounts", included: false },
    ],
    accentClass: "text-[#F4C430]",
    bgClass: "bg-[#FEF9EE]",
    borderClass: "border-[#E5E0D5]",
  },
  tropic: {
    emoji: "🌴",
    name: "TROPIC",
    price: { monthly: 29, annual: 290 },
    features: [
      { label: "Unlimited bookings", included: true },
      { label: "5 services", included: true },
      { label: "Custom booking link", included: true },
      { label: "Analytics dashboard", included: true },
      { label: "Priority support", included: true },
      { label: "Multi-staff accounts", included: false },
      { label: "White-label options", included: false },
    ],
    accentClass: "text-[#F4C430]",
    bgClass: "bg-[#0F172A]",
    borderClass: "border-[#F4C430]",
    badgeLabel: "BEST VALUE",
  },
  island_pro: {
    emoji: "🏝️",
    name: "ISLAND PRO",
    price: { monthly: 59, annual: 590 },
    features: [
      { label: "Unlimited bookings", included: true },
      { label: "Unlimited services", included: true },
      { label: "Multi-staff accounts", included: true },
      { label: "Priority support", included: true },
      { label: "White-label options", included: true },
      { label: "Full analytics suite", included: true },
      { label: "Custom domain", included: true },
    ],
    accentClass: "text-[#4ADE80]",
    bgClass: "bg-[#0F2D1F]",
    borderClass: "border-[#166534]",
  },
}

export function PricingCard({
  tier,
  isHighlighted = false,
  isCurrentPlan = false,
  billingInterval,
  isUpgrading = false,
  onUpgrade,
}: PricingCardProps) {
  const config = TIER_CONFIG[tier]
  const price =
    billingInterval === "annual" ? config.price.annual : config.price.monthly
  const isDark = tier === "tropic" || tier === "island_pro"

  const priceLabel =
    tier === "coconut"
      ? "Free Forever"
      : billingInterval === "annual"
      ? `$${price}/yr`
      : `$${price}/mo`

  const savingsLabel =
    tier !== "coconut" && billingInterval === "annual"
      ? `Save $${config.price.monthly * 12 - config.price.annual}/yr 🎉`
      : null

  return (
    <motion.div
      whileHover={!isCurrentPlan && tier !== "coconut" ? { scale: 1.02 } : undefined}
      whileTap={!isCurrentPlan && tier !== "coconut" ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative p-5 rounded-2xl border-2 transition-colors",
        config.bgClass,
        config.borderClass,
        isHighlighted && "shadow-lg shadow-[#F4C430]/10"
      )}
    >
      {config.badgeLabel && (
        <span className="absolute top-4 right-4 text-[10px] font-black bg-[#F4C430] text-[#0F172A] px-2 py-0.5 rounded-full uppercase tracking-widest">
          {config.badgeLabel}
        </span>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{config.emoji}</span>
          <span
            className={cn(
              "text-xs font-black uppercase tracking-widest",
              isDark ? "text-white/70" : "text-slate-500"
            )}
          >
            {config.name}
          </span>
        </div>
        <div className={cn("text-2xl font-black", isDark ? "text-white" : "text-[#0F172A]")}>
          {priceLabel}
        </div>
        {savingsLabel && (
          <span className="inline-block mt-1 text-[11px] font-bold bg-[#F4C430]/20 text-[#F4C430] px-2 py-0.5 rounded-full">
            {savingsLabel}
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-1.5 mb-5">
        {config.features.map((f) => (
          <li key={f.label} className="flex items-center gap-2 text-sm">
            {f.included ? (
              <Check
                weight="bold"
                className={cn("h-3.5 w-3.5 flex-shrink-0", isDark ? "text-[#0D9488]" : "text-[#0D9488]")}
              />
            ) : (
              <X
                weight="bold"
                className={cn(
                  "h-3.5 w-3.5 flex-shrink-0",
                  isDark ? "text-white/20" : "text-slate-300"
                )}
              />
            )}
            <span
              className={cn(
                f.included
                  ? isDark
                    ? "text-white/90"
                    : "text-slate-700"
                  : isDark
                  ? "text-white/30"
                  : "text-slate-300"
              )}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrentPlan ? (
        <div
          className={cn(
            "w-full text-center py-2.5 rounded-xl text-sm font-bold border",
            isDark
              ? "border-white/20 text-white/50"
              : "border-[#F4C430] text-[#F4C430]"
          )}
        >
          Current Plan
        </div>
      ) : tier !== "coconut" ? (
        <motion.button
          onClick={() => onUpgrade(tier)}
          disabled={isUpgrading}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-black transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]",
            tier === "tropic"
              ? "bg-[#F4C430] text-[#0F172A] hover:opacity-90"
              : "bg-[#166534] text-white hover:opacity-90",
            isUpgrading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isUpgrading ? (
            <CircleNotch className="h-4 w-4 animate-spin mx-auto" />
          ) : tier === "tropic" ? (
            "Upgrade to Tropic →"
          ) : (
            "Upgrade to Island Pro →"
          )}
        </motion.button>
      ) : null}
    </motion.div>
  )
}
