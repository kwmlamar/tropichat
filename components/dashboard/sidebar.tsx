"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { 
  ChatCircleDots,
  Users,
  FileText,
  Lightning,
  ChartBar,
  GearSix,
  SignOut,
  CaretDown,
  Stack,
  CalendarBlank,
  House,
  ArrowLineLeft,
  ArrowLineRight,
  Crown,
  ShieldCheck,
  Brain,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { signOut, getUnreadConversationCount, subscribeToConversations, getSupabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { Customer } from "@/types/database"
import { ThemeToggle } from "@/components/theme-toggle"

interface SidebarProps {
  customer: Customer | null
  personalProfile: Customer | null
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
  onOpenSettings: (tab?: string) => void
}

const navItems = [
  { href: "/dashboard/analytics", label: "Home", icon: House },
  { href: "/dashboard", label: "Inbox", icon: ChatCircleDots },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/automations", label: "Conversion Flows", icon: Lightning },
  { href: "/dashboard/ai", label: "Booking Assistant", icon: ShieldCheck },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarBlank },

]


export function Sidebar({ customer, personalProfile, isCollapsed, setIsCollapsed, onOpenSettings }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  // Fetch unread conversation count
  const fetchUnreadCount = useCallback(async () => {
    const { count } = await getUnreadConversationCount()
    setUnreadCount(count)
  }, [])

  useEffect(() => {
    fetchUnreadCount()

    // Check Admin Role using email allowlist
    async function checkRole() {
      const client = getSupabase()
      const { data: { session } } = await client.auth.getSession()
      if (!session) return

      const ADMIN_EMAILS = ["classicalsineus@gmail.com"]
      const userEmail = session.user.email?.toLowerCase() || ""
      
      if (ADMIN_EMAILS.includes(userEmail)) {
        setIsAdmin(true)
      }
    }
    checkRole()
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
      {/* Workspace Header - Modernized */}
      <div className={cn("flex shrink-0 items-center pt-8 pb-6", collapsed ? "justify-center px-3" : "px-5")}>
        <div className={cn(
          "flex items-center w-full transition-all duration-200",
          collapsed ? "justify-center" : "p-2 -m-2 rounded-xl hover:bg-gray-200/50 dark:hover:bg-[#111111]/50 cursor-default group"
        )}>
          <div className={cn(
            "shrink-0 flex items-center justify-center bg-white dark:bg-[#0A0A0A] rounded-xl shadow-sm border border-gray-100 dark:border-[#222222] transition-all duration-300",
            collapsed ? "h-10 w-10" : "h-10 w-10 group-hover:scale-105"
          )}>
            <Image
              src="/tropichat-logo.png"
              alt="TropiChat"
              width={40}
              height={40}
              unoptimized
              className="h-7 w-7 object-contain"
            />
          </div>
          
          {!collapsed && (
            <div className="min-w-0 flex-1 ml-3.5">
              <div className="flex items-center gap-1.5">
                <p className="text-[13.5px] font-black text-[#213138] dark:text-gray-100 truncate tracking-tight ">
                  {customer?.business_name || "TropiChat"}
                </p>
                <CaretDown className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 opacity-80">Workspace</p>
            </div>
          )}
        </div>
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
              onClick={() => {}}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-all duration-200 relative",
                collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5",
                active
                  ? "bg-[#3A9B9F]/10 text-[#3A9B9F] dark:bg-[#3A9B9F]/20"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#111111] dark:hover:text-gray-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("shrink-0", active ? "text-[#3A9B9F]" : "text-gray-400 dark:text-gray-500", collapsed ? "h-6 w-6" : "h-5.5 w-5.5")} />
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
          <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border border-orange-200/50 dark:border-orange-500/20 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-[#FF7E36]" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Get unlimited team members, analytics, and more.
            </p>
            <button
              onClick={() => onOpenSettings('billing')}
              className="block w-full text-center text-xs font-semibold text-white bg-[#FF7E36] hover:bg-[#ff7b52] rounded-lg py-2 transition-all shadow-sm"
            >
              View Plans
            </button>
          </div>
        </div>
      )}

      {/* Bottom Actions & User Profile */}
      <div className={cn("flex-shrink-0 mt-auto flex flex-col gap-1", collapsed ? "px-2 py-4" : "p-4")}>
        {/* Theme Toggle */}
        <div className={cn("flex items-center w-full mb-1", collapsed ? "justify-center" : "gap-3 px-1")}>
          <ThemeToggle />
          {!collapsed && <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>}
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!collapsed)}
          className={cn(
            "hidden lg:flex items-center rounded-xl text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#111111] dark:hover:text-gray-100 w-full",
            collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5 text-left"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ArrowLineRight className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          ) : (
            <ArrowLineLeft className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* Ghost Admin Link - Only for Pros */}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center rounded-xl text-sm font-bold transition-all duration-200 mb-1 w-full",
              collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5 text-left",
              isActive("/admin")
                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20"
                : "text-amber-600/70 hover:bg-amber-50 dark:text-amber-500/60 dark:hover:bg-amber-500/5 hover:text-amber-600"
            )}
            title={collapsed ? "Admin Portal" : undefined}
          >
            <ShieldCheck weight="bold" className={cn("shrink-0", isActive("/admin") ? "text-amber-600" : "text-amber-500/50", collapsed ? "h-6 w-6" : "h-5.5 w-5.5")} />
            {!collapsed && <span>Admin Portal</span>}
          </Link>
        )}



        {/* Settings Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            onOpenSettings()
          }}
          className={cn(
            "flex items-center rounded-xl text-sm font-medium transition-all duration-200 mb-1 w-full",
            collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5 text-left",
            isActive("/dashboard/settings")
              ? "bg-[#3A9B9F]/10 text-[#3A9B9F] dark:bg-[#3A9B9F]/20"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#111111] dark:hover:text-gray-100"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <GearSix className={cn("shrink-0", isActive("/dashboard/settings") ? "text-[#3A9B9F]" : "text-gray-400 dark:text-gray-500", collapsed ? "h-6 w-6" : "h-5.5 w-5.5")} />
          {!collapsed && <span>Settings</span>}
        </button>

        {/* User Profile */}
        <Dropdown
          align="left"
          side="top"
          trigger={
            <button className={cn("flex w-full min-w-0 items-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#111111] transition-colors overflow-hidden border border-transparent hover:border-gray-200 dark:hover:border-[#222222]", collapsed ? "justify-center p-2" : "gap-3 p-2 min-w-0")}>
              <Avatar
                fallback={personalProfile?.full_name || personalProfile?.contact_email || "U"}
                size="sm"
                className="shrink-0 ring-2 ring-white dark:ring-[#222222]"
              />
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {personalProfile?.full_name || personalProfile?.contact_email || "User"}
                    </p>
                  </div>
                  <CaretDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                </>
              )}
            </button>
          }
        >
          <DropdownItem
            icon={<GearSix className="h-4 w-4" />}
            onClick={onOpenSettings}
          >
            Settings
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem
            icon={<SignOut className="h-4 w-4" />}
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
      {/* Mobile navigation is handled by MobileBottomNav in the layout */}

      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex lg:flex-col lg:min-h-0 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-[#F9FAFB] lg:border-r lg:border-gray-200 dark:lg:bg-black dark:lg:border-[#222222] transition-all duration-300", isCollapsed ? "lg:w-20" : "lg:w-72")}>
        <SidebarContent collapsed={isCollapsed} />
      </div>
    </>
  )
}
