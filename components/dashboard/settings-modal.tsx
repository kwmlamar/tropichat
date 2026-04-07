"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  User, 
  Bell, 
  CreditCard, 
  Users, 
  InstagramLogo, 
  WhatsappLogo, 
  MessengerLogo, 
  Globe, 
  Tag, 
  Stack,
  CheckCircle,
  CaretRight,
  ShieldCheck,
  House,
  SignOut,
  AppWindow,
  Phone,
  ChatCircleText,
  Smiley,
  MagicWand,
  CircleNotch,
  ArrowRight,
  Plus,
  Trash,
  ArrowsClockwise,
  Buildings,
  Lock,
  EnvelopeSimple,
  Clock,
  ChatCircleDots,
  MapPin,
  DeviceMobile,
  At,
  IdentificationCard,
  Target,
  Lightning,
  Shield,
  Briefcase,
  ShareNetwork,
  BellRinging,
  Warning,
  CalendarBlank,
  Copy,
  CheckFat,
  ArrowSquareOut
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { SimpleSelect } from "@/components/ui/dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { 
  signOut, 
  updateCustomer, 
  updatePersonalProfile, 
  changePassword, 
  getCurrentCustomer, 
  getPersonalCustomer,
  getWorkspaceUsage,
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  getSupabase
} from "@/lib/supabase"
import { 
  getMetaStatus, 
  initiateMetaConnect, 
  disconnectChannel, 
  fetchBusinessProfile, 
  updateBusinessProfile,
  fetchFacebookPages,
  selectFacebookPage,
  fetchInstagramAccounts,
  selectInstagramAccount,
  fetchWhatsAppNumbers,
  selectWhatsAppNumber,
  type MetaStatus,
  type ChannelStatus,
  type BusinessProfile,
  type FacebookPage,
  type InstagramAccount,
  type WhatsAppPhoneNumber
} from "@/lib/meta-connections"
import { fetchEmailAccounts, addEmailAccount, toggleEmailStatus, disconnectEmailAccount } from "@/lib/omni-connections"
import { subscribeToPush, unsubscribeFromPush, getNotificationPermission, isPushSupported } from "@/lib/push-notifications"
import { useRouter } from "next/navigation"
import type { Customer, BusinessHours, TeamMember, MetaChannel } from "@/types/database"
import { PricingCard, type PlanTier, type BillingInterval } from "@/components/billing/PricingCard"
import { PricingToggle } from "@/components/billing/PricingToggle"
import { UsageBar } from "@/components/billing/UsageBar"
import { UpgradeModal } from "@/components/billing/UpgradeModal"
import { PERMISSIONS, normalizePlan } from "@/lib/billing/permissions"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  initialTab?: string
}

export type Tab = 
  | "profile" 
  | "hours"
  | "notifications" 
  | "billing" 
  | "team" 
  | "instagram" 
  | "whatsapp" 
  | "messenger" 
  | "email"
  | "sms"
  | "autoreply"
  | "booking"
  | "ai"

const timezones = [
  { value: "America/Nassau", label: "Bahamas (Nassau)" },
  { value: "America/Jamaica", label: "Jamaica (Kingston)" },
  { value: "America/Port_of_Spain", label: "Trinidad (Port of Spain)" },
  { value: "America/Barbados", label: "Barbados (Bridgetown)" },
  { value: "America/New_York", label: "Eastern Time (US)" },
]

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

