"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  List,
  Users,
  Check,
  Loader2,
  ExternalLink,
  ArrowLeft,
  Filter,
  CheckCircle,
  Clock
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getBookings, getServices, formatBookingTime } from "@/lib/bookings"
import { CreateBookingModal } from "@/components/bookings/create-booking-modal"
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal"
import type { Booking, BookingService } from "@/types/bookings"
import { getSupabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
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

  const [isMobile, setIsMobile] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate())

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

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth)
  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (calendarDays.length % 7 !== 0) calendarDays.push(null)

  const bookingsForDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return filtered.filter(b => b.booking_date === dateStr)
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

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

  // --- Mobile Dashboard (New Design) ---
  const MobileDashboardView = () => {
    const dayBookings = bookingsForDay(selectedDay)
    
    return (
      <div className="flex flex-col h-full bg-[#F5F7FA] font-[family-name:var(--font-plus-jakarta)]">
        <div className="flex items-center justify-between px-6 pt-8 pb-4">
          <h1 className="text-2xl font-extrabold text-[#213138]">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h1>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-1 px-2 border border-gray-100 bg-white rounded-lg text-gray-400 hover:text-navy-900 shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={nextMonth} className="p-1 px-2 border border-gray-100 bg-white rounded-lg text-gray-400 hover:text-navy-900 shadow-sm">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 flex-1 overflow-y-auto no-scrollbar pb-32">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const date = new Date(viewYear, viewMonth, day)
              const dayName = DAY_NAMES[date.getDay()]
              const isActive = selectedDay === day
              const count = bookingsForDay(day).length

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-[28px] border transition-all h-28 relative transform active:scale-95",
                    isActive 
                      ? "bg-[#3A9B9F] border-[#3A9B9F] text-white shadow-lg shadow-teal-500/20 z-10" 
                      : "bg-white border-transparent text-[#213138] hover:bg-white shadow-sm"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mb-1 shadow-none",
                    isActive ? "text-white/70" : "text-gray-400"
                  )}>
                    {dayName}
                  </span>
                  <span className={cn(
                    "text-2xl font-extrabold leading-none",
                    isActive ? "text-white" : "text-[#213138]"
                  )}>
                    {day}
                  </span>
                  {count > 0 && !isActive && (
                    <div className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-[#3A9B9F]" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between mb-2">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                 {dayBookings.length > 0 ? `Bookings for the ${selectedDay}th` : 'No bookings today'}
               </h3>
               {dayBookings.length > 0 && (
                 <span className="text-[10px] font-bold text-[#3A9B9F] bg-teal-50 px-2 py-0.5 rounded-full">
                   {dayBookings.length} total
                 </span>
               )}
             </div>

             {dayBookings.length > 0 ? (
               <div className="space-y-3">
                 {dayBookings.map(b => (
                   <button
                    key={b.id}
                    onClick={() => handleBookingClick(b)}
                    className="w-full bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-sm border border-transparent active:border-[#3A9B9F]/20 active:bg-gray-50 transition-all text-left group"
                   >
                     <Avatar 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.customer_name)}&background=random&color=fff`}
                        fallback={b.customer_name.charAt(0)}
                        className="h-10 w-10 border-2 border-white shadow-sm shrink-0"
                     />
                     <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#213138] truncate">{b.customer_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{b.service?.name}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-[#213138]">{formatBookingTime(b.booking_time)}</p>
                        <span className={cn(
                          "inline-block w-2 h-2 rounded-full mt-1",
                          STATUS_DOT[b.status]
                        )} />
                     </div>
                   </button>
                 ))}
               </div>
             ) : (
               <div className="py-12 flex flex-col items-center justify-center opacity-40">
                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected date is free</p>
               </div>
             )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F5F7FA] via-[#F5F7FA] to-transparent z-40">
          <Button 
            onClick={() => setCreateOpen(true)}
            className="w-full h-16 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-[28px] font-black text-lg shadow-xl shadow-teal-500/20 transition-all border-none"
          >
            New Booking
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#F8FAFB] relative overflow-hidden">
      {isMobile ? (
        <MobileDashboardView />
      ) : (
        <>
          <div className="relative z-10 bg-white/70 backdrop-blur-xl border-b border-white/40 px-8 py-6 flex items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#213138] tracking-tight font-[family-name:var(--font-poppins)]">
                Bookings
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Manage your service reservations
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 px-3 py-1.5 shadow-sm">
                <Filter className="h-4 w-4 text-[#3A9B9F]" />
                <select
                  value={filterService}
                  onChange={e => setFilterService(e.target.value)}
                  className="text-xs font-bold text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none pr-6"
                >
                  <option value="all">All Services</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex p-1 bg-gray-100/50 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <button onClick={() => setView('month')} className={cn("px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2", view === 'month' ? "bg-white text-[#3A9B9F] shadow-sm" : "text-gray-500")}>
                  <Calendar className="h-3.5 w-3.5" /> Month
                </button>
                <button onClick={() => setView('list')} className={cn("px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2", view === 'list' ? "bg-white text-[#3A9B9F] shadow-sm" : "text-gray-500")}>
                  <List className="h-3.5 w-3.5" /> List
                </button>
              </div>

              <Button onClick={() => setCreateOpen(true)} className="bg-[#3A9B9F] text-white rounded-xl px-5 h-11 font-bold shadow-lg shadow-teal-500/10">
                <Plus className="h-4 w-4 mr-2" /> New Booking
              </Button>

              <Link href="/book-preview" target="_blank">
                <Button variant="outline" className="text-[#3A9B9F] border-gray-100 rounded-xl px-4 h-11 font-bold">
                  <ExternalLink className="h-4 w-4 mr-2" /> Share Link
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative z-10 px-8 py-6 grid grid-cols-3 gap-6">
            <StatCard title="Confirmed" val={confirmedThisMonth} color="#3A9B9F" icon={CheckCircle} />
            <StatCard title="Pending" val={pendingThisMonth} color="#FF8B66" icon={Clock} />
            <StatCard title="Total Guests" val={totalPeople} color="#213138" icon={Users} />
          </div>

          <div className="relative z-10 flex-1 px-8 pb-8 overflow-hidden">
            <div className="h-full bg-white rounded-[32px] border border-gray-100 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-8 py-5 border-b border-gray-50">
                <h2 className="text-xl font-extrabold text-[#213138]">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={nextMonth} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-8">
                {loading ? <Loader2 className="animate-spin m-auto" /> : (
                  view === 'month' ? (
                    <MonthView calendarDays={calendarDays} dayNames={DAY_NAMES} bookingsForDay={bookingsForDay} isToday={isToday} onBookingClick={handleBookingClick} />
                  ) : (
                    <ListView bookings={filtered} onBookingClick={handleBookingClick} />
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <CreateBookingModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { fetchBookings(); setCreateOpen(false) }} />
      <BookingDetailsModal open={selectedBooking !== null} booking={selectedBooking} onClose={() => setSelectedBooking(null)} onUpdated={handleBookingUpdated} />
    </div>
  )
}

function StatCard({ title, val, icon: Icon, color }: { title: string, val: number, icon: any, color: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-2xl bg-gray-50" style={{ color }}><Icon className="h-5 w-5" /></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-3xl font-extrabold text-[#213138]">{val}</p>
    </div>
  )
}

function MonthView({ calendarDays, dayNames, bookingsForDay, isToday, onBookingClick }: any) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {dayNames.map((d: any) => <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d}</div>)}
      {calendarDays.map((day: any, idx: number) => {
        if (!day) return <div key={idx} className="h-32 bg-gray-50/50 rounded-2xl" />
        const dayBookings = bookingsForDay(day)
        return (
          <div key={idx} className={cn("h-32 p-3 rounded-2xl border bg-white flex flex-col gap-2", isToday(day) ? "border-[#3A9B9F] bg-teal-50/10" : "border-gray-50")}>
            <span className={cn("inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold", isToday(day) ? "bg-[#3A9B9F] text-white" : "text-gray-400")}>{day}</span>
            <div className="flex-1 overflow-hidden space-y-1">
              {dayBookings.slice(0, 2).map((b: any) => (
                <button key={b.id} onClick={() => onBookingClick(b)} className={cn("w-full text-[10px] font-bold py-1 px-2 rounded-lg text-white truncate", STATUS_BG[b.status])}>
                  {b.customer_name.split(' ')[0]}
                </button>
              ))}
              {dayBookings.length > 2 && <span className="text-[10px] font-bold text-[#3A9B9F]">+{dayBookings.length - 2} more</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ bookings, onBookingClick }: any) {
  if (bookings.length === 0) return <div className="text-center py-20 text-gray-400">No bookings found for this period</div>
  return (
    <div className="space-y-3">
      {bookings.map((b: any) => (
        <button key={b.id} onClick={() => onBookingClick(b)} className="w-full bg-white p-4 rounded-2xl border border-gray-50 flex items-center justify-between hover:shadow-sm transition-all text-left">
          <div className="flex items-center gap-4">
            <Avatar src={`https://ui-avatars.com/api/?name=${b.customer_name}&background=random&color=fff`} />
            <div>
              <p className="font-bold text-[#213138]">{b.customer_name}</p>
              <p className="text-xs text-gray-400 font-medium">{b.service?.name} · {b.number_of_people} guests</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#213138]">{formatBookingTime(b.booking_time)}</p>
            <Badge className={STATUS_BG[b.status]}>{b.status}</Badge>
          </div>
        </button>
      ))}
    </div>
  )
}
