"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  List,
  Loader2,
  Plus,
  Users,
  Zap,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getBookings, getServices, formatBookingTime } from "@/lib/bookings"
import { CreateBookingModal } from "@/components/bookings/create-booking-modal"
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal"
import type { Booking, BookingService } from "@/types/bookings"
import { getSupabase, getCurrentCustomer } from "@/lib/supabase"
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 dark:bg-[#1E1E1E]/70 backdrop-blur-xl p-5 rounded-3xl border border-gray-200 dark:border-[#2A2A2A] shadow-sm ring-1 ring-gray-100/50 dark:ring-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-[#262626]" style={{ color }}><Icon className="h-5 w-5" /></div>
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-3xl font-extrabold text-[#213138] dark:text-gray-100">{val}</p>
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
            <div key={idx} className={cn("min-h-[110px] rounded-2xl border transition-all duration-300 group overflow-hidden relative", today ? "border-[#3A9B9F] bg-[#3A9B9F]/5 dark:bg-[#3A9B9F]/10 ring-1 ring-[#3A9B9F]/20 shadow-md shadow-teal-500/5" : "border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E]")}>
              <div className="p-3">
                <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold mb-2 transition-all", today ? "bg-[#3A9B9F] text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300")}>{day}</div>
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
          <div className="sticky top-0 z-10 bg-white/40 dark:bg-[#121212]/40 backdrop-blur-md py-4 mb-4 border-b border-gray-100/50 dark:border-[#2A2A2A]/50">
            <h3 className="text-xs font-black text-[#3A9B9F] uppercase tracking-[0.2em]">{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          </div>
          <div className="grid gap-3">
            {dayBookings.map((b) => (
              <motion.button key={b.id} onClick={() => onBookingClick(b)} className="group w-full bg-white/80 dark:bg-[#1E1E1E]/80 hover:bg-white dark:hover:bg-[#262626] rounded-[24px] border border-gray-100 dark:border-[#2A2A2A] p-5 flex items-center gap-6 shadow-sm hover:translate-y-0.5 transition-all text-left">
                <div className="relative shrink-0">
                  <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.customer_name)}&background=random&color=fff`} size="lg" className="border-2 border-white shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-[#213138] dark:text-white truncate">{b.customer_name}</p>
                    <Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-lg border-none font-bold text-[10px] uppercase tracking-wider", b.status === 'confirmed' ? 'bg-teal-50 dark:bg-teal-900/20 text-[#3A9B9F]' : 'bg-coral-50 dark:bg-coral-900/20 text-[#FF8B66]')}>{b.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">{b.service?.name} · {b.number_of_people} Guests</p>
                </div>
                <div className="text-right shrink-0 pr-2">
                  <p className="text-lg font-black text-[#213138] dark:text-white">{formatBookingTime(b.booking_time)}</p>
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
  
  // Base State
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [view, setView] = useState<'month' | 'list'>('month')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<BookingService[]>([])
  const [loading, setLoading] = useState(true)
  const [filterService, setFilterService] = useState<string>('all')
  const [customerPlan, setCustomerPlan] = useState<string>("free")

  // UI State
  const [isMobile, setIsMobile] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedTime, setSelectedTime] = useState("10:00 AM")

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
    
    const { data: customer } = await getCurrentCustomer()
    if (customer) {
      setCustomerPlan(customer.plan)
    }

    if (customer?.plan === "free") {
      setLoading(false)
      return
    }

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

  const analytics = useMemo(() => ({
    confirmed: filtered.filter(b => b.status === 'confirmed').length,
    pending: filtered.filter(b => b.status === 'pending').length,
    totalGuests: filtered.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.number_of_people, 0)
  }), [filtered])

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

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth)
    const days: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [viewYear, viewMonth])

  const bookingsForDay = useCallback((day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filtered.filter(b => b.booking_date === dateStr)
  }, [viewYear, viewMonth, filtered])

  const isToday = useCallback((day: number) => 
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
  , [viewMonth, viewYear, today])

  const handleBookingClick = (b: Booking) => { setSelectedBooking(b); setDetailsOpen(true) }
  const handleBookingUpdated = (updated: Booking) => { setBookings(prev => prev.map(b => b.id === updated.id ? updated : b)) }

  const headerMonth = carouselDays[0].toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const timesList = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"]

  const handleMobileBack = () => {
    if (window.history.length > 2) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB] dark:bg-[#121212] relative overflow-hidden">
      {loading ? (
        <div className="flex flex-1 items-center justify-center h-full z-10 relative">
          <Loader2 className="h-8 w-8 animate-spin text-[#3A9B9F]" />
        </div>
      ) : customerPlan === "free" ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12 relative z-10 pt-20">
          <div className="bg-white dark:bg-[#1E1E1E]/90 backdrop-blur-xl rounded-[2.5rem] border border-gray-100 dark:border-[#2A2A2A] p-8 md:p-14 text-center shadow-2xl max-w-lg w-full">
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#3A9B9F]/30 blur-3xl rounded-full scale-150" />
                <div className="relative bg-gradient-to-br from-[#3A9B9F] to-[#2F8488] w-24 h-24 rounded-[1.5rem] flex items-center justify-center shadow-lg transform -rotate-6">
                  <Calendar className="h-10 w-10 text-white transform rotate-6" />
                </div>
              </div>
              
              <h3 className="text-3xl font-extrabold text-[#213138] dark:text-gray-100 font-[family-name:var(--font-poppins)] tracking-tight mb-4">Bookings are a Professional Feature</h3>
              <p className="text-[#475569] dark:text-gray-400 mb-10 text-[15px] leading-relaxed">
                Unlock the integrated calendar to schedule appointments, manage services, and view your agenda seamlessly.
              </p>
              
              <Button 
                onClick={() => router.push('/dashboard/settings?tab=billing')}
                className="w-full h-14 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-2xl shadow-xl shadow-[#3A9B9F]/20 font-bold active:scale-[0.98] transition-all text-[15px]"
              >
                Upgrade to Professional
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : isMobile ? (
        /* Mobile Dashboard Layout */
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#F5F7FA] dark:bg-[#121212] font-[family-name:var(--font-plus-jakarta)] overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-0">
            <button onClick={handleMobileBack} className="h-10 w-10 flex items-center justify-center bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2A2A2A] text-gray-500 dark:text-gray-400 active:scale-90 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-between px-8 py-3">
            <h1 className="text-xl font-extrabold text-[#213138] dark:text-gray-100 tracking-tight">{headerMonth}</h1>
            <div className="flex gap-2">
              <button onClick={() => setPageIndex(p => p - 1)} className="p-1 px-2 border border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] rounded-lg text-gray-400 dark:text-gray-500 hover:text-navy-900 shadow-sm transition-all active:scale-95"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPageIndex(p => p + 1)} className="p-1 px-2 border border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] rounded-lg text-gray-400 dark:text-gray-500 hover:text-navy-900 shadow-sm transition-all active:scale-95"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="px-6 flex-1 flex flex-col justify-start overflow-y-auto pb-6 custom-scrollbar">
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {carouselDays.map((date, idx) => {
                const dayNum = date.getDate()
                const dayName = DAY_NAMES[date.getDay()]
                const isSelected = selectedDate.toDateString() === date.toDateString()
                return (
                  <motion.button key={idx} onClick={() => setSelectedDate(date)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.02 }} className={cn("flex flex-col items-start justify-center p-4 rounded-[28px] border transition-all h-28 relative flex-shrink-0", isSelected ? "bg-[#3A9B9F] border-[#3A9B9F] text-white shadow-xl shadow-teal-500/10 z-10" : "bg-white dark:bg-[#1E1E1E] border-transparent dark:border-[#2A2A2A] text-[#213138] dark:text-gray-100 shadow-sm")}>
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5", isSelected ? "text-white/60" : "text-gray-400 dark:text-gray-500")}>{dayName}</span>
                    <span className={cn("text-3xl font-extrabold leading-tight", isSelected ? "text-white" : "text-[#213138] dark:text-white")}>{dayNum}</span>
                  </motion.button>
                )
              })}
            </div>
            <div className="mb-2">
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                {timesList.map((t) => (
                  <button key={t} onClick={() => setSelectedTime(t)} className={cn("px-5 py-3 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border shrink-0", selectedTime === t ? "bg-[#3A9B9F] text-white border-[#3A9B9F] shadow-lg shadow-teal-500/10" : "bg-white dark:bg-[#1E1E1E] text-gray-400 dark:text-gray-500 border-gray-100 dark:border-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#262626]")}>{t}</button>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                Bookings for {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
              <div className="grid gap-3">
                {(() => {
                  const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
                  const dayBookings = filtered.filter(b => b.booking_date === selectedStr)
                  if (dayBookings.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500 font-bold italic">No bookings on this day.</p>
                  return dayBookings.map(b => (
                    <motion.button key={b.id} onClick={() => handleBookingClick(b)} className="group w-full bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-[#2A2A2A] p-4 flex items-center gap-4 shadow-sm text-left active:scale-95 transition-transform">
                      <div className="relative shrink-0">
                        <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.customer_name)}&background=random&color=fff`} className="border border-gray-100 dark:border-[#2A2A2A] h-10 w-10 shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[#213138] dark:text-white truncate">{b.customer_name}</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">{b.service?.name} · {b.number_of_people} Guests</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-[#213138] dark:text-white">{formatBookingTime(b.booking_time)}</p>
                        <Badge variant="outline" className={cn("mt-1 px-1.5 py-0 rounded-md border-none font-bold text-[8px] uppercase tracking-wider", b.status === 'confirmed' ? 'bg-teal-50 dark:bg-teal-900/20 text-[#3A9B9F]' : 'bg-coral-50 dark:bg-coral-900/20 text-[#FF8B66]')}>{b.status}</Badge>
                      </div>
                    </motion.button>
                  ))
                })()}
              </div>
            </div>
          </div>
          <div className="p-8 pb-10 bg-white/50 dark:bg-[#1E1E1E]/50 backdrop-blur-sm border-t border-gray-100/30 dark:border-[#2A2A2A]/30">
            <Button onClick={() => setCreateOpen(true)} className="w-full h-14 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-[24px] font-bold text-base shadow-xl shadow-teal-500/20 border-none transform active:scale-95 transition-all">Book Appointment</Button>
          </div>
        </div>
      ) : (
        /* Desktop Dashboard Layout */
        <div className="flex-1 flex flex-col min-w-0">
          <div className="relative z-10 bg-white dark:bg-[#1E1E1E]/70 backdrop-blur-xl border-b border-gray-100 dark:border-[#2A2A2A] px-8 py-6 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-[#213138] dark:text-gray-100 tracking-tight font-[family-name:var(--font-poppins)] mb-1">Bookings</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Manage and track your tour reservations globally</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Filter className="h-3.5 w-3.5 text-[#3A9B9F] opacity-50 transition-opacity group-hover:opacity-100" />
                </div>
                <select 
                  value={filterService}
                  onChange={e => setFilterService(e.target.value)}
                  className="pl-9 pr-10 py-2.5 bg-gray-50/50 dark:bg-[#262626] border border-gray-100 dark:border-[#2A2A2A] rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-4 focus:ring-[#3A9B9F]/10 focus:border-[#3A9B9F] transition-all cursor-pointer appearance-none shadow-sm hover:bg-white dark:hover:bg-[#2A2A2A]"
                >
                  <option value="all">All Services</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="h-10 w-[1px] bg-gray-100 dark:bg-[#2A2A2A] mx-1" />

              <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-xl shadow-inner border border-gray-100 dark:border-[#2A2A2A]">
                <button
                  onClick={() => setView('month')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    view === 'month' 
                      ? "bg-[#3A9B9F] text-white shadow-lg shadow-[#3A9B9F]/20" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  Month
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    view === 'list' 
                      ? "bg-[#3A9B9F] text-white shadow-lg shadow-[#3A9B9F]/20" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  List
                </button>
              </div>

              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl px-6 h-11 font-bold shadow-lg shadow-[#3A9B9F]/20 active:scale-95 transition-all"
              >
                New Booking
              </Button>
              <Link href="/book-preview" target="_blank">
                <Button variant="outline" className="bg-white dark:bg-[#1E1E1E] hover:bg-gray-50 dark:hover:bg-[#262626] text-[#3A9B9F] border-gray-100 dark:border-[#2A2A2A] rounded-xl px-4 h-11 font-bold shadow-sm transition-all">
                  <ExternalLink className="h-4 w-4 mr-2" /> Share Link
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto custom-scrollbar">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="CONFIRMED" 
                val={bookings.filter(b => b.status === 'confirmed').length} 
                icon={CheckCircle2} 
                color="#3A9B9F" 
              />
              <StatCard 
                title="PENDING" 
                val={bookings.filter(b => b.status === 'pending').length} 
                icon={Clock} 
                color="#FF8B66" 
              />
              <StatCard 
                title="TOTAL GUESTS" 
                val={bookings.reduce((sum, b) => sum + (b.number_of_people || 0), 0)} 
                icon={Users} 
                color="#213138" 
              />
            </div>

            {/* View Area */}
            <div className="bg-white dark:bg-[#1E1E1E]/40 backdrop-blur-xl rounded-[32px] border border-gray-100 dark:border-[#2A2A2A] shadow-xl shadow-navy-900/5 overflow-hidden">
              <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-[#2A2A2A]">
                <h2 className="text-xl font-extrabold text-[#213138] dark:text-gray-100 font-[family-name:var(--font-poppins)]">{MONTH_NAMES[viewMonth]} <span className="text-gray-300 dark:text-gray-600 font-medium ml-1">{viewYear}</span></h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { if(viewMonth === 0){ setViewYear(y=>y-1); setViewMonth(11) } else setViewMonth(m=>m-1) }} className="p-2 rounded-xl bg-white/80 dark:bg-[#262626] hover:bg-white dark:hover:bg-[#2A2A2A] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-[#2A2A2A] shadow-sm transition-colors"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }} className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-500 hover:text-[#3A9B9F] dark:hover:text-[#3A9B9F] transition-colors">Today</button>
                  <button onClick={() => { if(viewMonth === 11){ setViewYear(y=>y+1); setViewMonth(0) } else setViewMonth(m=>m+1) }} className="p-2 rounded-xl bg-white/80 dark:bg-[#262626] hover:bg-white dark:hover:bg-[#2A2A2A] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-[#2A2A2A] shadow-sm transition-colors"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto relative custom-scrollbar min-h-[500px]">
                {loading ? <div className="flex items-center justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#3A9B9F]" /></div> : (
                  <AnimatePresence mode="wait">
                    <motion.div key={view + viewMonth + viewYear} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }} className="h-full">
                      {view === 'month' ? (
                        <MonthView 
                          calendarDays={calendarDays} 
                          dayNames={DAY_NAMES} 
                          bookingsForDay={bookingsForDay} 
                          isToday={isToday} 
                          onBookingClick={handleBookingClick} 
                        />
                      ) : (
                        <ListView bookings={filtered} onBookingClick={handleBookingClick} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { fetchBookings(); setCreateOpen(false) }} />
      <BookingDetailsModal open={detailsOpen} booking={selectedBooking} onClose={() => { setDetailsOpen(false); setSelectedBooking(null) }} onUpdated={handleBookingUpdated} />
    </div>
  )
}
