"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShieldCheck, CircleNotch } from "@phosphor-icons/react"
import { UpgradeSuccess } from "./UpgradeSuccess"
import type { PlanTier, BillingInterval } from "./PricingCard"

interface UpgradeModalProps {
  tier: PlanTier
  billingInterval: BillingInterval
  isOpen: boolean
  onClose: () => void
  onConfirm: (tier: PlanTier, interval: BillingInterval) => Promise<void>
}

const TIER_LABELS: Record<Exclude<PlanTier, "coconut">, string> = {
  tropic: "🌴 Tropic",
  island_pro: "🏝️ Island Pro",
}

const PRICES: Record<Exclude<PlanTier, "coconut">, { monthly: number; annual: number }> = {
  tropic: { monthly: 29, annual: 290 },
  island_pro: { monthly: 59, annual: 590 },
}

export function UpgradeModal({
  tier,
  billingInterval,
  isOpen,
  onClose,
  onConfirm,
}: UpgradeModalProps) {
  const [step, setStep] = useState<"confirm" | "success">("confirm")
  const [isProcessing, setIsProcessing] = useState(false)

  if (tier === "coconut") return null

  const label = TIER_LABELS[tier as Exclude<PlanTier, "coconut">]
  const prices = PRICES[tier as Exclude<PlanTier, "coconut">]
  const price = billingInterval === "annual" ? prices.annual : prices.monthly
  const priceLabel = billingInterval === "annual" ? `$${price}/yr` : `$${price}/mo`

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm(tier, billingInterval)
      setStep("success")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setStep("confirm")
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step === "confirm" ? handleClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet (mobile) / Dialog (tablet+) */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:w-[420px] z-50 bg-[#0F172A] rounded-t-3xl md:rounded-3xl overflow-hidden border border-white/10"
          >
            {step === "success" ? (
              <UpgradeSuccess tier={tier} onContinue={handleClose} />
            ) : (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-white">{label} — {priceLabel}</h3>
                  <button
                    onClick={handleClose}
                    aria-label="Close"
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Plan summary */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">Plan</span>
                    <span className="text-sm font-bold text-white">{label}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-sm text-white/70">Billing</span>
                    <span className="text-sm font-bold text-white capitalize">{billingInterval}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5 pt-2 border-t border-white/10">
                    <span className="text-sm font-bold text-white">Total</span>
                    <span className="text-base font-black text-[#F4C430]">{priceLabel}</span>
                  </div>
                </div>

                {/* Stripe redirect note */}
                <p className="text-xs text-white/40 mb-5 text-center">
                  You&apos;ll be redirected to Stripe to complete payment securely.
                </p>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mb-6">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secured by Stripe</span>
                </div>

                {/* CTA */}
                <motion.button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#F4C430] text-[#0F172A] font-black py-3.5 rounded-xl text-sm transition-opacity disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <CircleNotch className="h-4 w-4 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    `Pay ${priceLabel} →`
                  )}
                </motion.button>

                <button
                  onClick={handleClose}
                  className="w-full mt-3 text-sm text-white/40 hover:text-white/60 transition-colors py-2 focus-visible:outline-none"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
