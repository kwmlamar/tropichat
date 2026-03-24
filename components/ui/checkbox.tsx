"use client"

import * as React from "react"
import { Check } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  className?: string
  checked?: boolean
  onChange?: (e: any) => void
  onCheckedChange?: (checked: boolean) => void
  id?: string
  disabled?: boolean
  defaultChecked?: boolean
  name?: string
  value?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, defaultChecked, checked, onCheckedChange, onChange, disabled, id, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false)
    const isChecked = checked !== undefined ? checked : internalChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      const nextChecked = e.target.checked
      if (checked === undefined) {
          setInternalChecked(nextChecked)
      }
      onCheckedChange?.(nextChecked)
      onChange?.(e)
    }

    return (
      <label 
        className={cn("relative inline-flex items-center group cursor-pointer", disabled && "cursor-not-allowed")}
      >
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className="peer sr-only"
          checked={isChecked}
          onChange={handleChange} 
          disabled={disabled}
          {...props}
        />
        <div
          className={cn(
            "h-[18px] w-[18px] shrink-0 rounded-md border transition-all duration-200 flex items-center justify-center",
            "group-focus-within:ring-2 group-focus-within:ring-[#007B85]/40 group-focus-within:ring-offset-2",
            disabled ? "opacity-40 cursor-not-allowed" : "active:scale-95",
            // Light mode
            !isChecked && "bg-white border-gray-200 hover:border-gray-300 shadow-sm",
            // Dark mode
            !isChecked && "dark:bg-[#0C0C0C] dark:border-[#1C1C1C] dark:hover:border-[#2A2A2A] dark:shadow-none",
            // Checked state (brand colors work in both modes)
            isChecked && "bg-[#007B85] border-[#007B85] text-white shadow-sm shadow-[#007B85]/10",
            className
          )}
        >
          <Check
            weight="bold"
            className={cn(
              "h-3 w-3 transition-all duration-200",
              isChecked ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )}
          />
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
