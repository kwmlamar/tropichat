"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"
import { getSession, getCurrentCustomer } from "@/lib/supabase"
import type { Customer } from "@/types/database"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { session } = await getSession()

      if (!session) {
        router.push("/login")
        return
      }

      const { data } = await getCurrentCustomer()
      setCustomer(data)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-[#3A9B9F]/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-[2rem] bg-white dark:bg-[#1E1E1E] shadow-[0_8px_30px_rgba(58,155,159,0.2)] animate-pulse" />
            <img 
              src="/tropichat-logo.png" 
              alt="TropiChat" 
              className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-md animate-[pulse_2s_ease-in-out_infinite]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#3A9B9F] animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-[#FF8B66] animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-[#3A9B9F] animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen h-[100dvh] bg-gray-50 dark:bg-[#121212] flex overflow-hidden">
      <Sidebar customer={customer} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main content */}
      <div className={cn("flex flex-col flex-1 min-w-0 h-screen h-[100dvh] overflow-hidden transition-all duration-300", isCollapsed ? "lg:pl-20" : "lg:pl-72")}>
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>
      {/* Mobile Bottom Navigation — hidden when a thread is active via body class */}
      <div className="bottom-nav-container">
        <MobileBottomNav customer={customer} />
      </div>
    </div>
  )
}
