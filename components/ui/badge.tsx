import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "outline" | "primary" | "accent"
  size?: "sm" | "md"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variants = {
      default: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-900/50",
      secondary: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#262626] dark:text-gray-300 dark:border-[#2A2A2A]",
      success: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900/50",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-900/50",
      danger: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-900/50",
      outline: "bg-transparent text-gray-600 border-gray-300 dark:text-gray-400 dark:border-[#2A2A2A]",
      primary: "bg-[#3A9B9F] text-white border-none shadow-sm",
      accent: "bg-[#FF8B66] text-white border-none shadow-sm",
    }

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-xs",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border font-medium transition-colors",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
