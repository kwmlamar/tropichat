"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  List,
  Filter,
  CheckCircle,
  Clock,
  Users,
  Check,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getBookings, getServices } from "@/lib/bookings"
import { CreateBookingModal } from "@/components/bookings/create-booking-modal"
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal"
import type { Booking, BookingService } from "@/types/bookings"
import { getSupabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { SimpleSelect } from "@/components/ui/dropdown"
import { Avatar } from "@/components/ui/avatar"

const STATUS_BG: Record<string, string> = {
  confirmed: 'bg-[#3A9B9F]',
  pending: 'bg-[#FF8B66]',
  cancelled: 'bg-slate-300',
}
const STATUS_DOT: Record<string, string> = {
  confirmed: 'bg-[#3A9B9F]',
  pending: 'bg-[#FF8B66]',
  cancelled: 'bg-slate-300',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function BookingsPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [view, setView] = useState<'month' | 'list'>('month')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<BookingService[]>([])
  const [loading, setLoading] = useState(true)
  const [filterService, setFilterService] = useState<string>('all')

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const [{ data: b }, { data: s }] = await Promise.all([
      getBookings({ month: monthStr }),
      getServices(false),
    ])
    setBookings(b)
    setServices(s)
    setLoading(false)
  }, [monthStr])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Realtime: re-fetch when bookings change
  useEffect(() => {
    const client = getSupabase()
    const channel = client
      .channel('bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings()
      })
      .subscribe()
    return () => { client.removeChannel(channel) }
  }, [fetchBookings])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const filtered = bookings.filter(b =>
    filterService === 'all' || b.service_id === filterService
  )

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth)
  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  const bookingsForDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filtered.filter(b => b.booking_date === dateStr)
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  // Analytics
  const confirmedThisMonth = filtered.filter(b => b.status === 'confirmed').length
  const pendingThisMonth = filtered.filter(b => b.status === 'pending').length
  const totalPeople = filtered
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + b.number_of_people, 0)

  const handleBookingClick = (b: Booking) => {
    setSelectedBooking(b)
    setDetailsOpen(true)
  }

  const handleBookingUpdated = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white to-transparent opacity-60 z-0 pointer-events-none" />
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full z-0 animate-float pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-coral-500/5 blur-[120px] rounded-full z-0 animate-float-delayed pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/40 px-8 py-6 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-[#213138] tracking-tight font-[family-name:var(--font-poppins)]">
            Bookings
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage and track your tour reservations globally</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Service filter */}
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 px-3 py-1.5 shadow-sm">
            <Filter className="h-4 w-4 text-[#3A9B9F]" />
            <select
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="text-xs font-bold text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none pr-6"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '12px' }}
            >
              <option value="all">All Services</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex p-1 bg-gray-100/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
            <button
              onClick={() => setView('month')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all duration-300",
                view === 'month'
                  ? "bg-white text-[#3A9B9F] shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              Month
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all duration-300",
                view === 'list'
                  ? "bg-white text-[#3A9B9F] shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl px-5 h-11 font-bold shadow-lg shadow-teal-500/20 transition-all border-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="relative z-10 px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-[#3A9B9F]">
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirmed</span>
          </div>
          <p className="text-3xl font-extrabold text-[#213138]">{confirmedThisMonth}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#3A9B9F]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#3A9B9F] animate-pulse" />
            Active Reservations
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-coral-50 text-[#FF8B66]">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending</span>
          </div>
          <p className="text-3xl font-extrabold text-[#213138]">{pendingThisMonth}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#FF8B66]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#FF8B66] animate-pulse" />
            Requires Action
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-[#213138]/5 text-[#213138]">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Capacity</span>
          </div>
          <p className="text-3xl font-extrabold text-[#213138]">{totalPeople}</p>
          <div className="mt-2 text-[10px] font-bold text-gray-400">Total Group Attendance</div>
        </motion.div>
      </div>

      {/* Main content Area */}
      <div className="relative z-10 flex-1 flex flex-col px-8 pb-8 overflow-hidden">
        <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/60 shadow-inner flex flex-col overflow-hidden">
          {/* Month navigator */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-white/40">
            <h2 className="text-xl font-extrabold text-[#213138] font-[family-name:var(--font-poppins)]">
              {MONTH_NAMES[viewMonth]} <span className="text-gray-300 font-medium ml-1">{viewYear}</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 hover:text-[#3A9B9F] transition-all border border-gray-100 shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-[#3A9B9F] transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 hover:text-[#3A9B9F] transition-all border border-gray-100 shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* View Container */}
          <div className="flex-1 overflow-auto relative custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-[#3A9B9F]" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={view + monthStr}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {view === 'month' ? (
                    <MonthView
                      calendarDays={calendarDays}
                      dayNames={DAY_NAMES}
                      bookingsForDay={bookingsForDay}
                      isToday={isToday}
                      onBookingClick={handleBookingClick}
                    />
                  ) : (
                    <ListView
                      bookings={filtered}
                      onBookingClick={handleBookingClick}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Footer */}
      <div className="relative z-10 px-8 py-4 flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {(['confirmed', 'pending', 'cancelled'] as const).map(s => (
            <div key={s} className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} />
              {s}
            </div>
          ))}
        </div>
        <div className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
          TropiChat Reservation Ecosystem
        </div>
      </div>

      {/* Create booking modal */}
      <CreateBookingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(b) => {
          setBookings(prev => [b, ...prev])
          setCreateOpen(false)
        }}
      />

      {/* Booking details modal */}
      <BookingDetailsModal
        open={detailsOpen}
        booking={selectedBooking}
        onClose={() => { setDetailsOpen(false); setSelectedBooking(null) }}
        onUpdated={handleBookingUpdated}
      />
    </div>
  )
}

