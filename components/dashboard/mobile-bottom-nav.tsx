"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChatCircleDots,
  Users,
  CalendarBlank,
  User,
  SquaresFour,
  FileText,
  Lightning,
  ChartBar,
  Stack,
  SignOut,
  X,
  GearSix,
  ShieldCheck,
  House,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import { getUnreadConversationCount, subscribeToConversations, signOut } from "@/lib/supabase"
import { toast } from "sonner"
import type { Customer } from "@/types/database"
import { Avatar } from "@/components/ui/avatar"

// Primary tabs displayed in the bottom bar
const primaryTabs = [
  { href: "/dashboard/analytics", label: "Home", icon: House, exact: false },
  { href: "/dashboard", label: "Inbox", icon: ChatCircleDots, exact: true },
  { href: "#profile", label: "Profile", icon: User, exact: false },
]



// Secondary items shown in the "More" sheet
const moreItems = [
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/automations", label: "Automation", icon: Lightning },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarBlank },
  { href: "/dashboard/settings", label: "Settings", icon: GearSix },
]

interface MobileBottomNavProps {
  customer: Customer | null
  personalProfile: Customer | null
  onOpenSettings: () => void
}

export function MobileBottomNav({ customer, personalProfile, onOpenSettings }: MobileBottomNavProps) {
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
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#0A0A0A] rounded-t-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-[#222222]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#222222]">
              <h2 className="text-base font-semibold text-[#213138] dark:text-gray-100" style={{ fontFamily: "var(--font-lexend)" }}>
                More
              </h2>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#111111] transition-colors text-gray-400 dark:text-gray-500"
              >
                <X weight="bold" className="h-5 w-5" />
              </button>
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-2 gap-3 p-6">
              {moreItems.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                const isSettings = item.label === "Settings"
                
                return (
                  <div
                    key={item.href}
                    onClick={(e) => {
                      if (isSettings) {
                        e.preventDefault()
                        setShowMore(false)
                        onOpenSettings()
                      }
                    }}
                    className="w-full"
                  >
                    {isSettings ? (
                      <div
                        className={cn(
                          "flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.97] cursor-pointer",
                          "bg-gray-50 border-gray-100 text-gray-600 dark:bg-[#111111] dark:border-[#222222] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333333]"
                        )}
                      >
                        <Icon weight="bold" className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 active:scale-[0.97]",
                          active
                            ? "bg-[#007B85]/10 border-[#007B85]/20 text-[#007B85] dark:bg-[#007B85]/20 dark:border-[#007B85]/30"
                            : "bg-gray-50 border-gray-100 text-gray-600 dark:bg-[#111111] dark:border-[#222222] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333333]"
                        )}
                      >
                        <Icon weight="bold" className={cn("h-6 w-6", active ? "text-[#007B85]" : "text-gray-400 dark:text-gray-500")} />
                        <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Sign out */}
            <div className="px-6 pb-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <SignOut weight="bold" className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-black border-t border-gray-200 dark:border-[#222222]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch">
          {/* Primary tabs */}
          {primaryTabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href, tab.exact)
            const isInbox = tab.href === "/dashboard" && tab.exact
            const isProfile = tab.label === "Profile"

            if (isProfile) {
              return (
                <Link
                  key={tab.label}
                  href="/dashboard/profile"
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors duration-200",
                    pathname.startsWith("/dashboard/profile") ? "text-[#007B85]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  <div className="relative flex h-6 w-6 items-center justify-center">
                    <Avatar
                      fallback={personalProfile?.full_name || personalProfile?.contact_email || "U"}
                      className={cn(
                        "h-6 w-6 text-[10px] ring-2",
                        pathname.startsWith("/dashboard/profile") ? "ring-[#007B85]" : "ring-transparent dark:ring-transparent"
                      )}
                    />
                  </div>
                  <span className="text-[10px] font-medium tracking-wide transition-colors duration-200">
                    Profile
                  </span>
                  {pathname.startsWith("/dashboard/profile") && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#007B85]" />
                  )}
                </Link>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors duration-200",
                  active ? "text-[#007B85]" : "text-gray-400"
                )}
              >
                <div className="relative">
                  <Icon weight="bold" className={cn("h-6 w-6 transition-colors duration-200", active ? "text-[#007B85]" : "text-gray-400")} />
                  {/* Unread dot on Inbox */}
                  {isInbox && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#25D366] text-[10px] font-bold text-white px-0.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-medium tracking-wide transition-colors duration-200", active ? "text-[#007B85]" : "text-gray-400")}>
                  {tab.label}
                </span>
                {/* Active indicator pill */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#007B85]" />
                )}
              </Link>
            )
          })}

          {/* More tab */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors duration-200",
              isMoreActive || showMore ? "text-[#007B85]" : "text-gray-400"
            )}
          >
            <SquaresFour weight="bold" className={cn("h-6 w-6 transition-colors duration-200", isMoreActive || showMore ? "text-[#007B85]" : "text-gray-400")} />
            <span className={cn("text-[10px] font-medium tracking-wide", isMoreActive || showMore ? "text-[#007B85]" : "text-gray-400")}>
              More
            </span>
            {(isMoreActive || showMore) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#007B85]" />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
