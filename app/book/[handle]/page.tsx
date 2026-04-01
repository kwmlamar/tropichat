"use client"

import { useState, useEffect, useRef, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Storefront,
  Lock,
  WarningCircle,
  Spinner,
  CaretRight,
  CaretLeft,
  CalendarDots,
  Clock,
  ShieldCheck,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import type { BusinessProfile } from "@/types/database"
import type { BookingService, AvailabilitySlot } from "@/types/bookings"
import { Toaster, toast } from "sonner"

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const COCONUT_BOOKING_LIMIT = 20
const DAYS_AHEAD = 14
const TEAL = "#007B85"
const CORAL = "#FF7E36"
const WA_GREEN = "#25D366"

function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────
function getNext14Days(): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDateChip(d: Date) {
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" })
  const month = d.toLocaleDateString("en-US", { month: "short" })
  const date = d.getDate()
  return { dayName, month, date }
}

function formatTime(time: string) {
  const [h, m] = time.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatFullDate(dateStr: string) {
  const [y, mo, d] = dateStr.split("-").map(Number)
  const date = new Date(y, mo - 1, d)
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function WaIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// Service card (Screen 1 card layout)
function ServiceCard({
  service,
  selected,
  disabled,
  onClick,
}: {
  service: BookingService
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  const priceLabel =
    service.price === null
      ? null
      : service.price === 0
      ? "Free"
      : `$${service.price.toFixed(2)}${service.price_type === "per_person" ? "/person" : ""}`

  return (
    <motion.div
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "relative w-full rounded-2xl border-2 p-4 text-left transition-all",
        disabled
          ? "opacity-50 cursor-not-allowed border-gray-100 dark:border-white/5"
          : selected
          ? "border-[#007B85] bg-[#007B85]/5 cursor-pointer"
          : "border-gray-100 dark:border-white/8 hover:border-gray-200 dark:hover:border-white/15 cursor-pointer"
      )}
    >
      {disabled && (
        <div className="absolute top-3 right-3">
          <Lock size={14} weight="bold" className="text-gray-400" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{service.name}</p>
            <span className="shrink-0 text-[13px] font-bold px-2 py-1 rounded-full"
              style={{ backgroundColor: `${TEAL}22`, color: TEAL }}>
              {service.duration_minutes} min
            </span>
          </div>

          {service.description && (
            <p className="text-[13px] text-gray-500 line-clamp-2 mb-2">{service.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        {priceLabel ? (
          <span className="text-xl font-black text-gray-900 dark:text-white">{priceLabel}</span>
        ) : (
          <span className="text-sm text-gray-400">Price on request</span>
        )}

        {!disabled && (
          <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="flex items-center gap-1 text-[13px] font-bold px-3 py-2 rounded-xl transition-all"
            style={{ backgroundColor: selected ? CORAL : `${CORAL}18`, color: selected ? "white" : CORAL }}
          >
            Book <CaretRight size={12} weight="bold" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// 14-day date chip scroller
function DateChipScroller({
  days,
  selectedDate,
  onSelect,
}: {
  days: Date[]
  selectedDate: string | null
  onSelect: (iso: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {days.map((d) => {
        const iso = toISODate(d)
        const { dayName, month, date } = formatDateChip(d)
        const isSelected = selectedDate === iso
        return (
          <button
            key={iso}
            onClick={() => onSelect(iso)}
            className={cn(
              "snap-start shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl transition-all font-bold text-xs",
              isSelected
                ? "text-white shadow-sm"
                : "bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
            )}
            style={isSelected ? { backgroundColor: CORAL } : undefined}
          >
            <span className="text-[11px] uppercase tracking-wide opacity-70">{dayName}</span>
            <span className="text-base font-black leading-tight">{date}</span>
            <span className="text-[11px] uppercase tracking-wide opacity-70">{month}</span>
          </button>
        )
      })}
    </div>
  )
}

// Time pill grid
function TimePillGrid({
  slots,
  selectedSlot,
  loading,
  error,
  onSelect,
}: {
  slots: AvailabilitySlot[]
  selectedSlot: AvailabilitySlot | null
  loading: boolean
  error: string | null
  onSelect: (slot: AvailabilitySlot) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
        <Spinner size={16} className="animate-spin" />
        <span className="text-sm">Checking availability…</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="py-4 text-center text-sm text-gray-400 bg-gray-50 dark:bg-white/5 rounded-2xl">
        {error}
      </div>
    )
  }
  if (slots.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedSlot?.id === slot.id
        return (
          <button
            key={slot.id}
            onClick={() => onSelect(slot)}
            className={cn(
              "py-3.5 rounded-2xl text-sm font-bold border-2 transition-all",
              isSelected
                ? "text-white border-transparent"
                : "border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#007B85]/50"
            )}
            style={isSelected ? { backgroundColor: TEAL, borderColor: TEAL } : undefined}
          >
            {formatTime(slot.start_time)}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

interface BookingPageProps {
  params: Promise<{ handle: string }>
}

export default function PublicBookingPage({ params }: BookingPageProps) {
  const { handle } = use(params)

  // ── data ──
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<BookingService[]>([])
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [merchantUserId, setMerchantUserId] = useState<string | null>(null)
  const [isCapReached, setIsCapReached] = useState(false)

  // ── sheet state ──
  const [sheetOpen, setSheetOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [shakeStep1, setShakeStep1] = useState(false)

  // ── booking selections ──
  const [selectedService, setSelectedService] = useState<BookingService | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  // ── customer form ──
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerMessage, setCustomerMessage] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ── submission ──
  const [submitting, setSubmitting] = useState(false)

  const days14 = getNext14Days()
  const sheetRef = useRef<HTMLDivElement>(null)

  // ── Load merchant data ──
  useEffect(() => {
    async function fetchData() {
      const supabase = getPublicSupabase()
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
          userId = handle
        }
      }

      if (profileData) setBusinessProfile(profileData)
      if (userId) setMerchantUserId(userId)

      const effectiveUserId = userId ?? handle
      const { data: svcData } = await supabase
        .from("booking_services")
        .select("*")
        .eq("user_id", effectiveUserId)
        .eq("active", true)
        .order("name")

      if (svcData && svcData.length > 0) {
        setServices(svcData)
      }

      // Check plan cap (client-side preview — server enforces authoritatively)
      const { data: customer } = await supabase
        .from("customers")
        .select("plan")
        .eq("id", effectiveUserId)
        .maybeSingle()

      if (!customer || customer.plan === "coconut" || customer.plan === "free") {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

        const { count } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", effectiveUserId)
          .neq("status", "cancelled")
          .gte("booking_date", monthStart)
          .lte("booking_date", monthEnd)

        if ((count ?? 0) >= COCONUT_BOOKING_LIMIT) {
          setIsCapReached(true)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [handle])

  // ── Load time slots when date/service changes ──
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setAvailableSlots([])
      setSelectedSlot(null)
      setSlotsError(null)
      return
    }

    async function fetchSlots() {
      setLoadingSlots(true)
      setSlotsError(null)
      setSelectedSlot(null)

      const supabase = getPublicSupabase()
      const [y, mo, d] = selectedDate!.split("-").map(Number)
      const date = new Date(y, mo - 1, d)
      const dayOfWeek = date.getDay()

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
        const dayNames = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"]
        setSlotsError(`No available times for ${dayNames[dayOfWeek]}`)
        setAvailableSlots([])
        setLoadingSlots(false)
        return
      }

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
        setSlotsError("All time slots are fully booked for this date")
      }

      setAvailableSlots(slotsWithCapacity)
      setLoadingSlots(false)
    }

    fetchSlots()
  }, [selectedDate, selectedService])

  // ── Keyboard-aware scrolling (visualViewport) ──
  useEffect(() => {
    if (!sheetOpen) return
    const sheet = sheetRef.current
    if (!sheet || typeof window === "undefined" || !window.visualViewport) return

    const handleViewportResize = () => {
      const vv = window.visualViewport!
      // Shift sheet bottom to account for keyboard
      const bottomOffset = window.innerHeight - vv.height - vv.offsetTop
      sheet.style.paddingBottom = bottomOffset > 0 ? `${bottomOffset}px` : ""
    }

    window.visualViewport.addEventListener("resize", handleViewportResize)
    window.visualViewport.addEventListener("scroll", handleViewportResize)
    return () => {
      window.visualViewport!.removeEventListener("resize", handleViewportResize)
      window.visualViewport!.removeEventListener("scroll", handleViewportResize)
    }
  }, [sheetOpen])

  function openSheet(service: BookingService) {
    setSelectedService(service)
    setSelectedDate(null)
    setAvailableSlots([])
    setSelectedSlot(null)
    setStep(1)
    setSheetOpen(true)
  }

  function handleNextStep() {
    if (!selectedDate || !selectedSlot) {
      setShakeStep1(true)
      setTimeout(() => setShakeStep1(false), 600)
      return
    }
    setStep(2)
  }

  function validateForm() {
    const errors: Record<string, string> = {}
    if (!customerName.trim()) errors.name = "Name is required"
    if (!customerPhone.trim()) errors.phone = "Phone / WhatsApp is required"
    else if (!/^\+?[\d\s\-().]{7,20}$/.test(customerPhone)) {
      errors.phone = "Enter a valid phone number"
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

    setSubmitting(true)

    const response = await fetch("/api/bookings/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_user_id: merchantUserId ?? handle,
        service_id: selectedService.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        booking_date: selectedDate,
        booking_time: selectedSlot.start_time,
        number_of_people: 1,
        notes: customerMessage.trim() || undefined,
      }),
    })

    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      // Preserve form data — only show toast, don't close sheet
      toast.error(result.error ?? "Something went wrong. Please try again.")
      return
    }

    const bookingId = result.data?.id
    window.location.href = `/book/${handle}/confirmed?booking_id=${bookingId}`
  }

  // ── Derived ──
  const businessName = businessProfile?.business_name ?? "Business"
  const businessDesc = businessProfile?.business_description
  const profilePic = businessProfile?.profile_picture_url
  const whatsappNumber = businessProfile?.whatsapp_number
  const whatsappDigits = whatsappNumber?.replace(/[^\d]/g, "") ?? null
  const whatsappContactUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hi ${businessName}, I found your page on TropiChat and I'm interested in booking!`)}`
    : null

  // ── Loading state (skeleton) ──
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex flex-col p-4 sm:p-6">
        {/* Skeleton header */}
        <div className="flex flex-col items-center gap-3 pt-8 pb-4 animate-pulse">
          <div className="w-18 h-18 rounded-2xl bg-gray-100 dark:bg-white/5" style={{ width: 72, height: 72 }} />
          <div className="h-6 w-40 bg-gray-100 dark:bg-white/5 rounded-lg" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-white/5 rounded" />
        </div>
        {/* Skeleton cards */}
        <div className="animate-pulse space-y-3 max-w-lg mx-auto w-full mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0C0C0C] rounded-2xl border border-gray-100 dark:border-white/5 p-4 h-24">
              <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Empty state ──
  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex flex-col items-center justify-center p-6 text-center gap-5">
        <div className="h-16 w-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto">
          <Storefront size={32} className="text-gray-300 dark:text-white/20" weight="duotone" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{businessName}</h1>
          <p className="text-sm text-gray-500 max-w-xs">
            This merchant hasn&apos;t listed any services yet.
          </p>
        </div>
        {whatsappContactUrl ? (
          <a
            href={whatsappContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-colors"
            style={{ borderColor: WA_GREEN, color: WA_GREEN }}
          >
            <WaIcon size={16} />
            WhatsApp them directly
          </a>
        ) : (
          <p className="text-sm text-gray-400">Check back soon.</p>
        )}
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] relative overflow-hidden">
        {/* Background ambiance */}
        <div className="absolute top-0 inset-x-0 h-[360px] bg-gradient-to-b from-[#007B85]/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none blur-[90px]"
          style={{ background: `${TEAL}12` }} />

        <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 pb-32">

          {/* ── Business header ── */}
          <div className="flex flex-col items-center text-center gap-3 pt-8 pb-6">
            {profilePic ? (
              <Image
                src={profilePic}
                alt={businessName}
                width={72}
                height={72}
                className="rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="h-[72px] w-[72px] rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${TEAL}15` }}>
                <Storefront size={32} style={{ color: TEAL }} weight="duotone" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{businessName}</h1>
              {businessDesc && (
                <p className="text-sm text-gray-500 mt-1 max-w-sm">{businessDesc}</p>
              )}
            </div>
            {/* WhatsApp contact button */}
            {whatsappContactUrl && (
              <a
                href={whatsappContactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-bold transition-colors"
                style={{ backgroundColor: `${WA_GREEN}15`, color: WA_GREEN }}
              >
                <WaIcon size={13} />
                WhatsApp us
              </a>
            )}
          </div>

          {/* ── Service count badge ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-800 dark:text-white">Services</h2>
            <span className="text-[13px] font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500">
              {services.length} service{services.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* ── Booking cap banner ── */}
          {isCapReached && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
            >
              <div className="flex items-start gap-3">
                <Lock size={18} className="text-gray-400 shrink-0 mt-0.5" weight="bold" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    This merchant&apos;s booking calendar is currently full.
                  </p>
                  {whatsappContactUrl && (
                    <a
                      href={whatsappContactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-[13px] font-bold rounded-xl px-3 py-2 border transition-colors"
                      style={{ borderColor: WA_GREEN, color: WA_GREEN }}
                    >
                      <WaIcon size={13} />
                      WhatsApp to check availability
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Service cards ── */}
          <div className="space-y-3">
            {services.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                selected={selectedService?.id === svc.id && sheetOpen}
                disabled={isCapReached}
                onClick={() => openSheet(svc)}
              />
            ))}
          </div>
        </div>

        {/* ── Sticky Book CTA (when no sheet open) ── */}
        <AnimatePresence>
          {!sheetOpen && !isCapReached && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed bottom-0 inset-x-0 z-30 px-4 pb-6 pt-3 bg-gradient-to-t from-white dark:from-[#050505] to-transparent"
            >
              <button
                onClick={() => {
                  if (services.length > 0) openSheet(services[0])
                }}
                className="w-full h-14 rounded-3xl font-black text-base text-white shadow-lg transition-all max-w-lg mx-auto flex items-center justify-center gap-2"
                style={{ backgroundColor: CORAL, boxShadow: `0 8px 24px ${CORAL}40` }}
              >
                <CalendarDots size={20} weight="bold" />
                Book a Service
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottom Sheet ── */}
        <AnimatePresence>
          {sheetOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setSheetOpen(false)}
              />

              {/* Sheet */}
              <motion.div
                key="sheet"
                ref={sheetRef}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 inset-x-0 z-50 max-h-[90vh] bg-white dark:bg-[#0C0C0C] rounded-t-3xl overflow-y-auto"
              >
                {/* Drag handle */}
                <div className="sticky top-0 flex justify-center pt-3 pb-2 bg-white dark:bg-[#0C0C0C] z-10">
                  <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/15" />
                </div>

                <div className="px-5 pb-8">
                  {/* Step dots */}
                  <div className="flex gap-2 justify-start mb-5">
                    {([1, 2] as const).map((s) => (
                      <div
                        key={s}
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: step === s ? 24 : 8,
                          backgroundColor: step === s ? CORAL : "#e5e7eb",
                        }}
                      />
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {/* ── STEP 1: Service + Date + Time ── */}
                    {step === 1 && (
                      <motion.div
                        key="sheet-step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-5"
                      >
                        {/* Selected service summary */}
                        {selectedService && (
                          <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">
                              {selectedService.name}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {selectedService.duration_minutes} min
                              {selectedService.price != null && selectedService.price > 0
                                ? ` · $${selectedService.price.toFixed(2)}`
                                : ""}
                            </p>
                          </div>
                        )}

                        <div className="h-px bg-gray-100 dark:bg-white/8" />

                        {/* Date chips */}
                        <div className="space-y-2">
                          <p className="text-sm font-black text-gray-800 dark:text-white">
                            When would you like to come in?
                          </p>
                          <DateChipScroller
                            days={days14}
                            selectedDate={selectedDate}
                            onSelect={(iso) => {
                              setSelectedDate(iso)
                              setSelectedSlot(null)
                            }}
                          />
                        </div>

                        {/* Time pills */}
                        {selectedDate && (
                          <div className="space-y-2">
                            <p className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-1.5">
                              <Clock size={14} weight="bold" /> Available times
                            </p>
                            <TimePillGrid
                              slots={availableSlots}
                              selectedSlot={selectedSlot}
                              loading={loadingSlots}
                              error={slotsError}
                              onSelect={setSelectedSlot}
                            />
                          </div>
                        )}

                        <div className="h-px bg-gray-100 dark:bg-white/8" />

                        {/* Next CTA */}
                        <motion.button
                          animate={shakeStep1 ? {
                            x: [0, -6, 6, -6, 6, 0],
                            transition: { duration: 0.4 }
                          } : {}}
                          onClick={handleNextStep}
                          disabled={!selectedDate || !selectedSlot}
                          className="w-full h-13 rounded-3xl font-black text-base text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{
                            backgroundColor: CORAL,
                            height: 52,
                            boxShadow: selectedDate && selectedSlot ? `0 6px 20px ${CORAL}35` : undefined,
                          }}
                        >
                          Next: Your Details
                          <CaretRight size={18} weight="bold" />
                        </motion.button>
                      </motion.div>
                    )}

                    {/* ── STEP 2: Contact form ── */}
                    {step === 2 && (
                      <motion.div
                        key="sheet-step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div>
                          <h2 className="text-xl font-black text-gray-900 dark:text-white">Almost done!</h2>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Just a few details for {businessName}.
                          </p>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-white/8" />

                        {/* Name */}
                        <div className="space-y-1">
                          <label className="text-[13px] font-black uppercase tracking-wider text-gray-400">
                            Your name *
                          </label>
                          <input
                            type="text"
                            autoComplete="name"
                            placeholder="e.g. Maria Brown"
                            value={customerName}
                            onChange={(e) => {
                              setCustomerName(e.target.value)
                              setFormErrors((p) => ({ ...p, name: "" }))
                            }}
                            onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
                            className={cn(
                              "w-full h-12 rounded-2xl border-2 px-4 text-sm font-semibold bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none transition-colors",
                              formErrors.name
                                ? "border-red-400 focus:border-red-400"
                                : "border-gray-100 dark:border-white/10 focus:border-[#007B85]"
                            )}
                          />
                          {formErrors.name && (
                            <p className="text-[13px] text-red-500 flex items-center gap-1">
                              <WarningCircle size={12} /> {formErrors.name}
                            </p>
                          )}
                        </div>

                        {/* Phone / WhatsApp */}
                        <div className="space-y-1">
                          <label className="text-[13px] font-black uppercase tracking-wider text-gray-400">
                            Phone / WhatsApp *
                          </label>
                          <input
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            placeholder="+1 876 555 0100"
                            value={customerPhone}
                            onChange={(e) => {
                              setCustomerPhone(e.target.value)
                              setFormErrors((p) => ({ ...p, phone: "" }))
                            }}
                            onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
                            className={cn(
                              "w-full h-12 rounded-2xl border-2 px-4 text-sm font-semibold bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none transition-colors",
                              formErrors.phone
                                ? "border-red-400 focus:border-red-400"
                                : "border-gray-100 dark:border-white/10 focus:border-[#007B85]"
                            )}
                          />
                          {formErrors.phone && (
                            <p className="text-[13px] text-red-500 flex items-center gap-1">
                              <WarningCircle size={12} /> {formErrors.phone}
                            </p>
                          )}
                        </div>

                        {/* Optional message */}
                        <div className="space-y-1">
                          <label className="text-[13px] font-black uppercase tracking-wider text-gray-400">
                            Message for {businessName} (optional)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. My hair is shoulder length, I have a reference photo"
                            value={customerMessage}
                            onChange={(e) => setCustomerMessage(e.target.value)}
                            onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })}
                            className="w-full rounded-2xl border-2 border-gray-100 dark:border-white/10 px-4 py-3 text-sm font-semibold bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:outline-none focus:border-[#007B85] transition-colors resize-none"
                          />
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-white/8" />

                        {/* Booking summary */}
                        <div className="rounded-2xl p-4 space-y-1" style={{ backgroundColor: `${TEAL}08`, border: `1px solid ${TEAL}20` }}>
                          <p className="text-[13px] font-black uppercase tracking-wider" style={{ color: TEAL }}>
                            Booking Summary
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedService?.name}</p>
                          {selectedDate && (
                            <p className="text-[13px] text-gray-500">{formatFullDate(selectedDate)}</p>
                          )}
                          {selectedSlot && (
                            <p className="text-[13px] text-gray-500">{formatTime(selectedSlot.start_time)}</p>
                          )}
                        </div>

                        {/* CTAs */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-1 px-4 h-12 rounded-3xl font-bold text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <CaretLeft size={16} weight="bold" />
                            Back
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 h-12 rounded-3xl font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                            style={{
                              backgroundColor: CORAL,
                              boxShadow: `0 6px 20px ${CORAL}35`,
                            }}
                          >
                            {submitting ? (
                              <>
                                <Spinner size={16} className="animate-spin" />
                                Sending request…
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={16} weight="bold" />
                                Request Booking
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-[13px] text-center text-gray-400">
                          By tapping, you agree to TropiChat&apos;s Terms
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
