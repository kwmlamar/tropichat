"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"
import { getSession, getSupabase, getPersonalCustomer } from "@/lib/supabase"
import { SplashLoader } from "@/components/splash-loader"
import type { Customer } from "@/types/database"
import { cn } from "@/lib/utils"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [personalProfile, setPersonalProfile] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    async function checkAdminAuth() {
      const { session } = await getSession()

      if (!session) {
        router.push("/login")
        return
      }

      const client = getSupabase()
      
      // Check if user has admin/owner roles in team_members
      const { data: memberData } = await client
        .from('team_members')
        .select('role')
        .eq('user_id', session.user.id)
        .in('role', ['admin', 'owner'])
        .limit(1)

      if (!memberData || memberData.length === 0) {
        // Not an admin, redirect to dashboard
        router.push("/dashboard")
        return
      }

      setIsAuthorized(true)

      // Fetch personal profile for sidebar
      const { data: pData } = await getPersonalCustomer()
      
      const fallbackProfile = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Admin',
        contact_email: session.user.email || '',
      } as Customer

      setPersonalProfile(pData || fallbackProfile)
      setLoading(false)
    }

    checkAdminAuth()
  }, [router])

  if (loading) {
    return <SplashLoader isLoading={true} />
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="h-screen h-[100dvh] bg-gray-50 dark:bg-black flex overflow-hidden">
      {/* Sidebar - Using the same component but we'll customize links for Admin context later */}
      <Sidebar 
        customer={null} 
        personalProfile={personalProfile}
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      {/* Main content */}
      <div className={cn("flex flex-col flex-1 min-w-0 h-screen h-[100dvh] overflow-hidden transition-all duration-300", isCollapsed ? "lg:pl-20" : "lg:pl-72")}>
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0 pt-6 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <div className="bottom-nav-container md:hidden">
        <MobileBottomNav customer={null} personalProfile={personalProfile} />
      </div>
    </div>
  )
}
