"use client"

import { useEffect } from "react"
import { motion, useAnimate, useReducedMotion } from "framer-motion"
import { Check } from "@phosphor-icons/react"
import type { PlanTier } from "./PricingCard"

interface UpgradeSuccessProps {
  tier: PlanTier
  onContinue: () => void
}

const TIER_DETAILS: Record<PlanTier, { name: string; emoji: string; benefits: string[] }> = {
  starter: {
    name: "Starter",
    emoji: "🚀",
    benefits: ["500 contacts", "Unified Inbox", "Basic AI smart replies", "Mobile app access"],
  },
  medium: {
    name: "Medium",
    emoji: "🌴",
    benefits: ["2,500 contacts", "Bulk WhatsApp broadcasts", "QR Code generator", "CRM profile tracking"],
  },
  pro: {
    name: "Pro",
    emoji: "🏝️",
    benefits: ["10,000 contacts", "Unlimited team members", "AI knowledge base", "Booking & payment links"],
  },
  elite: {
    name: "Elite",
    emoji: "👑",
    benefits: ["Unlimited contacts", "White-label dashboard", "Custom API access", "24/7 VIP support"],
  },
}

function Confetti() {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const particles = Array.from({ length: 16 }, (_, i) => i)
    particles.forEach((i) => {
      const angle = (i / 16) * 360
      const distance = 80 + Math.random() * 60
      const x = Math.cos((angle * Math.PI) / 180) * distance
      const y = Math.sin((angle * Math.PI) / 180) * distance - 40
      animate(
        `[data-particle="${i}"]`,
        { x, y, opacity: [1, 1, 0], scale: [0, 1, 0.5] },
        { duration: 1, delay: i * 0.04, ease: "easeOut" }
      )
    })
  }, [animate])

  return (
    <div ref={scope} className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          data-particle={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: i % 2 === 0 ? "#3A9B9F" : "#14B8A6",
          }}
        />
      ))}
    </div>
  )
}

export function UpgradeSuccess({ tier, onContinue }: UpgradeSuccessProps) {
  const shouldReduceMotion = useReducedMotion()
  const details = TIER_DETAILS[tier]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center justify-center min-h-[460px] text-center px-8 py-12 bg-white dark:bg-[#080808] overflow-hidden"
    >
      {!shouldReduceMotion && <Confetti />}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        className="w-20 h-20 bg-[#3A9B9F]/10 rounded-[28px] flex items-center justify-center mb-6"
      >
        <span className="text-4xl">{details.emoji}</span>
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[22px] font-black text-gray-900 dark:text-white mb-2"
      >
        Welcome to {details.name}! 🎉
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-[14px] font-medium text-gray-400 mb-8 max-w-xs"
      >
        You&apos;re now on the {details.name} plan. Your business just leveled up.
      </motion.p>

      {details.benefits.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 mb-10 w-full max-w-xs text-left"
        >
          {details.benefits.map((b) => (
            <div key={b} className="flex items-center gap-3 text-[14px] font-bold text-gray-500 dark:text-gray-400">
              <div className="h-5 w-5 rounded-full bg-[#3A9B9F]/10 flex items-center justify-center shrink-0">
                <Check weight="bold" className="h-3 w-3 text-[#3A9B9F]" />
              </div>
              {b}
            </div>
          ))}
        </motion.div>
      )}

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onContinue}
        whileTap={{ scale: 0.97 }}
        className="w-full bg-[#3A9B9F] text-white font-black py-4 rounded-[18px] text-[15px] hover:bg-[#2F8488] transition-all shadow-lg shadow-[#3A9B9F]/20"
      >
        Go to Dashboard →
      </motion.button>
    </motion.div>
  )
}
