"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { getSession, getCurrentCustomer } from "@/lib/supabase"
import type { Customer } from "@/types/database"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar customer={customer} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header spacer */}
        <div className="h-14 lg:h-0" />

        {/* Page content */}
        <main className="h-[calc(100vh-3.5rem)] lg:h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
