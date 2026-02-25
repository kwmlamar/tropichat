"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Plus, Calendar, List, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getBookings, getServices } from "@/lib/bookings"
import { CreateBookingModal } from "@/components/bookings/create-booking-modal"
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal"
import type { Booking, BookingService } from "@/types/bookings"
import { getSupabase } from "@/lib/supabase"

const STATUS_BG: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending:   'bg-yellow-400',
  cancelled: 'bg-gray-300',
}
const STATUS_DOT: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending:   'bg-yellow-400',
  cancelled: 'bg-gray-300',
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function BookingsPage() {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [view, setView] = useState<'month' | 'list'>('month')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<BookingService[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filterService, setFilterService] = useState<string>('all')

  // Modals
  const [createOpen,   setCreateOpen]   = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen]   = useState(false)

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
  const daysInMonth  = getDaysInMonth(viewYear, viewMonth)
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
  const pendingThisMonth   = filtered.filter(b => b.status === 'pending').length
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500">Manage your tour reservations</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Service filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40"
            >
              <option value="all">All services</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('month')}
              className={cn(
                "px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors",
                view === 'month' ? "bg-[#3A9B9F] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              <Calendar className="h-4 w-4" />
              Month
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                "px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors",
                view === 'list' ? "bg-[#3A9B9F] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-gray-600">{confirmedThisMonth} confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-gray-600">{pendingThisMonth} pending</span>
        </div>
        <div className="text-gray-400">·</div>
        <span className="text-gray-600">{totalPeople} total guests</span>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h2>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3A9B9F] border-t-transparent" />
          </div>
        ) : view === 'month' ? (
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
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-100 px-6 py-2 flex items-center gap-4 text-xs text-gray-500">
        {(['confirmed', 'pending', 'cancelled'] as const).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
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
    <div className="p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[90px]" />
          }
          const dayBookings = bookingsForDay(day)
          const today = isToday(day)
          return (
            <div
              key={day}
              className={cn(
                "min-h-[90px] rounded-xl border p-1.5 text-xs transition-colors",
                today
                  ? "border-[#3A9B9F] bg-[#3A9B9F]/5"
                  : "border-gray-100 bg-white hover:border-gray-200"
              )}
            >
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium mb-1",
                today ? "bg-[#3A9B9F] text-white" : "text-gray-700"
              )}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(b => (
                  <button
                    key={b.id}
                    onClick={() => onBookingClick(b)}
                    className={cn(
                      "w-full text-left px-1.5 py-1 rounded text-white text-[10px] leading-tight truncate font-medium transition-opacity hover:opacity-80",
                      STATUS_BG[b.status]
                    )}
                    title={`${b.customer_name} · ${b.service?.name ?? ''}`}
                  >
                    {b.service?.name?.split(' ')[0] ?? '?'} · {b.number_of_people}p
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-gray-400 text-[10px] pl-1">+{dayBookings.length - 3} more</p>
                )}
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
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="rounded-full bg-gray-100 p-6 mb-4">
          <Calendar className="h-10 w-10 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">No bookings this month</p>
        <p className="text-gray-400 text-sm mt-1">Create your first booking to get started</p>
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
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayBookings]) => (
        <div key={date}>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </div>
          <div className="space-y-2">
            {dayBookings.map(b => (
              <button
                key={b.id}
                onClick={() => onBookingClick(b)}
                className="w-full bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all text-left"
              >
                <div
                  className="h-10 w-1 rounded-full shrink-0"
                  style={{ backgroundColor: b.service?.color ?? '#3A9B9F' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.customer_name}</p>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                                                  'bg-gray-100 text-gray-500'
                    )}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.service?.name} · {b.number_of_people} {b.number_of_people === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900">
                    {(() => {
                      const [h, m] = b.booking_time.split(':').map(Number)
                      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
                    })()}
                  </p>
                  {b.service?.price && (
                    <p className="text-xs text-gray-400">${(b.service.price * b.number_of_people).toFixed(2)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
