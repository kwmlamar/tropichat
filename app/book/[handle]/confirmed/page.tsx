"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle,
  CalendarDays,
  Clock,
  Users,
  Phone,
  ArrowLeft,
  Loader2,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import type { Booking, BookingService } from "@/types/bookings"

function getPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

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

function generateICS(booking: Booking & { service: BookingService }, businessName: string) {
  const [y, mo, d] = booking.booking_date.split("-").map(Number)
  const [h, mi] = booking.booking_time.split(":").map(Number)
  const start = new Date(y, mo - 1, d, h, mi)
  const end = new Date(start.getTime() + booking.service.duration_minutes * 60 * 1000)

  const pad = (n: number) => String(n).padStart(2, "0")
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TropiChat//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@tropichat`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${booking.service.name} — ${businessName}`,
    `DESCRIPTION:Booking ref: ${booking.reference_code ?? booking.id.slice(0, 8).toUpperCase()}`,
    `STATUS:CONFIRMED`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  const blob = new Blob([ics], { type: "text/calendar" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `booking-${booking.reference_code ?? booking.id.slice(0, 8)}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

interface ConfirmedPageProps {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ booking_id?: string }>
}

export default function BookingConfirmedPage({ params, searchParams }: ConfirmedPageProps) {
  const { handle } = use(params)
  const { booking_id } = use(searchParams)

  const [booking, setBooking] = useState<(Booking & { service: BookingService }) | null>(null)
  const [businessName, setBusinessName] = useState("")
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

      // Load business name from profile or service owner
      const { data: profile } = await supabase
        .from("business_profiles")
        .select("business_name")
        .or(`handle.eq.${handle},user_id.eq.${data.user_id}`)
        .maybeSingle()

      setBusinessName(profile?.business_name ?? "Your Business")
      setLoading(false)
    }

    fetchBooking()
  }, [booking_id, handle])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#007B85]" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p className="text-gray-500">{error ?? "Booking not found"}</p>
        <Link href={`/book/${handle}`}>
          <Button variant="ghost" className="font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Booking
          </Button>
        </Link>
      </div>
    )
  }

  const refCode = booking.reference_code ?? booking.id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-[#007B85]/5 to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 pt-6"
        >
          <div className="h-20 w-20 rounded-full bg-[#007B85]/10 border-4 border-[#007B85]/20 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-[#007B85]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">You&apos;re Booked!</h1>
            <p className="text-gray-500 mt-1">Your booking with {businessName} is confirmed.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[#0C0C0C] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden"
        >
          {/* Reference code banner */}
          <div className="bg-[#007B85] px-6 py-4 text-center">
            <p className="text-white/70 text-xs font-black uppercase tracking-widest">Confirmation #</p>
            <p className="text-white text-2xl font-black tracking-wider mt-0.5">{refCode}</p>
          </div>

          {/* Booking details */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#007B85]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CalendarDays className="h-4 w-4 text-[#007B85]" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Date</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">
                  {formatDate(booking.booking_date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#007B85]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="h-4 w-4 text-[#007B85]" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Time</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">
                  {formatTime(booking.booking_time)}
                  <span className="text-gray-400 font-normal ml-1">
                    ({booking.service.duration_minutes} min)
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#007B85]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="h-4 w-4 text-[#007B85]" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Service</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">
                  {booking.service.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {booking.number_of_people} {booking.number_of_people === 1 ? "guest" : "guests"}
                  {booking.service.price
                    ? ` · $${(booking.service.price * (booking.service.price_type === "per_person" ? booking.number_of_people : 1)).toFixed(2)}`
                    : ""}
                </p>
              </div>
            </div>

            {booking.customer_email && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#007B85]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="h-4 w-4 text-[#007B85]" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Confirmation sent to</p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm mt-0.5">
                    {booking.customer_email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <Button
            onClick={() => generateICS(booking, businessName)}
            variant="outline"
            className="w-full h-12 rounded-2xl font-black border-gray-200 dark:border-white/10 gap-2"
          >
            <Download className="h-4 w-4" />
            Add to Calendar
          </Button>

          <Link href={`/book/${handle}`} className="block">
            <Button
              variant="ghost"
              className="w-full h-12 rounded-2xl font-black text-gray-500 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {businessName}
            </Button>
          </Link>
        </motion.div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Powered by <span className="font-bold text-[#007B85]">TropiChat</span>
        </p>
      </div>
    </div>
  )
}
