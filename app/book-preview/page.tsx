"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

// --- Mock Data ---
const MOCK_SERVICES = [
  {
    id: "1",
    name: "Standard Bahamas Island Tour",
    description: "Experience the best of Nassau with our guided standard tour including key landmarks and history.",
    price: 85,
    duration_minutes: 180,
    color: "#3A9B9F",
    image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "2",
    name: "Private VIP Boat Experience",
    description: "Exclusive private boat tour with snorkeling and beach lunch. Perfect for groups and families.",
    price: 450,
    duration_minutes: 240,
    color: "#FF8B66",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop"
  }
]

const TIME_SLOTS = ["10:00 PM", "10:45 PM", "12:00 AM", "2:30 PM", "4:00 PM", "6:15 PM"]

export default function BookingPreviewPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(MOCK_SERVICES[0])
  const [selectedDate, setSelectedDate] = useState("24")
  const [selectedTime, setSelectedTime] = useState("10:00 PM")
  const [people, setPeople] = useState(1)
  const [isDone, setIsDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // Calendar logic for mock
  const [currentMonth, setCurrentMonth] = useState("February")
  const [currentYear, setCurrentYear] = useState(2026)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleComplete = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setIsDone(true)
    }, 1500)
  }

  // --- MOBILE LAYOUT (Match reference image) ---
  const MobileLayout = () => (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA] font-[family-name:var(--font-plus-jakarta)] px-6 pt-12 pb-24 max-w-md mx-auto relative overflow-x-hidden">
      {/* Back Button */}
      <button 
        onClick={() => setStep(Math.max(1, step - 1))}
        className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 mb-8 transition-all"
      >
        <ArrowLeft className="h-5 w-5 text-gray-400" />
      </button>

      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h1 className="text-2xl font-extrabold text-[#213138]">
          {currentMonth} {currentYear}
        </h1>
        <div className="flex gap-2">
          <button className="p-1 px-2 border border-gray-100 bg-white rounded-lg text-gray-400 hover:text-navy-900 shadow-sm">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="p-1 px-2 border border-gray-100 bg-white rounded-lg text-gray-400 hover:text-navy-900 shadow-sm">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid (3 columns like reference) */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, "01", "02"].map((day, idx) => {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"]
          const isActive = selectedDate === day.toString()
          const isNextMonth = day === "01" || day === "02"

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(day.toString())}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-[24px] border transition-all h-28 transform active:scale-95 shadow-sm",
                isActive 
                  ? "bg-[#3A9B9F] border-[#3A9B9F] text-white shadow-lg shadow-teal-500/20 z-10 scale-[1.02]" 
                  : "bg-white border-transparent text-[#213138] hover:border-teal-500/30"
              )}
            >
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50",
                isActive ? "text-white/80" : "text-gray-400"
              )}>
                {dayNames[idx]}
              </span>
              <span className={cn(
                "text-2xl font-extrabold",
                isActive ? "text-white" : isNextMonth ? "text-gray-200" : "text-[#213138]"
              )}>
                {day}
              </span>
            </button>
          )
        })}
      </div>

      {/* Time Slots */}
      <div className="flex flex-wrap gap-2 mb-12">
        {TIME_SLOTS.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTime(t)}
            className={cn(
              "px-5 py-3 rounded-2xl text-[11px] font-bold border transition-all shadow-sm",
              selectedTime === t 
                ? "bg-[#3A9B9F] border-[#3A9B9F] text-white" 
                : "bg-white border-transparent text-[#213138] hover:bg-gray-50"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* FIXED Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#F5F7FA] via-[#F5F7FA] to-transparent z-20 max-w-md mx-auto">
        <Button 
          onClick={handleComplete}
          disabled={loading}
          className="w-full h-16 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-3xl font-black text-lg shadow-xl shadow-teal-500/20 active:scale-[0.98] transition-all border-none"
        >
          {loading ? (
             <span className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" />
          ) : (
            "Book Appointment"
          )}
        </Button>
      </div>
    </div>
  )

  // --- DESKTOP LAYOUT (Premium Landing Style) ---
  const DesktopLayout = () => (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col font-sans">
       <div className="max-w-6xl mx-auto w-full px-8 py-12 flex-1 flex flex-col lg:flex-row gap-12">
          {/* Left: Branding & Services */}
          <div className="flex-1 space-y-12">
             <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-[#213138] rounded-2xl flex items-center justify-center shadow-xl rotate-3">
                   <Image src="/tropichat-logo.png" alt="Logo" width={32} height={32} className="brightness-200" />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-[#213138] leading-tight font-[family-name:var(--font-poppins)]">Simply Dave</h2>
                   <p className="text-xs font-bold text-[#3A9B9F] uppercase tracking-[0.2em]">Exotic Bahamas Experiences</p>
                </div>
             </div>

             <div className="space-y-6">
                <h1 className="text-5xl font-extrabold text-[#213138] tracking-tighter leading-[1.1] font-[family-name:var(--font-poppins)]">
                   Discover the Magic <br />
                   <span className="text-[#3A9B9F]">of the Islands.</span>
                </h1>
                <p className="text-gray-500 text-lg max-w-md leading-relaxed">
                   Select one of our curated island experiences below and book your adventure in seconds.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {MOCK_SERVICES.map(s => (
                   <button 
                     key={s.id} 
                     onClick={() => setSelectedService(s)}
                     className={cn(
                       "relative rounded-[32px] overflow-hidden border transition-all h-64 group",
                       selectedService.id === s.id ? "border-[#3A9B9F] ring-4 ring-[#3A9B9F]/10" : "border-gray-100"
                     )}
                   >
                     <Image src={s.image} alt={s.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-left">
                        <h3 className="text-white font-bold text-lg">{s.name}</h3>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">${s.price} / GUEST</p>
                     </div>
                     {selectedService.id === s.id && (
                        <div className="absolute top-4 right-4 h-8 w-8 bg-[#3A9B9F] rounded-full flex items-center justify-center text-white shadow-lg">
                           <Check className="h-4 w-4" />
                        </div>
                     )}
                   </button>
                ))}
             </div>
          </div>

          {/* Right: Booking Card */}
          <div className="w-full lg:w-[420px] shrink-0">
             <div className="bg-white rounded-[40px] shadow-2xl shadow-navy-900/5 border border-gray-100 p-8 sticky top-12">
                   <h3 className="text-xl font-bold text-[#213138] mb-8 font-[family-name:var(--font-poppins)]">Request Booking</h3>
                   
                   <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-[#F8FAFB] border border-gray-100 flex items-center gap-4">
                         <div className="h-12 w-12 bg-[#213138] rounded-xl flex items-center justify-center text-[#3A9B9F] shrink-0 shadow-lg">
                            <CalendarDays className="h-6 w-6" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Experience</p>
                            <p className="text-sm font-bold truncate text-[#213138]">{selectedService.name}</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                           <input type="date" className="w-full h-12 rounded-xl bg-white border border-gray-100 px-4 text-xs font-bold" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time</label>
                           <input type="time" className="w-full h-12 rounded-xl bg-white border border-gray-100 px-4 text-xs font-bold" />
                         </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-gray-50">
                          <Button 
                            className="w-full h-14 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 text-md"
                            onClick={handleComplete}
                            disabled={loading}
                          >
                             {loading ? 'Processing...' : 'Confirm Availability'}
                             {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                          </Button>
                          <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest opacity-60">
                             No immediate payment required
                          </p>
                      </div>
                   </div>
             </div>
          </div>
       </div>
    </div>
  )

  if (isDone) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6 text-center font-[family-name:var(--font-plus-jakarta)]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-[#3A9B9F] rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-teal-500/30 mb-8"
        >
          <Check className="h-12 w-12" />
        </motion.div>
        <h1 className="text-3xl font-extrabold text-[#213138] mb-4">Success!</h1>
        <p className="text-gray-500 font-medium mb-12 max-w-xs mx-auto">
          Your booking request has been sent. The business will notify you shortly on WhatsApp.
        </p>
        <Button 
          onClick={() => { setIsDone(false); setStep(1); }}
          className="bg-[#213138] text-white h-14 px-8 rounded-2xl font-bold hover:bg-black transition-all"
        >
          Back to Start
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="md:hidden">
        <MobileLayout />
      </div>
      <div className="hidden md:block">
        <DesktopLayout />
      </div>
    </>
  )
}
