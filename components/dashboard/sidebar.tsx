"use client"

import { useState } from "react"
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
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { signOut } from "@/lib/supabase"
import { toast } from "sonner"
import type { Customer } from "@/types/database"

interface SidebarProps {
  customer: Customer | null
}

const navItems = [
  { href: "/dashboard", label: "Inbox", icon: Inbox },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/automations", label: "Automations", icon: Zap },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ customer }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-white/10">
        <Image
          src="/tropichat-full-logo2.png"
          alt="TropiChat"
          width={160}
          height={44}
          unoptimized
          className="h-11 w-auto object-contain shrink-0 -translate-x-5"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[#3A9B9F]/20 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-[#3A9B9F]" : "text-gray-400")} />
              {item.label}
              {item.label === "Inbox" && (
                <Badge variant="danger" size="sm" className="ml-auto">
                  3
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan Badge */}
      {customer && customer.plan !== "professional" && (
        <div className="mx-3 mb-4">
          <div className="rounded-xl bg-white/10 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-[#FF8B66]" />
              <span className="text-sm font-semibold text-white">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Get unlimited team members, analytics, and more.
            </p>
            <Link
              href="/dashboard/settings?tab=billing"
              className="block w-full text-center text-xs font-medium text-white bg-[#3A9B9F] hover:bg-[#2F8488] rounded-lg py-2 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <Dropdown
          align="left"
          trigger={
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-white/10 transition-colors">
              <Avatar
                fallback={customer?.business_name || "User"}
                size="sm"
              />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {customer?.business_name || "Loading..."}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {customer?.contact_email || ""}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#213138] border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1 flex items-center justify-center min-w-0">
            <Image
              src="/tropichat-full-logo2.png"
              alt="TropiChat"
              width={140}
              height={38}
              unoptimized
              className="h-9 w-auto object-contain shrink-0 -translate-x-5"
            />
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:bg-white/10 rounded-lg"
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
          <div className="fixed left-0 top-14 bottom-0 w-72 bg-[#213138] flex flex-col overflow-y-auto">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-white/10 lg:bg-[#213138]">
        <SidebarContent />
      </div>
    </>
  )
}
