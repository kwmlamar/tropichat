"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  CalendarBlank,
  CheckCircle,
  CaretLeft,
  CaretRight,
  Clock,
  ArrowSquareOut,
  Funnel,
  CaretDown,
  CircleNotch,
  GearSix,
  Users,
  ArrowRight,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getBookings, getServices, formatBookingTime } from "@/lib/bookings"
import { CreateBookingModal } from "@/components/bookings/create-booking-modal"
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal"
import type { Booking, BookingService } from "@/types/bookings"
import { getSupabase, getCurrentCustomer } from "@/lib/supabase"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
const STATUS_TABS: { key: StatusFilter; label: string; dot: string }[] = [
  { key: 'all',       label: 'All',        dot: '' },
  { key: 'pending',   label: 'Requests',   dot: 'bg-[#FF7E36]' },
  { key: 'confirmed', label: 'Confirmed',  dot: 'bg-[#007B85]' },
  { key: 'completed', label: 'Completed',  dot: 'bg-indigo-500' },
]

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay() }

import { PlanGate } from "@/components/billing/PlanGate"

// ─── Status badge ─────────────────────────────────────────────────────────────
// Signature: teal = confirmed, coral = pending, muted = cancelled
function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") return (
    <span className="text-[11px] font-black text-[#3A9B9F] uppercase tracking-widest">Confirmed</span>
  )
  if (status === "pending") return (
    <span className="text-[11px] font-black text-[#FF7E36] uppercase tracking-widest">Pending</span>
  )
  if (status === "completed") return (
    <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Completed</span>
  )
  return <span className="text-[11px] font-black text-gray-400 dark:text[#525252] uppercase tracking-widest">{status}</span>
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ title, val, accent }: { title: string; val: number; accent: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-5 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200 shadow-sm"
      style={{ borderLeftColor: accent, borderLeftWidth: 2 }}>
      <p className="text-[11px] text-gray-500 dark:text-[#525252] uppercase tracking-[0.2em] font-black mb-2">{title}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">{val}</p>
    </motion.div>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-[#3A9B9F]",
  pending:   "bg-[#FF7E36]",
  cancelled: "bg-gray-300 dark:bg-[#333]",
  completed: "bg-indigo-400",
}

function MonthView({ calendarDays, bookingsForDay, isToday, onBookingClick }: any) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-[0.2em] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day: number | null, idx: number) => {
          if (day === null) return <div key={idx} className="min-h-[96px] rounded-xl" />
          const dayBkgs = bookingsForDay(day)
          const today = isToday(day)
          return (
            <div key={idx} className={cn(
              "min-h-[96px] rounded-xl border transition-all duration-200 overflow-hidden",
              today
                ? "border-[#3A9B9F] bg-[#3A9B9F]/[0.04] dark:bg-[#3A9B9F]/[0.08]"
                : "border-gray-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] hover:border-gray-200 dark:hover:border-[#2A2A2A]"
            )}>
              <div className="p-2.5">
                <div className={cn(
                  "h-6 w-6 rounded-lg flex items-center justify-center text-[11px] font-black mb-1.5",
                  today ? "bg-[#3A9B9F] text-white shadow-sm" : "text-gray-400 dark:text-[#525252]"
                )}>{day}</div>
                <div className="space-y-1">
                  {dayBkgs.slice(0, 3).map((b: Booking) => (
                    <button key={b.id} onClick={() => onBookingClick(b)}
                      className={cn("w-full text-left px-1.5 py-1 rounded text-white text-[11px] font-black truncate uppercase tracking-tight", STATUS_DOT[b.status])}>
                      {b.customer_name.split(" ")[0]}
                    </button>
                  ))}
                  {dayBkgs.length > 3 && (
                    <p className="text-[11px] font-black text-[#3A9B9F] pl-1 uppercase tracking-widest">+{dayBkgs.length - 3} More</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── List view ─────────────────────────────────────────────────────────────────
function ListView({ bookings, onBookingClick }: any) {
  if (bookings.length === 0) return (
    <div className="py-20 text-center">
      <p className="text-[13px] font-bold text-gray-400 dark:text-[#525252] uppercase tracking-widest">No bookings for this period</p>
    </div>
  )
  const grouped: Record<string, Booking[]> = {}
  for (const b of bookings) {
    if (!grouped[b.booking_date]) grouped[b.booking_date] = []
    grouped[b.booking_date].push(b)
  }
  return (
    <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayBookings]) => (
        <div key={date}>
          <p className="text-[11px] font-black text-[#3A9B9F] uppercase tracking-[0.2em] mb-4">
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <div className="space-y-2">
            {dayBookings.map(b => (
              <button key={b.id} onClick={() => onBookingClick(b)}
                className="group w-full bg-white dark:bg-[#0C0C0C] hover:border-[#3A9B9F]/30 dark:hover:border-[#3A9B9F]/30 border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-4 flex items-center gap-4 text-left transition-all duration-200 shadow-sm active:scale-[0.99]">
                <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.customer_name)}&background=random&color=fff`} size="md"
                  className="h-10 w-10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-black text-gray-900 dark:text-white truncate tracking-tight">{b.customer_name}</p>
                  <p className="text-[12px] font-bold text-gray-500 dark:text-[#525252] truncate mt-0.5">{b.service?.name} · {b.number_of_people} guests</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">{formatBookingTime(b.booking_time)}</p>
                  <StatusBadge status={b.status} />
                </div>
                <CaretRight weight="bold" className="h-4 w-4 text-gray-300 dark:text-[#333] group-hover:text-[#3A9B9F] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter()
  const today  = new Date()

  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [view, setView]           = useState<"month"|"list">("month")
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [services, setServices]   = useState<BookingService[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterService, setFilter]= useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [customerPlan, setPlan]   = useState("free")
  const [isMobile, setIsMobile]   = useState(false)
  const [selectedDate, setSelDate]= useState<Date>(today)
  const [selectedTime, setSelTime]= useState("10:00 AM")
  const [currCustomerId, setCurrId]= useState<string|null>(null)
  const [createOpen, setCreateOpen]   = useState(false)
  const [selectedBooking, setSelBkg]  = useState<Booking|null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const monthStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}`

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check)
  }, [])

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const { data: customer } = await getCurrentCustomer()
    if (customer) { setPlan(customer.plan); setCurrId(customer.id) }
    
    // We fetching services even on free plan so UI shows something nice behind blur
    const [{ data: b }, { data: s }] = await Promise.all([
        getBookings({ month: monthStr }), 
        getServices(false)
    ])
    setBookings(b || []); setServices(s || []); 
    setLoading(false)
  }, [monthStr])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  useEffect(() => {
    const client = getSupabase()
    const ch = client.channel("bookings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchBookings())
      .subscribe()
    return () => { client.removeChannel(ch) }
  }, [fetchBookings])

  const filtered = bookings.filter(b =>
    (filterService === "all" || b.service_id === filterService) &&
    (statusFilter === "all" || b.status === statusFilter)
  )
  const pendingCount = bookings.filter(b => b.status === 'pending').length

  const calendarDays = useMemo(() => {
    const n = getDaysInMonth(viewYear, viewMonth)
    const f = getFirstDay(viewYear, viewMonth)
    const days: (number|null)[] = [...Array(f).fill(null), ...Array.from({ length: n }, (_, i) => i+1)]
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [viewYear, viewMonth])

  const carouselDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    return Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1))
  }, [viewYear, viewMonth])

  const bookingsForDay = useCallback((day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
    return filtered.filter(b => b.booking_date === dateStr)
  }, [viewYear, viewMonth, filtered])

  const isToday = useCallback((day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
  , [viewMonth, viewYear])

  const onBookingClick = (b: Booking) => { setSelBkg(b); setDetailsOpen(true) }
  const onBookingUpdated = (u: Booking) => { setBookings(p => p.map(b => b.id === u.id ? u : b)) }

  const prevMonth = () => { if (viewMonth===0){setViewYear(y=>y-1);setViewMonth(11)}else setViewMonth(m=>m-1) }
  const nextMonth = () => { if (viewMonth===11){setViewYear(y=>y+1);setViewMonth(0)}else setViewMonth(m=>m+1) }

  const timesList = ["10:00 AM","11:30 AM","1:00 PM","2:30 PM","4:00 PM"]

  const handleMobileBack = () => { if (window.history.length > 2) router.back(); else router.push("/dashboard") }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-1 items-center justify-center h-full p-8">
      <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-[#3A9B9F]" />
    </div>
  )

  // ── Wrapped Content ────────────────────────────────────────────────────────
  return (
    <PlanGate plan={customerPlan} feature="canUseBookingPage" className="min-h-full">
      {isMobile ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-3 border-b border-gray-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C]">
            <button onClick={handleMobileBack}
              className="h-9 w-9 flex items-center justify-center bg-gray-100 dark:bg-[#111] rounded-xl text-gray-500 dark:text-[#525252] active:scale-90 transition-transform">
              <ArrowLeft weight="bold" className="h-4 w-4" />
            </button>
            <p className="text-[15px] font-black text-[#213138] dark:text-white uppercase tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            <Link href="/dashboard/bookings/availability">
              <button className="h-9 w-9 flex items-center justify-center bg-gray-100 dark:bg-[#111] rounded-xl text-gray-500 dark:text-[#525252] active:scale-90 transition-transform">
                <GearSix weight="bold" className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Day calendar grid + nav */}
          <div className="px-1 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-[11px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-[0.2em]">Select Date</p>
              <div className="flex items-center gap-2.5">
                <button onClick={prevMonth} className="p-3 rounded-2xl border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] text-gray-600 dark:text-gray-300 hover:text-[#3A9B9F] active:scale-90 transition-all shadow-sm">
                  <CaretLeft weight="bold" className="h-5 w-5" />
                </button>
                <button onClick={nextMonth} className="p-3 rounded-2xl border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] text-gray-600 dark:text-gray-300 hover:text-[#3A9B9F] active:scale-90 transition-all shadow-sm">
                  <CaretRight weight="bold" className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 px-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[11px] font-black text-gray-400 dark:text-[#525252] uppercase py-1">{d[0]}</div>
              ))}
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={idx} />
                const date = new Date(viewYear, viewMonth, day)
                const isSelected = selectedDate.toDateString() === date.toDateString()
                const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`
                const count = filtered.filter(b => b.booking_date === dateStr).length
                
                return (
                  <motion.button key={idx} onClick={() => setSelDate(date)}
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.002 }}
                    className={cn("flex flex-col items-center justify-center aspect-square rounded-xl border transition-all duration-200 relative",
                      isSelected
                        ? "bg-[#3A9B9F] border-[#3A9B9F] text-white shadow-lg shadow-[#3A9B9F]/20"
                        : "bg-white dark:bg-[#0C0C0C] border-gray-100 dark:border-[#1C1C1C] text-gray-900 dark:text-white"
                    )}>
                    <span className={cn("text-[16px] font-black leading-none", isSelected ? "text-white" : "opacity-100")}>
                      {day}
                    </span>
                    {count > 0 && !isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#3A9B9F]" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Time slots */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {timesList.map(t => (
                <button key={t} onClick={() => setSelTime(t)}
                  className={cn("px-4 py-2 rounded-full text-[11px] font-black whitespace-nowrap border shrink-0 transition-all uppercase tracking-widest",
                    selectedTime === t
                      ? "bg-[#3A9B9F] text-white border-[#3A9B9F] shadow-sm"
                    : "bg-white dark:bg-[#0C0C0C] text-gray-500 dark:text-[#525252] border-gray-100 dark:border-[#1C1C1C]")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings for selected day */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
          <p className="text-[11px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <CalendarBlank weight="bold" className="h-3.5 w-3.5" />
            {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          {(() => {
            const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,"0")}-${String(selectedDate.getDate()).padStart(2,"0")}`
            const dayBkgs = filtered.filter(b => b.booking_date === dateStr)
            if (dayBkgs.length === 0) return (
              <div className="py-12 bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-2xl flex flex-col items-center justify-center text-center px-6">
                <Users weight="bold" className="h-8 w-8 text-gray-200 dark:text-[#1A1A1A] mb-3" />
                <p className="text-[13px] font-bold text-gray-400 dark:text-[#525252] uppercase tracking-widest">No bookings on this day</p>
              </div>
            )
            return (
              <div className="space-y-2">
                {dayBkgs.map(b => (
                  <button key={b.id} onClick={() => onBookingClick(b)}
                    className="w-full bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all shadow-sm">
                    <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.customer_name)}&background=random&color=fff`} className="h-10 w-10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-black text-gray-900 dark:text-white truncate tracking-tight">{b.customer_name}</p>
                      <p className="text-[12px] font-bold text-gray-500 dark:text-[#525252]">{b.service?.name} · {b.number_of_people} guests</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">{formatBookingTime(b.booking_time)}</p>
                      <StatusBadge status={b.status} />
                    </div>
                  </button>
                ))}
              </div>
            )
          })()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-[#1C1C1C] bg-white/80 dark:bg-[#0C0C0C]/80 backdrop-blur-xl z-[110]">
          <button onClick={() => {
            const dateStr = selectedDate.toISOString().split("T")[0]
            router.push(`/dashboard/bookings/new?date=${dateStr}&time=${encodeURIComponent(selectedTime)}`)
          }}
            className="w-full h-12 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#3A9B9F]/20">
            Book Appointment
          </button>
        </div>
      </div>
      ) : (
        <div className="p-8 min-h-screen overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <p className="text-[11px] text-gray-400 dark:text-[#525252] uppercase tracking-[0.2em] font-black mb-1.5 flex items-center gap-2">
                  Calendar
                </p>
                <h1 className="text-3xl font-black text-[#213138] dark:text-white tracking-tight uppercase">Bookings</h1>
              </div>
              <div className="flex items-center gap-3">
                {/* Service filter */}
                <div className="relative">
                  <Funnel weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#525252]" />
                  <select value={filterService} onChange={e => setFilter(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-[13px] font-bold text-gray-700 dark:text-[#A3A3A3] focus:outline-none focus:border-[#3A9B9F] transition-all duration-200 cursor-pointer appearance-none shadow-sm uppercase tracking-widest">
                    <option value="all">All Services</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <CaretDown weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-[#525252] pointer-events-none" />
                </div>
                {/* View toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-[#111] p-1 rounded-xl border border-gray-200 dark:border-[#1C1C1C] gap-0.5 shadow-inner">
                  {(["month","list"] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className={cn("px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200",
                        view === v
                          ? "bg-white dark:bg-[#1C1C1C] text-[#3A9B9F] shadow-sm"
                          : "text-gray-400 dark:text-[#525252] hover:text-gray-700 dark:hover:text-[#A3A3A3]")}>
                      {v}
                    </button>
                  ))}
                </div>
                <Link href="/dashboard/bookings/availability">
                  <Button variant="outline" className="bg-white dark:bg-[#0C0C0C] border-gray-200 dark:border-[#1C1C1C] hover:border-gray-300 dark:hover:border-[#2A2A2A] text-gray-600 dark:text-[#A3A3A3] rounded-xl h-10 text-[11px] font-black uppercase tracking-widest">
                    <GearSix weight="bold" className="h-4 w-4 mr-2" />Services
                  </Button>
                </Link>
                <button onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 h-10 px-5 bg-[#3A9B9F] hover:bg-[#2F8488] text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-lg shadow-[#3A9B9F]/20 active:scale-95">
                  New Booking
                </button>
                <Link href={currCustomerId ? `/book/${currCustomerId}` : "/book-preview"} target="_blank">
                  <Button variant="outline" className="bg-white dark:bg-[#0C0C0C] border-gray-200 dark:border-[#1C1C1C] hover:border-[#3A9B9F] text-[#3A9B9F] rounded-xl h-10 text-[11px] font-black uppercase tracking-widest">
                    <ArrowSquareOut weight="bold" className="h-4 w-4 mr-2" />Share
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Status filter tabs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.04 }}
              className="flex items-center gap-1 bg-gray-100 dark:bg-[#111] p-1 rounded-xl border border-gray-200 dark:border-[#1C1C1C] self-start shadow-inner">
              {STATUS_TABS.map(tab => {
                const count = tab.key === 'all' ? bookings.length : bookings.filter(b => b.status === tab.key).length
                return (
                  <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                    className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200",
                      statusFilter === tab.key
                        ? "bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-400 dark:text-[#525252] hover:text-gray-700 dark:hover:text-[#A3A3A3]"
                    )}>
                    {tab.dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tab.dot)} />}
                    {tab.label}
                    {count > 0 && (
                      <span className={cn("text-[11px] font-black tabular-nums ml-1",
                        tab.key === 'pending' && count > 0 ? "text-[#FF7E36]" : "text-gray-400 dark:text-[#525252]")}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
              className="grid grid-cols-3 gap-4">
              <StatCard title="Confirmed" val={bookings.filter(b => b.status==="confirmed").length} accent="#3A9B9F" />
              <StatCard title="Requests"  val={pendingCount}   accent="#FF7E36" />
              <StatCard title="Guests"    val={bookings.filter(b => b.status!=="cancelled").reduce((s,b)=>s+b.number_of_people,0)} accent="#3A9B9F" />
            </motion.div>

            {/* Calendar card — the signature element of bookings */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}
              className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Calendar header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-[#1C1C1C]">
                <h2 className="text-[16px] font-black text-[#213138] dark:text-white uppercase tracking-tight">
                  {MONTH_NAMES[viewMonth]} <span className="text-gray-300 dark:text-[#333] italic font-medium ml-1">{viewYear}</span>
                </h2>
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:text-[#3A9B9F] transition-all duration-200 shadow-sm active:scale-95">
                    <CaretLeft weight="bold" className="h-5 w-5" />
                  </button>
                  <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
                    className="px-5 h-10 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] text-[11px] font-black text-gray-500 dark:text-[#525252] hover:text-[#3A9B9F] transition-all duration-200 uppercase tracking-widest">
                    Today
                  </button>
                  <button onClick={nextMonth} className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:text-[#3A9B9F] transition-all duration-200 shadow-sm active:scale-95">
                    <CaretRight weight="bold" className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={view + viewMonth + viewYear}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}>
                  {view === "month"
                    ? <MonthView calendarDays={calendarDays} bookingsForDay={bookingsForDay} isToday={isToday} onBookingClick={onBookingClick} />
                    : <ListView bookings={filtered} onBookingClick={onBookingClick} />
                  }
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
      
      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={() => { fetchBookings(); setCreateOpen(false) }}
        initialDate={selectedDate.toISOString().split("T")[0]}
        initialTime={selectedTime.includes(":") ? selectedTime : undefined} />
      <BookingDetailsModal open={detailsOpen} booking={selectedBooking}
        onClose={() => { setDetailsOpen(false); setSelBkg(null) }} onUpdated={onBookingUpdated} />
    </PlanGate>
  )
}
