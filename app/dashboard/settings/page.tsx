"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  User,
  Clock,
  ChatCircleDots,
  Users,
  CreditCard,
  Key,
  FloppyDisk,
  CircleNotch,
  Link,
  CheckCircle,
  XCircle,
  ArrowSquareOut,
  Plug,
  Buildings,
  MapPin,
  Phone,
  SignOut,
  CaretLeft,
  CaretRight,
  Bell,
  WhatsappLogo,
  MessengerLogo,
  InstagramLogo,
  Plus,
  Trash,
  SealCheck,
} from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SimpleSelect } from "@/components/ui/dropdown"
import { ChannelIcon } from "@/components/dashboard/channel-icon"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSession, getCurrentCustomer, updateCustomer, changePassword, getTeamMembers, inviteTeamMember, removeTeamMember, getPersonalCustomer, updatePersonalProfile, getPersonalTeamMember } from "@/lib/supabase"
import {
  getMetaStatus,
  initiateMetaConnect,
  disconnectChannel,
  fetchBusinessProfile,
  updateBusinessProfile,
  type MetaStatus,
  type ChannelStatus,
  type BusinessProfile,
} from "@/lib/meta-connections"
import { toast } from "sonner"
import { subscribeToPush, unsubscribeFromPush, getNotificationPermission, isPushSupported } from "@/lib/push-notifications"
import type { Customer, BusinessHours, MetaChannel, TeamMember } from "@/types/database"
import { Avatar } from "@/components/ui/avatar"

const timezones = [
  { value: "America/Nassau", label: "Bahamas (Nassau)" },
  { value: "America/Jamaica", label: "Jamaica (Kingston)" },
  { value: "America/Port_of_Spain", label: "Trinidad (Port of Spain)" },
  { value: "America/Barbados", label: "Barbados (Bridgetown)" },
  { value: "America/New_York", label: "Eastern Time (US)" },
]

const defaultBusinessHours: BusinessHours = {
  monday: { start: "09:00", end: "17:00", enabled: true },
  tuesday: { start: "09:00", end: "17:00", enabled: true },
  wednesday: { start: "09:00", end: "17:00", enabled: true },
  thursday: { start: "09:00", end: "17:00", enabled: true },
  friday: { start: "09:00", end: "17:00", enabled: true },
  saturday: { start: "09:00", end: "13:00", enabled: false },
  sunday: { start: "09:00", end: "13:00", enabled: false },
}

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

