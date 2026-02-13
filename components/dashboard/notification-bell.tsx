"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from "@/lib/supabase"
import { NotificationDropdown } from "./notification-dropdown"
import type { Notification } from "@/types/database"

interface NotificationBellProps {
  customerId: string
}

export function NotificationBell({ customerId }: NotificationBellProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch notifications and unread count
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const [notifResult, countResult] = await Promise.all([
      getNotifications(20, 0),
      getUnreadNotificationCount(),
    ])

    if (notifResult.data) {
      setNotifications(notifResult.data)
    }
    setUnreadCount(countResult.count)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time subscription
  useEffect(() => {
    if (!customerId) return

    const unsubscribe = subscribeToNotifications(customerId, (newNotification) => {
      // Add to front of list
      setNotifications((prev) => [newNotification, ...prev].slice(0, 20))
      setUnreadCount((prev) => prev + 1)

      // Show toast for new notification
      toast(newNotification.title, {
        description: newNotification.message,
        duration: 5000,
      })
    })

    return unsubscribe
  }, [customerId])

  // Handle clicking a notification
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    // Navigate if link exists
    if (notification.link) {
      router.push(notification.link)
    }

    setIsOpen(false)
  }

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          isOpen
            ? "bg-white/20 text-white"
            : "text-gray-400 hover:bg-white/10 hover:text-white"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF8B66] px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        notifications={notifications}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllRead}
        loading={loading}
      />
    </div>
  )
}
