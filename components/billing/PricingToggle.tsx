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
      className="inline-flex items-center bg-gray-100 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-full p-1 gap-1"
      role="group"
      aria-label="Billing interval"
    >
      <button
        onClick={() => onChange("monthly")}
        className={cn(
          "relative px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007B85]",
          value === "monthly" ? "text-white" : "text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80"
        )}
        aria-pressed={value === "monthly"}
      >
        {value === "monthly" && (
          <motion.span
            layoutId="toggle-pill"
            className="absolute inset-0 bg-[#213138] dark:bg-[#007B85] rounded-full shadow-sm"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10">Monthly</span>
      </button>

      <button
        onClick={() => onChange("annual")}
        className={cn(
          "relative px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007B85]",
          value === "annual" ? "text-[#213138]" : "text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white/80"
        )}
        aria-pressed={value === "annual"}
      >
        {value === "annual" && (
          <motion.span
            layoutId="toggle-pill"
            className="absolute inset-0 bg-[#F4C430] rounded-full shadow-sm"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          Annual
          <span className={cn(
            "text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none uppercase tracking-tighter",
            value === "annual" ? "bg-white text-[#213138]" : "bg-[#4ADE80] text-white"
          )}>
            -20% OFF
          </span>
        </span>
      </button>
    </div>

  )
}
