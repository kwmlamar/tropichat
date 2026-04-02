"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { CaretLeft, CircleNotch } from "@phosphor-icons/react"
import { getCurrentCustomer, getPersonalCustomer } from "@/lib/supabase"
import { getMetaStatus } from "@/lib/meta-connections"
import { TabContent, type Tab } from "@/components/dashboard/settings-modal"
import type { Customer } from "@/types/database"
import type { MetaStatus } from "@/lib/meta-connections"

const titleMap: Record<string, string> = {
  profile: "Profile Details",
  hours: "Business Hours",
  team: "Team Members",
  billing: "Billing & Plans",
  instagram: "Instagram & Meta",
  notifications: "Notifications",
}

export default function MobileSettingsPage({ params }: { params: Promise<{ tab: string }> }) {
  const resolvedParams = use(params)
  const tab = resolvedParams.tab as Tab
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [personalProfile, setPersonalProfile] = useState<any>(null)
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null)

  const refreshData = useCallback(async () => {
    const [wsRes, pRes, metaRes] = await Promise.all([
      getCurrentCustomer(),
      getPersonalCustomer(),
      getMetaStatus()
    ])
    if (wsRes.data) setCustomer(wsRes.data)
    if (pRes.data) setPersonalProfile(pRes.data)
    if (metaRes.data) setMetaStatus(metaRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-black flex items-center justify-center">
        <CircleNotch className="h-8 w-8 animate-spin text-[#007B85]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-black pb-24 lg:hidden">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0C0C0C] border-b border-gray-100 dark:border-[#1C1C1C] flex items-center px-4 h-14">
        <button 
          onClick={() => router.push('/dashboard/profile')}
          className="flex items-center text-[#007B85] hover:text-[#2F8488] transition-colors"
        >
          <CaretLeft weight="bold" className="h-5 w-5 mr-1" />
          <span className="text-[15px] font-medium pt-[1px]">Profile</span>
        </button>
        <div className="absolute left-[50%] translate-x-[-50%] text-center pointer-events-none">
          <h1 className="text-[15px] font-bold text-[#213138] dark:text-white truncate">
            {titleMap[tab] || "Settings"}
          </h1>
        </div>
      </header>

      {/* Content Area */}
      <div className="p-4 sm:p-6 overflow-x-hidden">
        <TabContent 
          activeTab={tab}
          customer={customer}
          personalProfile={personalProfile}
          metaStatus={metaStatus}
          onRefresh={refreshData}
        />
      </div>
    </div>
  )
}
