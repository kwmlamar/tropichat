"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Warning, XCircle } from "@phosphor-icons/react"

interface UsageBarProps {
  used: number
  limit: number
  label: string
}

export function UsageBar({ used, limit, label }: UsageBarProps) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const isWarning = pct >= 80 && pct < 100
  const isLimit = pct >= 100

  return (
    <div
      className="space-y-1.5"
      role="progressbar"
      aria-valuenow={used}
      aria-valuemax={limit}
      aria-label={label}
    >
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-white/80">{label}</span>
        <span
          className={cn(
            "font-bold",
            isLimit ? "text-red-400" : isWarning ? "text-orange-400" : "text-white/80"
          )}
        >
          {used} / {limit}
        </span>
      </div>

      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isLimit
              ? "bg-red-400"
              : isWarning
              ? "bg-[#F97316]"
              : "bg-[#F4C430]"
          )}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {isLimit && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
          <XCircle weight="fill" className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Limit reached — upgrade to continue accepting bookings.</span>
        </div>
      )}
      {isWarning && !isLimit && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-300">
          <Warning weight="fill" className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Running low — upgrade soon.</span>
        </div>
      )}
    </div>
  )
}
