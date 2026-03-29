"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"
import { SettingsModal } from "@/components/dashboard/settings-modal"
import { getSession, getCurrentCustomer, getPersonalCustomer } from "@/lib/supabase"
import { SplashLoader } from "@/components/splash-loader"
import type { Customer } from "@/types/database"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [personalProfile, setPersonalProfile] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { session } = await getSession()

      if (!session) {
        router.push("/login")
        return
      }

      // 1. Fetch workspace customer (for shared stuff)
      const { data: wsData } = await getCurrentCustomer()
      
      // REDIRECT TO ONBOARDING IF NOT DONE
      if (wsData && !(wsData as any).has_onboarded) {
        router.push("/onboarding")
        return
      }
      
      setCustomer(wsData)

      // 2. Fetch personal customer (for current user identity)
      const { data: pData } = await getPersonalCustomer()
      
      // ENSURE we have a valid profile object for the sidebar even if fetch had issues
      const fallbackProfile = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        contact_email: session.user.email || '',
      } as Customer

      setPersonalProfile(pData || fallbackProfile)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  return (
    <div className="h-screen h-[100dvh] bg-gray-50 dark:bg-black flex overflow-hidden">
      {/* Premium Entry Splash Loader — Sit on top */}
      <SplashLoader isLoading={loading} />

      {/* Dashboard UI — Renders in background immediately while loader reveals */}
      <Sidebar 
        customer={customer} 
        personalProfile={personalProfile}
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main content */}
      <div className={cn("flex flex-col flex-1 min-w-0 h-screen h-[100dvh] overflow-hidden transition-all duration-300", isCollapsed ? "lg:pl-20" : "lg:pl-72")}>
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav-container">
        <MobileBottomNav 
          customer={customer} 
          personalProfile={personalProfile} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Global Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={personalProfile}
      />
    </div>
  )
}
