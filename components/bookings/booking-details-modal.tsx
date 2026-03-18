"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Phone,
  Mail,
  FileText,
  CalendarDays,
  Clock,
  Users,
  AlertTriangle,
  ExternalLink,
  Send,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cancelBooking, updateBooking, formatBookingDate, formatBookingTime, generateConfirmationMessage } from "@/lib/bookings"
import type { Booking } from "@/types/bookings"
import { toast } from "sonner"

interface BookingDetailsModalProps {
  booking: Booking | null
  open: boolean
  onClose: () => void
  onUpdated?: (booking: Booking) => void
  onSendMessage?: (message: string, conversationId: string) => void
  onGoToConversation?: (conversationId: string) => void
}

const STATUS_STYLES = {
  confirmed: 'bg-teal-500 text-white shadow-lg shadow-teal-500/20',
  pending: 'bg-coral-500 text-white shadow-lg shadow-coral-500/20',
  cancelled: 'bg-gray-400 text-white shadow-lg shadow-gray-400/20',
}

export function BookingDetailsModal({
  booking,
  open,
  onClose,
  onUpdated,
  onSendMessage,
  onGoToConversation,
}: BookingDetailsModalProps) {
  const [cancelling, setCancelling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showConfirmMsg, setShowConfirmMsg] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState('')

  if (!open || !booking) return null

  const service = booking.service

  const handleCancel = async () => {
    if (!confirm('Cancel this booking? This cannot be undone.')) return
    setCancelling(true)
    const { error } = await cancelBooking(booking.id)
    setCancelling(false)
    if (error) { toast.error(error); return }
    toast.success('Booking cancelled')
    onUpdated?.({ ...booking, status: 'cancelled', cancelled_at: new Date().toISOString() })
    onClose()
  }

  const handleConfirm = async () => {
    setConfirming(true)
    const { data, error } = await updateBooking(booking.id, { status: 'confirmed' })
    setConfirming(false)
    if (error || !data) { toast.error(error ?? 'Failed to confirm'); return }
    toast.success('Booking confirmed')
    onUpdated?.(data)
  }

  const handleShowConfirmMsg = () => {
    const msg = generateConfirmationMessage(
      booking.customer_name,
      service?.name ?? 'your tour',
      booking.booking_date,
      booking.booking_time,
      booking.number_of_people
    )
    setConfirmMsg(msg)
    setShowConfirmMsg(true)
  }

  const handleSendConfirmMsg = () => {
    if (!booking.conversation_id) return
    onSendMessage?.(confirmMsg, booking.conversation_id)
    setShowConfirmMsg(false)
    toast.success('Message sent')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy-900/60 backdrop-blur-xl"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.1)] w-full max-w-md max-h-[90vh] overflow-hidden border border-white/60 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100/50 relative overflow-hidden shrink-0">
            <div className="relative z-10 flex items-center gap-4">
              {service && (
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                  style={{ backgroundColor: service.color }}
                >
                  <CalendarDays className="h-6 w-6" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-extrabold text-[#213138] leading-tight font-[family-name:var(--font-poppins)]">
                  {service?.name ?? 'Booking Info'}
                </h2>
                <div className={cn(
                  "inline-flex text-[9px] px-2.5 py-1 rounded-full font-black mt-1 uppercase tracking-widest",
                  STATUS_STYLES[booking.status]
                )}>
                  {booking.status}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 p-2.5 rounded-2xl bg-gray-50/50 hover:bg-white text-gray-400 hover:text-navy-900 transition-all border border-gray-100 shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Subtle Gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full" />
          </div>

          <div className="p-5 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-gray-50/50 border border-gray-100 p-3 text-center transition-transform hover:scale-[1.02]">
                <CalendarDays className="h-4 w-4 text-[#3A9B9F] mx-auto mb-1.5 opacity-60" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                <p className="text-[13px] font-extrabold text-[#213138] leading-tight">
                  {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50/50 border border-gray-100 p-3 text-center transition-transform hover:scale-[1.02]">
                <Clock className="h-4 w-4 text-[#3A9B9F] mx-auto mb-1.5 opacity-60" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</p>
                <p className="text-[13px] font-extrabold text-[#213138]">
                  {formatBookingTime(booking.booking_time)}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50/50 border border-gray-100 p-3 text-center transition-transform hover:scale-[1.02]">
                <Users className="h-4 w-4 text-[#3A9B9F] mx-auto mb-1.5 opacity-60" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Size</p>
                <p className="text-[13px] font-extrabold text-[#213138]">{booking.number_of_people}</p>
              </div>
            </div>

            {/* Pricing Highlight */}
            {service?.price && (
              <div className="rounded-3xl bg-navy-900 p-6 text-white relative overflow-hidden group shadow-xl">
                <div
                  className="absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full opacity-20"
                  style={{ backgroundColor: service.color }}
                />
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Estimated Total</p>
                    <p className="text-3xl font-black tracking-tighter">
                      ${(service.price * booking.number_of_people).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      ${service.price} PER GUEST
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Card */}
            <div className="rounded-3xl border border-gray-100 bg-white/50 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#3A9B9F] flex items-center justify-center font-bold text-sm shadow-inner shadow-teal-500/5">
                  {booking.customer_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                  <p className="text-sm font-extrabold text-[#213138] truncate">{booking.customer_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {booking.customer_phone && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-bold text-gray-600">{booking.customer_phone}</p>
                  </div>
                )}
                {booking.customer_email && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-bold text-gray-600 truncate">{booking.customer_email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Segment */}
            {booking.notes && (
              <div className="rounded-3xl bg-teal-50/30 border border-teal-100/50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-[#3A9B9F] opacity-60" />
                  <p className="text-[10px] font-black text-[#3A9B9F] uppercase tracking-widest">Internal Notes</p>
                </div>
                <p className="text-xs font-medium text-gray-600 leading-relaxed italic">"{booking.notes}"</p>
              </div>
            )}

            {/* Confirmation composer */}
            <AnimatePresence>
              {showConfirmMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-[24px] border border-teal-100 bg-teal-50/20 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-[#3A9B9F] uppercase tracking-widest">Confirmation Message</p>
                    <button onClick={() => setShowConfirmMsg(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <textarea
                    value={confirmMsg}
                    onChange={e => setConfirmMsg(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-gray-100 bg-white/50 px-4 py-3 text-xs font-medium leading-relaxed resize-none focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 shadow-inner"
                  />
                  <Button
                    onClick={handleSendConfirmMsg}
                    className="w-full h-11 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 hover-lift border-none"
                    disabled={!booking.conversation_id}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Deliver Message
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              {booking.status === 'pending' && (
                <Button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="w-full bg-[#3A9B9F] hover:bg-[#2F8488] text-white"
                >
                  {confirming ? 'Confirming…' : 'Confirm Booking'}
                </Button>
              )}

              {!showConfirmMsg && booking.conversation_id && onSendMessage && (
                <Button variant="outline" onClick={handleShowConfirmMsg} className="w-full">
                  <Send className="h-4 w-4 mr-1.5" />
                  Send Confirmation Message
                </Button>
              )}

              {booking.conversation_id && onGoToConversation && (
                <Button
                  variant="outline"
                  onClick={() => { onGoToConversation(booking.conversation_id!); onClose() }}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Go to Conversation
                </Button>
              )}

              {booking.status !== 'cancelled' && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full text-sm text-red-500 hover:text-red-700 py-2 transition-colors"
                >
                  {cancelling ? 'Cancelling…' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
