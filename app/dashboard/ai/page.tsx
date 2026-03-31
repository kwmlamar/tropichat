"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Sparkle, 
  ChatCircleDots, 
  CalendarCheck, 
  Target, 
  Lightning,
  CaretRight
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PlanGate } from "@/components/billing/PlanGate"
import { getCurrentCustomer } from "@/lib/supabase"
import type { Customer } from "@/types/database"

export default function TropiAIPage() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await getCurrentCustomer()
      setCustomer(data)
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3A9B9F]" />
      </div>
    )
  }

  return (
    <PlanGate plan={customer?.plan} feature="canTrainAI" className="min-h-full">
      <div className="flex flex-col min-h-full bg-white dark:bg-black">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-[#1C1C1C]">
          <div>
            <h1 className="text-2xl font-black text-[#213138] dark:text-white flex items-center gap-2 uppercase tracking-tight">
              Tropi AI
              <span className="text-[10px] bg-[#3A9B9F]/10 text-[#3A9B9F] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-[#3A9B9F]/20">Beta</span>
            </h1>
            <p className="text-sm font-bold text-gray-500 dark:text-[#525252] mt-0.5">Automate your customer communication with Gemini 1.5 Flash</p>
          </div>
          <Button variant="outline" className="rounded-xl border-gray-200 dark:border-[#1C1C1C] font-black uppercase tracking-widest text-[11px] gap-2">
            <Lightning weight="fill" className="text-amber-500 h-4 w-4" />
            Test My Agent
          </Button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {/* Hero Section */}
          <div className="max-w-5xl mx-auto text-center mb-16 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-[11px] font-black text-[#3A9B9F] uppercase tracking-[0.3em] mb-4">Welcome to the future</p>
              <h2 className="text-4xl md:text-5xl font-black text-[#213138] dark:text-white mb-6 tracking-tight uppercase">
                Meet your new <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A9B9F] to-[#2F8488]">Island Sidekick</span>
              </h2>
            </motion.div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            <AICard 
              title="AI Replies"
              description="You share your knowledge, Tropi AI uses it to reply for you 24/7 across WhatsApp, IG, and Messenger."
              icon={<ChatCircleDots weight="duotone" className="h-8 w-8 text-[#3A9B9F]" />}
              delay={0.1}
            />
            <AICard 
              title="AI Bookings"
              description="Your agent handles the schedule, knows your availability, and books customers directly into your calendar."
              icon={<CalendarCheck weight="duotone" className="h-8 w-8 text-[#3A9B9F]" />}
              delay={0.2}
            />
            <AICard 
              title="AI Goals"
              description="Set specific business goals like 'Capture Leads' or 'Close Sales' and let the AI guide the conversation."
              icon={<Target weight="duotone" className="h-8 w-8 text-[#3A9B9F]" />}
              delay={0.3}
            />
          </div>

          {/* Action Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20 flex flex-col items-center"
          >
            <Button className="h-14 px-10 rounded-2xl bg-[#3A9B9F] hover:bg-[#2F8488] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3A9B9F]/20 group">
              Activate Tropi AI
              <CaretRight weight="bold" className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-8 text-[11px] font-bold text-gray-400 dark:text-[#525252] uppercase tracking-widest flex items-center gap-2">
              <Sparkle weight="fill" className="h-3 w-3 text-amber-500" />
              Tropi AI is in Beta. Built for the modern Caribbean business.
            </p>
          </motion.div>
        </div>
      </div>
    </PlanGate>
  )
}

function AICard({ title, description, icon, delay }: { title: string, description: string, icon: React.ReactNode, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="group bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-[40px] p-8 shadow-sm hover:shadow-xl hover:border-[#3A9B9F]/20 transition-all duration-300"
    >
      <div className="h-16 w-16 bg-gray-50 dark:bg-[#111] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#3A9B9F]/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-black text-[#213138] dark:text-white mb-3 uppercase tracking-tight">{title}</h3>
      <p className="text-[14px] font-bold text-gray-500 dark:text-[#525252] leading-relaxed">
        {description}
      </p>
      
      <div className="mt-8 pt-6 border-t border-gray-50 dark:border-[#1C1C1C]">
        <span className="text-[10px] font-black text-[#3A9B9F] uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer">
          Configure <CaretRight weight="bold" className="h-2.5 w-2.5" />
        </span>
      </div>
    </motion.div>
  )
}