// ============================================================
// Month grid view
// ============================================================
function MonthView({
  calendarDays,
  dayNames,
  bookingsForDay,
  isToday,
  onBookingClick,
}: {
  calendarDays: (number | null)[]
  dayNames: string[]
  bookingsForDay: (day: number) => Booking[]
  isToday: (day: number) => boolean
  onBookingClick: (b: Booking) => void
}) {
  return (
    <div className="p-8">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-3 mb-3">
        {dayNames.map(d => (
          <div key={d} className="text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-widest py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-3">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[110px] rounded-2xl bg-gray-50/20 shadow-inner" />
          }
          const dayBookings = bookingsForDay(day)
          const today = isToday(day)
          return (
            <div
              key={day}
              className={cn(
                "min-h-[110px] rounded-2xl border transition-all duration-300 group overflow-hidden relative",
                today
                  ? "border-[#3A9B9F] bg-[#3A9B9F]/5 ring-1 ring-[#3A9B9F]/20 shadow-md shadow-teal-500/5"
                  : "border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-[#3A9B9F]/30"
              )}
            >
              <div className="p-3">
                <div className={cn(
                  "h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold mb-2 transition-all",
                  today ? "bg-[#3A9B9F] text-white shadow-lg shadow-teal-500/30" : "text-gray-400 group-hover:text-gray-700"
                )}>
                  {day}
                </div>
                <div className="space-y-1.5">
                  {dayBookings.slice(0, 3).map(b => (
                    <motion.button
                      key={b.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onBookingClick(b)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-lg text-white text-[10px] leading-tight truncate font-bold transition-all shadow-sm",
                        STATUS_BG[b.status]
                      )}
                      title={`${b.customer_name} · ${b.service?.name ?? ''}`}
                    >
                      {b.number_of_people}p · {b.customer_name.split(' ')[0]}
                    </motion.button>
                  ))}
                  {dayBookings.length > 3 && (
                    <p className="text-[#3A9B9F] text-[9px] font-extrabold uppercase tracking-tighter pt-1 pl-1">
                      +{dayBookings.length - 3} others
                    </p>
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

// ============================================================
// List view
// ============================================================
function ListView({
  bookings,
  onBookingClick,
}: {
  bookings: Booking[]
  onBookingClick: (b: Booking) => void
}) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-teal-500/10 blur-2xl rounded-full" />
          <div className="relative rounded-3xl bg-gray-50 border border-white p-6 shadow-sm">
            <Calendar className="h-12 w-12 text-gray-300" />
          </div>
        </div>
        <h3 className="text-xl font-extrabold text-[#213138] mb-2 font-[family-name:var(--font-poppins)]">
          Quiet Month!
        </h3>
        <p className="text-gray-400 text-sm max-w-xs font-medium leading-relaxed">
          No tour reservations found for this period. Why not reach out to some leads?
        </p>
      </div>
    )
  }

  // Group by date
  const grouped: Record<string, Booking[]> = {}
  for (const b of bookings) {
    if (!grouped[b.booking_date]) grouped[b.booking_date] = []
    grouped[b.booking_date].push(b)
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto pb-12">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayBookings]) => (
        <div key={date} className="relative">
          <div className="sticky top-0 z-10 bg-white/40 backdrop-blur-md py-4 mb-4 border-b border-gray-100/50">
            <h3 className="text-xs font-black text-[#3A9B9F] uppercase tracking-[0.2em]">
              {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
              })}
            </h3>
          </div>

          <div className="grid gap-3">
            {dayBookings.map((b, idx) => (
              <motion.button
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onBookingClick(b)}
                className="group w-full bg-white/80 hover:bg-white rounded-[24px] border border-gray-100 p-5 flex items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-0.5 transition-all duration-300 text-left"
              >
                {/* Dynamic Status Indicator */}
                <div className="relative shrink-0">
                  <Avatar
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.customer_name)}&background=random&color=fff`}
                    size="lg"
                    className="border-2 border-white shadow-sm transition-transform group-hover:scale-105"
                  />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                    STATUS_BG[b.status]
                  )}>
                    {b.status === 'confirmed' ? <Check className="h-3 w-3 text-white" /> : <Clock className="h-3 w-3 text-white" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-[#213138] leading-tight truncate">
                      {b.customer_name}
                    </p>
                    <Badge variant="outline" className={cn(
                      "px-2.5 py-0.5 rounded-lg border-none font-bold text-[10px] uppercase tracking-wider",
                      b.status === 'confirmed' ? 'bg-teal-50 text-[#3A9B9F]' :
                        b.status === 'pending' ? 'bg-coral-50 text-[#FF8B66]' :
                          'bg-gray-100 text-gray-400'
                    )}>
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: b.service?.color ?? '#3A9B9F' }} />
                    {b.service?.name} · {b.number_of_people} Guests
                  </p>
                </div>

                <div className="text-right shrink-0 pr-2">
                  <p className="text-lg font-black text-[#213138] tracking-tight">
                    {(() => {
                      const [h, m] = b.booking_time.split(':').map(Number)
                      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
                    })()}
                  </p>
                  {b.service?.price && (
                    <p className="text-xs font-bold text-[#3A9B9F] mt-0.5">
                      ${(b.service.price * b.number_of_people).toFixed(2)}
                    </p>
                  )}
                </div>

                <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-[#3A9B9F] transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
