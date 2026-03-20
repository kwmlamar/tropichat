"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  CalendarDays,
  Clock,
  Users,
  User,
  Phone,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Check,
  Loader2,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getServices, createBooking, checkAvailability, generateConfirmationMessage } from "@/lib/bookings"
import type { BookingService, AvailabilityCheckResult, CreateBookingInput } from "@/types/bookings"
import { toast } from "sonner"

interface CreateBookingModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (booking: any) => void
  // Pre-fill from conversation
  prefill?: {
    customerName?: string
    customerPhone?: string
    customerEmail?: string
    conversationId?: string
  }
  // Confirmation message send handler
  onSendConfirmation?: (message: string, conversationId: string) => void
  initialDate?: string
  initialTime?: string
}

const SERVICE_COLORS = [
  '#3A9B9F', '#FF8B66', '#7C3AED', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6',
]

export function CreateBookingModal({
  open,
  onClose,
  onCreated,
  prefill,
  onSendConfirmation,
  initialDate,
  initialTime,
}: CreateBookingModalProps) {
  const parseTimeStr = (t: string) => {
    if (!t) return ''
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return t
    let h = parseInt(match[1])
    const m = match[2]
    const ampm = match[3].toUpperCase()
    if (ampm === 'PM' && h < 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m}`
  }

  const [services, setServices] = useState<BookingService[]>([])
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')

  // Form state
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(initialDate ?? '')
  const [time, setTime] = useState(initialTime ? parseTimeStr(initialTime) : '')
  const [people, setPeople] = useState(1)
  const [customerName, setCustomerName] = useState(prefill?.customerName ?? '')
  const [customerPhone, setCustomerPhone] = useState(prefill?.customerPhone ?? '')
  const [customerEmail, setCustomerEmail] = useState(prefill?.customerEmail ?? '')
  const [notes, setNotes] = useState('')
  const [confirmationMsg, setConfirmationMsg] = useState('')

  // Availability check state
  const [availability, setAvailability] = useState<AvailabilityCheckResult | null>(null)
  const [checkingAvail, setCheckingAvail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<any>(null)

  // Load services on open
  useEffect(() => {
    if (!open) return
    getServices(true).then(({ data }) => {
      setServices(data)
      if (data.length === 1) setServiceId(data[0].id)
    })
  }, [open])

  // Pre-fill when prefill prop changes
  useEffect(() => {
    if (prefill?.customerEmail) setCustomerEmail(prefill.customerEmail)
  }, [prefill])

  useEffect(() => {
    if (initialDate) setDate(initialDate)
    if (initialTime) setTime(parseTimeStr(initialTime))
  }, [initialDate, initialTime])

  // Check availability whenever service/date/time/people change
  const doAvailabilityCheck = useCallback(async () => {
    if (!serviceId || !date || !time || !people) {
      setAvailability(null)
      return
    }
    setCheckingAvail(true)
    const { data } = await checkAvailability({ service_id: serviceId, date, time, people })
    setAvailability(data)
    setCheckingAvail(false)
  }, [serviceId, date, time, people])

  useEffect(() => {
    const timeout = setTimeout(doAvailabilityCheck, 400)
    return () => clearTimeout(timeout)
  }, [doAvailabilityCheck])

  const selectedService = services.find(s => s.id === serviceId)

  const handleProceedToConfirm = () => {
    if (!serviceId || !date || !time || !customerName || !people) {
      toast.error('Please fill in all required fields')
      return
    }
    const msg = generateConfirmationMessage(
      customerName,
      selectedService?.name ?? 'your tour',
      date,
      time,
      people
    )
    setConfirmationMsg(msg)
    setStep('confirm')
  }

  const handleCreateBooking = async (sendMsg: boolean) => {
    setSubmitting(true)
    const input: CreateBookingInput = {
      service_id: serviceId,
      conversation_id: prefill?.conversationId,
      customer_name: customerName,
      customer_phone: customerPhone || undefined,
      customer_email: customerEmail || undefined,
      booking_date: date,
      booking_time: time + ':00',
      number_of_people: people,
      notes: notes || undefined,
    }

    const { data, error } = await createBooking(input)
    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    setCreatedBooking(data)
    onCreated?.(data)

    if (sendMsg && prefill?.conversationId && onSendConfirmation) {
      onSendConfirmation(confirmationMsg, prefill.conversationId)
    }

    setStep('done')
  }

  const handleClose = () => {
    // Reset all state
    setStep('form')
    setServiceId('')
    setDate('')
    setTime('')
    setPeople(1)
    setCustomerName(prefill?.customerName ?? '')
    setCustomerPhone(prefill?.customerPhone ?? '')
    setCustomerEmail(prefill?.customerEmail ?? '')
    setNotes('')
    setAvailability(null)
    setCreatedBooking(null)
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy-900/60 backdrop-blur-xl"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.1)] w-full max-w-lg max-h-[90vh] overflow-hidden border border-white/60 dark:border-[#2A2A2A] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100/50 dark:border-[#2A2A2A]/50 relative overflow-hidden shrink-0">
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold text-[#213138] dark:text-gray-100 leading-tight font-[family-name:var(--font-poppins)]">
                {step === 'done' ? 'Success!' : step === 'confirm' ? 'Final Check' : 'New Booking'}
              </h2>
              {step === 'form' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Fill in the tour details below</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="relative z-10 p-2.5 rounded-2xl bg-gray-50/50 dark:bg-[#262626]/50 hover:bg-white dark:hover:bg-[#2A2A2A] text-gray-400 dark:text-gray-500 hover:text-navy-900 dark:hover:text-white transition-all border border-gray-100 dark:border-[#2A2A2A] shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>


          </div>

          {/* ---- FORM STEP ---- */}
          {step === 'form' && (
            <div className="p-5 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
              {/* Service */}
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-3 ml-1">
                  Select Service <span className="text-coral-500">*</span>
                </label>
                {services.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#262626] border border-dashed border-gray-200 dark:border-[#2A2A2A] text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic font-medium">No active services. Add one in Availability settings.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {services.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setServiceId(s.id)}
                        className={cn(
                          "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 group hover-lift",
                          serviceId === s.id
                            ? "border-[#3A9B9F] bg-teal-50/30 dark:bg-[#3A9B9F]/10 ring-1 ring-[#3A9B9F]/20 shadow-lg shadow-teal-500/5 scale-[1.01]"
                            : "border-gray-100 dark:border-[#2A2A2A] bg-white/50 dark:bg-[#262626]/50 hover:border-gray-200 dark:hover:border-[#333333] hover:bg-white dark:hover:bg-[#2A2A2A]"
                        )}
                      >
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: s.color + '20', color: s.color }}
                        >
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#213138] dark:text-gray-100 text-sm group-hover:text-[#3A9B9F] transition-colors">{s.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold mt-0.5 uppercase tracking-wider opacity-80">
                            {s.duration_minutes} min · max {s.max_capacity} Guests
                            {s.price ? ` · $${s.price}` : ''}
                          </p>
                        </div>
                        {serviceId === s.id && (
                          <div className="h-5 w-5 rounded-full bg-[#3A9B9F] flex items-center justify-center shadow-md shadow-teal-500/20">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-2.5 ml-1">
                    Tour Date <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative group">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#3A9B9F] transition-colors" />
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-2xl bg-white/50 dark:bg-[#262626]/50 border border-gray-100 dark:border-[#2A2A2A] hover:border-gray-200 dark:hover:border-[#333333] focus:border-[#3A9B9F] dark:focus:border-[#3A9B9F] pl-11 pr-4 py-3.5 text-sm font-bold text-[#213138] dark:text-gray-100 focus:outline-none transition-all focus:ring-4 focus:ring-[#3A9B9F]/10 shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-2.5 ml-1">
                    Tour Time <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative group">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#3A9B9F] transition-colors" />
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full rounded-2xl bg-white/50 dark:bg-[#262626]/50 border border-gray-100 dark:border-[#2A2A2A] hover:border-gray-200 dark:hover:border-[#333333] focus:border-[#3A9B9F] dark:focus:border-[#3A9B9F] pl-11 pr-4 py-3.5 text-sm font-bold text-[#213138] dark:text-gray-100 focus:outline-none transition-all focus:ring-4 focus:ring-[#3A9B9F]/10 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Availability indicator */}
              <AnimatePresence>
                {(checkingAvail || availability) && serviceId && date && time && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all border",
                      checkingAvail
                        ? "bg-gray-50/50 dark:bg-[#262626]/50 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-[#2A2A2A]"
                        : availability?.available
                          ? "bg-teal-50/50 dark:bg-teal-900/10 text-[#3A9B9F] border-teal-100/50 dark:border-teal-900/20 shadow-sm shadow-teal-500/5"
                          : "bg-coral-50/50 dark:bg-coral-900/10 text-[#FF8B66] border-coral-100/50 dark:border-coral-900/20 shadow-sm shadow-coral-500/5"
                    )}
                  >
                    <div className="shrink-0">
                      {checkingAvail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : availability?.available ? (
                        <div className="h-5 w-5 rounded-full bg-teal-500 text-white flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <span className="leading-tight">
                      {checkingAvail
                        ? 'Confirming availability in realtime…'
                        : availability?.message}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Group Size */}
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-3 ml-1">
                  Group Size <span className="text-coral-500">*</span>
                </label>
                <div className="flex items-center gap-6 bg-white/50 dark:bg-[#262626]/50 border border-gray-100 dark:border-[#2A2A2A] p-3 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 ml-2">
                    <div className="h-9 w-9 rounded-xl bg-gray-50 dark:bg-[#333333] text-gray-400 dark:text-gray-500 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">People</span>
                  </div>

                  <div className="flex-1 flex justify-center items-center gap-6">
                    <button
                      onClick={() => setPeople(Math.max(1, people - 1))}
                      className="h-10 w-10 rounded-xl bg-white dark:bg-[#333333] border border-gray-100 dark:border-[#2A2A2A] flex items-center justify-center text-[#213138] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-[#3A9B9F] transition-all font-bold text-xl shadow-sm btn-press"
                    >
                      −
                    </button>
                    <span className="text-2xl font-black text-[#213138] dark:text-white w-10 text-center font-[family-name:var(--font-poppins)]">{people}</span>
                    <button
                      onClick={() => setPeople(Math.min(selectedService?.max_capacity ?? 99, people + 1))}
                      className="h-10 w-10 rounded-xl bg-white dark:bg-[#333333] border border-gray-100 dark:border-[#2A2A2A] flex items-center justify-center text-[#213138] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-[#3A9B9F] transition-all font-bold text-xl shadow-sm btn-press"
                    >
                      +
                    </button>
                  </div>

                  {selectedService && (
                    <div className="mr-3 px-3 py-1 bg-gray-50 dark:bg-[#333333] rounded-lg text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border border-gray-100 dark:border-[#2A2A2A]">
                      Max {selectedService.max_capacity}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer info */}
              <div className="pt-4 space-y-4">
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] ml-1 mb-2">
                  Customer Information
                </label>
                <div className="grid gap-3">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#3A9B9F] transition-colors" />
                    <Input
                      placeholder="Full Name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="rounded-2xl border-gray-100 dark:border-[#2A2A2A] bg-white/50 dark:bg-[#262626]/50 pl-11 h-12 font-bold text-sm dark:text-gray-100 focus-visible:ring-4 focus-visible:ring-[#3A9B9F]/10 focus-visible:border-[#3A9B9F] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#3A9B9F] transition-colors" />
                      <Input
                        placeholder="Phone"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="rounded-2xl border-gray-100 dark:border-[#2A2A2A] bg-white/50 dark:bg-[#262626]/50 pl-11 h-12 font-bold text-sm dark:text-gray-100 focus-visible:ring-4 focus-visible:ring-[#3A9B9F]/10 focus-visible:border-[#3A9B9F] transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#3A9B9F] transition-colors" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        className="rounded-2xl border-gray-100 dark:border-[#2A2A2A] bg-white/50 dark:bg-[#262626]/50 pl-11 h-12 font-bold text-sm dark:text-gray-100 focus-visible:ring-4 focus-visible:ring-[#3A9B9F]/10 focus-visible:border-[#3A9B9F] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] ml-1 mb-2.5">
                  Internal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Special requests, dietary requirements, etc."
                  rows={3}
                  className="w-full rounded-2xl border border-gray-100 dark:border-[#2A2A2A] bg-white/50 dark:bg-[#262626]/50 px-4 py-3 text-sm font-medium dark:text-gray-200 resize-none focus:outline-none focus:ring-4 focus:ring-[#3A9B9F]/10 focus:border-[#3A9B9F] transition-all shadow-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-100/50 dark:border-[#2A2A2A]/50">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="flex-1 h-12 font-bold text-gray-500 dark:text-gray-400 hover:text-navy-900 dark:hover:text-white rounded-2xl transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProceedToConfirm}
                  disabled={!serviceId || !date || !time || !customerName || !people}
                  className="flex-1 h-12 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover-lift border-none"
                >
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ---- CONFIRM STEP ---- */}
          {step === 'confirm' && selectedService && (
            <div className="p-5 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
              {/* Summary Card */}
              <div className="rounded-[24px] bg-[#213138] text-white p-6 shadow-xl relative overflow-hidden group">


                <div className="relative z-10 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: selectedService.color }}
                    >
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold leading-tight uppercase tracking-wide">{selectedService.name}</h3>
                      <p className="text-xs font-bold text-white/60 tracking-widest">{selectedService.duration_minutes} MIN DURATION</p>
                    </div>
                  </div>
                  {selectedService.price && (
                    <div className="text-right">
                      <p className="text-2xl font-black tracking-tighter">
                        ${selectedService.price_type === 'per_person' 
                          ? (selectedService.price * people).toFixed(0) 
                          : selectedService.price.toFixed(0)}
                      </p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        TOTAL ({selectedService.price_type === 'per_person' ? `${people} guests` : 'fixed'})
                      </p>
                    </div>
                  )}
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-y-5 gap-x-8 pt-6 border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Scheduled Date</p>
                    <p className="text-sm font-bold">
                      {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Start Time</p>
                    <p className="text-sm font-bold">
                      {(() => {
                        const [h, m] = time.split(':').map(Number)
                        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
                      })()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Group Capacity</p>
                    <p className="text-sm font-bold">{people} {people === 1 ? 'Guest' : 'Guests'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Customer</p>
                    <p className="text-sm font-bold truncate">{customerName}</p>
                  </div>
                </div>
              </div>

              {/* Confirmation message */}
              {prefill?.conversationId && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-3 ml-1">
                    Auto-Confirmation Message
                  </label>
                  <div className="relative">
                    <textarea
                      value={confirmationMsg}
                      onChange={e => setConfirmationMsg(e.target.value)}
                      rows={4}
                      className="w-full rounded-[24px] border border-gray-100 dark:border-[#2A2A2A] bg-gray-50/50 dark:bg-[#121212]/50 px-5 py-4 text-xs font-medium dark:text-gray-300 leading-relaxed resize-none focus:outline-none focus:ring-4 focus:ring-[#3A9B9F]/10 focus:border-[#3A9B9F] transition-all shadow-inner"
                    />
                    <div className="absolute top-4 right-4 text-[#3A9B9F]">
                      <FileText className="h-4 w-4 opacity-40" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => handleCreateBooking(true)}
                  disabled={submitting}
                  className="w-full h-12 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover-lift border-none"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    prefill?.conversationId && onSendConfirmation ? 'Confirm & Notify Customer' : 'Confirm Order'
                  )}
                </Button>

                {prefill?.conversationId && (
                  <Button
                    onClick={() => handleCreateBooking(false)}
                    disabled={submitting}
                    variant="ghost"
                    className="w-full h-12 font-bold text-gray-500 dark:text-gray-400 hover:text-navy-900 dark:hover:text-white rounded-2xl"
                  >
                    Create without sending message
                  </Button>
                )}

                <button
                  onClick={() => setStep('form')}
                  className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-[#3A9B9F] dark:hover:text-[#3A9B9F] transition-all flex items-center justify-center gap-2 pt-2 uppercase tracking-widest"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back to Details
                </button>
              </div>
            </div>
          )}

          {/* ---- DONE STEP ---- */}
          {step === 'done' && createdBooking && (
            <div className="p-12 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="mx-auto h-24 w-24 rounded-[32px] bg-teal-500 text-white flex items-center justify-center shadow-2xl shadow-teal-500/40 rotate-6"
              >
                   <Check className="h-10 w-10" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-[#213138] dark:text-gray-100 font-[family-name:var(--font-poppins)]">All Signed Up!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-[240px] mx-auto leading-relaxed">
                  Tour for <span className="text-[#3A9B9F] font-bold">{createdBooking.customer_name}</span> has been successfully logged.
                </p>
              </div>

              <div className="p-4 rounded-[24px] bg-gray-50 dark:bg-[#121212] border border-gray-100 dark:border-[#2A2A2A] text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-loose">
                {new Date(createdBooking.booking_date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              <Button
                onClick={handleClose}
                className="w-full h-12 bg-[#213138] dark:bg-white dark:text-[#213138] hover:bg-black dark:hover:bg-gray-100 text-white rounded-2xl font-bold transition-all hover-lift border-none"
              >
                Back to Dashboard
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
