"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Inbox,
  Users,
  FileText,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  FileStack,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { signOut, getUnreadConversationCount, subscribeToConversations } from "@/lib/supabase"
import { toast } from "sonner"
import type { Customer } from "@/types/database"

interface SidebarProps {
  customer: Customer | null
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

const navItems = [
  { href: "/dashboard", label: "Inbox", icon: Inbox },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/page-selection", label: "Page Selection", icon: FileStack },
  { href: "/dashboard/automations", label: "Automations", icon: Zap },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
]

export function Sidebar({ customer, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread conversation count
  const fetchUnreadCount = useCallback(async () => {
    const { count } = await getUnreadConversationCount()
    setUnreadCount(count)
  }, [])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Subscribe to conversation changes to update count in real-time
  useEffect(() => {
    if (!customer?.id) return

    const unsubscribe = subscribeToConversations(customer.id, () => {
      // Refetch count whenever any conversation changes
      fetchUnreadCount()
    })

    return unsubscribe
  }, [customer?.id, fetchUnreadCount])

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error(error)
      return
    }
    router.push("/login")
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <>
      {/* Workspace Header */}
      <div className={cn("flex shrink-0 items-center pt-6 pb-4", collapsed ? "justify-center px-2" : "gap-3 px-4")}>
        <Image
          src="/tropichat-logo.png"
          alt="TropiChat"
          width={80}
          height={80}
          unoptimized
          className={cn("shrink-0 object-contain transition-all duration-300", collapsed ? "h-11 w-11" : "h-20 w-20")}
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">
              {customer?.business_name || "TropiChat"}
            </p>
            <p className="text-xs text-gray-400">Workspace</p>
          </div>
        )}
      </div>

      {/* Navigation - scrollable so footer stays visible */}
      <nav className={cn("flex-1 min-h-0 overflow-y-auto pt-0 pb-4 space-y-1", collapsed ? "px-2" : "px-4")}>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative",
                collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5",
                active
                  ? "bg-[#3A9B9F]/10 text-[#3A9B9F]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("shrink-0", active ? "text-[#3A9B9F]" : "text-gray-400", collapsed ? "h-6 w-6" : "h-5 w-5")} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.label === "Inbox" && unreadCount > 0 && (
                <Badge variant="danger" size="sm" className="ml-auto">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
              {collapsed && item.label === "Inbox" && unreadCount > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan Badge + User - footer stays at bottom */}
      {!collapsed && customer && customer.plan !== "professional" && (
        <div className="mx-4 mb-4 flex-shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-[#FF8B66]" />
              <span className="text-sm font-semibold text-gray-900">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Get unlimited team members, analytics, and more.
            </p>
            <Link
              href="/dashboard/settings?tab=billing"
              className="block w-full text-center text-xs font-semibold text-white bg-[#FF8B66] hover:bg-[#ff7b52] rounded-lg py-2 transition-all shadow-sm"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Actions & User Profile */}
      <div className={cn("flex-shrink-0 mt-auto flex flex-col gap-1", collapsed ? "px-2 py-4" : "p-4")}>
        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!collapsed)}
          className={cn(
            "hidden lg:flex items-center rounded-xl text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full",
            collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5 text-left"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="shrink-0 h-6 w-6 text-gray-400" /> : <PanelLeftClose className="shrink-0 h-5 w-5 text-gray-400" />}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* Settings Button */}
        <Link
          href="/dashboard/settings"
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-all duration-200 mb-1 w-full",
            collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5 text-left",
            isActive("/dashboard/settings")
              ? "bg-[#3A9B9F]/10 text-[#3A9B9F]"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className={cn("shrink-0", isActive("/dashboard/settings") ? "text-[#3A9B9F]" : "text-gray-400", collapsed ? "h-6 w-6" : "h-5 w-5")} />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* User Profile */}
        <Dropdown
          align="left"
          side="top"
          trigger={
            <button className={cn("flex w-full min-w-0 items-center rounded-xl hover:bg-gray-100 transition-colors overflow-hidden border border-transparent hover:border-gray-200", collapsed ? "justify-center p-2" : "gap-3 p-2 min-w-0")}>
              <Avatar
                fallback={customer?.business_name || "User"}
                size="sm"
                className="shrink-0 ring-2 ring-white"
              />
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {customer?.contact_email || "Loading..."}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                </>
              )}
            </button>
          }
        >
          <DropdownItem
            icon={<Settings className="h-4 w-4" />}
            onClick={() => router.push("/dashboard/settings")}
          >
            Settings
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem
            icon={<LogOut className="h-4 w-4" />}
            onClick={handleSignOut}
            destructive
          >
            Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/tropichat-logo.png"
              alt="TropiChat"
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 shrink-0 object-contain"
            />
            <p className="text-sm font-bold text-gray-900 truncate">
              {customer?.business_name || "TropiChat"}
            </p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-14 bottom-0 w-72 bg-white flex flex-col overflow-y-auto overflow-x-hidden shadow-2xl z-40">
            <SidebarContent collapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex lg:flex-col lg:min-h-0 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-[#F9FAFB] lg:border-r lg:border-gray-200 transition-all duration-300", isCollapsed ? "lg:w-20" : "lg:w-72")}>
        <SidebarContent collapsed={isCollapsed} />
      </div>
    </>
  )
}
