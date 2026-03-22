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
import { CreateBookingForm } from "./create-booking-form"
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
  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
          className="relative bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.1)] w-full max-w-lg max-h-[90vh] overflow-hidden border border-white/60 dark:border-[#222222] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100/50 dark:border-[#222222]/50 relative overflow-hidden shrink-0">
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold text-[#213138] dark:text-gray-100 leading-tight font-[family-name:var(--font-poppins)]">
                New Booking
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Fill in the tour details below</p>
            </div>
            <button
              onClick={onClose}
              className="relative z-10 p-2.5 rounded-2xl bg-gray-50/50 dark:bg-[#111111]/50 hover:bg-white dark:hover:bg-[#222222] text-gray-400 dark:text-gray-500 hover:text-navy-900 dark:hover:text-white transition-all border border-gray-100 dark:border-[#222222] shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto">
            <CreateBookingForm
              onClose={onClose}
              onCreated={onCreated}
              prefill={prefill}
              onSendConfirmation={onSendConfirmation}
              initialDate={initialDate}
              initialTime={initialTime}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

