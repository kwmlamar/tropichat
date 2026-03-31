"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Lock, Crown, ShieldWarning } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { PlanTier, hasPermission, PERMISSIONS } from "@/lib/billing/permissions"
import { Button } from "@/components/ui/button"

interface PlanGateProps {
  plan: string | undefined
  feature: keyof typeof PERMISSIONS.free
  children: ReactNode
  className?: string
  variant?: "blur" | "simple" | "inline"
  onUpgradeClick?: () => void
}

export function PlanGate({
  plan,
  feature,
  children,
  className,
  variant = "blur",
  onUpgradeClick,
}: PlanGateProps) {
  const isAllowed = hasPermission(plan, feature)

  if (isAllowed) return <>{children}</>

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20", className)}>
        <Crown weight="fill" className="h-3 w-3" />
        Upgraded Plan Required
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden min-h-[100px]", className)}>
      {/* Blurred background content */}
      <div className={cn("pointer-events-none select-none", variant === "blur" && "blur-md opacity-40 grayscale")}>
        {children}
      </div>

      {/* Locked overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
        <div className="h-10 w-10 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-xl mb-3">
          <Lock weight="bold" className="h-5 w-5 text-orange-500" />
        </div>
        <h4 className="text-sm font-black text-[#213138] dark:text-white uppercase tracking-widest mb-1">Feature Locked</h4>
        <p className="text-[11px] font-bold text-gray-500 dark:text-[#525252] max-w-[180px] mb-4">
          This feature is available on higher tiers. Upgrade your plan to unlock.
        </p>
        <Button
          onClick={onUpgradeClick}
          className="bg-[#3A9B9F] text-white hover:bg-[#2F8488] rounded-xl font-bold h-8 text-[11px] px-4"
        >
          View Plans
        </Button>
      </div>
    </div>
  )
}

/**
 * Full page overlay for expired trials or suspended accounts.
 */
export function AccountBlocker({ 
  reason, 
  onOpenBilling 
}: { 
  reason: 'trial_expired' | 'suspended' | 'unauthenticated' | 'past_due',
  onOpenBilling: () => void 
}) {
  const content = {
    trial_expired: {
      icon: <Crown weight="bold" className="h-8 w-8 text-orange-500" />,
      title: "Free Trial Ended",
      message: "Your 14-day free trial has come to an end. Upgrade to a premium plan to keep using TropiChat and unlock all features.",
      button: "Select a Plan"
    },
    past_due: {
      icon: <ShieldWarning weight="bold" className="h-8 w-8 text-red-500" />,
      title: "Payment Required",
      message: "There was an issue processing your subscription payment. Please update your billing information to restore access.",
      button: "Update Billing"
    },
    suspended: {
      icon: <Lock weight="bold" className="h-8 w-8 text-red-500" />,
      title: "Access Restricted",
      message: "Your account access has been restricted. Please contact support or check your subscription status to continue.",
      button: "Manage Subscription"
    },
    unauthenticated: {
        icon: <Lock weight="bold" className="h-8 w-8 text-gray-500" />,
        title: "Session Expired",
        message: "You need to be logged in to access this workspace. Please sign in to continue.",
        button: "Sign In"
    }
  }[reason]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-10 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#1C1C1C] rounded-[40px] text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-2xl"
      >
        <div className="h-20 w-20 mx-auto flex items-center justify-center bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#222] rounded-3xl mb-8 shadow-inner">
          {content.icon}
        </div>
        <h2 className="text-3xl font-black text-[#213138] dark:text-white uppercase tracking-tight mb-3">
          {content.title}
        </h2>
        <p className="text-[15px] font-medium text-gray-500 dark:text-[#A3A3A3] mb-10 leading-relaxed px-2">
          {content.message}
        </p>
        <Button
          onClick={onOpenBilling}
          className="w-full bg-[#3A9B9F] text-white hover:bg-[#2F8488] h-14 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-[#3A9B9F]/20 transition-all active:scale-95"
        >
          {content.button}
        </Button>
      </motion.div>
    </div>
  )
}
