"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PricingToggleProps {
  value: "monthly" | "annual"
  onChange: (value: "monthly" | "annual") => void
}

export function PricingToggle({ value, onChange }: PricingToggleProps) {
  return (
    <div
      className="inline-flex items-center bg-[#0F172A] border border-white/10 rounded-full p-1 gap-1"
      role="group"
      aria-label="Billing interval"
    >
      <button
        onClick={() => onChange("monthly")}
        className={cn(
          "relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]",
          value === "monthly" ? "text-[#0F172A]" : "text-white/60 hover:text-white/80"
        )}
        aria-pressed={value === "monthly"}
      >
        {value === "monthly" && (
          <motion.span
            layoutId="toggle-pill"
            className="absolute inset-0 bg-white rounded-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">Monthly</span>
      </button>

      <button
        onClick={() => onChange("annual")}
        className={cn(
          "relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]",
          value === "annual" ? "text-[#0F172A]" : "text-white/60 hover:text-white/80"
        )}
        aria-pressed={value === "annual"}
      >
        {value === "annual" && (
          <motion.span
            layoutId="toggle-pill"
            className="absolute inset-0 bg-[#F4C430] rounded-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          Annual
          <span className="text-[10px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full leading-none">
            -17%
          </span>
        </span>
      </button>
    </div>
  )
}
