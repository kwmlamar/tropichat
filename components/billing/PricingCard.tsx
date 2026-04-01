"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Check, CircleNotch, ShieldCheck } from "@phosphor-icons/react"

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
    name: string
    price: { monthly: number; annual: number }
    features: PricingCardFeature[]
    badgeLabel?: string
  }
> = {
  starter: {
    name: "STARTER",
    price: { monthly: 15, annual: 144 },
    features: [
      { label: "Up to 500 contacts", included: true },
      { label: "Unified Inbox (IG, WA, MSN)", included: true },
      { label: "Basic AI Smart Replies", included: true },
      { label: "Mobile App Access", included: true },
      { label: "Community Support", included: true },
    ],
  },
  medium: {
    name: "MEDIUM",
    price: { monthly: 35, annual: 28 * 12 },
    features: [
      { label: "Up to 2,500 contacts", included: true },
      { label: "Bulk WhatsApp Broadcasts", included: true },
      { label: "WhatsApp Link & QR Generator", included: true },
      { label: "Full CRM Profile Tracking", included: true },
      { label: "Priority Email Support", included: true },
    ],
  },
  pro: {
    name: "PRO",
    price: { monthly: 75, annual: 60 * 12 },
    features: [
      { label: "Up to 10,000 contacts", included: true },
      { label: "Unlimited Team Members", included: true },
      { label: "AI Knowledge Base Training", included: true },
      { label: "Booking & Payment Links", included: true },
      { label: "Abandoned Cart Recovery", included: true },
      { label: "Direct Founder Support", included: true },
    ],
    badgeLabel: "RECOMMENDED",
  },
  elite: {
    name: "ELITE (MANAGED)",
    price: { monthly: 399, annual: 349 * 12 },
    features: [
      { label: "Full Done-For-You Setup", included: true },
      { label: "Managed WhatsApp & IG Sales", included: true },
      { label: "Custom AI Strategy & Training", included: true },
      { label: "Weekly Revenue Reporting", included: true },
      { label: "24/7 Priority Sales Support", included: true },
      { label: "Unlimited Contacts & Growth", included: true },
    ],
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
  const price = billingInterval === "annual" ? config.price.annual : config.price.monthly

  const priceLabel = billingInterval === "annual" ? `$${price}/yr` : `$${price}/mo`
  const monthlyEquivalent = billingInterval === "annual" ? Math.floor(price / 12) : price

  return (
    <div
      className={cn(
        "relative flex flex-col p-6 rounded-2xl border transition-all duration-200",
        "bg-white dark:bg-[#0C0C0C]",
        isHighlighted
          ? "border-[#3A9B9F] ring-1 ring-[#3A9B9F]/20"
          : "border-gray-200 dark:border-[#1C1C1C]",
        isCurrentPlan && "opacity-80"
      )}
    >
      {config.badgeLabel && (
        <span className="absolute -top-3 left-6 text-[10px] font-black bg-[#3A9B9F] text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
          {config.badgeLabel}
        </span>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-[#3A9B9F] uppercase tracking-[0.2em]">
            {config.name}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-[#213138] dark:text-white leading-none">
            ${billingInterval === "annual" ? monthlyEquivalent : price}
          </span>
          <span className="text-sm font-bold text-gray-500 dark:text-[#525252]">/mo</span>
        </div>
        {billingInterval === "annual" && (
          <p className="mt-1 text-[11px] font-bold text-gray-400 dark:text-[#525252]">
            Billed yearly at {priceLabel}
          </p>
        )}
      </div>

      {/* Features */}
      <div className="flex-1 space-y-4 mb-8">
        <ul className="space-y-3">
          {config.features.map((f) => (
            <li key={f.label} className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <Check weight="bold" className="h-4 w-4 text-[#3A9B9F]" />
              </div>
              <span className="text-[13px] font-medium text-gray-700 dark:text-[#A3A3A3] leading-tight">
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-auto">
        {isCurrentPlan ? (
          <div className="w-full text-center py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 border border-gray-100 dark:border-[#1C1C1C] text-gray-400 dark:text-[#525252] bg-gray-50/50 dark:bg-white/[0.02]">
            <ShieldCheck weight="bold" className="h-4 w-4" />
            Current Plan
          </div>
        ) : (
          <button
            onClick={() => onUpgrade(tier)}
            disabled={isUpgrading}
            className={cn(
              "w-full py-3 rounded-xl text-[13px] font-black transition-all duration-200 active:scale-[0.98]",
              isHighlighted
                ? "bg-[#3A9B9F] text-white hover:bg-[#2F8488] shadow-lg shadow-[#3A9B9F]/10"
                : "bg-gray-100 dark:bg-[#111] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#1A1A1A]",
              isUpgrading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isUpgrading ? (
              <CircleNotch className="h-4 w-4 animate-spin mx-auto text-current" />
            ) : (
              `Select ${config.name.toLowerCase()}`
            )}
          </button>
        )}
      </div>
    </div>
  )
}
