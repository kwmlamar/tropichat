"use client"

import { useState } from "react"
import { X, Phone, Mail, FileText, CalendarDays, Clock, Users, AlertTriangle, ExternalLink, Send } from "lucide-react"
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

const STATUS_COLORS = {
  confirmed: 'bg-green-100 text-green-800',
  pending:   'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-500',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {service && (
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {service?.name ?? 'Booking'}
              </h2>
              <span className={cn("inline-flex text-xs px-2 py-0.5 rounded-full font-medium mt-0.5", STATUS_COLORS[booking.status])}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Date / Time / People */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <CalendarDays className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Time</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatBookingTime(booking.booking_time)}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <Users className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">People</p>
              <p className="text-sm font-semibold text-gray-900">{booking.number_of_people}</p>
            </div>
          </div>

          {/* Price */}
          {service?.price && (
            <div className="rounded-xl bg-[#3A9B9F]/5 border border-[#3A9B9F]/20 px-4 py-3">
              <p className="text-xs text-gray-500">Estimated total</p>
              <p className="text-xl font-bold text-[#3A9B9F]">
                ${(service.price * booking.number_of_people).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">${service.price} × {booking.number_of_people} people</p>
            </div>
          )}

          {/* Customer */}
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            <div className="px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">Customer</p>
              <p className="text-sm font-semibold text-gray-900">{booking.customer_name}</p>
            </div>
            {booking.customer_phone && (
              <div className="px-4 py-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-700">{booking.customer_phone}</p>
              </div>
            )}
            {booking.customer_email && (
              <div className="px-4 py-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-700">{booking.customer_email}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <p className="text-xs text-gray-400">Notes</p>
              </div>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Confirmation message composer */}
          {showConfirmMsg && (
            <div className="rounded-xl border border-[#3A9B9F]/30 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Confirmation Message</p>
              <textarea
                value={confirmMsg}
                onChange={e => setConfirmMsg(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40 focus:border-[#3A9B9F]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSendConfirmMsg}
                  className="flex-1 bg-[#3A9B9F] hover:bg-[#2F8488] text-white"
                  disabled={!booking.conversation_id}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Send
                </Button>
                <Button variant="outline" onClick={() => setShowConfirmMsg(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}

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
      </div>
    </div>
  )
}
