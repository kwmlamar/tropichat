import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  )
}

export function SkeletonText({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-gray-200 p-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonMessage({ direction = "inbound" }: { direction?: "inbound" | "outbound" }) {
  return (
    <div className={cn("flex", direction === "outbound" ? "justify-end" : "justify-start")}>
      <div className={cn(
        "rounded-2xl px-4 py-2",
        direction === "outbound" ? "bg-blue-100" : "bg-gray-100"
      )}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1 h-3 w-24" />
      </div>
    </div>
  )
}
