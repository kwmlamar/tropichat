"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
} from "lucide-react"
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
import { getCurrentCustomer, updateCustomer } from "@/lib/supabase"
import {
  getMetaStatus,
  initiateMetaConnect,
  disconnectChannel,
  type MetaStatus,
  type ChannelStatus,
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

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "profile"

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

  // Integrations state
  const [metaStatus, setMetaStatus] = useState<MetaStatus | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState<MetaChannel | null>(null)

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

    if (tab === "integrations") {
      fetchMetaConnectionStatus()
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
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <Tabs defaultValue={initialTab} onValueChange={(tab) => {
        if (tab === "integrations" && !metaStatus) {
          fetchMetaConnectionStatus()
        }
      }}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            Business Hours
          </TabsTrigger>
          <TabsTrigger value="autoreply">
            <MessageSquare className="h-4 w-4 mr-2" />
            Auto-Reply
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Link2 className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (242) 555-0123"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <SimpleSelect
                  value={timezone}
                  onValueChange={setTimezone}
                  options={timezones}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-[#3A9B9F]"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours Tab */}
        <TabsContent value="hours">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500 mb-6">
                Set your business hours. Auto-replies can be configured to send
                different messages during and after business hours.
              </p>

              <div className="space-y-4">
                {days.map((day) => (
                  <div
                    key={day}
                    className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-28">
                      <Switch
                        checked={businessHours[day]?.enabled || false}
                        onCheckedChange={(checked) =>
                          updateDayHours(day, "enabled", checked)
                        }
                      />
                    </div>
                    <span className="w-24 font-medium text-gray-900 capitalize">
                      {day}
                    </span>
                    {businessHours[day]?.enabled ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={businessHours[day]?.start || "09:00"}
                          onChange={(e) =>
                            updateDayHours(day, "start", e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={businessHours[day]?.end || "17:00"}
                          onChange={(e) =>
                            updateDayHours(day, "end", e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400">Closed</span>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveBusinessHours}
                disabled={saving}
                className="bg-[#3A9B9F] mt-6"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Business Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Reply Tab */}
        <TabsContent value="autoreply">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Enable Auto-Reply
                  </h3>
                  <p className="text-sm text-gray-500">
                    Automatically respond to incoming messages
                  </p>
                </div>
                <Switch
                  checked={autoReplyEnabled}
                  onCheckedChange={setAutoReplyEnabled}
                />
              </div>

              {autoReplyEnabled && (
                <div>
                  <Label htmlFor="autoReplyMessage">Auto-Reply Message</Label>
                  <Textarea
                    id="autoReplyMessage"
                    value={autoReplyMessage}
                    onChange={(e) => setAutoReplyMessage(e.target.value)}
                    placeholder="Thanks for reaching out! We'll get back to you as soon as possible."
                    className="mt-1 min-h-[120px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will be sent automatically when someone
                    messages you.
                  </p>
                </div>
              )}

              <Button
                onClick={handleSaveAutoReply}
                disabled={saving}
                className="bg-[#3A9B9F]"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Auto-Reply Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Team Management Coming Soon
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Invite team members to help manage your conversations.
                  Upgrade to Professional to unlock this feature.
                </p>
                <Button className="mt-4 bg-[#3A9B9F]">
                  Upgrade to Professional
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* Connect with Meta CTA */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Meta Business Platform</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your Meta account to manage WhatsApp, Instagram, and Messenger in one place.
                    </p>
                  </div>
                  <Button
                    onClick={handleConnectMeta}
                    disabled={connecting}
                    className="bg-[#1877F2] hover:bg-[#166FE5] text-white shrink-0"
                  >
                    {connecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    {connecting ? "Redirecting..." : "Connect with Meta"}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  This will request permissions for all three channels in a single OAuth flow.
                  You can disconnect individual channels below.
                </p>
              </CardContent>
            </Card>

            {/* Channel Status Cards */}
            {metaLoading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-24 mb-3" />
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-8 w-full mt-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {/* WhatsApp */}
                <ChannelCard
                  channel="whatsapp"
                  label="WhatsApp Business"
                  color="#25D366"
                  icon={
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  }
                  status={metaStatus?.whatsapp}
                  disconnecting={disconnecting === "whatsapp"}
                  onDisconnect={() => handleDisconnectChannel("whatsapp")}
                />

                {/* Instagram */}
                <ChannelCard
                  channel="instagram"
                  label="Instagram"
                  color="#E4405F"
                  icon={
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  }
                  status={metaStatus?.instagram}
                  disconnecting={disconnecting === "instagram"}
                  onDisconnect={() => handleDisconnectChannel("instagram")}
                />

                {/* Messenger */}
                <ChannelCard
                  channel="messenger"
                  label="Messenger"
                  color="#0084FF"
                  icon={
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z"/>
                    </svg>
                  }
                  status={metaStatus?.messenger}
                  disconnecting={disconnecting === "messenger"}
                  onDisconnect={() => handleDisconnectChannel("messenger")}
                />
              </div>
            )}

            {/* Permissions Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Required Permissions</h3>
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">WhatsApp</p>
                    <ul className="space-y-1 text-gray-500">
                      <li>whatsapp_business_management</li>
                      <li>whatsapp_business_messaging</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Instagram</p>
                    <ul className="space-y-1 text-gray-500">
                      <li>instagram_basic</li>
                      <li>instagram_manage_messages</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Messenger</p>
                    <ul className="space-y-1 text-gray-500">
                      <li>pages_messaging</li>
                      <li>pages_manage_metadata</li>
                      <li>pages_read_engagement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Current Plan</h3>
                  <Badge
                    variant={customer?.plan === "free" ? "secondary" : "success"}
                  >
                    {customer?.plan?.charAt(0).toUpperCase() +
                      (customer?.plan?.slice(1) || "")}
                  </Badge>
                </div>

                {customer?.plan === "free" ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      You're on the free trial. Upgrade to unlock more features.
                    </p>
                    <Button className="bg-[#3A9B9F]">
                      Upgrade to Professional
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly price</span>
                      <span className="font-medium">$59/month</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Next billing date</span>
                      <span className="font-medium">Feb 15, 2024</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Usage</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Contacts</span>
                      <span className="font-medium">127 / 500</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-[#3A9B9F] h-2 rounded-full"
                        style={{ width: "25%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Messages this month</span>
                      <span className="font-medium">1,234</span>
                    </div>
                    <p className="text-xs text-gray-400">Unlimited on all plans</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Payment Method
                </h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-white rounded p-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                    <p className="text-xs text-gray-500">Expires 12/25</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
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
    <Card className={isConnected ? "border-green-200" : undefined}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="rounded-lg p-2 text-white"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900">{label}</h4>
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="h-3.5 w-3.5" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <XCircle className="h-3.5 w-3.5" />
                Not connected
              </div>
            )}
          </div>
        </div>

        {isConnected && status?.account_name && (
          <p className="text-sm text-gray-600 mb-3 truncate">
            {status.account_name}
            {status.metadata && (status.metadata as Record<string, string>).phone_display && (
              <span className="text-gray-400 ml-1">
                ({(status.metadata as Record<string, string>).phone_display})
              </span>
            )}
          </p>
        )}

        {isConnected && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            {disconnecting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Unplug className="h-3.5 w-3.5 mr-1.5" />
            )}
            Disconnect
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
