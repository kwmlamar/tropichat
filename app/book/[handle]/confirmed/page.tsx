"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle,
  CalendarCheck,
  ShareNetwork,
  ArrowLeft,
} from "@phosphor-icons/react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { toast, Toaster } from "sonner"
import type { Booking, BookingService } from "@/types/bookings"

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const TEAL = "#007B85"
const WA_GREEN = "#25D366"

function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
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
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function buildGoogleCalendarUrl(booking: Booking & { service: BookingService }, businessName: string): string {
  const [y, mo, d] = booking.booking_date.split("-").map(Number)
  const [h, mi] = booking.booking_time.split(":").map(Number)
  const start = new Date(y, mo - 1, d, h, mi)
  const end = new Date(start.getTime() + booking.service.duration_minutes * 60 * 1000)

  const pad = (n: number) => String(n).padStart(2, "0")
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${booking.service.name} — ${businessName}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Booking with ${businessName} via TropiChat. Ref: ${booking.reference_code ?? booking.id.slice(0, 8).toUpperCase()}`,
  })

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`
}

function WaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

// ─────────────────────────────────────────────
// Animated checkmark component
// ─────────────────────────────────────────────
function CheckmarkCircle() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
      style={{ backgroundColor: TEAL }}
    >
      <CheckCircle size={40} weight="bold" className="text-white" />
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

interface ConfirmedPageProps {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ booking_id?: string }>
}

export default function BookingConfirmedPage({ params, searchParams }: ConfirmedPageProps) {
  const { handle } = use(params)
  const { booking_id } = use(searchParams)

  const [booking, setBooking] = useState<(Booking & { service: BookingService }) | null>(null)
  const [businessName, setBusinessName] = useState("")
  const [merchantWhatsapp, setMerchantWhatsapp] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!booking_id) {
      setError("No booking ID provided")
      setLoading(false)
      return
    }

    async function fetchBooking() {
      const supabase = getPublicSupabase()

      const { data, error: err } = await supabase
        .from("bookings")
        .select("*, service:booking_services(*)")
        .eq("id", booking_id!)
        .single()

      if (err || !data) {
        setError("Booking not found")
        setLoading(false)
        return
      }

      setBooking(data as Booking & { service: BookingService })

      const { data: profile } = await supabase
        .from("business_profiles")
        .select("business_name, whatsapp_number")
        .or(`handle.eq.${handle},user_id.eq.${data.user_id}`)
        .maybeSingle()

      setBusinessName(profile?.business_name ?? "Your Business")
      setMerchantWhatsapp(profile?.whatsapp_number ?? null)
      setLoading(false)
    }

    fetchBooking()
  }, [booking_id, handle])

  async function handleShare() {
    const shareData = {
      title: `Book ${businessName} on TropiChat`,
      text: `I just booked with ${businessName}! Book your appointment:`,
      url: window.location.origin + `/book/${handle}`,
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled share — silent
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url)
        toast.success("Link copied!")
      } catch {
        toast.error("Couldn't copy link")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#007B85] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p className="text-gray-500">{error ?? "Booking not found"}</p>
        <Link
          href={`/book/${handle}`}
          className="flex items-center gap-2 font-bold text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Booking
        </Link>
      </div>
    )
  }

  const refCode = booking.reference_code ?? booking.id.slice(0, 8).toUpperCase()
  const whatsappDigits = merchantWhatsapp ? merchantWhatsapp.replace(/[^\d]/g, "") : null
  const whatsappConfirmUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        `Hi ${businessName}, I just requested ${booking.service.name} via TropiChat — looking forward to it! 🌴 (Ref: ${refCode})`
      )}`
    : null
  const calendarUrl = buildGoogleCalendarUrl(booking, businessName)

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Background ambiance */}
        <div className="absolute top-0 inset-x-0 h-[360px] bg-gradient-to-b from-[#007B85]/5 to-transparent pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* ── Animated checkmark + headline ── */}
          <div className="text-center space-y-4 pt-6">
            <CheckmarkCircle />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                Booking Requested!
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {businessName} will confirm your appointment via WhatsApp within a few hours.
              </p>
            </motion.div>
          </div>

          {/* ── Booking summary card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-[#0C0C0C] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden"
          >
            {/* Confirmation code banner */}
            <div className="px-6 py-4 text-center" style={{ backgroundColor: TEAL }}>
              <p className="text-white/70 text-[13px] font-black uppercase tracking-widest">
                Confirmation #
              </p>
              <p className="text-white text-2xl font-black tracking-wider mt-0.5">
                {refCode}
              </p>
            </div>

            {/* Booking details */}
            <div className="px-6 py-5 space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">{booking.service.name}</p>
              <p className="text-sm text-gray-500">
                {formatDate(booking.booking_date)}
              </p>
              <p className="text-sm text-gray-500">
                {formatTime(booking.booking_time)}
                {booking.service.duration_minutes && (
                  <span className="text-gray-400"> · {booking.service.duration_minutes} min</span>
                )}
              </p>
              {booking.service.price != null && booking.service.price > 0 && (
                <p className="text-sm font-bold" style={{ color: TEAL }}>
                  ${booking.service.price.toFixed(2)}
                </p>
              )}
            </div>
          </motion.div>

          {/* ── Action buttons ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            {/* Primary CTA: WhatsApp — full-width teal #25D366 */}
            {whatsappConfirmUrl && (
              <a
                href={whatsappConfirmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-13 font-black text-white rounded-2xl transition-colors"
                style={{
                  backgroundColor: WA_GREEN,
                  height: 52,
                  boxShadow: `0 6px 20px ${WA_GREEN}40`,
                }}
              >
                <WaIcon size={20} />
                Get WhatsApp Confirmation
              </a>
            )}

            {/* Add to Calendar */}
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 font-bold text-sm rounded-2xl border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 transition-colors"
            >
              <CalendarCheck size={18} weight="bold" />
              Add to Calendar
            </a>

            {/* Social share */}
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full h-12 font-bold text-sm rounded-2xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ShareNetwork size={18} weight="bold" />
              Share this page
            </button>

            {/* Back link */}
            <Link
              href={`/book/${handle}`}
              className="flex items-center justify-center gap-2 w-full h-12 font-bold text-sm rounded-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={16} weight="bold" />
              Back to {businessName}
            </Link>
          </motion.div>

          <p className="text-center text-[13px] text-gray-400 pb-6">
            Powered by <span className="font-bold" style={{ color: TEAL }}>TropiChat</span>
          </p>
        </div>
      </div>
    </>
  )
}
