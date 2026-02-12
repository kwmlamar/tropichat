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
import { toast } from "sonner"
import type { Customer, BusinessHours } from "@/types/database"

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

      <Tabs defaultValue={initialTab}>
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
