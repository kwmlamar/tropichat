"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3A9B9F] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#3A9B9F] shadow-[0_0_15px_rgba(58,155,159,0.15)]" : "bg-gray-200",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] ring-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}
