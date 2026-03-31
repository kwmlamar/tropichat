"use client"

import { useState, useEffect, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarDays,
  Clock,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Phone,
  Mail,
  User,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { BusinessProfile } from "@/types/database"
import type { BookingService, AvailabilitySlot } from "@/types/bookings"

function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const DAY_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function formatTime(time: string) {
  const [h, m] = time.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

function toISODate(inputValue: string) {
  // input[type=date] returns YYYY-MM-DD already
  return inputValue
}

interface BookingPageProps {
  params: Promise<{ handle: string }>
}

export default function PublicBookingPage({ params }: BookingPageProps) {
  const { handle } = use(params)
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [services, setServices] = useState<BookingService[]>([])
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [merchantUserId, setMerchantUserId] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<BookingService | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  // Customer info
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [guestCount, setGuestCount] = useState(1)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Load services and business profile
  useEffect(() => {
    async function fetchData() {
      const supabase = getPublicSupabase()

      // Try to load profile by handle first, then by user_id (bid fallback)
      let profileData: BusinessProfile | null = null
      let userId: string | null = null

      const { data: byHandle } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("handle", handle)
        .maybeSingle()

      if (byHandle) {
        profileData = byHandle as BusinessProfile
        userId = byHandle.user_id
      } else {
        // Fallback: try as user_id directly (backward compat with /book/[bid])
        const { data: byUserId } = await supabase
          .from("business_profiles")
          .select("*, connected_accounts!inner(user_id)")
          .eq("connected_accounts.user_id", handle)
          .maybeSingle()

        if (byUserId) {
          profileData = byUserId as unknown as BusinessProfile
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          userId = (byUserId as any).connected_accounts?.user_id ?? handle
        } else {
          // Last fallback: use handle as user_id directly
          userId = handle
        }
      }

      if (profileData) setBusinessProfile(profileData)
      if (userId) setMerchantUserId(userId)

      // Load active services for this merchant
      const effectiveUserId = userId ?? handle
      const { data: svcData } = await supabase
        .from("booking_services")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("active", true)
        .order("name")

      if (svcData && svcData.length > 0) {
        setServices(svcData)
        setSelectedService(svcData[0])
      }

      setLoading(false)
    }

    fetchData()
  }, [handle])

  // Load available time slots when date or service changes
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setAvailableSlots([])
      setSelectedSlot(null)
      return
    }

    async function fetchSlots() {
      setLoadingSlots(true)
      setAvailabilityError(null)
      setSelectedSlot(null)

      const supabase = getPublicSupabase()
      const date = new Date(selectedDate + "T00:00:00")
      const dayOfWeek = date.getDay()

      // Fetch recurring slots for this day of week + one-off slots for this date
      const { data: slots } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("service_id", selectedService!.id)
        .eq("is_available", true)
        .or(
          `and(is_recurring.eq.true,day_of_week.eq.${dayOfWeek}),and(is_recurring.eq.false,specific_date.eq.${selectedDate})`
        )
        .order("start_time")

      if (!slots || slots.length === 0) {
        setAvailabilityError(`No available times for ${DAY_OF_WEEK[dayOfWeek]}s`)
        setAvailableSlots([])
        setLoadingSlots(false)
        return
      }

      // For each slot, check current bookings
      const slotsWithCapacity: AvailabilitySlot[] = []
      for (const slot of slots) {
        const { count } = await supabase
          .from("bookings")
          .select("number_of_people", { count: "exact", head: false })
          .eq("service_id", selectedService!.id)
          .eq("booking_date", selectedDate)
          .eq("booking_time", slot.start_time)
          .neq("status", "cancelled")

        const bookedCount = count ?? 0
        if (bookedCount < slot.max_bookings) {
          slotsWithCapacity.push(slot)
        }
      }

      if (slotsWithCapacity.length === 0) {
        setAvailabilityError("All time slots are fully booked for this date")
      }

      setAvailableSlots(slotsWithCapacity)
      setLoadingSlots(false)
    }

    fetchSlots()
  }, [selectedDate, selectedService])

  function validateForm() {
    const errors: Record<string, string> = {}
    if (!customerName.trim()) errors.customerName = "Name is required"
    if (customerPhone && !/^\+?[\d\s\-()]{7,15}$/.test(customerPhone)) {
      errors.customerPhone = "Enter a valid phone number"
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      errors.customerEmail = "Enter a valid email address"
    }
    if (guestCount < 1) errors.guestCount = "At least 1 guest required"
    if (!customerPhone && !customerEmail) {
      errors.customerPhone = "Phone or email is required to receive confirmation"
    }
    return errors
  }

  async function handleSubmit() {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    if (!selectedService || !selectedDate || !selectedSlot) return

    setBookingLoading(true)
    setBookingError(null)

    const response = await fetch("/api/bookings/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_user_id: merchantUserId ?? handle,
        service_id: selectedService.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        booking_date: toISODate(selectedDate),
        booking_time: selectedSlot.start_time,
        number_of_people: guestCount,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      setBookingError(result.error ?? "Booking failed. Please try again.")
      setBookingLoading(false)
      return
    }

    const bookingId = result.data?.id
    router.push(`/book/${handle}/confirmed?booking_id=${bookingId}`)
  }

  const businessName = businessProfile?.business_name ?? "Business"
  const businessDesc = businessProfile?.business_description
  const businessPhone = businessProfile?.contact_phone
  const profilePic = businessProfile?.profile_picture_url
  const whatsappNumber = businessProfile?.whatsapp_number
  const whatsappDigits = whatsappNumber ? whatsappNumber.replace(/[^\d]/g, "") : null
  const whatsappContactUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hi ${businessName}, I found your page on TropiChat and I'm interested in booking!`)}`
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#007B85]" />
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="h-16 w-16 rounded-full bg-[#007B85]/10 flex items-center justify-center mx-auto">
          <CalendarDays className="h-8 w-8 text-[#007B85]" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{businessName}</h1>
        <p className="text-gray-500 max-w-sm">This business hasn&apos;t set up their booking services yet. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#007B85]/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#007B85]/8 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-pink-500/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Business header */}
        <div className="flex flex-col items-center text-center gap-3 pt-6">
          {profilePic ? (
            <Image
              src={profilePic}
              alt={businessName}
              width={72}
              height={72}
              className="rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="h-18 w-18 rounded-2xl bg-[#007B85]/10 flex items-center justify-center">
              <CalendarDays className="h-9 w-9 text-[#007B85]" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{businessName}</h1>
            {businessDesc && (
              <p className="text-sm text-gray-500 mt-1 max-w-sm">{businessDesc}</p>
            )}
            {businessPhone && (
              <p className="text-sm text-[#007B85] mt-1 font-medium">{businessPhone}</p>
            )}
            {whatsappContactUrl && (
              <a
                href={whatsappContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp us
              </a>
            )}
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 justify-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step >= s ? "w-10 bg-[#007B85]" : "w-5 bg-gray-200 dark:bg-white/10"
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Select Service + Date + Time */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="bg-white dark:bg-[#0C0C0C] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl p-6 space-y-5">
                {/* Service selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Select Service
                  </Label>
                  <div className="grid gap-2">
                    {services.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => {
                          setSelectedService(svc)
                          setSelectedDate("")
                          setAvailableSlots([])
                          setSelectedSlot(null)
                        }}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all",
                          selectedService?.id === svc.id
                            ? "border-[#007B85] bg-[#007B85]/5"
                            : "border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-xl flex-shrink-0"
                            style={{ backgroundColor: svc.color + "33" }}
                          >
                            <div
                              className="h-full w-full rounded-xl flex items-center justify-center text-xs font-black"
                              style={{ color: svc.color }}
                            >
                              {svc.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">{svc.name}</p>
                            <p className="text-xs text-gray-500">
                              {svc.duration_minutes} min
                              {svc.price ? ` · $${svc.price}${svc.price_type === "per_person" ? "/person" : ""}` : ""}
                            </p>
                          </div>
                        </div>
                        {selectedService?.id === svc.id && (
                          <div className="h-5 w-5 rounded-full bg-[#007B85] flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date picker */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    <CalendarDays className="inline h-3.5 w-3.5 mr-1" />
                    Select Date
                  </Label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#111] px-4 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-[#007B85] focus:ring-1 focus:ring-[#007B85]"
                  />
                </div>

                {/* Time slot picker */}
                {selectedDate && (
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                      <Clock className="inline h-3.5 w-3.5 mr-1" />
                      Select Time
                    </Label>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Checking availability…</span>
                      </div>
                    ) : availabilityError ? (
                      <div className="py-4 text-center text-sm text-gray-400 bg-gray-50 dark:bg-white/5 rounded-2xl">
                        {availabilityError}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              "py-3 rounded-2xl text-sm font-bold border-2 transition-all",
                              selectedSlot?.id === slot.id
                                ? "border-[#007B85] bg-[#007B85] text-white"
                                : "border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#007B85]/50"
                            )}
                          >
                            {formatTime(slot.start_time)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!selectedService || !selectedDate || !selectedSlot}
                className="w-full h-14 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-3xl font-black text-base shadow-lg shadow-[#007B85]/20 group"
              >
                Continue
                <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Customer info */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="bg-white dark:bg-[#0C0C0C] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl p-6 space-y-5">
                <div className="text-center space-y-1 pb-2">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Your Details</h2>
                  <p className="text-sm text-gray-500">So {businessName} can confirm your booking</p>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    <User className="inline h-3 w-3 mr-1" />
                    Full Name *
                  </Label>
                  <Input
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      setFormErrors((p) => ({ ...p, customerName: "" }))
                    }}
                    placeholder="e.g. Jane Smith"
                    className={cn(
                      "h-12 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-[#111] font-semibold",
                      formErrors.customerName && "border-red-400 focus:border-red-400"
                    )}
                  />
                  {formErrors.customerName && (
                    <p className="text-xs text-red-500">{formErrors.customerName}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    <Phone className="inline h-3 w-3 mr-1" />
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value)
                      setFormErrors((p) => ({ ...p, customerPhone: "" }))
                    }}
                    placeholder="e.g. +1 868 555 0100"
                    className={cn(
                      "h-12 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-[#111] font-semibold",
                      formErrors.customerPhone && "border-red-400 focus:border-red-400"
                    )}
                  />
                  {formErrors.customerPhone && (
                    <p className="text-xs text-red-500">{formErrors.customerPhone}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    <Mail className="inline h-3 w-3 mr-1" />
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value)
                      setFormErrors((p) => ({ ...p, customerEmail: "" }))
                    }}
                    placeholder="e.g. jane@email.com"
                    className={cn(
                      "h-12 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-[#111] font-semibold",
                      formErrors.customerEmail && "border-red-400 focus:border-red-400"
                    )}
                  />
                  {formErrors.customerEmail && (
                    <p className="text-xs text-red-500">{formErrors.customerEmail}</p>
                  )}
                </div>

                {/* Guest count */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400">
                    <Users className="inline h-3 w-3 mr-1" />
                    Number of Guests
                  </Label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
                      className="h-12 w-12 rounded-2xl border border-gray-100 dark:border-white/10 font-black text-lg flex items-center justify-center hover:border-[#007B85] transition-colors"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-xl font-black text-gray-900 dark:text-white">
                      {guestCount}
                    </span>
                    <button
                      onClick={() => setGuestCount((n) => Math.min(selectedService?.max_capacity ?? 20, n + 1))}
                      className="h-12 w-12 rounded-2xl border border-gray-100 dark:border-white/10 font-black text-lg flex items-center justify-center hover:border-[#007B85] transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {selectedService && (
                    <p className="text-xs text-gray-400">Max {selectedService.max_capacity} per booking</p>
                  )}
                </div>
              </div>

              {/* Booking summary */}
              <div className="bg-[#007B85]/5 rounded-2xl border border-[#007B85]/20 p-4 space-y-1.5">
                <p className="text-xs font-black uppercase tracking-widest text-[#007B85]">Booking Summary</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedService?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDate && formatDate(selectedDate)}
                  {selectedSlot && ` at ${formatTime(selectedSlot.start_time)}`}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {guestCount} {guestCount === 1 ? "guest" : "guests"}
                  {selectedService?.price
                    ? ` · $${(selectedService.price * (selectedService.price_type === "per_person" ? guestCount : 1)).toFixed(2)}`
                    : ""}
                </p>
              </div>

              {bookingError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-sm text-red-600 dark:text-red-400">
                  {bookingError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 rounded-3xl font-black text-gray-500"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={bookingLoading}
                  className="flex-[2] h-14 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-3xl font-black shadow-lg shadow-[#007B85]/20"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-gray-400">
                <ShieldCheck className="inline h-3 w-3 mr-1" />
                Your info is only shared with {businessName}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-6">
          Powered by <span className="font-bold text-[#007B85]">TropiChat</span>
        </p>
      </div>
    </div>
  )
}
