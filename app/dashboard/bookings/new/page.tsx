"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CreateBookingForm } from "@/components/bookings/create-booking-form"


import { Suspense } from "react"

function NewBookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialDate = searchParams.get('date') || undefined
  const initialTime = searchParams.get('time') || undefined

  return (
    <div className="fixed inset-0 z-[200] bg-[#F8FAFB] dark:bg-black flex flex-col overflow-hidden">
      <CreateBookingForm 
        isPage={true}
        onClose={() => router.back()}
        onCreated={() => {
          router.push('/dashboard/bookings')
        }}
        initialDate={initialDate}
        initialTime={initialTime}
      />
    </div>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[200] bg-[#F8FAFB] dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007B85]" />
      </div>
    }>
      <NewBookingContent />
    </Suspense>
  )
}
