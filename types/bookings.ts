// Booking system types for TropiChat

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

// ============================================================
// Database row types
// ============================================================

export interface BookingService {
  id: string
  user_id: string
  name: string
  description: string | null
  duration_minutes: number
  max_capacity: number
  price: number | null
  color: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface AvailabilitySlot {
  id: string
  service_id: string
  is_recurring: boolean
  day_of_week: number | null   // 0=Sunday … 6=Saturday
  specific_date: string | null // ISO date string 'YYYY-MM-DD'
  start_time: string           // 'HH:MM:SS'
  end_time: string
  max_bookings: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id: string
  service_id: string
  conversation_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  booking_date: string   // 'YYYY-MM-DD'
  booking_time: string   // 'HH:MM:SS'
  number_of_people: number
  status: BookingStatus
  notes: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  // joined
  service?: BookingService
}

// ============================================================
// Input types (forms / API)
// ============================================================

export interface CreateServiceInput {
  name: string
  description?: string
  duration_minutes: number
  max_capacity: number
  price?: number
  color?: string
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  active?: boolean
}

export interface CreateAvailabilitySlotInput {
  service_id: string
  is_recurring: boolean
  day_of_week?: number
  specific_date?: string
  start_time: string
  end_time: string
  max_bookings: number
  is_available?: boolean
}

export interface UpdateAvailabilitySlotInput extends Partial<Omit<CreateAvailabilitySlotInput, 'service_id'>> {
  is_available?: boolean
}

export interface CreateBookingInput {
  service_id: string
  conversation_id?: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  booking_date: string
  booking_time: string
  number_of_people: number
  notes?: string
}

export interface UpdateBookingInput {
  service_id?: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  booking_date?: string
  booking_time?: string
  number_of_people?: number
  status?: BookingStatus
  notes?: string
}

// ============================================================
// Availability check types
// ============================================================

export interface AvailabilityCheckResult {
  available: boolean
  slot: AvailabilitySlot | null
  bookedCount: number
  remaining: number
  message: string
}

// ============================================================
// Calendar display types
// ============================================================

export interface CalendarBooking extends Booking {
  service: BookingService
}

// Day of week labels
export const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const DAY_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
