"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3A9B9F] border-t-transparent" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar customer={customer} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main content */}
      <div className={cn("flex flex-col flex-1 min-w-0 h-screen overflow-hidden transition-all duration-300", isCollapsed ? "lg:pl-20" : "lg:pl-72")}>
        {/* Mobile header spacer */}
        <div className="h-14 lg:h-0 flex-shrink-0" />

        {/* Page content — scrolls internally */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
