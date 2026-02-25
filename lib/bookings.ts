// Client-side helpers for the booking system
import { getSupabase } from '@/lib/supabase'
import type {
  Booking, BookingService, AvailabilitySlot,
  CreateBookingInput, UpdateBookingInput,
  CreateServiceInput, UpdateServiceInput,
  CreateAvailabilitySlotInput, UpdateAvailabilitySlotInput,
  AvailabilityCheckResult,
} from '@/types/bookings'

async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await getSupabase().auth.getSession()
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}

// ============================================================
// BOOKINGS
// ============================================================

export async function getBookings(params?: {
  month?: string
  date?: string
  status?: string
  service_id?: string
  conversation_id?: string
}): Promise<{ data: Booking[]; error: string | null }> {
  const headers = await authHeader()
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
  const res = await fetch(`/api/bookings${qs}`, { headers })
  const json = await res.json()
  return { data: json.data ?? [], error: json.error ?? null }
}

export async function getBooking(id: string): Promise<{ data: Booking | null; error: string | null }> {
  const headers = await authHeader()
  const res = await fetch(`/api/bookings/${id}`, { headers })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

export async function createBooking(input: CreateBookingInput): Promise<{ data: Booking | null; error: string | null }> {
  const headers = await authHeader()
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

export async function updateBooking(id: string, input: UpdateBookingInput): Promise<{ data: Booking | null; error: string | null }> {
  const headers = await authHeader()
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

export async function cancelBooking(id: string): Promise<{ error: string | null }> {
  const { error } = await updateBooking(id, { status: 'cancelled' })
  return { error }
}

// ============================================================
// AVAILABILITY CHECK
// ============================================================

export async function checkAvailability(params: {
  service_id: string
  date: string
  time: string
  people: number
}): Promise<{ data: AvailabilityCheckResult | null; error: string | null }> {
  const headers = await authHeader()
  const qs = '?' + new URLSearchParams({
    service_id: params.service_id,
    date: params.date,
    time: params.time,
    people: String(params.people),
  }).toString()
  const res = await fetch(`/api/bookings/availability${qs}`, { headers })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

// ============================================================
// SERVICES
// ============================================================

export async function getServices(activeOnly = true): Promise<{ data: BookingService[]; error: string | null }> {
  const headers = await authHeader()
  const res = await fetch(`/api/services?active=${activeOnly}`, { headers })
  const json = await res.json()
  return { data: json.data ?? [], error: json.error ?? null }
}

export async function createService(input: CreateServiceInput): Promise<{ data: BookingService | null; error: string | null }> {
  const headers = await authHeader()
  const res = await fetch('/api/services', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<{ data: BookingService | null; error: string | null }> {
  const headers = await authHeader()
  const res = await fetch(`/api/services/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

export async function deleteService(id: string): Promise<{ error: string | null }> {
  const headers = await authHeader()
  const res = await fetch(`/api/services/${id}`, { method: 'DELETE', headers })
  const json = await res.json()
  return { error: json.error ?? null }
}

// ============================================================
// AVAILABILITY SLOTS
// ============================================================

export async function getAvailabilitySlots(serviceId?: string): Promise<{ data: AvailabilitySlot[]; error: string | null }> {
  const headers = await authHeader()
  const qs = serviceId ? `?service_id=${serviceId}` : ''
  const res = await fetch(`/api/availability${qs}`, { headers })
  const json = await res.json()
  return { data: json.data ?? [], error: json.error ?? null }
}

export async function createAvailabilitySlot(input: CreateAvailabilitySlotInput): Promise<{ data: AvailabilitySlot | null; error: string | null }> {
  const headers = await authHeader()
  const res = await fetch('/api/availability', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

export async function updateAvailabilitySlot(id: string, input: UpdateAvailabilitySlotInput): Promise<{ data: AvailabilitySlot | null; error: string | null }> {
  const headers = await authHeader()
  const res = await fetch(`/api/availability/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

export async function deleteAvailabilitySlot(id: string): Promise<{ error: string | null }> {
  const headers = await authHeader()
  const res = await fetch(`/api/availability/${id}`, { method: 'DELETE', headers })
  const json = await res.json()
  return { error: json.error ?? null }
}

// ============================================================
// UTILITIES
// ============================================================

export function formatBookingTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

export function formatBookingDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function generateConfirmationMessage(
  customerName: string,
  serviceName: string,
  date: string,
  time: string,
  numberOfPeople: number
): string {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = formatBookingTime(time)
  const firstName = customerName.split(' ')[0]
  return `Hi ${firstName}! Your ${serviceName} booking is confirmed for ${formattedDate} at ${formattedTime} for ${numberOfPeople} ${numberOfPeople === 1 ? 'person' : 'people'}. We'll send a reminder the day before. Looking forward to seeing you! 🌴`
}
