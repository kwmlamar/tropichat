"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  MessageCircle,
  Users,
  CalendarDays,
  Settings,
  User,
  LayoutGrid,
  FileText,
  Zap,
  BarChart3,
  FileStack,
  LogOut,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import { getUnreadConversationCount, subscribeToConversations, signOut } from "@/lib/supabase"
import { toast } from "sonner"
import type { Customer } from "@/types/database"

// Primary tabs displayed in the bottom bar
const primaryTabs = [
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays, exact: false },
  { href: "/dashboard", label: "Chats", icon: MessageCircle, exact: true },
  { href: "/dashboard/settings", label: "Profile", icon: User, exact: false },
]

// Secondary items shown in the "More" sheet
const moreItems = [
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/automations", label: "Automations", icon: Zap },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/page-selection", label: "Page Selection", icon: FileStack },
]

interface MobileBottomNavProps {
  customer: Customer | null
}

export function MobileBottomNav({ customer }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    const { count } = await getUnreadConversationCount()
    setUnreadCount(count)
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  useEffect(() => {
    if (!customer?.id) return
    const unsubscribe = subscribeToConversations(customer.id, () => {
      fetchUnreadCount()
    })
    return unsubscribe
  }, [customer?.id, fetchUnreadCount])

  // Close "More" sheet when navigating
  useEffect(() => {
    setShowMore(false)
  }, [pathname])

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href))

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error(error)
      return
    }
    router.push("/login")
  }


  return (
    <>
      {/* "More" bottom sheet overlay */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setShowMore(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1E1E1E] rounded-t-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-[#2A2A2A]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2A2A2A]">
              <h2 className="text-base font-semibold text-[#213138] dark:text-gray-100" style={{ fontFamily: "var(--font-poppins)" }}>
                More
              </h2>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors text-gray-400 dark:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-2 gap-3 p-6">
              {moreItems.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.97]",
                      active
                        ? "bg-[#3A9B9F]/10 border-[#3A9B9F]/20 text-[#3A9B9F] dark:bg-[#3A9B9F]/20 dark:border-[#3A9B9F]/30"
                        : "bg-gray-50 border-gray-100 text-gray-600 dark:bg-[#262626] dark:border-[#2A2A2A] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333333]"
                    )}
                  >
                    <Icon className={cn("h-6 w-6", active ? "text-[#3A9B9F]" : "text-gray-400 dark:text-gray-500")} />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Sign out */}
            <div className="px-6 pb-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-[#2A2A2A]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch">
          {/* Primary tabs */}
          {primaryTabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href, tab.exact)
            const isInbox = tab.href === "/dashboard" && tab.exact

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors duration-200",
                  active ? "text-[#3A9B9F]" : "text-gray-400"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-6 w-6 transition-colors duration-200", active ? "text-[#3A9B9F]" : "text-gray-400")} />
                  {/* Unread dot on Inbox */}
                  {isInbox && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-bold text-white px-0.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-medium tracking-wide transition-colors duration-200", active ? "text-[#3A9B9F]" : "text-gray-400")}>
                  {tab.label}
                </span>
                {/* Active indicator pill */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#3A9B9F]" />
                )}
              </Link>
            )
          })}

          {/* More tab */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors duration-200",
              isMoreActive || showMore ? "text-[#3A9B9F]" : "text-gray-400"
            )}
          >
            <LayoutGrid className={cn("h-6 w-6 transition-colors duration-200", isMoreActive || showMore ? "text-[#3A9B9F]" : "text-gray-400")} />
            <span className={cn("text-[10px] font-medium tracking-wide", isMoreActive || showMore ? "text-[#3A9B9F]" : "text-gray-400")}>
              More
            </span>
            {(isMoreActive || showMore) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#3A9B9F]" />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
