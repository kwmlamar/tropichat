"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOnClickOutside } from "@/lib/hooks"

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
  /** "top" = open above trigger (e.g. for footer); "bottom" = open below (default) */
  side?: "top" | "bottom"
  className?: string
}

export function Dropdown({
  trigger,
  children,
  align = "left",
  side = "bottom",
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => setIsOpen(false))

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            "absolute z-[9999] min-w-[200px] rounded-[18px] bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xl py-2 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/40 dark:border-[#2A2A2A] ring-1 ring-black/[0.03]",
            "animate-in fade-in-0 scale-in-95 duration-200 ease-out",
            align === "right" ? "right-0" : "left-0",
            side === "top" ? "bottom-full mb-3" : "mt-3 top-full"
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
  icon?: React.ReactNode
  className?: string
}

export function DropdownItem({
  children,
  onClick,
  disabled,
  destructive,
  icon,
  className,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-all duration-200 mx-1 w-[calc(100%-8px)] rounded-xl",
        "hover:bg-[#3A9B9F]/5 dark:hover:bg-[#3A9B9F]/10 hover:text-[#3A9B9F] disabled:cursor-not-allowed disabled:opacity-50",
        destructive ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600" : "text-gray-600 dark:text-gray-300",
        className
      )}
    >
      {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
      <span className="flex-1 truncate font-medium">{children}</span>
    </button>
  )
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-gray-200 dark:bg-[#3A3A3A]" />
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </div>
  )
}

// Simple Select Dropdown
interface SimpleSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  disabled,
}: SimpleSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => setIsOpen(false))

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#262626] px-3 py-2 text-sm text-gray-900 dark:text-gray-100",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selectedOption && "text-gray-400 dark:text-gray-500"
        )}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-[18px] bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xl py-2 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/40 dark:border-[#2A2A2A] ring-1 ring-black/[0.03] animate-in fade-in-0 scale-in-95 duration-200 ease-out">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onValueChange(option.value)
                setIsOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 mx-1 w-[calc(100%-8px)] rounded-xl",
                "hover:bg-[#3A9B9F]/5 dark:hover:bg-[#2A2A2A] hover:text-[#3A9B9F]",
                option.value === value ? "bg-[#3A9B9F]/10 dark:bg-[#3A9B9F]/20 text-[#3A9B9F] font-semibold" : "text-gray-600 dark:text-gray-300"
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