export function SettingsModal({ isOpen, onClose, user, initialTab }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const router = useRouter()

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as Tab)
    }
  }, [initialTab, isOpen])

  // Data states
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [personalProfile, setPersonalProfile] = useState<any>(user)
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
  }, [])

  useEffect(() => {
    if (isOpen) {
      refreshData()
    }
  }, [isOpen, refreshData])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (!isOpen) return null

  const tabs = [
    { id: "profile", label: "Profile", icon: User, section: "Account" },
    { id: "notifications", label: "Notifications", icon: Bell, section: "Account" },
    { id: "billing", label: "Billing & Plans", icon: CreditCard, section: "Account" },
    { id: "team", label: "Team Members", icon: Users, section: "Account" },
    { id: "hours", label: "Business Hours", icon: Clock, section: "Workspace" },
    { id: "autoreply", label: "Auto-Reply", icon: ChatCircleDots, section: "Workspace" },
    { id: "booking", label: "Booking Page", icon: CalendarBlank, section: "Workspace" },
    { id: "ai", label: "Tropi AI", icon: MagicWand, section: "Workspace" },
    { id: "instagram", label: "Instagram", icon: InstagramLogo, section: "Channels" },
    { id: "whatsapp", label: "WhatsApp", icon: WhatsappLogo, section: "Channels" },
    { id: "messenger", label: "Messenger", icon: MessengerLogo, section: "Channels" },
    { id: "email", label: "Email", icon: At, section: "Channels" },
    { id: "sms", label: "SMS", icon: DeviceMobile, section: "Channels" },
  ]

  const sections = ["Account", "Workspace", "Channels"]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-10 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-full lg:h-[85vh] bg-white dark:bg-[#0C0C0C] lg:rounded-[24px] shadow-2xl overflow-hidden flex flex-col lg:flex-row pointer-events-auto border border-gray-200 dark:border-[#1C1C1C]"
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#1C1C1C] bg-[#F9FAFB] dark:bg-[#080808]">
            <h2 className="text-[15px] font-bold dark:text-white">Settings</h2>
            <button onClick={onClose} className="p-2"><X weight="bold" className="h-5 w-5 text-gray-400" /></button>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-64 border-r border-gray-100 dark:border-[#1C1C1C] flex flex-col bg-[#F9FAFB] dark:bg-[#080808] shrink-0 overflow-hidden">
            {/* User Header */}
            <div className="hidden lg:block p-5 pb-3">
              <div className="flex items-center gap-3 p-2 rounded-xl transition-colors">
                <Avatar 
                  fallback={(personalProfile?.full_name || personalProfile?.contact_email || "U")[0].toUpperCase()} 
                  size="sm" 
                  className="ring-2 ring-white dark:ring-[#111]"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                    {personalProfile?.full_name || "User"}
                  </p>
                  <p className="text-[10px] font-bold text-[#007B85] uppercase tracking-widest">
                    {customer?.business_name || "Admin"}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-x-auto lg:overflow-y-auto px-3 py-2 flex lg:flex-col gap-2 lg:gap-0 lg:space-y-6 scrollbar-hide">
              {sections.map(section => (
                <div key={section} className="shrink-0 lg:shrink-1 lg:space-y-1">
                  <p className="hidden lg:block px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mb-2">{section}</p>
                  <div className="flex lg:flex-col gap-1 lg:gap-0">
                    {tabs.filter(t => t.section === section).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        className={cn(
                          "whitespace-nowrap flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200",
                          activeTab === tab.id
                            ? "bg-[#007B85]/10 text-[#007B85] dark:bg-[#007B85]/20"
                            : "text-gray-500 hover:text-gray-900 dark:text-[#A3A3A3] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#111]"
                        )}
                      >
                        <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className="h-4 w-4 shrink-0" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="hidden lg:block p-4 border-t border-gray-100 dark:border-[#1C1C1C]">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all"
              >
                <SignOut weight="bold" className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-[#0C0C0C] overflow-hidden">
            <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-gray-100 dark:border-[#1C1C1C] shrink-0">
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <button 
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
                >
                  <X weight="bold" className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 lg:p-12 pb-24 lg:pb-12">
              <div className="max-w-2xl mx-auto">
                <TabContent 
                  activeTab={activeTab} 
                  customer={customer} 
                  personalProfile={personalProfile} 
                  metaStatus={metaStatus}
                  onRefresh={refreshData}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export function TabContent({ activeTab, customer, personalProfile, metaStatus, onRefresh }: { 
  activeTab: Tab, 
  customer: Customer | null, 
  personalProfile: any, 
  metaStatus: MetaStatus | null,
  onRefresh: () => void
}) {
  switch (activeTab) {
    case "profile": return <ProfileSettings customer={customer} profile={personalProfile} onRefresh={onRefresh} />
    case "hours": return <BusinessHoursSettings customer={customer} onRefresh={onRefresh} />
    case "autoreply": return <AutoReplySettings customer={customer} onRefresh={onRefresh} />
    case "notifications": return <NotificationSettings />
    case "billing": return <BillingSettings customer={customer} onRefresh={onRefresh} />
    case "team": return <TeamSettings />
    case "instagram": return <ChannelDetail channel="instagram" status={metaStatus?.instagram} onRefresh={onRefresh} />
    case "whatsapp": return <WhatsAppSettings status={metaStatus?.whatsapp} onRefresh={onRefresh} />
    case "messenger": return <ChannelDetail channel="messenger" status={metaStatus?.messenger} onRefresh={onRefresh} />
    case "email": return <EmailSettings onRefresh={onRefresh} />
    case "sms": return <SMSSettings customer={customer} onRefresh={onRefresh} />
    case "booking": return <BookingPageSettings />
    case "ai": return <AISettings customer={customer} onRefresh={onRefresh} />
    default: return null
  }
}

/* --- SUB-COMPONENTS --- */

function ProfileSettings({ customer, profile, onRefresh }: { customer: any, profile: any, onRefresh: () => void }) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [businessName, setBusinessName] = useState(customer?.business_name || "")
  const [timezone, setTimezone] = useState(customer?.timezone || "America/Nassau")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const [pRes, cRes] = await Promise.all([
      updatePersonalProfile({ full_name: fullName }),
      updateCustomer({ business_name: businessName, timezone })
    ])
    if (!pRes.error && !cRes.error) {
      toast.success("Profile updated successfully")
      onRefresh()
    } else {
      toast.error("Failed to update profile")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-10">
      <section>
        <h4 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Personal & Business</h4>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Your Full Name</Label>
              <Input 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Business Name</Label>
              <Input 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="My Business"
                className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Default Timezone</Label>
            <SimpleSelect 
              value={timezone} 
              onValueChange={setTimezone} 
              options={timezones} 
              className="w-full"
            />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full lg:w-auto bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-10 h-11"
          >
            {saving ? <CircleNotch className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
          </Button>
        </div>
      </section>

      <div className="h-px bg-gray-100 dark:bg-[#1C1C1C]" />

      <section>
        <h4 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Security</h4>
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C] flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold dark:text-white mb-1">Update Password</p>
            <p className="text-xs text-gray-500">Change your login credentials securely.</p>
          </div>
          <Button variant="outline" className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:hover:bg-[#111]">
            Change
          </Button>
        </div>
      </section>
    </div>
  )
}

function BusinessHoursSettings({ customer, onRefresh }: { customer: Customer | null, onRefresh: () => void }) {
  const [hours, setHours] = useState<BusinessHours>(customer?.business_hours || {} as BusinessHours)
  const [saving, setSaving] = useState(false)

  const updateDay = (day: string, field: string, value: any) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof BusinessHours], [field]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateCustomer({ business_hours: hours })
    if (!error) {
      toast.success("Hours updated")
      onRefresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold dark:text-white mb-1">Standard Availability</h3>
        <p className="text-sm text-gray-500 mb-6">Set your workspace hours. Our AI can use these for automatic replies.</p>
        
        <div className="space-y-2 bg-gray-50 dark:bg-[#080808] rounded-2xl p-4 border border-gray-100 dark:border-[#1C1C1C]">
          {days.map(day => (
            <div key={day} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3 w-32">
                <Switch 
                  checked={hours[day]?.enabled || false} 
                  onCheckedChange={v => updateDay(day, "enabled", v)}
                />
                <span className="text-[14px] font-bold capitalize select-none dark:text-white">{day}</span>
              </div>
              
              {hours[day]?.enabled ? (
                <div className="flex items-center gap-2">
                  <Input 
                    type="time" 
                    value={hours[day]?.start || "09:00"} 
                    onChange={e => updateDay(day, "start", e.target.value)}
                    className="h-9 w-28 text-center rounded-xl bg-white dark:bg-[#111] dark:border-[#222]"
                  />
                  <span className="text-gray-400 px-1">—</span>
                  <Input 
                    type="time" 
                    value={hours[day]?.end || "17:00"} 
                    onChange={e => updateDay(day, "end", e.target.value)}
                    className="h-9 w-28 text-center rounded-xl bg-white dark:bg-[#111] dark:border-[#222]"
                  />
                </div>
              ) : (
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase pr-3">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-8 h-10 w-full lg:w-auto">
        {saving ? <CircleNotch className="h-4 w-4 animate-spin mr-2" /> : "Update Business Hours"}
      </Button>
    </div>
  )
}

function AutoReplySettings({ customer, onRefresh }: { customer: Customer | null, onRefresh: () => void }) {
  const [enabled, setEnabled] = useState(customer?.auto_reply_enabled || false)
  const [message, setMessage] = useState(customer?.auto_reply_message || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateCustomer({ 
      auto_reply_enabled: enabled, 
      auto_reply_message: message 
    })
    if (!error) {
      toast.success("Auto-reply saved")
      onRefresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C]">
        <div>
          <h4 className="text-[15px] font-bold dark:text-white mb-1">Enable Auto-Reply</h4>
          <p className="text-xs text-gray-500">Automatically respond when you're away.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className={cn("space-y-2 transition-opacity duration-300", !enabled && "opacity-50 pointer-events-none")}>
        <Label className="text-[13px] font-semibold dark:text-gray-300">Offline Message</Label>
        <Textarea 
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Hi! We're currently offline. We'll get back to you during business hours."
          className="min-h-[140px] rounded-2xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#080808]"
        />
        <p className="text-[11px] text-gray-400 italic">This message is sent when any contact messages you outside of business hours.</p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-10 h-10">
        {saving ? <CircleNotch className="h-4 w-4 animate-spin mr-2" /> : "Save Settings"}
      </Button>
    </div>
  )
}

function NotificationSettings() {
  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPushSupported(isPushSupported())
    setPushEnabled(getNotificationPermission() === 'granted')
  }, [])

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    if (checked) {
      const { success } = await subscribeToPush()
      if (success) setPushEnabled(true)
    } else {
      const { success } = await unsubscribeFromPush()
      if (success) setPushEnabled(false)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <section>
        <h4 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Device Notifications</h4>
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-[#007B85]/10 rounded-xl">
                <Bell weight="bold" className="h-5 w-5 text-[#007B85]" />
              </div>
              <div>
                <p className="text-[14px] font-bold dark:text-white">Push Notifications</p>
                <p className="text-xs text-gray-500">Alerts for new messages and automation triggers.</p>
              </div>
            </div>
            {pushSupported ? (
              <Switch checked={pushEnabled} onCheckedChange={handleToggle} disabled={loading} />
            ) : (
              <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 dark:bg-[#111] px-2 py-1 rounded">Unsupported</span>
            )}
          </div>
          {pushEnabled && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl mt-4">
              <CheckCircle weight="fill" className="h-4 w-4 text-green-500" />
              <p className="text-[11px] font-bold text-green-600">Notifications are active on this browser.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

const STRIPE_PRICE_ENV: Record<PlanTier, { monthly: string | undefined; annual: string | undefined }> = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL,
  },
  medium: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEDIUM_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_MEDIUM_ANNUAL,
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL,
  },
  elite: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY,
    annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_ANNUAL,
  },
}


function BillingSettings({ customer, onRefresh }: { customer: any, onRefresh: () => void }) {
  const [bookingCount, setBookingCount] = useState(0)
  const [usage, setUsage] = useState({ contacts: 0, messages: 0 })
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly")
  const [upgradingTier, setUpgradingTier] = useState<PlanTier | null>(null)
  const [upgradeModalTier, setUpgradeModalTier] = useState<PlanTier | null>(null)
  const [managingPortal, setManagingPortal] = useState(false)

  // Map legacy plan names to new tiers for UI consistency
  const currentPlan = useMemo(() => {
    const raw = customer?.plan?.toLowerCase() || "starter"
    if (raw === "coconut" || raw === "free") return "starter"
    if (raw === "starter" || raw === "tropic") return "starter"
    if (raw === "medium" || raw === "island_pro") return "medium"
    if (raw === "pro" || raw === "professional") return "pro"
    if (raw === "elite" || raw === "enterprise") return "elite"
    return "starter"
  }, [customer?.plan]) as PlanTier

  const isStarter = currentPlan === "starter"


  useEffect(() => {
    async function fetchUsage() {
      const data = await getWorkspaceUsage()
      if (!data.error) {
        setUsage({ contacts: data.contactsCount, messages: data.messagesCount })
      }
      const supabase = getSupabase()
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { count } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "cancelled")
          .gte("booking_date", monthStart)
          .lte("booking_date", monthEnd)
        setBookingCount(count ?? 0)
      }
    }
    fetchUsage()
  }, [])

  const handleUpgrade = async (tier: PlanTier, interval: BillingInterval) => {
    if (tier as any === "coconut") return

    setUpgradingTier(tier)
    try {
      const envKeys = STRIPE_PRICE_ENV[tier]
      const priceId = interval === "annual"
        ? envKeys.annual
        : envKeys.monthly


      if (!priceId) {
        toast.error("Pricing not configured. Contact support.")
        return
      }
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error("Not authenticated"); return }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        toast.error(json.error || "Failed to start checkout")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setUpgradingTier(null)
    }
  }

  const handleManagePortal = async () => {
    setManagingPortal(true)
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error("Not authenticated"); return }

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        toast.error(json.error || "Failed to open billing portal")
      }
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setManagingPortal(false)
    }
  }

  const handleTrialUpgrade = async (tier: PlanTier) => {
    try {
      const { error } = await updateCustomer({ plan: tier as any })
      if (error) throw error
      toast.success(`Upgraded to ${tier} trial!`)
      setUpgradeModalTier(null)
      onRefresh()
    } catch {
      toast.error("Failed to update trial plan")
    }
  }

  const planDisplayName =
    currentPlan === "starter" ? `Starter — ${customer?.plan === 'free' ? 'Free Trial' : '$15/mo'}`
    : currentPlan === "medium" ? `Medium — $${billingInterval === "annual" ? "28/mo" : "35/mo"}`
    : currentPlan === "pro" ? `Pro — $${billingInterval === "annual" ? "60/mo" : "75/mo"}`
    : `Elite (Managed) — $${billingInterval === "annual" ? "349/mo" : "399/mo"}`


  return (
    <div className="space-y-10">
      {/* Current plan card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-[#3A9B9F] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-[#3A9B9F]/10 border border-[#3A9B9F]/20">
                Active Plan
              </span>
            </div>
            <h3 className="text-2xl font-black text-[#213138] dark:text-white">
              {planDisplayName.split(' — ')[0]}
            </h3>
            <p className="text-sm font-bold text-gray-500 dark:text-[#525252]">
              {planDisplayName.split(' — ')[1]}
            </p>
            {customer?.stripe_current_period_end && (
              <div className="flex items-center gap-1.5 pt-2 text-[11px] font-medium text-gray-400">
                <Clock weight="bold" className="h-3.5 w-3.5" />
                Next bill on {new Date(customer.stripe_current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </div>
            )}
          </div>

          {!isStarter || customer?.plan !== 'free' ? (
            <Button
              onClick={handleManagePortal}
              disabled={managingPortal}
              className="bg-[#213138] dark:bg-white text-white dark:text-[#0C0C0C] hover:opacity-90 rounded-xl font-bold h-10 px-6"
            >
              {managingPortal ? <CircleNotch className="h-4 w-4 animate-spin mr-2" /> : <CreditCard weight="bold" className="h-4 w-4 mr-2" />}
              Manage Billing
            </Button>
          ) : null}
        </div>

        {customer && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#1C1C1C]">
            <UsageBar 
              used={usage.contacts} 
              limit={PERMISSIONS[currentPlan]?.maxContacts || 500} 
              label="Contacts Used" 
            />
          </div>
        )}
      </div>

      {/* Pricing Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-black text-[#213138] dark:text-white" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Available Plans</h4>
            <p className="text-sm text-gray-500 font-medium">Choose the best fit for your growing business.</p>
          </div>
          <PricingToggle value={billingInterval} onChange={setBillingInterval} />
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["starter", "medium", "pro", "elite"] as PlanTier[]).map((tier) => (
            <PricingCard
              key={tier}
              tier={tier}
              isHighlighted={tier === "pro"}
              isCurrentPlan={tier === currentPlan}
              billingInterval={billingInterval}
              isUpgrading={upgradingTier === tier}
              onUpgrade={(t) => setUpgradeModalTier(t)}
            />
          ))}
        </div>
      </div>

      {upgradeModalTier && (
        <UpgradeModal
          tier={upgradeModalTier}
          billingInterval={billingInterval}
          isOpen={!!upgradeModalTier}
          isTrial={customer?.status === 'trial' || customer?.plan === 'free'}
          onClose={() => setUpgradeModalTier(null)}
          onConfirm={handleUpgrade}
          onTrialUpgrade={handleTrialUpgrade}
        />
      )}

      {/* Usage section */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-[0.2em]">Usage Analytics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-gray-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 flex items-center justify-center bg-[#3A9B9F]/10 rounded-xl">
                <ChatCircleDots weight="bold" className="h-5 w-5 text-[#3A9B9F]" />
              </div>
              <p className="text-[11px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest text-balance">Messages Sent</p>
            </div>
            <p className="text-4xl font-black text-[#213138] dark:text-white tabular-nums tracking-tighter">
              {usage.messages.toLocaleString()}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-gray-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 flex items-center justify-center bg-[#3A9B9F]/10 rounded-xl">
                <Users weight="bold" className="h-5 w-5 text-[#3A9B9F]" />
              </div>
              <p className="text-[11px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest">Contacts Stored</p>
            </div>
            <p className="text-4xl font-black text-[#213138] dark:text-white tabular-nums tracking-tighter">
              {usage.contacts.toLocaleString()}
            </p>
          </div>
        </div>
      </div>


      {/* Upgrade modal */}
      {upgradeModalTier && (
        <UpgradeModal
          tier={upgradeModalTier}
          billingInterval={billingInterval}
          isOpen={true}
          onClose={() => setUpgradeModalTier(null)}
          onConfirm={handleUpgrade}
        />
      )}
    </div>
  )
}

function TeamSettings() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await getTeamMembers()
      if (data) setMembers(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold dark:text-white">Workspace Team</h3>
          <p className="text-xs text-gray-500">Add staff to help manage your customers.</p>
        </div>
        <Button size="sm" className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl h-9">
          <Plus weight="bold" className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="space-y-3">
        {members.map(member => (
          <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C]">
            <div className="flex items-center gap-3">
              <Avatar fallback={(member.name || "U")[0]} size="sm" />
              <div>
                <p className="text-[14px] font-bold dark:text-white">{member.name || "Pending..."}</p>
                <p className="text-[11px] text-gray-500">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-[#007B85]/10 text-[#007B85] dark:bg-[#007B85]/20 px-2 py-0.5 rounded-full">
                {member.role || "Member"}
              </span>
              <button className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChannelEmptyState({ channel, onConnect, icon: Icon, color, features }: { 
  channel: string, 
  onConnect: () => void, 
  icon: any, 
  color: string,
  features: string[]
}) {
  return (
    <div className="flex flex-col items-center py-4">
       <div className={cn("h-20 w-20 flex items-center justify-center rounded-[28px] shadow-2xl mb-8", color)}>
          <Icon weight="duotone" className="h-10 w-10 text-white" />
       </div>
       <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Connect {channel}</h3>
       <p className="text-gray-500 text-sm max-w-xs text-center leading-relaxed mb-10">
          Sync your {channel} conversations and automate your customer engagement in one place.
       </p>
       
       <div className="w-full space-y-3 mb-10">
          {features.map((f, i) => (
             <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C]">
                <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
                   <CheckCircle weight="fill" className="h-3.5 w-3.5 text-green-500" />
                </div>
                <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">{f}</span>
             </div>
          ))}
       </div>

       <Button 
          onClick={onConnect} 
          className={cn("w-full py-7 rounded-2xl text-white font-black text-base transition-transform active:scale-[0.98] shadow-xl", color)}
       >
          Connect {channel} via Meta
       </Button>
       <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Official Meta Business Partner</p>
    </div>
  )
}

function ChannelDetail({ channel, status, onRefresh }: { channel: MetaChannel, status: any, onRefresh: () => void }) {
  const [connecting, setConnecting] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [options, setOptions] = useState<any[]>([])
  const [showOptions, setShowOptions] = useState(false)
  
  const handleConnect = async () => {
    setConnecting(true)
    const { url } = await initiateMetaConnect()
    if (url) window.location.href = url
  }

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${channel}? This will stop all message syncing.`)) return
    setDisconnecting(true)
    const { error } = await disconnectChannel(channel)
    if (!error) {
      toast.success(`${channel} disconnected successfully`)
      onRefresh()
    } else {
      toast.error(error)
    }
    setDisconnecting(false)
  }

  const handleFetchOptions = async () => {
    setSwitching(true)
    let res: any
    if (channel === 'instagram') res = await fetchInstagramAccounts()
    else if (channel === 'messenger') res = await fetchFacebookPages()
    
    if (res?.data) setOptions(res.data)
    setShowOptions(true)
    setSwitching(false)
  }

  const handleSelect = async (id: string, name: string, pic?: string, username?: string) => {
    setSwitching(true)
    let res: any
    if (channel === 'instagram') res = await selectInstagramAccount({ accountId: id, accountName: name, profilePictureUrl: pic, username })
    else if (channel === 'messenger') res = await selectFacebookPage({ pageId: id, pageName: name, profilePictureUrl: pic })
    
    if (!res?.error) {
      toast.success(`Switched to ${name}`)
      onRefresh()
      setShowOptions(false)
    }
    setSwitching(false)
  }

  const handleSync = async () => {
    toast.success(`Syncing ${channel} history...`)
    const { data: { session } } = await getSupabase().auth.getSession()
    await fetch('/api/meta/sync-history', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: status?.id })
    })
    toast.success("Sync complete!")
  }

  if (!status?.connected) {
     const meta = {
        instagram: { icon: InstagramLogo, color: "bg-gradient-to-tr from-[#FFB347] via-[#FF3366] to-[#CB1D8D] shadow-pink-500/20", features: ["Unified Inbox Sync", "Story Mentions Tracking", "Auto-Replies for DMs"] },
        messenger: { icon: MessengerLogo, color: "bg-gradient-to-b from-[#00C6FF] to-[#0072FF] shadow-blue-500/20", features: ["Live Chat on Website", "Order Status Automation", "Facebook Page Integration"] }
     } as any
     return <ChannelEmptyState channel={channel} onConnect={handleConnect} {...meta[channel]} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 rounded-3xl border border-gray-100 dark:border-[#1C1C1C] bg-gray-50 dark:bg-[#080808]">
        <div className="flex items-center gap-4 text-left">
           <Avatar src={status.profile_picture_url} fallback={status.account_name} size="md" className="rounded-xl shadow-lg" />
           <div className="min-w-0">
              <p className="text-[14px] font-bold dark:text-white mb-0.5 truncate">{status.account_name}</p>
              <p className="text-xs text-gray-500">ID: {status.account_id}</p>
           </div>
        </div>
        <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">Active</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={handleSync} className="rounded-xl border-gray-200 dark:border-[#1C1C1C] h-12 font-bold dark:text-white dark:hover:bg-[#111]">
          <ArrowsClockwise className="h-4 w-4 mr-2" />
          Sync History
        </Button>
        <Button variant="outline" onClick={handleFetchOptions} disabled={switching} className="rounded-xl border-gray-200 dark:border-[#1C1C1C] h-12 font-bold dark:text-white dark:hover:bg-[#111]">
          {switching ? <CircleNotch className="animate-spin h-4 w-4" /> : <IdentificationCard className="h-4 w-4 mr-2" />}
          Switch Account
        </Button>
      </div>

      <AnimatePresence>
        {showOptions && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 space-y-2 border-t border-gray-100 dark:border-[#1C1C1C]"
          >
            <div className="text-left py-2 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available {channel === 'instagram' ? 'Accounts' : 'Pages'}</p>
              <button onClick={() => setShowOptions(false)} className="text-[10px] font-bold text-[#007B85] hover:underline">Close</button>
            </div>
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id, opt.name, opt.profile_picture_url, opt.username)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                  opt.is_connected 
                    ? "border-[#007B85] bg-[#007B85]/5 shadow-sm" 
                    : "border-gray-100 dark:border-[#1C1C1C] hover:border-gray-200 dark:hover:bg-[#111]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar src={opt.profile_picture_url} fallback={opt.name} size="sm" className="rounded-lg" />
                  <div className="text-left">
                    <p className="text-sm font-bold dark:text-white">{opt.name}</p>
                    <p className="text-[10px] text-gray-400">@{opt.username || opt.category}</p>
                  </div>
                </div>
                {opt.is_connected && <CheckCircle weight="fill" className="h-4 w-4 text-[#007B85]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-8 border-t border-gray-100 dark:border-[#1C1C1C]">
          <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Automation & Health</h4>
              <button onClick={handleDisconnect} disabled={disconnecting} className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1.5 transition-colors">
                  {disconnecting ? <CircleNotch className="h-3 w-3 animate-spin" /> : <Warning className="h-3 w-3" />}
                  Disconnect {channel}
              </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C]">
                  <Lightning weight="fill" className="h-4 w-4 text-amber-500 mb-2" />
                  <p className="text-xs font-bold dark:text-white">API Quota</p>
                  <p className="text-[10px] text-gray-500">99.9% Health</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C]">
                  <ShieldCheck weight="fill" className="h-4 w-4 text-green-500 mb-2" />
                  <p className="text-xs font-bold dark:text-white">Permissions</p>
                  <p className="text-[10px] text-gray-500">Optimal</p>
              </div>
          </div>
      </div>
    </div>
  )
}

function WhatsAppSettings({ status, onRefresh }: { status: any, onRefresh: () => void }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [numbers, setNumbers] = useState<WhatsAppPhoneNumber[]>([])
  const [showSwitch, setShowSwitch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (status?.connected) {
      setLoading(true)
      fetchBusinessProfile().then(res => {
        if (res.data) setProfile(res.data)
        setLoading(false)
      })
    }
  }, [status?.connected])

  const handleConnect = async () => {
    setConnecting(true)
    const { url } = await initiateMetaConnect()
    if (url) window.location.href = url
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp? You will no longer be able to send or receive messages via the WhatsApp API.")) return
    setDisconnecting(true)
    const { error } = await disconnectChannel('whatsapp')
    if (!error) {
      toast.success("WhatsApp disconnected successfully")
      onRefresh()
    } else {
      toast.error(error)
    }
    setDisconnecting(false)
  }

  const handleFetchNumbers = async () => {
    setSwitching(true)
    const { data } = await fetchWhatsAppNumbers()
    if (data) setNumbers(data)
    setShowSwitch(true)
    setSwitching(false)
  }

  const handleSelectNumber = async (num: WhatsAppPhoneNumber) => {
    setSwitching(true)
    const { error } = await selectWhatsAppNumber({ 
      phoneNumberId: num.id, 
      displayNumber: num.display_number, 
      verifiedName: num.verified_name 
    })
    if (!error) {
      toast.success(`Switched to ${num.display_number}`)
      onRefresh()
      setShowSwitch(false)
    }
    setSwitching(false)
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await updateBusinessProfile(profile)
    if (!error) toast.success("WhatsApp profile updated")
    setSaving(false)
  }

  if (!status?.connected) {
     return (
        <ChannelEmptyState 
           channel="WhatsApp" 
           onConnect={handleConnect} 
           icon={WhatsappLogo} 
           color="bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-green-500/20"
           features={["Official API Connection", "WhatsApp Templates", "Business Profile Manager"]} 
        />
     )
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center bg-[#25D366] rounded-xl shadow-lg shadow-green-500/20">
              <WhatsappLogo weight="bold" className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black dark:text-white">WhatsApp Business</h3>
              <p className="text-xs text-gray-500">Connected Identity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleFetchNumbers} disabled={switching} className="text-[#007B85] font-bold text-xs h-8 px-3 rounded-lg hover:bg-[#007B85]/5">
              {switching ? <CircleNotch className="animate-spin h-3.5 w-3.5" /> : "Switch Number"}
            </Button>
            <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">Active</div>
          </div>
        </div>

        <AnimatePresence>
          {showSwitch && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-4 bg-gray-50 dark:bg-[#080808] rounded-2xl border border-gray-100 dark:border-[#1C1C1C] space-y-2"
            >
               <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available WhatsApp Numbers</p>
                  <button onClick={() => setShowSwitch(false)} className="text-[10px] font-bold text-[#007B85]">Close</button>
               </div>
               {numbers.map(num => (
                  <button
                    key={num.id}
                    onClick={() => handleSelectNumber(num)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                      num.is_connected ? "border-[#007B85] bg-[#007B85]/5 shadow-sm" : "bg-white dark:bg-[#111] border-gray-100 dark:border-[#1C1C1C]"
                    )}
                  >
                    <div className="text-left">
                       <p className="text-sm font-bold dark:text-white">{num.display_number}</p>
                       <p className="text-[10px] text-gray-400 capitalize">{num.verified_name} · Quality: {num.quality_rating}</p>
                    </div>
                    {num.is_connected && <CheckCircle weight="fill" className="h-4 w-4 text-[#007B85]" />}
                  </button>
               ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Public Business Name</Label>
            <Input 
              value={profile?.business_name || ""}
              onChange={e => setProfile(prev => ({ ...prev!, business_name: e.target.value }))}
              placeholder="e.g. TropiTech Solutions"
              className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Description</Label>
            <Textarea 
              value={profile?.business_description || ""}
              onChange={e => setProfile(prev => ({ ...prev!, business_description: e.target.value }))}
              placeholder="Describe what your business does..."
              className="min-h-[100px] rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Contact Email</Label>
              <Input 
                value={profile?.contact_email || ""}
                onChange={e => setProfile(prev => ({ ...prev!, contact_email: e.target.value }))}
                placeholder="hello@tropical.com"
                className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Website</Label>
              <Input 
                value={profile?.website_url || ""}
                onChange={e => setProfile(prev => ({ ...prev!, website_url: e.target.value }))}
                placeholder="https://tropic.com"
                className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#111]"
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-12 h-11 font-bold w-full lg:w-auto">
            {saving ? <CircleNotch className="h-4 w-4 animate-spin mr-2" /> : "Save WhatsApp Profile"}
          </Button>
        </div>
      </section>

      <div className="h-px bg-gray-100 dark:bg-[#1C1C1C]" />

      <section>
          <div className="flex items-center justify-between mb-6">
              <h4 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Advanced Settings</h4>
              <button 
                onClick={handleDisconnect} 
                disabled={disconnecting}
                className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1.5 transition-colors"
              >
                  {disconnecting ? <CircleNotch className="animate-spin h-3.5 w-3.5" /> : <Trash className="h-3.5 w-3.5" />}
                  Disconnect WhatsApp
              </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" className="rounded-xl border-gray-200 dark:border-[#1C1C1C] h-12 font-bold dark:text-white dark:hover:bg-[#111]">
              <ArrowsClockwise className="h-4 w-4 mr-2" />
              Sync Message History
            </Button>
          </div>
      </section>
    </div>
  )
}

function EmailSettings({ onRefresh }: { onRefresh: () => void }) {
  const [emails, setEmails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingEmail, setAddingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const fetch = useCallback(async () => {
    const { data } = await fetchEmailAccounts()
    if (data) setEmails(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleToggle = async (id: string, current: string) => {
    await toggleEmailStatus(id, current as any)
    fetch()
  }

  const handleAdd = async () => {
    setAddingEmail(true)
    const { error } = await addEmailAccount(newEmail)
    if (!error) {
      toast.success("Email added")
      setNewEmail("")
      setIsAdding(false)
      fetch()
    }
    setAddingEmail(false)
  }

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-black dark:text-white">Professional Email</h3>
          <p className="text-xs text-gray-500">Connect your custom domain or Gmail account.</p>
        </div>
        <Button size="sm" onClick={() => setIsAdding(true)} className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl h-9">
          <Plus weight="bold" className="h-4 w-4 mr-2" />
          Add Email
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 border border-[#007B85]/20 bg-[#007B85]/5 rounded-2xl space-y-4">
             <div className="space-y-2">
                <Label className="text-sm font-bold dark:text-white">Email Address</Label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="hello@yourdomain.com" className="rounded-xl border-gray-200 dark:bg-white text-black" />
             </div>
             <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={addingEmail} className="bg-[#007B85] rounded-xl flex-1">
                   {addingEmail ? "Connecting..." : "Confirm Connection"}
                </Button>
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl flex-1">Cancel</Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {emails.map(email => (
          <div key={email.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center bg-teal-50 dark:bg-teal-900/10 rounded-xl text-[#007B85]">
                <EnvelopeSimple weight="bold" className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold dark:text-white truncate">{email.channel_account_id}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active via SMTP</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <Switch checked={email.status === 'active'} onCheckedChange={() => handleToggle(email.id, email.status)} />
               <button onClick={async () => { 
                if (confirm(`Disconnect ${email.channel_account_id}?`)) {
                  await disconnectEmailAccount(email.id); 
                  fetch() 
                }
               }} className="text-gray-400 hover:text-red-500 transition-colors">
                 <Trash className="h-4 w-4" />
               </button>
            </div>
          </div>
        ))}
        {emails.length === 0 && !isAdding && (
           <div className="py-12 text-center">
              <At weight="duotone" className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No emails connected yet.</p>
           </div>
        )}
      </div>
    </div>
  )
}

function SMSSettings({ customer, onRefresh }: { customer: Customer | null, onRefresh: () => void }) {
  const [phone, setPhone] = useState(customer?.phone_number || "")
  const [sid, setSid] = useState("")
  const [token, setToken] = useState("")
  const [saving, setSaving] = useState(false)
  const isActive = !!customer?.phone_number

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateCustomer({ phone_number: phone })
    if (!error) {
      toast.success(isActive ? "SMS Settings Updated" : "SMS Channel Activated")
      onRefresh()
    }
    setSaving(false)
  }

  const handleDisconnect = async () => {
    if (!confirm("Remove SMS credentials?")) return
    setSaving(true)
    const { error } = await updateCustomer({ phone_number: null as any })
    if (!error) {
      toast.success("SMS Disconnected")
      setPhone("")
      setSid("")
      setToken("")
      onRefresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#213138] to-[#111] text-white overflow-hidden relative shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#007B85]/20 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                 <DeviceMobile weight="bold" className="h-6 w-6 text-[#3A9B9F]" />
              </div>
              <div>
                 <h3 className="text-xl font-black">SMS Connectivity</h3>
                 <p className="text-xs opacity-60">Powered by Twilio</p>
              </div>
            </div>
            {isActive && (
              <button onClick={handleDisconnect} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center gap-1">
                 <X weight="bold" className="h-3 w-3" />
                 Disconnect
              </button>
            )}
          </div>
          
          <div className="space-y-4">
             <div className="space-y-2">
                <Label className="text-xs font-bold opacity-70 uppercase tracking-widest">Twilio Account SID</Label>
                <Input type="password" value={sid} onChange={e => setSid(e.target.value)} placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" className="bg-white/5 border-white/10 text-white rounded-xl h-11" />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold opacity-70 uppercase tracking-widest">Auth Token</Label>
                <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="••••••••••••••••••••••••••••••••" className="bg-white/5 border-white/10 text-white rounded-xl h-11" />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold opacity-70 uppercase tracking-widest">Twilio Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (242) 555-0000" className="bg-white/5 border-white/10 text-white rounded-xl h-11" />
             </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full mt-8 bg-[#007B85] hover:bg-[#3A9B9F] text-white rounded-2xl font-black py-6 shadow-lg shadow-teal-500/10">
             {saving ? <CircleNotch className="animate-spin h-5 w-5" /> : (isActive ? "Update SMS Settings" : "Activate SMS Channel")}
          </Button>
        </div>
      </div>
    </div>
  )
}

function BookingPageSettings() {
  const [handle, setHandle] = useState("")
  const [editHandle, setEditHandle] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [savingWhatsapp, setSavingWhatsapp] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tropichat.com"

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      const res = await fetch("/api/bookings/handle", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setHandle(json.handle ?? "")
        setEditHandle(json.handle ?? "")
        setWhatsappNumber(json.whatsapp_number ?? "")
      }
      setLoading(false)
    }
    load()
  }, [])

  const bookingUrl = handle ? `${appUrl}/book/${handle}` : null

  const handleCopy = () => {
    if (!bookingUrl) return
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    const trimmed = editHandle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
    if (!trimmed) {
      toast.error("Handle cannot be empty")
      return
    }
    setSaving(true)
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSaving(false); return }
    const res = await fetch("/api/bookings/handle", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ handle: trimmed }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || "Failed to save handle")
    } else {
      setHandle(json.handle)
      setEditHandle(json.handle)
      setEditing(false)
      toast.success("Booking link updated")
    }
    setSaving(false)
  }

  const handleSaveWhatsapp = async () => {
    setSavingWhatsapp(true)
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSavingWhatsapp(false); return }
    // Strip everything except digits and leading +
    const cleaned = whatsappNumber.trim().replace(/[^\d+]/g, "")
    const res = await fetch("/api/bookings/handle", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ handle: handle || undefined, whatsapp_number: cleaned || null }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || "Failed to save WhatsApp number")
    } else {
      setWhatsappNumber(json.whatsapp_number ?? "")
      toast.success("WhatsApp number saved")
    }
    setSavingWhatsapp(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40 rounded-xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h4 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Shareable Booking Link</h4>

        {bookingUrl ? (
          <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-xl bg-[#007B85]/10 flex items-center justify-center shrink-0">
                <CalendarBlank className="w-4 h-4 text-[#007B85]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold dark:text-white mb-0.5">Your booking page is live</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{bookingUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1 rounded-xl border-teal-200 dark:border-teal-800 text-[#007B85] dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40"
              >
                {copied
                  ? <><CheckFat className="w-4 h-4 mr-2" />Copied!</>
                  : <><Copy className="w-4 h-4 mr-2" />Copy Link</>
                }
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="rounded-xl border-teal-200 dark:border-teal-800 text-[#007B85] dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40"
              >
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  <ArrowSquareOut className="w-4 h-4 mr-2" />Preview
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-dashed border-gray-300 dark:border-[#2C2C2C]">
            <p className="text-[13px] text-gray-500 dark:text-gray-400">No booking link yet. Set a handle below to create your public booking page.</p>
          </div>
        )}
      </section>

      <section>
        <h4 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Booking Handle</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Your unique handle appears in your booking URL: <span className="font-mono text-gray-700 dark:text-gray-300">{appUrl}/book/<span className="text-[#007B85]">{handle || "your-handle"}</span></span>
        </p>

        {editing ? (
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <span className="text-[13px] text-gray-400 shrink-0">{appUrl}/book/</span>
              <Input
                value={editHandle}
                onChange={e => setEditHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="your-handle"
                className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#080808] font-mono"
                maxLength={60}
                autoFocus
              />
            </div>
            <p className="text-[11px] text-gray-400 italic">Only lowercase letters, numbers, hyphens, and underscores. 2–60 characters.</p>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || editHandle.length < 2}
                className="bg-[#007B85] hover:bg-[#2F8488] rounded-xl px-8 h-10"
              >
                {saving ? <CircleNotch className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Handle
              </Button>
              <Button
                variant="outline"
                onClick={() => { setEditing(false); setEditHandle(handle) }}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-200 dark:border-[#1C1C1C] font-mono text-[14px] text-gray-700 dark:text-gray-300">
              {handle || <span className="text-gray-400 dark:text-gray-600">not set</span>}
            </div>
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
              className="rounded-xl shrink-0"
            >
              {handle ? "Change" : "Set Handle"}
            </Button>
          </div>
        )}
      </section>

      <section>
        <h4 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">WhatsApp Contact Number</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Customers will see a &quot;WhatsApp us&quot; button on your booking page. Enter your number in international format, e.g. <span className="font-mono text-gray-700 dark:text-gray-300">+12425550100</span>.
        </p>
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <WhatsappLogo className="w-5 h-5 text-[#25D366] shrink-0" />
            <Input
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              placeholder="+1 242 555 0100"
              className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:bg-[#080808]"
              maxLength={20}
            />
          </div>
          <Button
            onClick={handleSaveWhatsapp}
            disabled={savingWhatsapp}
            className="bg-[#25D366] hover:bg-[#1ebe58] text-white rounded-xl px-8 h-10"
          >
            {savingWhatsapp ? <CircleNotch className="h-4 w-4 animate-spin mr-2" /> : <WhatsappLogo className="h-4 w-4 mr-2" />}
            Save WhatsApp Number
          </Button>
          {whatsappNumber && (
            <p className="text-xs text-[#25D366]">
              Customers can reach you at{" "}
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                wa.me/{whatsappNumber.replace(/[^\d]/g, "")}
              </a>
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

// ─── AI Settings ─────────────────────────────────────────────────

function AISettings({ customer, onRefresh }: { customer: Customer | null, onRefresh: () => void }) {
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(customer?.ai_autopilot_enabled ?? false)
  const [saving, setSaving] = useState(false)

  const handleToggle = async (enabled: boolean) => {
    setSaving(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch('/api/ai/autopilot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ enabled })
      })
      const data = await res.json()
      if (data.success) {
        setAutoPilotEnabled(enabled)
        toast.success(enabled ? 'Auto-Pilot is now ON — AI will reply to all channels' : 'Auto-Pilot OFF — AI will suggest replies only')
        onRefresh()
      } else {
        toast.error('Failed to update Auto-Pilot setting')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const isConfigured = !!customer?.ai_voice_profile

  return (
    <div className="space-y-8">
      {/* Status */}
      <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
        autoPilotEnabled 
          ? 'bg-[#007B85]/5 border-[#007B85]/20' 
          : 'bg-gray-50 dark:bg-[#080808] border-gray-100 dark:border-[#1C1C1C]'
      }`}>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
          autoPilotEnabled ? 'bg-[#007B85]' : 'bg-gray-200 dark:bg-[#1C1C1C]'
        }`}>
          <MagicWand weight="fill" className={`h-5 w-5 ${autoPilotEnabled ? 'text-white' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold dark:text-white">Tropi AI Status</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {autoPilotEnabled 
              ? 'Auto-Pilot ON — AI replies automatically on all channels'
              : 'Auto-Pilot OFF — AI suggests replies but does not send'}
          </p>
        </div>
        {autoPilotEnabled && (
          <span className="text-[10px] font-black text-[#007B85] bg-[#007B85]/10 px-2 py-1 rounded-full uppercase tracking-wider">
            Live
          </span>
        )}
      </div>

      {/* Auto-Pilot Toggle */}
      <div className="space-y-4">
        <h4 className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Auto-Pilot Mode</h4>
        
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[14px] font-bold dark:text-white">Auto-Reply to Customers</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                When ON, Tropi AI automatically replies to incoming messages on WhatsApp, Instagram, and Messenger.<br/>
                When OFF, AI still suggests replies in your inbox — you choose when to send.
              </p>
            </div>
            <Switch 
              checked={autoPilotEnabled} 
              onCheckedChange={handleToggle}
              disabled={saving || !isConfigured}
              className="shrink-0 mt-0.5"
            />
          </div>

          {!isConfigured && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
              <Warning weight="fill" className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-400">
                Train your AI first before enabling Auto-Pilot. Go to the AI page to set up your business brief.
              </p>
            </div>
          )}
        </div>

        {/* Mode explanation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`p-4 rounded-xl border transition-all ${
            autoPilotEnabled 
              ? 'border-[#007B85]/30 bg-[#007B85]/5' 
              : 'border-gray-100 dark:border-[#1C1C1C] bg-gray-50 dark:bg-[#080808] opacity-60'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Lightning weight="fill" className={`h-4 w-4 ${autoPilotEnabled ? 'text-[#007B85]' : 'text-gray-400'}`} />
              <span className="text-[12px] font-bold dark:text-white">Auto-Pilot ON</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">AI reads every message and replies instantly on all channels. Human cooldown: if you reply manually, AI pauses for 2 minutes.</p>
          </div>
          <div className={`p-4 rounded-xl border transition-all ${
            !autoPilotEnabled 
              ? 'border-gray-200 dark:border-[#222] bg-white dark:bg-[#111]' 
              : 'border-gray-100 dark:border-[#1C1C1C] bg-gray-50 dark:bg-[#080808] opacity-60'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <ChatCircleText weight="fill" className="h-4 w-4 text-gray-400" />
              <span className="text-[12px] font-bold dark:text-white">Suggestions Only</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">AI generates a suggested reply in your inbox. You review it and click Send when you're ready.</p>
          </div>
        </div>
      </div>

      {/* Link to full AI page */}
      <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1C1C1C] flex items-center justify-between">
        <div>
          <p className="text-[14px] font-bold dark:text-white mb-1">Business Brief &amp; Voice Training</p>
          <p className="text-xs text-gray-500">Configure what your AI knows about your business — services, pricing, payment, booking method.</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl border-gray-200 dark:border-[#1C1C1C] dark:hover:bg-[#111] shrink-0 ml-4"
          onClick={() => window.location.href = '/dashboard/ai'}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>
    </div>
  )
}
