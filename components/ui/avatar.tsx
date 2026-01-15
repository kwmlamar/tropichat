import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false)

    const sizes = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
    }

    const getInitials = (name?: string) => {
      if (!name) return "?"
      const words = name.trim().split(" ")
      if (words.length === 1) return words[0][0]?.toUpperCase() || "?"
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }

    const getColorFromName = (name?: string) => {
      if (!name) return "bg-gray-400"
      const colors = [
        "bg-blue-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-indigo-500",
        "bg-teal-500",
        "bg-orange-500",
        "bg-cyan-500",
        "bg-rose-500",
      ]
      const index = name.charCodeAt(0) % colors.length
      return colors[index]
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          sizes[size],
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center font-medium text-white",
              getColorFromName(fallback || alt)
            )}
          >
            {getInitials(fallback || alt)}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
