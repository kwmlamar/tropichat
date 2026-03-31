"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Check, X, CircleNotch, ShieldCheck } from "@phosphor-icons/react"

export type PlanTier = "starter" | "medium" | "pro" | "elite"
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
  starter: {
    emoji: "🚀",
    name: "STARTER",
    price: { monthly: 15, annual: 144 },
    features: [
      { label: "Up to 500 contacts", included: true },
      { label: "Unified Inbox (IG, WA, MSN)", included: true },
      { label: "Basic AI Smart Replies", included: true },
      { label: "Mobile App Access", included: true },
      { label: "Community Support", included: true },
      { label: "Bulk WhatsApp Broadcasts", included: false },
    ],
    accentClass: "text-[#F4C430]",
    bgClass: "bg-[#FEF9EE] dark:bg-white/[0.03]",
    borderClass: "border-[#E5E0D5] dark:border-white/10",
  },
  medium: {
    emoji: "🌴",
    name: "MEDIUM",
    price: { monthly: 35, annual: 336 },
    features: [
      { label: "Up to 2,500 contacts", included: true },
      { label: "Bulk WhatsApp Broadcasts", included: true },
      { label: "WhatsApp Link & QR Generator", included: true },
      { label: "Full CRM Profile Tracking", included: true },
      { label: "Priority Email Support", included: true },
      { label: "Booking & Payment Links", included: false },
    ],
    accentClass: "text-[#007B85]",
    bgClass: "bg-white dark:bg-[#0C0C0C]",
    borderClass: "border-gray-200 dark:border-white/10",
  },
  pro: {
    emoji: "🏝️",
    name: "PRO",
    price: { monthly: 75, annual: 720 },
    features: [
      { label: "Up to 10,000 contacts", included: true },
      { label: "Unlimited Team Members", included: true },
      { label: "AI Knowledge Base Training", included: true },
      { label: "Booking & Payment Links", included: true },
      { label: "Abandoned Cart Recovery", included: true },
      { label: "Direct Founder Support", included: true },
    ],
    accentClass: "text-white",
    bgClass: "bg-[#007B85] text-white",
    borderClass: "border-[#007B85]",
    badgeLabel: "RECOMMENDED",
  },
  elite: {
    emoji: "👑",
    name: "ELITE",
    price: { monthly: 150, annual: 1440 },
    features: [
      { label: "Unlimited Contacts", included: true },
      { label: "White-label Dashboard", included: true },
      { label: "Custom API Integrations", included: true },
      { label: "Dedicated Account Manager", included: true },
      { label: "24/7 VIP Multi-channel Support", included: true },
      { label: "Custom Bot Development", included: true },
    ],
    accentClass: "text-[#4ADE80]",
    bgClass: "bg-[#0F172A] dark:bg-black",
    borderClass: "border-[#1E293B] dark:border-[#1C1C1C]",
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
  const isDark = tier === "pro" || tier === "elite"

  const priceLabel = billingInterval === "annual"
      ? `$${price}/yr`
      : `$${price}/mo`

  const savingsLabel =
    billingInterval === "annual"
      ? `Save $${config.price.monthly * 12 - config.price.annual}/yr 🎉`
      : null

  return (
    <motion.div
      whileHover={!isCurrentPlan ? { scale: 1.01 } : undefined}
      whileTap={!isCurrentPlan ? { scale: 0.99 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative p-6 px-7 rounded-[32px] border-2 transition-all duration-300",
        config.bgClass,
        config.borderClass,
        isHighlighted && "shadow-2xl shadow-[#007B85]/20 ring-4 ring-[#007B85]/10 scale-[1.02] z-10"
      )}
    >
      {config.badgeLabel && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black bg-[#213138] dark:bg-white text-white dark:text-[#0F172A] px-4 py-1 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
          {config.badgeLabel}
        </span>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="h-10 w-10 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-2xl text-2xl">
            {config.emoji}
          </div>
          <span
            className={cn(
              "text-[13px] font-black uppercase tracking-widest",
              isDark ? "text-white/80" : "text-gray-500"
            )}
            style={{ fontFamily: "var(--font-plus-jakarta)" }}
          >
            {config.name}
          </span>
        </div>
        <div className={cn("text-3xl font-black flex items-baseline gap-1", isDark ? "text-white" : "text-[#213138]")} style={{ fontFamily: "var(--font-plus-jakarta)" }}>
          {priceLabel.split('/')[0]}
          <span className={cn("text-sm font-bold opacity-60", isDark ? "text-white" : "text-gray-500")}>
            /{priceLabel.split('/')[1]}
          </span>
        </div>
        {savingsLabel && (
          <span className={cn(
            "inline-block mt-2 text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight",
            isDark ? "bg-white/20 text-white" : "bg-[#4ADE80]/10 text-[#166534]"
          )}>
            {savingsLabel}
          </span>
        )}
      </div>

      {/* Features - Grouped by importance */}
      <div className="space-y-4 mb-8">
        <ul className="space-y-3">
          {config.features.map((f) => (
            <li key={f.label} className="flex items-start gap-3 text-[13.5px]">
              <div className={cn(
                "mt-0.5 h-4.5 w-4.5 flex-shrink-0 flex items-center justify-center rounded-full",
                f.included 
                  ? isDark ? "bg-white/20 text-white" : "bg-[#007B85]/10 text-[#007B85]"
                  : "opacity-20"
              )}>
                {f.included ? (
                  <Check weight="bold" className="h-3 w-3" />
                ) : (
                  <X weight="bold" className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  "font-medium leading-tight",
                  f.included
                    ? isDark ? "text-white/90" : "text-gray-700"
                    : isDark ? "text-white/30" : "text-gray-300"
                )}
              >
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-auto">
        {isCurrentPlan ? (
          <div
            className={cn(
              "w-full text-center py-4 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2 border",
              isDark
                ? "border-white/20 text-white/50 bg-white/5"
                : "border-gray-100 text-gray-400 bg-gray-50"
            )}
          >
            <ShieldCheck weight="bold" className="h-4 w-4" />
            Current Plan
          </div>
        ) : (
          <motion.button
            onClick={() => onUpgrade(tier)}
            disabled={isUpgrading}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full py-4 rounded-2xl text-[13px] font-black transition-all duration-300 shadow-xl active:shadow-none",
              tier === "pro"
                ? "bg-white text-[#007B85] hover:bg-gray-50 shadow-[#007B85]/20"
                : isHighlighted 
                  ? "bg-[#007B85] text-white hover:bg-[#2F8488] shadow-[#007B85]/20"
                  : "bg-[#213138] text-white hover:bg-[#2c4049] shadow-black/10",
              isUpgrading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isUpgrading ? (
              <CircleNotch className="h-4 w-4 animate-spin mx-auto" />
            ) : (
              `Choose ${config.name.toLowerCase()} →`
            )}
          </motion.button>
        )}
      </div>
    </motion.div>

  )
}

