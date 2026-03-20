"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CreateBookingForm } from "@/components/bookings/create-booking-form"
import { ChevronLeft } from "lucide-react"

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialDate = searchParams.get('date') || undefined
  const initialTime = searchParams.get('time') || undefined

  return (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-[#121212] flex flex-col">
      {/* Back Button (Floating on Mobile) */}
      <div className="lg:hidden absolute top-[calc(env(safe-area-inset-top)+1.5rem)] left-6 z-[20]">
        <button
          onClick={() => router.back()}
          className="h-10 w-10 bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-md rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-[#2A2A2A]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <CreateBookingForm 
        isPage={true}
        onClose={() => router.back()}
        onCreated={() => {
          // You could redirect to the specific date here if you want
          router.push('/dashboard/bookings')
        }}
        initialDate={initialDate}
        initialTime={initialTime}
      />
    </div>
  )
}