const waCategoryOptions = [
  { value: "Tour Operator", label: "Tour Operator" },
  { value: "Restaurant", label: "Restaurant" },
  { value: "Hotel", label: "Hotel" },
  { value: "Retail", label: "Retail" },
  { value: "Transportation", label: "Transportation" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Health & Wellness", label: "Health & Wellness" },
  { value: "Professional Services", label: "Professional Services" },
  { value: "Other", label: "Other" },
]

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "profile"

  const [activeTab, setActiveTab] = useState(initialTab)
  const [mobileMenuVisible, setMobileMenuVisible] = useState(!searchParams.get("tab"))

  const handleMobileNav = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuVisible(false)
    router.push(`/dashboard/settings?tab=${tab}`)
  }

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)

  // Form state
  const [fullName, setFullName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [timezone, setTimezone] = useState("America/Nassau")
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultBusinessHours)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [autoReplyMessage, setAutoReplyMessage] = useState("")

  // Password state
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  // Integrations state
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState<MetaChannel | null>(null)

  // WhatsApp Business Profile state
  const [wpBusinessName, setWpBusinessName] = useState("")
  const [wpDescription, setWpDescription] = useState("")
  const [wpCategory, setWpCategory] = useState("")
  const [wpWebsite, setWpWebsite] = useState("")
  const [wpAddress, setWpAddress] = useState("")
  const [wpHours, setWpHours] = useState("")
  const [wpPhone, setWpPhone] = useState("")
  const [wpEmail, setWpEmail] = useState("")
  const [wpSaving, setWpSaving] = useState(false)
  const [wpSaved, setWpSaved] = useState(false)
  const [wpLoaded, setWpLoaded] = useState(false)

  // Push notifications state
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pushSupported, setPushSupported] = useState(true)

  // Billing state
  const [billingLoading, setBillingLoading] = useState(false)
  const [contactsCount, setContactsCount] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)

  useEffect(() => {
    setPushSupported(isPushSupported())
    setPushEnabled(getNotificationPermission() === 'granted')
  }, [])

  // Fetch customer data
  useEffect(() => {
    async function fetchCustomer() {
      setLoading(true)
      // Fetch both personal and workspace data
      const [workspaceRes, personalRes] = await Promise.all([
        getCurrentCustomer(),
        getPersonalCustomer()
      ])

      if (workspaceRes.error) {
        toast.error("Failed to load workspace settings")
      } else if (workspaceRes.data) {
        setCustomer(workspaceRes.data)
        setBusinessName(workspaceRes.data.business_name)
        setTimezone(workspaceRes.data.timezone || "America/Nassau")
        setBusinessHours(workspaceRes.data.business_hours || defaultBusinessHours)
        setAutoReplyEnabled(workspaceRes.data.auto_reply_enabled)
        setAutoReplyMessage(workspaceRes.data.auto_reply_message || "")
      }

      if (personalRes.data) {
        setFullName(personalRes.data.full_name || "")
        setContactEmail(personalRes.data.contact_email || "")
        setPhoneNumber(personalRes.data.phone_number || "")
      }

      // Final fallback: if after all that, name is still empty, pull from team_members directly
      if (!workspaceRes.error && (!personalRes.data?.full_name || !personalRes.data?.contact_email)) {
        const { data: member } = await getPersonalTeamMember()
        if (member) {
          if (!fullName && member.name) setFullName(member.name)
          if (!contactEmail && member.email) setContactEmail(member.email)
        }
      }

      // Fetch usage if we have a workspace
      if (workspaceRes.data) {
        const { getWorkspaceUsage } = await import('@/lib/supabase')
        const usage = await getWorkspaceUsage()
        if (!usage.error) {
          setContactsCount(usage.contactsCount)
          setMessagesCount(usage.messagesCount)
        }
      }

      setLoading(false)
    }

    fetchCustomer()
  }, [])

  // Fetch Meta connection status when integrations tab is loaded
  const fetchMetaConnectionStatus = async () => {
    setMetaLoading(true)
    const { data, error } = await getMetaStatus()
    if (error) {
      // Don't toast on initial load — the table might not exist yet
      console.error("Meta status error:", error)
    } else if (data) {
      setMetaStatus(data)
    }
    setMetaLoading(false)
  }

  // Fetch on mount if the initial tab is integrations, or show toast from callback
  useEffect(() => {
    const tab = searchParams.get("tab")
    const metaResult = searchParams.get("meta")
    const metaMessage = searchParams.get("message")

    // Sync mobile menu visibility with URL
    if (!tab) {
      setMobileMenuVisible(true)
    } else {
      setMobileMenuVisible(false)
      setActiveTab(tab)
    }

    if (tab === "integrations" || tab === "whatsapp") {
      fetchMetaConnectionStatus()
    }

    if (tab === "whatsapp") {
      fetchWhatsAppProfile()
    }

    if (metaResult === "connected") {
      toast.success("Meta account connected successfully!")
      fetchMetaConnectionStatus()
    } else if (metaResult === "error") {
      toast.error(metaMessage || "Failed to connect Meta account")
    }
  }, [searchParams])

  const handleConnectMeta = async () => {
    setConnecting(true)
    const { url, error } = await initiateMetaConnect()
    if (error) {
      toast.error(error)
      setConnecting(false)
      return
    }
    if (url) {
      window.location.href = url
    }
  }

  const handleDisconnectChannel = async (channel: MetaChannel) => {
    setDisconnecting(channel)
    const { error } = await disconnectChannel(channel)
    if (error) {
      toast.error(error)
    } else {
      toast.success(`${channel.charAt(0).toUpperCase() + channel.slice(1)} disconnected`)
      await fetchMetaConnectionStatus()
    }
    setDisconnecting(null)
  }

  const handleSaveProfile = async () => {
    setSaving(true)

    // Save personal profile data to the user's specific record
    const { error: profileError } = await updatePersonalProfile({
      full_name: fullName,
      contact_email: contactEmail,
      phone_number: phoneNumber,
    })

    if (profileError) {
      toast.error("Failed to update personal profile")
    }

    // Update workspace business name and timezone
    const { error: wsError } = await updateCustomer({
      business_name: businessName,
      timezone,
    })

    if (wsError) {
      toast.error("Failed to update workspace details")
    }

    if (!profileError && !wsError) {
      toast.success("Profile updated successfully")
    }

    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setSavingPassword(true)
    const { error } = await changePassword(newPassword)

    if (error) {
      toast.error(error)
    } else {
      toast.success("Password updated successfully")
      setNewPassword("")
      setConfirmPassword("")
    }

    setSavingPassword(false)
  }

  const handleSaveBusinessHours = async () => {
    setSaving(true)

    const { error } = await updateCustomer({
      business_hours: businessHours,
    })

    if (error) {
      toast.error("Failed to save business hours")
    } else {
      toast.success("Business hours saved")
    }

    setSaving(false)
  }

  const handleSaveAutoReply = async () => {
    setSaving(true)

    const { error } = await updateCustomer({
      auto_reply_enabled: autoReplyEnabled,
      auto_reply_message: autoReplyMessage || null,
    })

    if (error) {
      toast.error("Failed to save auto-reply settings")
    } else {
      toast.success("Auto-reply settings saved")
    }

    setSaving(false)
  }

  // WhatsApp Business Profile handlers
  const fetchWhatsAppProfile = async () => {
    if (wpLoaded) return
    const { data: profile, error } = await fetchBusinessProfile()
    if (error) {
      console.error("WA profile error:", error)
    } else if (profile) {
      setWpBusinessName(profile.business_name || "")
      setWpDescription(profile.business_description || "")
      setWpCategory(profile.business_category || "")
      setWpWebsite(profile.website_url || "")
      setWpAddress(profile.business_address || "")
      setWpHours(profile.business_hours || "")
      setWpPhone(profile.contact_phone || "")
      setWpEmail(profile.contact_email || "")
    }
    setWpLoaded(true)
  }

  const handleSaveWhatsAppProfile = async () => {
    setWpSaving(true)
    setWpSaved(false)

    const { error } = await updateBusinessProfile({
      business_name: wpBusinessName,
      business_description: wpDescription,
      business_category: wpCategory,
      website_url: wpWebsite,
      business_address: wpAddress,
      business_hours: wpHours,
      contact_phone: wpPhone,
      contact_email: wpEmail,
    })

    if (error) {
      toast.error(error)
    } else {
      toast.success("WhatsApp business profile saved")
      setWpSaved(true)
      setTimeout(() => setWpSaved(false), 3000)
    }

    setWpSaving(false)
  }

  const handleTogglePush = async (enabled: boolean) => {
    setPushLoading(true)
    if (enabled) {
      const { success, error } = await subscribeToPush()
      if (success) {
        setPushEnabled(true)
        toast.success("Push notifications enabled")
      } else {
        toast.error(error || "Failed to enable notifications")
      }
    } else {
      const { success, error } = await unsubscribeFromPush()
      if (success) {
        setPushEnabled(false)
        toast.success("Push notifications disabled")
      } else {
        toast.error(error || "Failed to disable notifications")
      }
    }
    setPushLoading(false)
  }

  const updateDayHours = (
    day: keyof BusinessHours,
    field: "start" | "end" | "enabled",
    value: string | boolean
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const handleUpgrade = async () => {
    setBillingLoading(true)
    try {
      const { session } = await getSession()

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          // In production, this pulls the LIVE price ID from Vercel ENV. In local, it pulls the TEST price ID from .env.local
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_1TCscVRkoM3tY8Ak7wio2Jd3"
        })
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || "Failed to initiate checkout")
      }
    } catch (e) {
      toast.error("An error occurred during checkout")
    }
    setBillingLoading(false)
  }

  const handleManageBilling = async () => {
    setBillingLoading(true)
    try {
      const { session } = await getSession()

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        }
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || "Failed to load billing portal")
      }
    } catch (e) {
      toast.error("An error occurred loading the billing portal")
    }
    setBillingLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-7 w-32 mb-2 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
        <Skeleton className="h-4 w-48 mb-8 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
        <div className="flex gap-1 mb-8">
          {Array(7).fill(0).map((_,i) => <Skeleton key={i} className="h-9 w-20 bg-slate-100 dark:bg-[#1A1A1A] rounded-xl" />)}
        </div>
        <div className="space-y-5">
          <Skeleton className="h-px w-full bg-slate-100 dark:bg-[#1A1A1A]" />
          <Skeleton className="h-10 w-full bg-slate-100 dark:bg-[#1A1A1A] rounded-xl" />
          <Skeleton className="h-10 w-full bg-slate-100 dark:bg-[#1A1A1A] rounded-xl" />
          <Skeleton className="h-10 w-2/3 bg-slate-100 dark:bg-[#1A1A1A] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen lg:min-h-full">
      {/* ================= MOBILE MENU VIEW ================= */}
      <div className={cn("lg:hidden w-full pb-24", !mobileMenuVisible && "hidden")}>


        {/* Header */}
        <div className="pt-[calc(env(safe-area-inset-top)+1rem)] pb-5 px-5 flex items-center justify-between border-b border-gray-100 dark:border-[#1C1C1C]">
          <div className="w-10" />
          <h1 className="text-[18px] font-bold text-[#213138] dark:text-white  tracking-tight">Settings</h1>
          <div className="h-9 w-9 flex items-center justify-center bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl">
            <ThemeToggle />
          </div>
        </div>

        {/* Avatar & Info */}
        <div className="flex flex-col items-center px-5 pt-8 pb-8">
          <div className="h-20 w-20 rounded-2xl bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-[#007B85] ">
              {(fullName || businessName || contactEmail || "U")[0].toUpperCase()}
            </span>
          </div>
          <h2 className="text-[18px] font-bold text-[#213138] dark:text-white  tracking-tight">
            {fullName || businessName || "Your Profile"}
          </h2>
          <p className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400 mt-1">
            <MapPin weight="bold" className="h-3 w-3 text-[#007B85]" />
            {timezone.split('/')[1]?.replace('_', ' ') || "Local"}
          </p>
        </div>

        <div className="px-5 space-y-6 pb-10">
          {/* Auto-Reply toggle */}
          <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChatCircleDots weight="bold" className="h-4 w-4 text-gray-400 dark:text-gray-400" />
              <span className="text-[14px] font-medium text-gray-900 dark:text-white">Auto-Reply Mode</span>
            </div>
            <Switch
              checked={autoReplyEnabled}
              onCheckedChange={async (c) => {
                setAutoReplyEnabled(c)
                await updateCustomer({ auto_reply_enabled: c })
                toast.success(c ? "Auto-reply activated" : "Auto-reply disabled")
              }}
            />
          </div>

          {/* Nav links */}
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium px-1 mb-3">General</p>
            <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-[#1C1C1C]">
              <MobileTabLink icon={User} label="Profile" onClick={() => handleMobileNav('profile')} />
              <MobileTabLink icon={Clock} label="Business Hours" onClick={() => handleMobileNav('hours')} />
              <MobileTabLink icon={Users} label="Team" onClick={() => handleMobileNav('team')} />
              <MobileTabLink icon={Link} label="Integrations" onClick={() => handleMobileNav('integrations')} />
              <MobileTabLink icon={Buildings} label="WhatsApp Profile" onClick={() => handleMobileNav('whatsapp')} />
              <MobileTabLink icon={Bell} label="Notifications" onClick={() => handleMobileNav('notifications')} />
              <MobileTabLink icon={CreditCard} label="Billing & Plan" onClick={() => handleMobileNav('billing')} />
            </div>
          </div>
        </div>
      </div>

      {/* ================= DESKTOP & MOBILE CONTENT VIEW ================= */}
      <div className={cn("p-6 max-w-4xl pb-24 lg:pb-6", !mobileMenuVisible ? "block" : "hidden lg:block")}>

        {/* Mobile Back Header */}
        <div className="lg:hidden flex items-center gap-4 mb-8 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <button
            onClick={() => {
              setMobileMenuVisible(true)
              router.push('/dashboard/settings')
            }}
            className="h-10 w-10 bg-white dark:bg-[#0A0A0A] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-[#222222] transition-transform active:scale-95"
          >
            <CaretLeft weight="bold" className="h-5 w-5" />
          </button>
          <h1 className="text-[22px] font-bold text-[#213138] dark:text-gray-100  tracking-tight">
            Settings
          </h1>
        </div>

        <div className="mb-8">
          <p className="text-[11px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1.5 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />Workspace
          </p>
          <h1 className="hidden lg:block text-3xl font-bold text-[#213138] dark:text-white  tracking-tight">Settings</h1>
        </div>

        <Tabs value={activeTab} defaultValue={initialTab} onValueChange={(tab) => {
          setActiveTab(tab)
          router.push(`/dashboard/settings?tab=${tab}`)
          if (tab === "integrations") fetchMetaConnectionStatus()
          if (tab === "whatsapp") {
            fetchWhatsAppProfile()
            fetchMetaConnectionStatus()
          }
          if (tab === "billing") {
             // Handle billing tab logic if needed
          }
        }}>
          <TabsList className="hidden lg:flex mb-8 p-1 bg-gray-100 dark:bg-black rounded-xl w-fit gap-0.5 border border-gray-200 dark:border-[#1C1C1C]">
            <TabsTrigger
              value="profile"
              className="rounded-lg px-4 py-2 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 dark:data-[state=active]:border-b-[#007B85] text-gray-500 dark:text-gray-400 data-[state=active]:shadow-sm font-medium"
            >
              <User weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="hours"
              className="rounded-lg px-4 py-2 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 dark:data-[state=active]:border-b-[#007B85] text-gray-500 dark:text-gray-400 data-[state=active]:shadow-sm font-medium"
            >
              <Clock weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              Hours
            </TabsTrigger>
            <TabsTrigger
              value="autoreply"
              className="rounded-lg px-4 py-2 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 dark:data-[state=active]:border-b-[#007B85] text-gray-500 dark:text-gray-400 data-[state=active]:shadow-sm font-medium"
            >
              <ChatCircleDots weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              Replies
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="rounded-lg px-4 py-2 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 dark:data-[state=active]:border-b-[#007B85] text-gray-500 dark:text-gray-400 data-[state=active]:shadow-sm font-medium"
            >
              <Users weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              Team
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="rounded-lg px-4 py-2 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 dark:data-[state=active]:border-b-[#007B85] text-gray-500 dark:text-gray-400 data-[state=active]:shadow-sm font-medium"
            >
              <Link weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              Channels
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-lg px-4 py-2 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 dark:data-[state=active]:border-b-[#007B85] text-gray-500 dark:text-gray-400 data-[state=active]:shadow-sm font-medium"
            >
              <Bell weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              Alerts
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              className="rounded-lg px-4 py-2 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 dark:data-[state=active]:border-b-[#007B85] text-gray-500 dark:text-gray-400 data-[state=active]:shadow-sm font-medium"
            >
              <Buildings weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              WA Profile
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="rounded-lg px-4 py-2 text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E1E1E] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 dark:data-[state=active]:border-b-[#007B85] text-gray-500 dark:text-gray-400 data-[state=active]:shadow-sm font-medium"
            >
              <CreditCard weight="bold" className="h-3.5 w-3.5 mr-1.5" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-10 pb-12">
            {/* Profile Details */}
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />
                Personal Details
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                Manage your primary account information and contact details
              </p>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business Name
                    </Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (242) 555-0123"
                      className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timezone
                    </Label>
                    <SimpleSelect value={timezone} onValueChange={setTimezone} options={timezones} className="mt-1.5" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end mt-6">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-8"
                >
                  {saving && <CircleNotch weight="bold" className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-[#1C1C1C]" />

            {/* Change Password */}
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-[#333] inline-block" />
                Change Password
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                Ensure your account is using a long, random password to stay secure
              </p>
              <div className="space-y-5 max-w-md">
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !newPassword || !confirmPassword}
                  className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-8"
                >
                  {savingPassword && <CircleNotch weight="bold" className="h-4 w-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Business Hours Tab */}
          <TabsContent value="hours" className="pb-12">
            <div className="space-y-8">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />
                  Business Hours
                </p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                  Set your standard hours. Auto-replies use these to determine working state.
                </p>

                <div className="bg-white dark:bg-[#0C0C0C] rounded-2xl border border-gray-200 dark:border-[#1C1C1C] overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-[#1C1C1C]">
                    {days.map((day) => (
                      <div
                        key={day}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#111] transition-colors",
                          !businessHours[day]?.enabled && "bg-gray-50/50 dark:bg-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between sm:justify-start gap-4">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={businessHours[day]?.enabled || false}
                              onCheckedChange={(checked) => updateDayHours(day, "enabled", checked)}
                            />
                            <span className="text-[14px] font-bold text-gray-900 dark:text-white capitalize min-w-[90px]">
                              {day}
                            </span>
                          </div>
                          {!businessHours[day]?.enabled && (
                            <span className="sm:hidden text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                              Closed
                            </span>
                          )}
                        </div>

                        {businessHours[day]?.enabled ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-32">
                              <Input
                                type="time"
                                value={businessHours[day]?.start || "09:00"}
                                onChange={(e) => updateDayHours(day, "start", e.target.value)}
                                className="w-full text-center rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111] h-11 sm:h-9"
                              />
                            </div>
                            <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500 shrink-0">to</span>
                            <div className="relative flex-1 sm:w-32">
                              <Input
                                type="time"
                                value={businessHours[day]?.end || "17:00"}
                                onChange={(e) => updateDayHours(day, "end", e.target.value)}
                                className="w-full text-center rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111] h-11 sm:h-9"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="hidden sm:inline text-[13px] text-gray-400 dark:text-gray-500 italic">
                            Closed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  onClick={handleSaveBusinessHours}
                  disabled={saving}
                  className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-8"
                >
                  {saving && <CircleNotch weight="bold" className="h-4 w-4 mr-2 animate-spin" />}
                  Save Business Hours
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Auto-Reply Tab */}
          <TabsContent value="autoreply" className="pb-12">
            <div className="space-y-8">
              <div>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />
                      Auto-Reply
                    </p>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                      Automatically respond to messages outside of business hours
                    </p>
                  </div>
                  <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
                </div>

                {autoReplyEnabled && (
                  <div className="bg-white dark:bg-[#0C0C0C] p-6 rounded-2xl border border-gray-200 dark:border-[#1C1C1C]">
                    <Label htmlFor="autoReplyMessage" className="text-[13px] font-medium text-gray-700 dark:text-[#A3A3A3]">
                      Offline Message
                    </Label>
                    <Textarea
                      id="autoReplyMessage"
                      value={autoReplyMessage}
                      onChange={(e) => setAutoReplyMessage(e.target.value)}
                      placeholder="Thanks for reaching out! We'll get back to you as soon as possible."
                      className="mt-2 min-h-[140px] rounded-xl border-gray-200 dark:border-[#1C1C1C] resize-none bg-gray-50 dark:bg-[#111] dark:text-white"
                    />
                    <p className="text-[12px] text-gray-400 dark:text-gray-400 mt-2">
                      Sent instantly when you are outside business hours.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end">
                <Button
                  onClick={handleSaveAutoReply}
                  disabled={saving}
                  className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-8"
                >
                  {saving && <CircleNotch weight="bold" className="h-4 w-4 mr-2 animate-spin" />}
                  Save Auto-Reply Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="pb-12">
            <TeamTab customer={customer} />
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-10 pb-12">
            {/* Connect Meta — clean card, no dark hero */}
            <div
              className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              style={{ borderLeftColor: "#007B85", borderLeftWidth: 2 }}
            >
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />
                  Meta Business Platform
                </p>
                <h3 className="text-[18px] font-bold text-gray-900 dark:text-white  mb-1">
                  Connect your channels
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                  Link WhatsApp Business, Instagram, and Messenger in one OAuth flow.
                </p>
              </div>
              <Button
                onClick={handleConnectMeta}
                disabled={connecting}
                className="shrink-0 h-10 px-6 bg-[#007B85] hover:bg-[#2F8488] text-white font-semibold rounded-xl transition-colors duration-200 active:scale-95"
              >
                {connecting ? (
                  <>
                    <CircleNotch weight="bold" className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>Connect with Meta</>
                )}
              </Button>
            </div>

            {/* Channel Cards */}
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />
                Connected Channels
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-5">
                Each channel connects independently. Disconnect them individually at any time.
              </p>
              {metaLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-gray-100 dark:border-[#222222] p-6 bg-white dark:bg-[#0A0A0A] shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
                    >
                      <Skeleton className="h-10 w-10 rounded-xl mb-4" />
                      <Skeleton className="h-5 w-28 mb-2" />
                      <Skeleton className="h-4 w-40 mb-6" />
                      <Skeleton className="h-9 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <ChannelCard
                    channel="whatsapp"
                    label="WhatsApp Business"
                    color="#25D366"
                    icon={<ChannelIcon channel="whatsapp" size="xl" />}
                    status={metaStatus?.whatsapp}
                    disconnecting={disconnecting === "whatsapp"}
                    onDisconnect={() => handleDisconnectChannel("whatsapp")}
                  />
                  <ChannelCard
                    channel="instagram"
                    label="Instagram"
                    color="#E4405F"
                    icon={<ChannelIcon channel="instagram" size="xl" />}
                    status={metaStatus?.instagram}
                    disconnecting={disconnecting === "instagram"}
                    onDisconnect={() => handleDisconnectChannel("instagram")}
                  />
                  <ChannelCard
                    channel="messenger"
                    label="Messenger"
                    color="#0084FF"
                    icon={<ChannelIcon channel="messenger" size="xl" />}
                    status={metaStatus?.messenger}
                    disconnecting={disconnecting === "messenger"}
                    onDisconnect={() => handleDisconnectChannel("messenger")}
                  />
                </div>
              )}
            </div>

            {/* Connected Account Details */}
            {metaStatus &&
              (metaStatus.instagram?.connected ||
                metaStatus.whatsapp?.connected ||
                metaStatus.messenger?.connected) && (
                <div>
                  <div className="h-px bg-gray-100 dark:bg-[#1C1C1C] mb-6" />
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-4 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />
                    Connected Accounts
                  </p>
                  <div className="space-y-2">
                    {metaStatus.instagram?.connected && (
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C]">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white flex-shrink-0">
                          <InstagramLogo weight="bold" className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                            {(metaStatus.instagram.metadata as Record<string, string>)?.ig_username ||
                              metaStatus.instagram.account_name ||
                              "Instagram"}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-400">
                            Instagram · ID: {metaStatus.instagram.account_id?.slice(0, 8)}…
                            {metaStatus.instagram.account_id?.slice(-4)}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-[#007B85] uppercase tracking-widest">
                          Active
                        </span>
                      </div>
                    )}
                    {metaStatus.whatsapp?.connected && (
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C]">
                        <div className="h-9 w-9 rounded-xl bg-[#25D366] flex items-center justify-center text-white flex-shrink-0">
                          <WhatsappLogo weight="bold" className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                            {metaStatus.whatsapp.account_name || "WhatsApp Business"}
                          </p>
                          {(metaStatus.whatsapp.metadata as Record<string, string>)?.phone_display && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-400">
                              {(metaStatus.whatsapp.metadata as Record<string, string>).phone_display}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-[#007B85] uppercase tracking-widest">
                          Active
                        </span>
                      </div>
                    )}
                    {metaStatus.messenger?.connected && (
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C]">
                        <div className="h-9 w-9 rounded-xl bg-[#0084FF] flex items-center justify-center text-white flex-shrink-0">
                          <MessengerLogo weight="bold" className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                            {metaStatus.messenger.account_name || "Messenger"}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-[#007B85] uppercase tracking-widest">
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Webhook strip */}
            <div>
              <div className="h-px bg-gray-100 dark:bg-[#1C1C1C] mb-6" />
              <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-4 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#007B85] animate-pulse inline-block" />
                Webhook Status
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                  className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl px-4 py-3"
                  style={{ borderLeftColor: "#007B85", borderLeftWidth: 2 }}
                >
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#007B85] animate-pulse" />
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Active</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-1">
                    Endpoint
                  </p>
                  <code className="text-[11px] font-mono text-gray-700 dark:text-[#A3A3A3]">
                    /api/webhooks/meta
                  </code>
                </div>
                <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-1">
                    Verification
                  </p>
                  <div className="flex items-center gap-1 text-[#007B85]">
                    <CheckCircle weight="bold" className="h-3.5 w-3.5" />
                    <span className="text-[13px] font-semibold">Verified</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-1">
                    Last Event
                  </p>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-3">
                Subscribed:{" "}
                <span className="font-medium text-gray-700 dark:text-[#A3A3A3]">
                  messages · message_deliveries · message_reads
                </span>
              </p>
            </div>
          </TabsContent>

          {/* WhatsApp Business Profile Tab */}
          <TabsContent value="whatsapp" className="pb-12">
            {metaStatus?.whatsapp?.connected === false ? (
              <div
                className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-12 text-center"
                style={{ borderLeftColor: "#25D366", borderLeftWidth: 2 }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-5">
                  <Buildings weight="bold" className="h-5 w-5 text-[#25D366]" />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 dark:text-white  mb-2">
                  WhatsApp Not Connected
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
                  Connect your Meta account with WhatsApp Business permissions to manage your public
                  business profile.
                </p>
                <Button
                  onClick={() => setActiveTab('integrations')}
                  className="bg-[#007B85] hover:bg-[#2F8488] text-white rounded-xl px-6"
                >
                  Go to Integrations
                </Button>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Business Info */}
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#25D366] inline-block" />
                    Business Info
                  </p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
                    Displayed publicly on your WhatsApp Business profile
                  </p>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="wpBusinessName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Business Name <span className="text-[#FF7E36]">*</span>
                      </Label>
                      <Input
                        id="wpBusinessName"
                        value={wpBusinessName}
                        onChange={(e) => setWpBusinessName(e.target.value)}
                        placeholder="Ocean Breeze Tours Nassau Tours"
                        className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wpDescription" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Business Description
                      </Label>
                      <Textarea
                        id="wpDescription"
                        value={wpDescription}
                        onChange={(e) => setWpDescription(e.target.value)}
                        placeholder="Premier boat tours and water sports in Nassau, Bahamas..."
                        className="mt-1.5 min-h-[110px] rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111] resize-none"
                      />
                      <p className="text-xs text-[#475569] dark:text-gray-500 mt-1.5">
                        Max 512 characters · Shown in your WhatsApp profile card
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="wpCategory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Business Category
                      </Label>
                      <SimpleSelect
                        value={wpCategory}
                        onValueChange={setWpCategory}
                        options={waCategoryOptions}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-[#222222]" />

                {/* Contact Info */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center flex-shrink-0">
                      <Phone weight="bold" className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Contact Information</h4>
                      <p className="text-xs text-[#475569] dark:text-gray-400">
                        How customers can reach you outside of WhatsApp
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="wpPhone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </Label>
                      <Input
                        id="wpPhone"
                        value={wpPhone}
                        onChange={(e) => setWpPhone(e.target.value)}
                        placeholder="+1-242-555-0199"
                        className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wpEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </Label>
                      <Input
                        id="wpEmail"
                        type="email"
                        value={wpEmail}
                        onChange={(e) => setWpEmail(e.target.value)}
                        placeholder="info@oceanbreezetours.com"
                        className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="wpWebsite" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Website URL
                      </Label>
                      <Input
                        id="wpWebsite"
                        value={wpWebsite}
                        onChange={(e) => setWpWebsite(e.target.value)}
                        placeholder="www.oceanbreezetours.com"
                        className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-[#222222]" />

                {/* Location & Hours */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center flex-shrink-0">
                      <MapPin weight="bold" className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Location &amp; Hours</h4>
                      <p className="text-xs text-[#475569] dark:text-gray-400">
                        Let customers know where to find you and when you're open
                      </p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="wpAddress" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Business Address
                      </Label>
                      <Input
                        id="wpAddress"
                        value={wpAddress}
                        onChange={(e) => setWpAddress(e.target.value)}
                        placeholder="Paradise Island, Nassau, Bahamas"
                        className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wpHours" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Business Hours
                      </Label>
                      <Input
                        id="wpHours"
                        value={wpHours}
                        onChange={(e) => setWpHours(e.target.value)}
                        placeholder="Monday-Saturday 8:00 AM - 6:00 PM, Sunday Closed"
                        className="mt-1.5 rounded-xl border-gray-200 dark:border-[#222222] dark:bg-[#111111]"
                      />
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {wpSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle weight="bold" className="h-4 w-4" />
                      Saved successfully
                    </span>
                  )}
                  <Button
                    onClick={handleSaveWhatsAppProfile}
                    disabled={wpSaving}
                    className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-8"
                  >
                    {wpSaving && <CircleNotch weight="bold" className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-10 pb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center flex-shrink-0">
                  <Bell weight="bold" className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Push Notifications</h4>
                  <p className="text-xs text-[#475569] dark:text-gray-400">
                    Receive real-time alerts on your phone or desktop even when the app is closed
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-[#222222] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">System Alerts</p>
                    <p className="text-sm text-[#475569] dark:text-gray-400 mt-1">
                      {pushSupported
                        ? "Get notified of new messages from WhatsApp, Instagram, and Facebook Messenger directly on your device's lock screen."
                        : "Push notifications are not supported on this browser. Please use a modern browser like Chrome, Safari, or Edge."}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {pushLoading && (
                      <CircleNotch weight="bold" className="h-4 w-4 animate-spin text-[#007B85]" />
                    )}
                    <Switch
                      disabled={!pushSupported || pushLoading}
                      checked={pushEnabled}
                      onCheckedChange={handleTogglePush}
                    />
                  </div>
                </div>

                {pushEnabled && (
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#222222] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#222222]">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                        Connected Devices
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white dark:bg-[#0A0A0A] flex items-center justify-center shadow-sm">
                          <CheckCircle weight="bold" className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          This Device is registered
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-10 pb-12">
            {/* Current Plan */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard weight="bold" className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Current Plan Overview</h4>
                  <p className="text-xs text-[#475569] dark:text-gray-400">
                    Manage your active subscription and upcoming charges
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-[#222222] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-[#222222]">
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                      TropiChat {customer?.plan?.charAt(0).toUpperCase() + (customer?.plan?.slice(1) || "")}
                    </h5>
                    <p className="text-sm text-[#475569] dark:text-gray-400 mt-1">
                      {customer?.plan === "free" ? (
                        (() => {
                          const created = new Date(customer?.created_at || new Date())
                          const trialEnd = new Date(created.getTime() + 14 * 24 * 60 * 60 * 1000)
                          const diffTime = Math.max(0, trialEnd.getTime() - new Date().getTime())
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                          return diffDays > 0
                            ? `You have ${diffDays} day${diffDays === 1 ? "" : "s"} left in your 14-day free trial.`
                            : "Your 14-day free trial has expired."
                        })()
                      ) : (
                        "Your workspace is growing efficiently."
                      )}
                    </p>
                  </div>
                  <Badge variant={customer?.plan === "free" ? "secondary" : "success"} className="px-3 py-1">
                    {customer?.plan?.charAt(0).toUpperCase() + (customer?.plan?.slice(1) || "")}
                  </Badge>
                </div>

                {customer?.plan === "free" ? (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h6 className="font-semibold text-emerald-900 dark:text-emerald-400">
                        Ready to level up?
                      </h6>
                      <p className="text-sm text-emerald-700 dark:text-emerald-500 mt-1">
                        Upgrade to Professional to unlock team management and advanced integrations.
                      </p>
                    </div>
                    <Button
                      className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl text-white shrink-0 shadow-sm"
                      onClick={handleUpgrade}
                      disabled={billingLoading}
                    >
                      {billingLoading ? (
                        <CircleNotch weight="bold" className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Upgrade Now
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-[#475569] dark:text-gray-400 font-medium mb-1">
                        Monthly Cost
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {customer?.stripe_current_period_end ? "$29" : "$0"}
                        <span className="text-sm text-gray-500 font-normal">/mo</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#475569] dark:text-gray-400 font-medium mb-1">
                        {customer?.stripe_current_period_end ? "Next Billing Date" : "Account Status"}
                      </p>
                      <p className="text-lg font-semibold text-[#007B85] dark:text-teal-400">
                        {customer?.stripe_current_period_end
                          ? new Date(customer.stripe_current_period_end).toLocaleDateString()
                          : "Lifetime Founder's Pass"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-[#222222]" />

            {/* Usage */}
            <div>
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Workspace Usage</h4>
                <p className="text-xs text-[#475569] dark:text-gray-400">
                  Monitor your limits and message volume for the current billing cycle
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-[#222222] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Contacts</span>
                    <span className="text-sm font-semibold text-[#007B85]">
                      {contactsCount} / 500
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[#111111] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#007B85] h-full rounded-full transition-all"
                      style={{ width: `${Math.min((contactsCount / 500) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#475569] dark:text-gray-500 mt-3">Active unique clients</p>
                </div>
                <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-[#222222] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Messages</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {messagesCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-emerald-50 dark:bg-emerald-900/10 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: "100%" }} />
                  </div>
                  <p className="text-xs text-[#475569] dark:text-gray-500 mt-3">
                    Unlimited messages on all plans
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-[#222222]" />

            {/* Payment Method */}
            {customer?.plan !== "free" && customer?.stripe_customer_id && (
              <div>
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Manage Billing</h4>
                  <p className="text-xs text-[#475569] dark:text-gray-400">
                    Update payment methods, view invoices, or cancel your subscription
                  </p>
                </div>
                <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-[#222222] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-xl w-14 h-10 flex items-center justify-center">
                      <CreditCard weight="bold" className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        Stripe Customer Portal
                      </p>
                      <p className="text-xs text-[#475569] dark:text-gray-500 mt-0.5">
                        Securely manage your billing info
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageBilling}
                    disabled={billingLoading}
                    className="rounded-xl border-gray-200 dark:border-[#3A3A3A] shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111111] hover:bg-gray-50 dark:hover:bg-[#333333]"
                  >
                    {billingLoading ? (
                      <CircleNotch weight="bold" className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowSquareOut weight="bold" className="h-4 w-4 mr-2" />
                    )}
                    Portal
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function MobileTabLink({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-4 px-2 transition-colors active:bg-gray-50 dark:active:bg-[#111111] rounded-2xl">
      <div className="flex items-center gap-4">
        <Icon weight="bold" className="h-[22px] w-[22px] text-[#475569] dark:text-gray-400" />
        <span className="font-medium text-[#213138] dark:text-gray-100 text-[16px]">{label}</span>
      </div>
      <CaretRight weight="bold" className="h-[20px] w-[20px] text-gray-400 dark:text-gray-600" />
    </button>
  )
}

// ==================== Channel Status Card ====================

function TeamTab({ customer }: { customer: Customer | null }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<'admin' | 'agent'>('agent')

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      const { data, error } = await getTeamMembers()
      if (!error && data) {
        setMembers(data)
      }
      setLoading(false)
    }
    fetchMembers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !inviteName) return

    setInviting(true)
    const { data, error } = await inviteTeamMember(inviteEmail, inviteName, inviteRole)
    if (error) {
      toast.error(error)
    } else if (data) {
      toast.success("Invitation sent successfully")
      setMembers([...members, data])
      setInviteEmail("")
      setInviteName("")
    }
    setInviting(false)
  }

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return

    const { error } = await removeTeamMember(id)
    if (error) {
      toast.error(error)
    } else {
      toast.success("Team member removed")
      setMembers(members.filter((m) => m.id !== id))
    }
  }

  const isFreePlan = customer?.plan === "free"

  return (
    <div className="space-y-8">
      {/* Plan Gating Overlay */}
      {isFreePlan && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <SealCheck weight="bold" className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-400">Professional Feature</h4>
              <p className="text-sm text-amber-700 dark:text-amber-500/80 mt-1">
                Team management is only available on the Professional plan. Upgrade to invite your staff.
              </p>
            </div>
          </div>
          <Button 
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm px-6"
            onClick={() => window.location.href = '/dashboard/settings?tab=billing'}
          >
            Upgrade to Invite Team
          </Button>
        </div>
      )}

      {/* Invite Form */}
      <div className={cn("space-y-6", isFreePlan && "opacity-50 pointer-events-none")}>
        <div>
          <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />
            Invite Member
          </p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6">
            Add team members to your workspace to collaborate on conversations
          </p>
          
          <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-[#0A0A0A] p-5 rounded-2xl border border-gray-100 dark:border-[#222222] shadow-sm">
            <div className="md:col-span-1">
              <Label className="text-xs font-semibold mb-1.5 block">Full Name</Label>
              <Input 
                placeholder="John Doe" 
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111]"
                required
              />
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs font-semibold mb-1.5 block">Email Address</Label>
              <Input 
                type="email"
                placeholder="john@example.com" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111]"
                required
              />
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs font-semibold mb-1.5 block">Role</Label>
              <SimpleSelect 
                value={inviteRole} 
                onValueChange={(v) => setInviteRole(v as any)}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'agent', label: 'Agent' }
                ]}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button 
                type="submit"
                disabled={inviting || !inviteEmail || !inviteName}
                className="w-full bg-[#007B85] hover:bg-[#2F8488] text-white rounded-xl h-10 font-bold"
              >
                {inviting ? (
                  <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus weight="bold" className="h-4 w-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="h-px bg-gray-100 dark:bg-[#1C1C1C]" />

        {/* Members List */}
        <div>
          <p className="text-[10px] text-gray-400 dark:text-gray-400 uppercase tracking-widest font-medium mb-4 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-[#333] inline-block" />
            Existing Team Members
          </p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl bg-gray-100 dark:bg-[#111]" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="bg-gray-50 dark:bg-[#0A0A0A]/40 border border-dashed border-gray-200 dark:border-[#222222] rounded-2xl p-12 text-center">
              <Users weight="bold" className="h-8 w-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No team members yet. Invite someone to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {members.map((member) => (
                <motion.div 
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex items-center justify-between p-4 bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#222222] rounded-2xl transition-all hover:shadow-md hover:border-[#007B85]/20"
                >
                  <div className="flex items-center gap-4">
                    <Avatar fallback={member.name} size="md" className="ring-2 ring-white dark:ring-[#222222]" />
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-gray-100 text-[15px] leading-tight">
                        {member.name}
                        {member.role === 'owner' && (
                          <span className="ml-2 text-[10px] bg-[#007B85]/10 text-[#007B85] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Owner</span>
                        )}
                      </h5>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end mr-4">
                      <Badge 
                        variant={member.role === 'admin' ? 'warning' : member.role === 'owner' ? 'success' : 'secondary'}
                        className="text-[10px] font-black uppercase tracking-widest px-2"
                      >
                        {member.role}
                      </Badge>
                      <span className={cn(
                        "text-[10px] font-bold mt-1 uppercase tracking-tighter",
                        member.status === 'active' ? "text-emerald-500" : "text-amber-500"
                      )}>
                        {member.status}
                      </span>
                    </div>

                    {member.role !== 'owner' && (
                      <button 
                        onClick={() => handleRemove(member.id)}
                        className="h-10 w-10 flex items-center justify-center text-gray-300/60 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                        title="Remove Member"
                      >
                        <Trash weight="bold" className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChannelCard({
  channel,
  label,
  color,
  icon,
  status,
  disconnecting,
  onDisconnect,
}: {
  channel: MetaChannel
  label: string
  color: string
  icon: React.ReactNode
  status?: ChannelStatus
  disconnecting: boolean
  onDisconnect: () => void
}) {
  const isConnected = status?.connected ?? false

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative overflow-hidden p-6 rounded-[28px] transition-all duration-300",
        "bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#222222] shadow-[0_4px_20px_rgba(0,0,0,0.02)]",
        isConnected ? "ring-2 ring-teal-500/5 shadow-[0_8px_30px_rgba(58,155,159,0.08)]" : "opacity-60 grayscale-[0.5]"
      )}
    >
      {/* Dynamic Glow Background */}
      {isConnected && (
        <div
          className="absolute -right-6 -top-6 w-24 h-24 blur-[40px] opacity-20 transition-opacity rounded-full"
          style={{ backgroundColor: color }}
        />
      )}

      <div className="flex items-start gap-4 mb-5">
        <div className="shrink-0 flex items-center justify-center transition-transform hover:scale-110 duration-300">
          {icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="font-bold text-[#213138] dark:text-gray-100  text-lg leading-tight truncate">
            {label}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            {isConnected ? (
              <div className="flex items-center gap-1.5 text-[#007B85] text-xs font-bold uppercase tracking-wider">
                <div className="h-1.5 w-1.5 rounded-full bg-[#007B85] animate-pulse" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                Disconnected
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-[48px] mb-5">
        {isConnected && status?.account_name ? (
          <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-[#111111] border border-gray-100/50 dark:border-[#222222]">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
              {status.account_name}
            </p>
            {status.metadata && (status.metadata as Record<string, string>).phone_display && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {(status.metadata as Record<string, string>).phone_display}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            Waiting for connection...
          </p>
        )}
      </div>

      {isConnected && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          disabled={disconnecting}
          className="w-full rounded-xl border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 font-bold transition-all duration-200"
        >
          {disconnecting ? (
            <CircleNotch weight="bold" className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <SignOut weight="bold" className="h-3.5 w-3.5 mr-2" />
          )}
          Disconnect Channel
        </Button>
      )}
    </motion.div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <Skeleton className="h-7 w-32 mb-2 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
        <Skeleton className="h-4 w-48 mb-8 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
        <div className="flex gap-1 mb-8">
          {Array(7).fill(0).map((_,i) => <Skeleton key={i} className="h-9 w-20 bg-slate-100 dark:bg-[#1A1A1A] rounded-xl" />)}
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
