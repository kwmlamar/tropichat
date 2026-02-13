"use client"

import { MessageSquare, UserPlus, Bell, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "@/lib/utils"
import type { Notification } from "@/types/database"

interface NotificationItemProps {
  notification: Notification
  onClick: (notification: Notification) => void
}

const typeConfig = {
  new_message: {
    icon: MessageSquare,
    color: "text-[#3A9B9F]",
    bg: "bg-[#3A9B9F]/10",
  },
  mention: {
    icon: Bell,
    color: "text-[#FF8B66]",
    bg: "bg-[#FF8B66]/10",
  },
  assignment: {
    icon: UserPlus,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  system: {
    icon: AlertCircle,
    color: "text-gray-500",
    bg: "bg-gray-100",
  },
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const config = typeConfig[notification.type] || typeConfig.system
  const Icon = config.icon

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
        !notification.read && "bg-[#3A9B9F]/[0.03]"
      )}
    >
      {/* Icon */}
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.bg)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-snug", !notification.read ? "font-semibold text-gray-900" : "text-gray-700")}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#3A9B9F]" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notification.message}</p>
        <p className="mt-1 text-xs text-gray-400">{formatDistanceToNow(notification.created_at)}</p>
      </div>
    </button>
  )
}
