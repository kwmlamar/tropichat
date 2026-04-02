"use client"

import { useEffect, useState } from "react"
import { getPersonalCustomer, signOut } from "@/lib/supabase"
import type { Customer } from "@/types/database"
import { Avatar } from "@/components/ui/avatar"
import { 
  User, 
  Clock, 
  Users, 
  CreditCard, 
  Bell, 
  InstagramLogo, 
  CaretRight, 
  SignOut,
  ShieldCheck,
  House,
  ChatCircleDots,
  CalendarBlank,
  WhatsappLogo,
  MessengerLogo
} from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function MobileProfilePage() {
  const [profile, setProfile] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const { data } = await getPersonalCustomer()
      if (data) {
        setProfile(data)
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleOpenSettings = (tab: string) => {
    router.push(`/dashboard/profile/${tab}`)
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error(error)
      return
    }
    router.push("/login")
  }

  const Section = ({ title, children }: { title?: string, children: React.ReactNode }) => (
    <div className="mb-6">
      {title && (
        <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
          {title}
        </h3>
      )}
      <div className="bg-white dark:bg-[#0C0C0C] border-y sm:border sm:rounded-2xl border-gray-200 dark:border-[#1C1C1C] overflow-hidden">
        {children}
      </div>
    </div>
  )

  const Item = ({ 
    icon: Icon, 
    label, 
    onClick, 
    colorClass,
    isDestructive = false
  }: { 
    icon: any, 
    label: string, 
    onClick: () => void, 
    colorClass: string,
    isDestructive?: boolean
  }) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-white dark:bg-[#0C0C0C] active:bg-gray-50 dark:active:bg-[#111111] transition-colors ${
        isDestructive ? 'text-red-500 hover:text-red-600' : 'text-gray-900 dark:text-gray-100 hover:text-gray-600'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`p-1.5 rounded-lg ${isDestructive ? colorClass : `text-white ${colorClass}`}`}>
          <Icon weight={isDestructive ? "bold" : "fill"} className="w-5 h-5" />
        </div>
        <span className="text-[15px] font-medium tracking-tight">{label}</span>
      </div>
      {!isDestructive && (
        <CaretRight weight="bold" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24 sm:pt-8 md:max-w-2xl md:mx-auto">
      {/* Header Profile Section */}
      <div className="flex flex-col items-center pt-10 pb-8 px-4">
        <div className="relative mb-4">
          <Avatar 
            fallback={profile?.full_name || profile?.contact_email || "U"}
            size="xl"
            className="h-24 w-24 ring-4 ring-white shadow-sm dark:ring-[#111111]"
          />
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-32 bg-gray-200 dark:bg-[#1C1C1C] rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-[#1C1C1C] rounded animate-pulse" />
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-xl font-bold text-[#213138] dark:text-white tracking-tight">
              {profile?.full_name || profile?.business_name || "TropiChat User"}
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {profile?.contact_email || "No email provided"}
            </p>
          </div>
        )}
      </div>

      <div className="w-full">
        <Section title="Account">
          <Item 
            icon={User} 
            colorClass="bg-gray-400 dark:bg-gray-600" 
            label="Profile Details" 
            onClick={() => handleOpenSettings("profile")} 
          />
          <div className="h-[1px] bg-gray-100 dark:bg-[#1C1C1C] ml-14" />
          <Item 
            icon={Clock} 
            colorClass="bg-blue-500" 
            label="Business Hours" 
            onClick={() => handleOpenSettings("hours")} 
          />
          <div className="h-[1px] bg-gray-100 dark:bg-[#1C1C1C] ml-14" />
          <Item 
            icon={Users} 
            colorClass="bg-indigo-500" 
            label="Team Members" 
            onClick={() => handleOpenSettings("team")} 
          />
        </Section>

        <Section title="Billing & Plans">
          <Item 
            icon={CreditCard} 
            colorClass="bg-[#3A9B9F]" 
            label="Subscription & Billing" 
            onClick={() => handleOpenSettings("billing")} 
          />
        </Section>

        <Section title="Integrations">
          <Item 
            icon={WhatsappLogo} 
            colorClass="bg-[#25D366]" 
            label="WhatsApp" 
            onClick={() => handleOpenSettings("whatsapp")} 
          />
          <div className="h-[1px] bg-gray-100 dark:bg-[#1C1C1C] ml-14" />
          <Item 
            icon={InstagramLogo} 
            colorClass="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500" 
            label="Instagram" 
            onClick={() => handleOpenSettings("instagram")} 
          />
          <div className="h-[1px] bg-gray-100 dark:bg-[#1C1C1C] ml-14" />
          <Item 
            icon={MessengerLogo} 
            colorClass="bg-blue-500" 
            label="Messenger" 
            onClick={() => handleOpenSettings("messenger")} 
          />
        </Section>

        <Section title="Preferences">
          <Item 
            icon={Bell} 
            colorClass="bg-[#FF8B66]" 
            label="Notifications" 
            onClick={() => handleOpenSettings("notifications")} 
          />
        </Section>

        <Section>
          <Item 
            icon={SignOut} 
            colorClass="bg-transparent text-red-500 !p-0" 
            label="Sign Out" 
            onClick={handleSignOut} 
            isDestructive
          />
        </Section>
      </div>
    </div>
  )
}
