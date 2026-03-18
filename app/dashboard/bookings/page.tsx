"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  Loader2,
  ExternalLink,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getBookings, getServices, formatBookingTime } from "@/lib/bookings"
import { CreateBookingModal } from "@/components/bookings/create-booking-modal"
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal"
import type { Booking, BookingService } from "@/types/bookings"
import { getSupabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"

// Constants
const STATUS_BG: Record<string, string> = {
  confirmed: 'bg-[#3A9B9F]',
  pending: 'bg-[#FF8B66]',
  cancelled: 'bg-slate-300',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Helpers
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

// --- Sub-components (StatCard, MonthView, ListView) ---

function StatCard({ title, val, icon: Icon, color }: { title: string, val: number, icon: any, color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-sm ring-1 ring-gray-100/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-2xl bg-gray-50" style={{ color }}><Icon className="h-5 w-5" /></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-3xl font-extrabold text-[#213138]">{val}</p>
    </motion.div>
  )
}

function MonthView({ calendarDays, dayNames, bookingsForDay, isToday, onBookingClick }: any) {
  return (
    <div className="p-8">
      <div className="grid grid-cols-7 gap-3 mb-3">
        {dayNames.map((d: any) => <div key={d} className="text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-widest py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-3">
        {calendarDays.map((day: any, idx: number) => {
          if (day === null) return <div key={idx} className="min-h-[110px] rounded-2xl bg-gray-50/20" />
          const dayBookings = bookingsForDay(day)
          const today = isToday(day)
          return (
            <div key={day} className={cn("min-h-[110px] rounded-2xl border transition-all duration-300 group overflow-hidden relative", today ? "border-[#3A9B9F] bg-[#3A9B9F]/5 ring-1 ring-[#3A9B9F]/20 shadow-md shadow-teal-500/5" : "border-gray-100 bg-white")}>
              <div className="p-3">
                <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold mb-2 transition-all", today ? "bg-[#3A9B9F] text-white" : "text-gray-400 group-hover:text-gray-700")}>{day}</div>
                <div className="space-y-1.5">
                  {dayBookings.slice(0, 3).map((b: any) => (
                    <motion.button key={b.id} onClick={() => onBookingClick(b)} className={cn("w-full text-left px-2 py-1.5 rounded-lg text-white text-[10px] leading-tight truncate font-bold shadow-sm", STATUS_BG[b.status])}>
                      {b.number_of_people}p · {b.customer_name.split(' ')[0]}
                    </motion.button>
                  ))}
                  {dayBookings.length > 3 && <p className="text-[#3A9B9F] text-[9px] font-extrabold uppercase tracking-tighter pt-1 pl-1">+{dayBookings.length - 3} more</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ListView({ bookings, onBookingClick }: any) {
  if (bookings.length === 0) return <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No bookings found for this period</div>
  const grouped: Record<string, Booking[]> = {}
  for (const b of bookings) {
    if (!grouped[b.booking_date]) grouped[b.booking_date] = []
    grouped[b.booking_date].push(b)
  }
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto pb-12">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayBookings]) => (
        <div key={date}>
          <div className="sticky top-0 z-10 bg-white/40 backdrop-blur-md py-4 mb-4 border-b border-gray-100/50">
            <h3 className="text-xs font-black text-[#3A9B9F] uppercase tracking-[0.2em]">{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          </div>
          <div className="grid gap-3">
            {dayBookings.map((b) => (
              <motion.button key={b.id} onClick={() => onBookingClick(b)} className="group w-full bg-white/80 hover:bg-white rounded-[24px] border border-gray-100 p-5 flex items-center gap-6 shadow-sm hover:translate-y-0.5 transition-all text-left">
                <div className="relative shrink-0">
                  <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.customer_name)}&background=random&color=fff`} size="lg" className="border-2 border-white shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-[#213138] truncate">{b.customer_name}</p>
                    <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-lg border-none font-bold text-[10px] uppercase tracking-wider", b.status === 'confirmed' ? 'bg-teal-50 text-[#3A9B9F]' : 'bg-coral-50 text-[#FF8B66]')}>{b.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 font-medium mt-0.5">{b.service?.name} · {b.number_of_people} Guests</p>
                </div>
                <div className="text-right shrink-0 pr-2">
                  <p className="text-lg font-black text-[#213138]">{formatBookingTime(b.booking_time)}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#3A9B9F] transition-colors" />
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Main Page ---

export default function BookingsPage() {
  const router = useRouter()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [view, setView] = useState<'month' | 'list'>('month')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<BookingService[]>([])
  const [loading, setLoading] = useState(true)
  const [filterService, setFilterService] = useState<string>('all')

  // Pagination & Responsive
  const [isMobile, setIsMobile] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [pageIndex, setPageIndex] = useState(0)

  // Modals
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const [{ data: b }, { data: s }] = await Promise.all([
      getBookings({ month: monthStr }),
      getServices(false),
    ])
    setBookings(b || [])
    setServices(s || [])
    setLoading(false)
  }, [monthStr])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  useEffect(() => {
    const client = getSupabase()
    const channel = client.channel('bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => { fetchBookings() })
      .subscribe()
    return () => { client.removeChannel(channel) }
  }, [fetchBookings])

  const filtered = bookings.filter(b => filterService === 'all' || b.service_id === filterService)

  const analytics = useMemo(() => {
    return {
      confirmed: filtered.filter(b => b.status === 'confirmed').length,
      pending: filtered.filter(b => b.status === 'pending').length,
      totalGuests: filtered.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.number_of_people, 0)
    }
  }, [filtered])

  const carouselDays = useMemo(() => {
    const baseDate = new Date(viewYear, viewMonth, 1)
    const days = []
    const startOffset = pageIndex * 12
    for (let i = 0; i < 12; i++) {
        const d = new Date(baseDate)
        d.setDate(baseDate.getDate() + startOffset + i)
        days.push(d)
    }
    return days
  }, [viewYear, viewMonth, pageIndex])

  const bookingsForDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filtered.filter(b => b.booking_date === dateStr)
  }

  const isToday = (day: number) => day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  const handleBookingClick = (b: Booking) => { setSelectedBooking(b); setDetailsOpen(true) }
  const handleBookingUpdated = (updated: Booking) => { setBookings(prev => prev.map(b => b.id === updated.id ? updated : b)) }

  const headerMonth = carouselDays[0].toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const times = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"]
  const [selectedTime, setSelectedTime] = useState("10:00 AM")

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB] relative overflow-hidden">
      {isMobile ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#F5F7FA] font-[family-name:var(--font-plus-jakarta)] overflow-hidden">
          {/* Mobile Back & Title */}
          <div className="flex items-center justify-between px-6 pt-8 pb-2">
            <button onClick={() => router.back()} className="h-12 w-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-500 active:scale-90 transition-transform"><ArrowLeft className="h-6 w-6" /></button>
          </div>
          <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-2xl font-extrabold text-[#213138] tracking-tight">{headerMonth}</h1>
            <div className="flex gap-2">
              <button onClick={() => setPageIndex(p => p - 1)} className="p-1 px-2 border border-gray-100 bg-white rounded-lg text-gray-400 hover:text-navy-900 shadow-sm"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPageIndex(p => p + 1)} className="p-1 px-2 border border-gray-100 bg-white rounded-lg text-gray-400 hover:text-navy-900 shadow-sm"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          {/* Mobile Grid */}
          <div className="px-6 flex-1 overflow-y-auto no-scrollbar pb-32">
            <div className="grid grid-cols-3 gap-3 mb-8">
              {carouselDays.map((date, idx) => {
                const dayNum = date.getDate()
                const dayName = DAY_NAMES[date.getDay()]
                const isSelected = selectedDate.toDateString() === date.toDateString()
                return (
                  <motion.button key={idx} onClick={() => setSelectedDate(date)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }} className={cn("flex flex-col items-start justify-between p-5 rounded-[32px] border transition-all h-36 relative", isSelected ? "bg-[#3A9B9F] border-[#3A9B9F] text-white shadow-xl shadow-teal-500/20 z-10" : "bg-white border-transparent text-[#213138] shadow-sm")}>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest leading-none", isSelected ? "text-white/60" : "text-gray-400")}>{dayName}</span>
                    <span className={cn("text-4xl font-extrabold mt-1", isSelected ? "text-white" : "text-[#213138]")}>{dayNum}</span>
                  </motion.button>
                )
              })}
            </div>
            {/* Time Slots */}
            <div className="mb-4">
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
                {times.map((t) => (
                  <button key={t} onClick={() => setSelectedTime(t)} className={cn("px-6 py-3.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all", selectedTime === t ? "bg-[#3A9B9F] text-white border-[#3A9B9F] shadow-lg shadow-teal-500/10" : "bg-white text-gray-400 border-gray-100")}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Mobile Footer CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#F5F7FA] via-[#F5F7FA] to-transparent z-[110]">
            <Button onClick={() => setCreateOpen(true)} className="w-full h-16 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-[28px] font-bold text-lg shadow-2xl shadow-teal-500/20 border-none transition-all active:scale-95">Book Appointment</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Background Decorations */}
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white to-transparent opacity-60 z-0 pointer-events-none" />
          <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full z-0 pointer-events-none" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] bg-coral-500/5 blur-[120px] rounded-full z-0 pointer-events-none" />

          {/* Desktop Top Bar */}
          <div className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/40 px-8 py-6 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-extrabold text-[#213138] tracking-tight font-[family-name:var(--font-poppins)]">Bookings</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">Manage and track your tour reservations globally</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 px-3 py-1.5 shadow-sm">
                <Filter className="h-4 w-4 text-[#3A9B9F]" />
                <select value={filterService} onChange={e => setFilterService(e.target.value)} className="text-xs font-bold text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none pr-6">
                  <option value="all">All Services</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex p-1 bg-gray-100/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <button onClick={() => setView('month')} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", view === 'month' ? "bg-white text-[#3A9B9F] shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700")}>Month</button>
                <button onClick={() => setView('list')} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", view === 'list' ? "bg-white text-[#3A9B9F] shadow-sm ring-1 ring-black/5" : "text-gray-500 hover:text-gray-700")}>List</button>
              </div>
              <Button onClick={() => setCreateOpen(true)} className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl px-5 h-11 font-bold shadow-lg shadow-teal-500/20 border-none transition-all">New Booking</Button>
              <Link href="/book-preview" target="_blank"><Button variant="outline" className="bg-white hover:bg-gray-50 text-[#3A9B9F] border-gray-100 rounded-xl px-4 h-11 font-bold shadow-sm transition-all"><ExternalLink className="h-4 w-4 mr-2" /> Share Link</Button></Link>
            </div>
          </div>

          {/* Desktop Stats */}
          <div className="relative z-10 px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard title="Confirmed" val={analytics.confirmed} color="#3A9B9F" icon={CheckCircle} />
            <StatCard title="Pending" val={analytics.pending} color="#FF8B66" icon={Clock} />
            <StatCard title="Total Guests" val={analytics.totalGuests} color="#213138" icon={Users} />
          </div>

          {/* Desktop Content */}
          <div className="relative z-10 flex-1 flex flex-col px-8 pb-8 overflow-hidden">
            <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/60 shadow-inner flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-8 py-5 border-b border-white/40">
                <h2 className="text-xl font-extrabold text-[#213138] font-[family-name:var(--font-poppins)]">{MONTH_NAMES[viewMonth]} <span className="text-gray-300 font-medium ml-1">{viewYear}</span></h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { if(viewMonth === 0){ setViewYear(y=>y-1); setViewMonth(11) } else setViewMonth(m=>m-1) }} className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 border border-gray-100 shadow-sm"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-[#3A9B9F] transition-colors">Today</button>
                  <button onClick={() => { if(viewMonth === 11){ setViewYear(y=>y+1); setViewMonth(0) } else setViewMonth(m=>m+1) }} className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 border border-gray-100 shadow-sm"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto relative custom-scrollbar">
                {loading ? <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-[#3A9B9F]" /></div> : (
                  <AnimatePresence mode="wait">
                    <motion.div key={view + monthStr} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }} className="h-full">
                      {view === 'month' ? <MonthView calendarDays={useMemo(() => {
                        const daysInMonth = getDaysInMonth(viewYear, viewMonth)
                        const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth)
                        const days: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
                        while (days.length % 7 !== 0) days.push(null)
                        return days
                      }, [viewYear, viewMonth])} dayNames={DAY_NAMES} bookingsForDay={bookingsForDay} isToday={isToday} onBookingClick={handleBookingClick} /> : <ListView bookings={filtered} onBookingClick={handleBookingClick} />}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Shared Modals */}
      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { fetchBookings(); setCreateOpen(false) }} />
      <BookingDetailsModal open={detailsOpen} booking={selectedBooking} onClose={() => { setDetailsOpen(false); setSelectedBooking(null) }} onUpdated={handleBookingUpdated} />
    </div>
  )
}
