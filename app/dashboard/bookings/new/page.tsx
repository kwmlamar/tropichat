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
    <div className="fixed inset-0 z-[200] bg-[#F8FAFB] dark:bg-[#121212] flex flex-col overflow-hidden">
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
