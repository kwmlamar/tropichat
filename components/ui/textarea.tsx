import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white dark:bg-[#111111] dark:border-[#222222] px-3 py-2 text-sm text-gray-900 dark:text-gray-100",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-[#007B85] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
