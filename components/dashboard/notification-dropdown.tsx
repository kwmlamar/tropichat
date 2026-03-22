"use client"

import { useRef } from "react"
import { Checks as CheckCheck, Bell } from "@phosphor-icons/react"
import { useOnClickOutside } from "@/lib/hooks"
import { NotificationItem } from "./notification-item"
import type { Notification } from "@/types/database"

interface NotificationDropdownProps {
  notifications: Notification[]
  isOpen: boolean
  onClose: () => void
  onNotificationClick: (notification: Notification) => void
  onMarkAllRead: () => void
  loading?: boolean
}

export function NotificationDropdown({
  notifications,
  isOpen,
  onClose,
  onNotificationClick,
  onMarkAllRead,
  loading,
}: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, onClose)

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-[9999] mt-2 w-80 overflow-hidden rounded-xl bg-white dark:bg-[#0A0A0A] shadow-xl ring-1 ring-black/5 dark:ring-white/10 border dark:border-[#222222] sm:w-96"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#222222] px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#3A9B9F]/10 px-2 py-0.5 text-xs font-medium text-[#3A9B9F]">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs font-medium text-[#3A9B9F] hover:text-[#2F8488] transition-colors"
          >
            <CheckCheck weight="bold" className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3A9B9F] border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="mb-3 rounded-full bg-gray-100 dark:bg-[#111111] p-3">
              <Bell weight="bold" className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">All caught up!</p>
            <p className="mt-1 text-xs text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-[#222222]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={onNotificationClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
