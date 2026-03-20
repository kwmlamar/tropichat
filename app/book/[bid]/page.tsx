"use client"

import { useState, useEffect, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarDays,
  Clock,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { getSupabase } from "@/lib/supabase"
import type { BusinessProfile } from "@/types/database"
import type { BookingService } from "@/types/bookings"

interface BookingPageProps {
  params: Promise<{ bid: string }>
}

export default function PublicBookingPage({ params }: BookingPageProps) {
  const { bid } = use(params)
  const [isMobile, setIsMobile] = useState(false)
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<BookingService[]>([])
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [selectedService, setSelectedService] = useState<BookingService | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [isDone, setIsDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  // Fetch real data
  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabase()
      
      // Fetch services for this businessId (user_id)
      const { data: svcData } = await supabase
        .from("booking_services")
        .select("*")
        .eq("user_id", bid)
        .eq("active", true)
        .order("name")

      // Fetch business profile - we find it by joining through connected_accounts
      // Actually business_profiles is linked to connected_account which is linked to user_id.
      // But let's check the schema again. 
      // business_profiles - connected_account_id
      // connected_accounts - user_id
      const { data: profileData } = await supabase
        .from("business_profiles")
        .select("*, connected_accounts!inner(user_id)")
        .eq("connected_accounts.user_id", bid)
        .maybeSingle()

      if (svcData) {
        setServices(svcData)
        if (svcData.length > 0) setSelectedService(svcData[0])
      }
      
      if (profileData) {
        setBusinessProfile(profileData as any)
      }

      setLoading(false)
    }

    fetchData()
    
    // Check mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [bid])

  const handleComplete = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return
    
    setBookingLoading(true)
    const supabase = getSupabase()
    
    // In a real app we'd collect customer name/phone here. 
    // For MVP walkthrough, we'll use "Walk-in Customer" or prompt.
    const customerPrompt = window.prompt("Enter your name to confirm booking:")
    if (!customerPrompt) {
      setBookingLoading(false)
      return
    }

    const { error } = await supabase.from("bookings").insert({
      user_id: bid,
      service_id: selectedService.id,
      customer_name: customerPrompt,
      booking_date: selectedDate, // Need to make this a real ISO date
      booking_time: selectedTime,
      status: "pending",
    })

    if (error) {
      console.error("Booking error:", error)
      alert("Failed to book. Please try again.")
    } else {
      setIsDone(true)
    }
    
    setBookingLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <Loader2 className="h-10 w-10 animate-spin text-[#3A9B9F]" />
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] p-8 text-center">
        <div className="max-w-md">
            <h1 className="text-2xl font-bold mb-4">No Services Found</h1>
            <p className="text-gray-500 mb-8">This business hasn't set up any bookable services yet.</p>
            <Button onClick={() => window.location.href = "/dashboard"}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  // Reuse the logic from preview but simplified for real data
  const MobileLayout = () => (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA] dark:bg-[#121212] font-[family-name:var(--font-plus-jakarta)] px-6 pt-12 pb-24 max-w-md mx-auto relative">
      <h1 className="text-2xl font-extrabold text-[#213138] dark:text-white mb-8">
        {businessProfile?.business_name || "Book Appointment"}
      </h1>
      
      <div className="space-y-6">
        {/* Service Select */}
        <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Service</label>
            <div className="flex flex-col gap-3">
               {services.map(s => (
                <button
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={cn(
                        "p-4 rounded-[24px] border text-left transition-all",
                        selectedService?.id === s.id ? "bg-[#3A9B9F] border-[#3A9B9F] text-white shadow-lg" : "bg-white dark:bg-[#1E1E1E] border-transparent"
                    )}
                >
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className={cn("text-xs opacity-70", selectedService?.id === s.id ? "text-white" : "text-gray-500")}>${s.price} • {s.duration_minutes}m</p>
                </button>
               ))}
            </div>
        </div>

        {/* Date Selector (Simplified) */}
        <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pick Date & Time</label>
             <input 
                type="date" 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border-none shadow-sm font-bold text-sm"
             />
             <input 
                type="time" 
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white dark:bg-[#1E1E1E] border-none shadow-sm font-bold text-sm"
             />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F5F7FA] dark:from-[#121212] to-transparent z-20 max-w-md mx-auto">
        <Button 
          onClick={handleComplete}
          disabled={bookingLoading || !selectedDate || !selectedTime}
          className="w-full h-16 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-3xl font-black text-lg shadow-xl shadow-teal-500/20"
        >
          {bookingLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Request Booking"}
        </Button>
      </div>
    </div>
  )

  const DesktopLayout = () => (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-[#121212] flex flex-col font-sans">
       <div className="max-w-6xl mx-auto w-full px-8 py-12 flex-1 flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-12">
             <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-[#213138] rounded-2xl flex items-center justify-center shadow-xl rotate-3 overflow-hidden">
                   {businessProfile?.profile_picture_url ? (
                    <Image src={businessProfile.profile_picture_url} alt="Logo" width={64} height={64} className="object-cover" />
                   ) : (
                    <div className="text-white text-2xl font-black">{businessProfile?.business_name?.[0] || 'T'}</div>
                   )}
                </div>
                <div>
                   <h2 className="text-3xl font-black text-[#213138] dark:text-white leading-tight">{businessProfile?.business_name || "Business Booking"}</h2>
                   <p className="text-xs font-bold text-[#3A9B9F] uppercase tracking-[0.2em]">{businessProfile?.business_category || "Service Provider"}</p>
                </div>
             </div>

             <div className="space-y-6">
                <h1 className="text-5xl font-extrabold text-[#213138] dark:text-white tracking-tighter leading-[1.1]">
                   Your Adventure <br />
                   <span className="text-[#3A9B9F]">Awaits.</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md leading-relaxed">
                   {businessProfile?.business_description || "Book your next professional experience with us easily via WhatsApp and TropiChat."}
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {services.map(s => (
                   <button 
                     key={s.id} 
                     onClick={() => setSelectedService(s)}
                     className={cn(
                       "relative rounded-[32px] p-8 border transition-all text-left bg-white dark:bg-[#1E1E1E] group",
                       selectedService?.id === s.id ? "border-[#3A9B9F] ring-4 ring-[#3A9B9F]/10 shadow-lg" : "border-gray-100 dark:border-gray-800"
                     )}
                   >
                     <p className="font-bold text-2xl text-[#213138] dark:text-white mb-2">{s.name}</p>
                     <p className="text-gray-400 text-sm mb-6 line-clamp-2">{s.description}</p>
                     <div className="flex items-center justify-between">
                        <p className="text-[#3A9B9F] font-black text-xl">${s.price}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.duration_minutes} Min</p>
                     </div>
                     {selectedService?.id === s.id && (
                        <div className="absolute top-4 right-4 h-8 w-8 bg-[#3A9B9F] rounded-full flex items-center justify-center text-white">
                           <Check className="h-4 w-4" />
                        </div>
                     )}
                   </button>
                ))}
             </div>
          </div>

          <div className="w-full lg:w-[420px] shrink-0">
             <div className="bg-white dark:bg-[#1E1E1E] rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 sticky top-12">
                   <h3 className="text-xl font-bold text-[#213138] dark:text-white mb-8">Schedule Booking</h3>
                   <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-[#F8FAFB] dark:bg-[#262626] border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                         <div className="h-12 w-12 bg-[#213138] rounded-xl flex items-center justify-center text-[#3A9B9F] shrink-0">
                            <CalendarDays className="h-6 w-6" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</p>
                            <p className="text-sm font-bold truncate text-[#213138] dark:text-white">{selectedService?.name || "None Selected"}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                            <input type="date" onChange={(e) => setSelectedDate(e.target.value)} className="w-full h-12 rounded-xl bg-white dark:bg-[#262626] border border-gray-100 dark:border-gray-800 px-4 text-xs font-bold" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time</label>
                            <input type="time" onChange={(e) => setSelectedTime(e.target.value)} className="w-full h-12 rounded-xl bg-white dark:bg-[#262626] border border-gray-100 dark:border-gray-800 px-4 text-xs font-bold" />
                         </div>
                      </div>

                      <Button 
                        className="w-full h-14 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20"
                        onClick={handleComplete}
                        disabled={bookingLoading || !selectedService || !selectedDate || !selectedTime}
                      >
                         {bookingLoading ? 'Processing...' : 'Confirm Availability'}
                         {!bookingLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                   </div>
             </div>
          </div>
       </div>
    </div>
  )

  if (isDone) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-[#3A9B9F] rounded-[32px] flex items-center justify-center text-white mb-8">
          <Check className="h-12 w-12" />
        </motion.div>
        <h1 className="text-3xl font-extrabold text-[#213138] dark:text-white mb-4">You're All Set!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-12 max-w-xs mx-auto">
          We've received your booking. You'll get a confirmation message from {businessProfile?.business_name || "us"} shortly.
        </p>
        <Button onClick={() => window.location.reload()} className="bg-[#213138] dark:bg-white dark:text-black">Done</Button>
      </div>
    )
  }

  return isMobile ? <MobileLayout /> : <DesktopLayout />
}
