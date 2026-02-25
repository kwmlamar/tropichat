"use client"

import { useState, useEffect, useCallback } from "react"
import { X, CalendarDays, Clock, Users, User, Phone, FileText, AlertTriangle, CheckCircle2 } from "lucide-react"
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
}: CreateBookingModalProps) {
  const [services, setServices] = useState<BookingService[]>([])
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')

  // Form state
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
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
    if (prefill?.customerName) setCustomerName(prefill.customerName)
    if (prefill?.customerPhone) setCustomerPhone(prefill.customerPhone)
    if (prefill?.customerEmail) setCustomerEmail(prefill.customerEmail)
  }, [prefill])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {step === 'done' ? 'Booking Created!' : step === 'confirm' ? 'Confirm Booking' : 'Create Booking'}
            </h2>
            {step === 'form' && (
              <p className="text-sm text-gray-500 mt-0.5">Fill in the details below</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ---- FORM STEP ---- */}
        {step === 'form' && (
          <div className="p-6 space-y-5">
            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tour / Service <span className="text-red-500">*</span>
              </label>
              {services.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No active services. Add one in Availability settings.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {services.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setServiceId(s.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                        serviceId === s.id
                          ? "border-[#3A9B9F] bg-[#3A9B9F]/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500">
                          {s.duration_minutes} min · up to {s.max_capacity} people
                          {s.price ? ` · $${s.price}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <CalendarDays className="h-4 w-4 inline mr-1" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40 focus:border-[#3A9B9F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40 focus:border-[#3A9B9F]"
                />
              </div>
            </div>

            {/* Availability indicator */}
            {(checkingAvail || availability) && serviceId && date && time && (
              <div
                className={cn(
                  "flex items-start gap-2 px-3 py-2.5 rounded-lg text-sm",
                  checkingAvail
                    ? "bg-gray-50 text-gray-500"
                    : availability?.available
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                )}
              >
                {checkingAvail ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mt-0.5" />
                ) : availability?.available ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <span>
                  {checkingAvail
                    ? 'Checking availability…'
                    : availability?.message}
                </span>
              </div>
            )}

            {/* People */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Users className="h-4 w-4 inline mr-1" />
                Number of people <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPeople(Math.max(1, people - 1))}
                  className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
                >
                  −
                </button>
                <span className="text-xl font-semibold text-gray-900 w-8 text-center">{people}</span>
                <button
                  onClick={() => setPeople(Math.min(selectedService?.max_capacity ?? 99, people + 1))}
                  className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-lg"
                >
                  +
                </button>
                {selectedService && (
                  <span className="text-xs text-gray-400">max {selectedService.max_capacity}</span>
                )}
              </div>
            </div>

            {/* Customer info */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Customer Information</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  <User className="h-3 w-3 inline mr-1" />
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Phone className="h-3 w-3 inline mr-1" />
                    Phone
                  </label>
                  <Input
                    placeholder="+1 242 000 0000"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="h-4 w-4 inline mr-1" />
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Special requests, dietary requirements, etc."
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40 focus:border-[#3A9B9F]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleProceedToConfirm}
                disabled={!serviceId || !date || !time || !customerName || !people}
                className="flex-1 bg-[#3A9B9F] hover:bg-[#2F8488] text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ---- CONFIRM STEP ---- */}
        {step === 'confirm' && selectedService && (
          <div className="p-6 space-y-5">
            {/* Summary */}
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedService.color }} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedService.name}</p>
                  <p className="text-xs text-gray-500">{selectedService.duration_minutes} min tour</p>
                </div>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Time</p>
                  <p className="font-medium text-gray-900">
                    {(() => {
                      const [h, m] = time.split(':').map(Number)
                      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">People</p>
                  <p className="font-medium text-gray-900">{people}</p>
                </div>
                {selectedService.price && (
                  <div>
                    <p className="text-xs text-gray-400">Price</p>
                    <p className="font-medium text-gray-900">${(selectedService.price * people).toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 text-sm">
                <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                <p className="font-medium text-gray-900">{customerName}</p>
                {customerPhone && <p className="text-gray-500 text-xs">{customerPhone}</p>}
              </div>
            </div>

            {/* Confirmation message */}
            {prefill?.conversationId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmation message (editable)
                </label>
                <textarea
                  value={confirmationMsg}
                  onChange={e => setConfirmationMsg(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40 focus:border-[#3A9B9F]"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              {prefill?.conversationId && onSendConfirmation && (
                <Button
                  onClick={() => handleCreateBooking(true)}
                  disabled={submitting}
                  className="w-full bg-[#3A9B9F] hover:bg-[#2F8488] text-white"
                >
                  {submitting ? 'Creating…' : 'Confirm & Send Message'}
                </Button>
              )}
              <Button
                onClick={() => handleCreateBooking(false)}
                disabled={submitting}
                variant={prefill?.conversationId ? 'outline' : undefined}
                className={prefill?.conversationId ? 'w-full' : 'w-full bg-[#3A9B9F] hover:bg-[#2F8488] text-white'}
              >
                {submitting ? 'Creating…' : 'Confirm Booking'}
              </Button>
              <button
                onClick={() => setStep('form')}
                className="text-sm text-gray-500 hover:text-gray-700 text-center mt-1"
              >
                ← Back to edit
              </button>
            </div>
          </div>
        )}

        {/* ---- DONE STEP ---- */}
        {step === 'done' && createdBooking && (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Booking Confirmed!</h3>
              <p className="text-sm text-gray-500 mt-1">
                {createdBooking.service?.name} for {createdBooking.customer_name} on{' '}
                {new Date(createdBooking.booking_date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full bg-[#3A9B9F] hover:bg-[#2F8488] text-white">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
