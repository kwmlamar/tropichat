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
  isTrial?: boolean
  onClose: () => void
  onConfirm: (tier: PlanTier, interval: BillingInterval) => Promise<void>
  onTrialUpgrade?: (tier: PlanTier) => Promise<void>
}

const TIER_LABELS: Record<PlanTier, string> = {
  starter: "🚀 Starter",
  medium: "🌴 Medium",
  pro: "🏝️ Pro",
  elite: "👑 Elite",
}

const PRICES: Record<PlanTier, { monthly: number; annual: number }> = {
  starter: { monthly: 15, annual: 144 },
  medium: { monthly: 35, annual: 336 },
  pro: { monthly: 75, annual: 720 },
  elite: { monthly: 150, annual: 1440 },
}

export function UpgradeModal({
  tier,
  billingInterval,
  isOpen,
  isTrial,
  onClose,
  onConfirm,
  onTrialUpgrade,
}: UpgradeModalProps) {
  const [step, setStep] = useState<"confirm" | "success">("confirm")
  const [isProcessing, setIsProcessing] = useState(false)

  const label = TIER_LABELS[tier]
  const prices = PRICES[tier]
  const price = billingInterval === "annual" ? prices.annual : prices.monthly
  const priceLabel = billingInterval === "annual" ? `$${price}/yr` : `$${price}/mo`

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      if (isTrial && onTrialUpgrade) {
        await onTrialUpgrade(tier)
      } else {
        await onConfirm(tier, billingInterval)
      }
      setStep("success")
    } catch {
      // toast is handled in parent
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setStep("confirm")
    onClose()
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step === "confirm" ? handleClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[110]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] z-[120] bg-white dark:bg-[#080808] rounded-[28px] overflow-hidden border border-gray-100 dark:border-[#1C1C1C] shadow-2xl"
          >
            {step === "success" ? (
              <UpgradeSuccess tier={tier} onContinue={handleClose} />
            ) : (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center bg-[#3A9B9F]/10 rounded-xl">
                      <ShieldCheck weight="bold" className="h-6 w-6 text-[#3A9B9F]" />
                    </div>
                    <h3 className="text-[17px] font-black text-gray-900 dark:text-white">Review Plan</h3>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#111] text-gray-400 transition-colors"
                  >
                    <X weight="bold" className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50/50 dark:bg-[#111]/50 border border-gray-100 dark:border-[#1C1C1C] mb-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Plan</span>
                    <span className="text-[15px] font-black text-gray-900 dark:text-white">{label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Billing</span>
                    <span className="text-[15px] font-black text-gray-900 dark:text-white capitalize">{billingInterval}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 dark:border-[#222] flex justify-between items-center">
                    <span className="text-[14px] font-black text-gray-900 dark:text-white">Total</span>
                    <span className="text-[20px] font-black text-[#3A9B9F]">{isTrial ? "Trial Access" : priceLabel}</span>
                  </div>
                </div>

                <p className="text-[12px] font-medium text-gray-500 mb-8 text-center leading-relaxed">
                  {isTrial 
                    ? "As part of your 14-day free trial, you can instantly test this tier without a credit card."
                    : "You'll be redirected to Stripe to securely complete your payment."}
                </p>

                <motion.button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#3A9B9F] text-white font-black py-4 rounded-[18px] text-[15px] transition-all hover:bg-[#2F8488] shadow-lg shadow-[#3A9B9F]/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <CircleNotch className="h-5 w-5 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    isTrial ? `Start ${label.split(' ')[1]} Trial →` : `Subscribe to ${label.split(' ')[1]} →`
                  )}
                </motion.button>

                <button
                  onClick={handleClose}
                  className="w-full mt-4 text-[13px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors py-2"
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
