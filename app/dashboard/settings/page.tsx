"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  User,
  Clock,
  MessageSquare,
  Users,
  CreditCard,
  Key,
  Save,
  Loader2,
  Link2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Unplug,
  Building2,
  MapPin,
  Phone,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react"
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
import { getCurrentCustomer, updateCustomer, changePassword } from "@/lib/supabase"
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
import type { Customer, BusinessHours, MetaChannel } from "@/types/database"

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

export default function SettingsPage() {
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

  // Fetch customer data
  useEffect(() => {
    async function fetchCustomer() {
      setLoading(true)
      const { data, error } = await getCurrentCustomer()

      if (error) {
        toast.error("Failed to load settings")
      } else if (data) {
        setCustomer(data)
        setBusinessName(data.business_name)
        setContactEmail(data.contact_email)
        setPhoneNumber(data.phone_number || "")
        setTimezone(data.timezone || "America/Nassau")
        setBusinessHours(data.business_hours || defaultBusinessHours)
        setAutoReplyEnabled(data.auto_reply_enabled)
        setAutoReplyMessage(data.auto_reply_message || "")
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

    const { error } = await updateCustomer({
      business_name: businessName,
      contact_email: contactEmail,
      phone_number: phoneNumber || null,
      timezone,
    })

    if (error) {
      toast.error("Failed to save settings")
    } else {
      toast.success("Settings saved")
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

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen lg:min-h-full">
      {/* ================= MOBILE MENU VIEW ================= */}
      <div className={cn("lg:hidden w-full pb-24", !mobileMenuVisible && "hidden")}>


        {/* Header */}
        <div className="relative z-10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 px-6 flex items-center justify-between">
          <div className="w-10" /> {/* spacer to center title */}
          <h1 className="text-[22px] font-bold text-[#213138] font-[family-name:var(--font-poppins)] tracking-tight">Profile</h1>
          <button className="h-10 w-10 bg-white shadow-sm flex items-center justify-center text-[#213138] border border-gray-100 rounded-[14px]">
            <Bell className="h-5 w-5 text-[#475569]" strokeWidth={2} />
          </button>
        </div>

        {/* Avatar & Info */}
        <div className="relative z-10 flex flex-col items-center px-6 mt-4 mb-10">
          <div className="relative">
            <div className="h-28 w-28 rounded-full bg-white shadow-sm border-[4px] border-white overflow-hidden flex items-center justify-center">
              <span className="text-[40px] font-bold text-[#3A9B9F] font-[family-name:var(--font-poppins)]">
                {(businessName || contactEmail || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
          <h2 className="mt-5 text-[22px] font-bold text-[#213138] font-[family-name:var(--font-poppins)] tracking-tight">
            {businessName || "Your Business"}
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#475569] mt-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#3A9B9F]" />
            <span>{timezone.split('/')[1]?.replace('_', ' ') || "Local"}</span>
          </div>
        </div>

        <div className="relative z-10 px-6 space-y-8">
          {/* Action / Mode Toggle */}
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="h-9 w-9 bg-gray-50 flex items-center justify-center rounded-xl border border-gray-100">
                <MessageSquare className="h-4 w-4 text-[#475569]" />
              </div>
              <span className="font-semibold text-gray-900 text-[15px]">Auto-Reply Mode</span>
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

          {/* Links Section */}
          <div className="space-y-3 pt-6">
            <h3 className="text-[14px] font-medium text-[#213138] px-2 mb-4">General</h3>
            <div className="flex flex-col gap-2">
              <MobileTabLink icon={User} label="Profile Setting" onClick={() => handleMobileNav('profile')} />
              <MobileTabLink icon={Clock} label="Business Hours" onClick={() => handleMobileNav('hours')} />
              <MobileTabLink icon={Users} label="Team Management" onClick={() => handleMobileNav('team')} />
              <MobileTabLink icon={Link2} label="Integrations" onClick={() => handleMobileNav('integrations')} />
              <MobileTabLink icon={Building2} label="WhatsApp Profile" onClick={() => handleMobileNav('whatsapp')} />
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
            className="h-10 w-10 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center text-gray-600 border border-gray-100 transition-transform active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[22px] font-bold text-[#213138] font-[family-name:var(--font-poppins)] tracking-tight">
            Settings
          </h1>
        </div>

        <h1 className="hidden lg:block text-2xl font-bold text-[#213138] mb-6 font-[family-name:var(--font-poppins)] tracking-tight">Settings</h1>

        <Tabs value={activeTab} defaultValue={initialTab} onValueChange={(tab) => {
          setActiveTab(tab)
          router.push(`/dashboard/settings?tab=${tab}`)
          if (tab === "integrations" && !metaStatus) fetchMetaConnectionStatus()
          if (tab === "whatsapp") {
            fetchWhatsAppProfile()
            if (!metaStatus) fetchMetaConnectionStatus()
          }
        }}>
          <TabsList className="hidden lg:flex mb-6 text-sm font-medium">
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="hours"><Clock className="h-4 w-4 mr-2" />Business Hours</TabsTrigger>
            <TabsTrigger value="autoreply"><MessageSquare className="h-4 w-4 mr-2" />Auto-Reply</TabsTrigger>
            <TabsTrigger value="team"><Users className="h-4 w-4 mr-2" />Team</TabsTrigger>
            <TabsTrigger value="integrations"><Link2 className="h-4 w-4 mr-2" />Integrations</TabsTrigger>
            <TabsTrigger value="whatsapp"><Building2 className="h-4 w-4 mr-2" />WhatsApp Profile</TabsTrigger>
            <TabsTrigger value="billing"><CreditCard className="h-4 w-4 mr-2" />Billing</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-10 pb-12">
            {/* Profile Details */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-[#3A9B9F]/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-[#3A9B9F]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Personal Details</h4>
                  <p className="text-xs text-[#475569]">Manage your primary account information and contact details</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">Business Name</Label>
                    <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1.5 rounded-xl border-gray-200" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Contact Email</Label>
                    <Input id="email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="mt-1.5 rounded-xl border-gray-200" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                    <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (242) 555-0123" className="mt-1.5 rounded-xl border-gray-200" />
                  </div>
                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium text-gray-700">Timezone</Label>
                    <SimpleSelect value={timezone} onValueChange={setTimezone} options={timezones} className="mt-1.5" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end mt-6">
                <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#3A9B9F] hover:bg-[#2F8488] rounded-xl px-8">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Change Password */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Key className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Change Password</h4>
                  <p className="text-xs text-[#475569]">Ensure your account is using a long, random password to stay secure</p>
                </div>
              </div>
              <div className="space-y-5 max-w-md">
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="mt-1.5 rounded-xl border-gray-200" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="mt-1.5 rounded-xl border-gray-200" />
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={handleChangePassword} disabled={savingPassword || !newPassword || !confirmPassword} className="bg-[#3A9B9F] hover:bg-[#2F8488] rounded-xl px-8">
                  {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Business Hours Tab */}
          <TabsContent value="hours" className="pb-12">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Business Hours</h4>
                    <p className="text-xs text-[#475569]">Set your standard hours. Auto-replies use these hours to determine working state.</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {days.map((day) => (
                      <div key={day} className="flex items-center justify-between sm:justify-start gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="w-14">
                          <Switch checked={businessHours[day]?.enabled || false} onCheckedChange={(checked) => updateDayHours(day, "enabled", checked)} />
                        </div>
                        <span className="w-24 font-medium text-sm text-gray-900 capitalize">{day}</span>
                        {businessHours[day]?.enabled ? (
                          <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <Input type="time" value={businessHours[day]?.start || "09:00"} onChange={(e) => updateDayHours(day, "start", e.target.value)} className="w-32 rounded-lg border-gray-200 h-9" />
                            <span className="text-gray-400 text-sm">to</span>
                            <Input type="time" value={businessHours[day]?.end || "17:00"} onChange={(e) => updateDayHours(day, "end", e.target.value)} className="w-32 rounded-lg border-gray-200 h-9" />
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic py-1.5 flex-1 sm:flex-none">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button onClick={handleSaveBusinessHours} disabled={saving} className="bg-[#3A9B9F] hover:bg-[#2F8488] rounded-xl px-8">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Business Hours
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Auto-Reply Tab */}
          <TabsContent value="autoreply" className="pb-12">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Auto-Reply Configuration</h4>
                    <p className="text-xs text-[#475569]">Automatically respond to incoming messages outside of business hours</p>
                  </div>
                  <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
                </div>

                {autoReplyEnabled && (
                  <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 block transition-all">
                    <Label htmlFor="autoReplyMessage" className="text-sm font-medium text-gray-700">Offline Auto-Reply Message</Label>
                    <Textarea
                      id="autoReplyMessage"
                      value={autoReplyMessage}
                      onChange={(e) => setAutoReplyMessage(e.target.value)}
                      placeholder="Thanks for reaching out! We'll get back to you as soon as possible."
                      className="mt-2 min-h-[140px] rounded-xl border-gray-200 resize-none bg-white shadow-sm"
                    />
                    <p className="text-xs text-[#475569] mt-2">
                      This message is sent instantly when customers message you while you are closed.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end">
                <Button onClick={handleSaveAutoReply} disabled={saving} className="bg-[#3A9B9F] hover:bg-[#2F8488] rounded-xl px-8">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Auto-Reply Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="pb-12">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5">
                <Users className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Team Management</h3>
              <p className="text-sm text-[#475569] max-w-sm mb-6 leading-relaxed">
                Invite team members to help manage your customer conversations across multiple channels.
              </p>
              <Button className="bg-[#3A9B9F] hover:bg-[#2F8488] rounded-xl px-6">
                Upgrade to Professional
              </Button>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-10 pb-12">

            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-[#213138] p-8 text-white">

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-white/70">Meta Business Platform</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Connect your channels</h3>
                  <p className="text-white/65 text-sm max-w-md leading-relaxed">
                    Link WhatsApp Business, Instagram, and Messenger in one OAuth flow. Manage all customer conversations from a single inbox.
                  </p>
                </div>
                <Button
                  onClick={handleConnectMeta}
                  disabled={connecting}
                  className={cn(
                    "shrink-0 h-12 min-w-[180px] font-bold px-8 rounded-2xl shadow-lg transition-all duration-300 active:scale-95",
                    connecting
                      ? "bg-white/10 text-white backdrop-blur-md border border-white/20 cursor-wait opacity-100"
                      : "bg-white text-[#213138] hover:bg-gray-100 border-none shadow-white/10"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-teal-400" />
                        <span className="animate-pulse">Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Connect with Meta
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </div>

            {/* Channel Cards */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Connected Channels</h4>
              <p className="text-sm text-[#475569] mb-5">Each channel connects independently. Disconnect them individually at any time.</p>
              {metaLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-gray-100 p-6 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                      <Skeleton className="h-10 w-10 rounded-xl mb-4" />
                      <Skeleton className="h-5 w-28 mb-2" />
                      <Skeleton className="h-4 w-40 mb-6" />
                      <Skeleton className="h-9 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <ChannelCard channel="whatsapp" label="WhatsApp Business" color="#25D366"
                    icon={<ChannelIcon channel="whatsapp" size="xl" />}
                    status={metaStatus?.whatsapp} disconnecting={disconnecting === "whatsapp"} onDisconnect={() => handleDisconnectChannel("whatsapp")} />
                  <ChannelCard channel="instagram" label="Instagram" color="#E4405F"
                    icon={<ChannelIcon channel="instagram" size="xl" />}
                    status={metaStatus?.instagram} disconnecting={disconnecting === "instagram"} onDisconnect={() => handleDisconnectChannel("instagram")} />
                  <ChannelCard channel="messenger" label="Messenger" color="#0084FF"
                    icon={<ChannelIcon channel="messenger" size="xl" />}
                    status={metaStatus?.messenger} disconnecting={disconnecting === "messenger"} onDisconnect={() => handleDisconnectChannel("messenger")} />
                </div>
              )}
            </div>

            {/* Connected Account Details */}
            {metaStatus && (metaStatus.instagram?.connected || metaStatus.whatsapp?.connected || metaStatus.messenger?.connected) && (
              <div>
                <div className="h-px bg-gray-100 mb-8" />
                <h4 className="font-semibold text-gray-900 mb-5">Connected Accounts</h4>
                <div className="space-y-3">
                  {metaStatus.instagram?.connected && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white font-bold flex-shrink-0">{metaStatus.instagram.account_name?.[0] || "I"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><p className="font-semibold text-gray-900 text-sm">{(metaStatus.instagram.metadata as Record<string, string>)?.ig_username || metaStatus.instagram.account_name || "Instagram"}</p><Badge variant="secondary" size="sm">Instagram</Badge></div>
                        <p className="text-xs text-[#475569] mt-0.5">ID: {metaStatus.instagram.account_id?.slice(0, 8)}...{metaStatus.instagram.account_id?.slice(-4)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600 flex-shrink-0"><CheckCircle className="h-4 w-4" /><span className="text-xs font-semibold">Active</span></div>
                    </div>
                  )}
                  {metaStatus.whatsapp?.connected && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                      <div className="h-11 w-11 rounded-xl bg-[#25D366] flex items-center justify-center text-white flex-shrink-0"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><p className="font-semibold text-gray-900 text-sm">{metaStatus.whatsapp.account_name || "WhatsApp Business"}</p><Badge variant="secondary" size="sm">WhatsApp</Badge></div>
                        {(metaStatus.whatsapp.metadata as Record<string, string>)?.phone_display && <p className="text-xs text-[#475569] mt-0.5">{(metaStatus.whatsapp.metadata as Record<string, string>).phone_display}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600 flex-shrink-0"><CheckCircle className="h-4 w-4" /><span className="text-xs font-semibold">Active</span></div>
                    </div>
                  )}
                  {metaStatus.messenger?.connected && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                      <div className="h-11 w-11 rounded-xl bg-[#0084FF] flex items-center justify-center text-white flex-shrink-0"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z" /></svg></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><p className="font-semibold text-gray-900 text-sm">{metaStatus.messenger.account_name || "Messenger"}</p><Badge variant="secondary" size="sm">Messenger</Badge></div>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600 flex-shrink-0"><CheckCircle className="h-4 w-4" /><span className="text-xs font-semibold">Active</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Webhook info strip */}
            <div>
              <div className="h-px bg-gray-100 mb-8" />
              <h4 className="font-semibold text-gray-900 mb-5">Webhook Status</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Status</span></div>
                  <p className="font-semibold text-emerald-800 text-sm">Active</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1">Endpoint</p>
                  <code className="text-xs font-mono text-gray-700">/api/webhooks/meta</code>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1">Verification</p>
                  <div className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /><span className="text-sm font-semibold">Verified</span></div>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1">Last Event</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              <p className="text-xs text-[#475569] mt-3">Subscribed events: <span className="font-medium text-gray-700">messages · message_deliveries · message_reads</span></p>
            </div>
          </TabsContent>

          {/* WhatsApp Business Profile Tab */}
          <TabsContent value="whatsapp" className="pb-12">
            {metaStatus?.whatsapp?.connected === false ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
                  <Building2 className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">WhatsApp Not Connected</h3>
                <p className="text-sm text-[#475569] max-w-sm mb-6 leading-relaxed">
                  Connect your Meta account with WhatsApp Business permissions to manage your public business profile.
                </p>
                <Button
                  onClick={() => { const el = document.querySelector('[value="integrations"]') as HTMLButtonElement | null; el?.click() }}
                  className="bg-[#3A9B9F] hover:bg-[#2F8488] rounded-xl px-6"
                >
                  Go to Integrations
                </Button>
              </div>
            ) : (
              <div className="space-y-10">

                {/* Business Info */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Business Info</h4>
                      <p className="text-xs text-[#475569]">Displayed publicly on your WhatsApp Business profile</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="wpBusinessName" className="text-sm font-medium text-gray-700">Business Name <span className="text-[#FF8B66]">*</span></Label>
                      <Input id="wpBusinessName" value={wpBusinessName} onChange={(e) => setWpBusinessName(e.target.value)} placeholder="Simply Dave Nassau Tours" className="mt-1.5 rounded-xl border-gray-200" />
                    </div>
                    <div>
                      <Label htmlFor="wpDescription" className="text-sm font-medium text-gray-700">Business Description</Label>
                      <Textarea id="wpDescription" value={wpDescription} onChange={(e) => setWpDescription(e.target.value)} placeholder="Premier boat tours and water sports in Nassau, Bahamas..." className="mt-1.5 min-h-[110px] rounded-xl border-gray-200 resize-none" />
                      <p className="text-xs text-[#475569] mt-1.5">Max 512 characters · Shown in your WhatsApp profile card</p>
                    </div>
                    <div>
                      <Label htmlFor="wpCategory" className="text-sm font-medium text-gray-700">Business Category</Label>
                      <SimpleSelect value={wpCategory} onValueChange={setWpCategory} options={waCategoryOptions} className="mt-1.5" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Contact Info */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Contact Information</h4>
                      <p className="text-xs text-[#475569]">How customers can reach you outside of WhatsApp</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="wpPhone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                      <Input id="wpPhone" value={wpPhone} onChange={(e) => setWpPhone(e.target.value)} placeholder="+1-242-555-0199" className="mt-1.5 rounded-xl border-gray-200" />
                    </div>
                    <div>
                      <Label htmlFor="wpEmail" className="text-sm font-medium text-gray-700">Email Address</Label>
                      <Input id="wpEmail" type="email" value={wpEmail} onChange={(e) => setWpEmail(e.target.value)} placeholder="info@simplydavenassau.com" className="mt-1.5 rounded-xl border-gray-200" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="wpWebsite" className="text-sm font-medium text-gray-700">Website URL</Label>
                      <Input id="wpWebsite" value={wpWebsite} onChange={(e) => setWpWebsite(e.target.value)} placeholder="www.simplydavenassau.com" className="mt-1.5 rounded-xl border-gray-200" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Location & Hours */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Location &amp; Hours</h4>
                      <p className="text-xs text-[#475569]">Let customers know where to find you and when you're open</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="wpAddress" className="text-sm font-medium text-gray-700">Business Address</Label>
                      <Input id="wpAddress" value={wpAddress} onChange={(e) => setWpAddress(e.target.value)} placeholder="Paradise Island, Nassau, Bahamas" className="mt-1.5 rounded-xl border-gray-200" />
                    </div>
                    <div>
                      <Label htmlFor="wpHours" className="text-sm font-medium text-gray-700">Business Hours</Label>
                      <Input id="wpHours" value={wpHours} onChange={(e) => setWpHours(e.target.value)} placeholder="Monday-Saturday 8:00 AM - 6:00 PM, Sunday Closed" className="mt-1.5 rounded-xl border-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {wpSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      Saved successfully
                    </span>
                  )}
                  <Button onClick={handleSaveWhatsAppProfile} disabled={wpSaving} className="bg-[#3A9B9F] hover:bg-[#2F8488] rounded-xl px-8">
                    {wpSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-10 pb-12">

            {/* Current Plan */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Current Plan Overview</h4>
                  <p className="text-xs text-[#475569]">Manage your active subscription and upcoming charges</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <h5 className="font-semibold text-gray-900 text-lg">TropiChat {customer?.plan?.charAt(0).toUpperCase() + (customer?.plan?.slice(1) || "")}</h5>
                    <p className="text-sm text-[#475569] mt-1">{customer?.plan === "free" ? "You are currently exploring the 14-day free trial." : "Your workspace is growing efficiently."}</p>
                  </div>
                  <Badge variant={customer?.plan === "free" ? "secondary" : "success"} className="px-3 py-1">
                    {customer?.plan?.charAt(0).toUpperCase() + (customer?.plan?.slice(1) || "")}
                  </Badge>
                </div>

                {customer?.plan === "free" ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h6 className="font-semibold text-emerald-900">Ready to level up?</h6>
                      <p className="text-sm text-emerald-700 mt-1">Upgrade to Professional to unlock team management and advanced integrations.</p>
                    </div>
                    <Button className="bg-[#3A9B9F] hover:bg-[#2F8488] rounded-xl text-white shrink-0 shadow-sm">
                      Upgrade Now
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-[#475569] font-medium mb-1">Monthly Cost</p>
                      <p className="text-2xl font-bold text-gray-900">$59<span className="text-sm text-gray-500 font-normal">/mo</span></p>
                    </div>
                    <div>
                      <p className="text-sm text-[#475569] font-medium mb-1">Next Billing Date</p>
                      <p className="text-lg font-semibold text-gray-900">Feb 15, 2024</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Usage */}
            <div>
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900">Workspace Usage</h4>
                <p className="text-xs text-[#475569]">Monitor your limits and message volume for the current billing cycle</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm text-gray-900">Contacts</span>
                    <span className="text-sm font-semibold text-[#3A9B9F]">127 / 500</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-[#3A9B9F] h-full rounded-full transition-all" style={{ width: "25%" }} />
                  </div>
                  <p className="text-xs text-[#475569] mt-3">Active unique clients</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm text-gray-900">Messages</span>
                    <span className="text-sm font-semibold text-gray-900">1,234</span>
                  </div>
                  <div className="w-full bg-emerald-50 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: "100%" }} />
                  </div>
                  <p className="text-xs text-[#475569] mt-3">Unlimited messages on all plans</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Payment Method */}
            <div>
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900">Payment Method</h4>
                <p className="text-xs text-[#475569]">The card charged for your monthly subscription</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl w-14 h-10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">•••• •••• •••• 4242</p>
                    <p className="text-xs text-[#475569] mt-0.5">Expires 12/25</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl border-gray-200 shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                  Update
                </Button>
              </div>
            </div>

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function MobileTabLink({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-4 px-2 transition-colors active:bg-gray-50 rounded-2xl">
      <div className="flex items-center gap-4">
        <Icon className="h-[22px] w-[22px] text-[#475569]" strokeWidth={1.5} />
        <span className="font-medium text-[#213138] text-[16px]">{label}</span>
      </div>
      <ChevronRight className="h-[20px] w-[20px] text-gray-400" strokeWidth={1.5} />
    </button>
  )
}

// ==================== Channel Status Card ====================

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
        "bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]",
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
          <h4 className="font-bold text-[#213138] font-[family-name:var(--font-poppins)] text-lg leading-tight truncate">
            {label}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            {isConnected ? (
              <div className="flex items-center gap-1.5 text-[#3A9B9F] text-xs font-bold uppercase tracking-wider">
                <div className="h-1.5 w-1.5 rounded-full bg-[#3A9B9F] animate-pulse" />
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
          <div className="p-3 rounded-xl bg-gray-50/50 border border-gray-100/50">
            <p className="text-sm font-semibold text-gray-700 truncate">
              {status.account_name}
            </p>
            {status.metadata && (status.metadata as Record<string, string>).phone_display && (
              <p className="text-xs text-gray-400 mt-0.5">
                {(status.metadata as Record<string, string>).phone_display}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
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
          className="w-full rounded-xl border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 font-bold transition-all duration-200"
        >
          {disconnecting ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5 mr-2" />
          )}
          Disconnect Channel
        </Button>
      )}
    </motion.div>
  )
}
