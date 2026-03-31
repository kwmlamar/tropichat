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
      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest mb-2">
        <span className="text-gray-500 dark:text-[#525252]">{label}</span>
        <span
          className={cn(
            isLimit ? "text-red-500" : isWarning ? "text-orange-500" : "text-[#3A9B9F]"
          )}
        >
          {used} / {limit}
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isLimit
              ? "bg-red-500"
              : isWarning
              ? "bg-orange-500"
              : "bg-[#3A9B9F]"
          )}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {(isLimit || isWarning) && (
        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
          {isLimit ? (
            <>
              <XCircle weight="fill" className="h-3.5 w-3.5 text-red-500" />
              <span className="text-red-500 uppercase tracking-tight">Limit reached</span>
            </>
          ) : (
            <>
              <Warning weight="fill" className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-orange-500 uppercase tracking-tight">Usage high</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
