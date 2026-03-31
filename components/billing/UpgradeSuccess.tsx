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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div ref={scope} className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          data-particle={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: i % 2 === 0 ? "#F4C430" : "#0D9488",
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
      className="relative flex flex-col items-center justify-center min-h-[420px] text-center px-6 py-10 bg-gradient-to-b from-[#0F172A] via-[#0D9488]/10 to-[#0F172A] rounded-2xl overflow-hidden"
    >
      {!shouldReduceMotion && <Confetti />}

      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
        className="text-6xl mb-4 block"
      >
        {details.emoji}
      </motion.span>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-black text-white mb-2"
      >
        Welcome to {details.name}! 🎉
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-white/60 mb-6 max-w-xs"
      >
        You&apos;re now on the {details.name} plan. Your Caribbean business just leveled up.
      </motion.p>

      {details.benefits.length > 0 && (
        <motion.ul
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-2 mb-8 w-full max-w-xs"
        >
          {details.benefits.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm text-white/80">
              <Check weight="bold" className="h-4 w-4 text-[#0D9488] flex-shrink-0" />
              {b}
            </li>
          ))}
        </motion.ul>
      )}

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onContinue}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-xs bg-[#F4C430] text-[#0F172A] font-black py-3 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
      >
        Go to Dashboard →
      </motion.button>
    </motion.div>
  )
}
