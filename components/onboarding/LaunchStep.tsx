"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export type StepStatus = "completed" | "active" | "upcoming"

interface LaunchStepProps {
  stepNumber: number
  title: string
  status: StepStatus
  children?: React.ReactNode
}

export function LaunchStep({ stepNumber, title, status, children }: LaunchStepProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 overflow-hidden transition-colors",
        status === "active"
          ? "border-l-4 border-l-[#F4C430] border-t-[#F4C430]/20 border-r-[#F4C430]/20 border-b-[#F4C430]/20 bg-[#0F172A]"
          : status === "completed"
          ? "border-[#0D9488]/30 bg-[#0D9488]/5"
          : "border-white/5 bg-white/[0.02]"
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {status === "completed" ? (
          <CheckCircle weight="fill" className="h-5 w-5 text-[#0D9488] flex-shrink-0" />
        ) : (
          <span
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 border",
              status === "active"
                ? "border-[#F4C430] text-[#F4C430] bg-[#F4C430]/10"
                : "border-white/20 text-white/30"
            )}
          >
            {stepNumber}
          </span>
        )}
        <span
          className={cn(
            "text-sm font-semibold",
            status === "completed"
              ? "text-white/50 line-through"
              : status === "active"
              ? "text-white"
              : "text-white/30"
          )}
        >
          {title}
        </span>
      </div>

      {/* Expandable content for active step */}
      <AnimatePresence initial={false}>
        {status === "active" && children && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            aria-expanded={true}
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
