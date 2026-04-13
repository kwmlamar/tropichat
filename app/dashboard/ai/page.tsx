"use client"
import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  MessageSquare as ChatCircleDots,
  Calendar as CalendarCheck,
  Target,
  Zap as Lightning,
  ChevronRight as CaretRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { PlanGate } from "@/components/billing/PlanGate"
import { getCurrentCustomer } from "@/lib/supabase"
import type { Customer } from "@/types/database"
import { DEFAULT_BUSINESS_BRIEF } from "@/lib/ai-schema"
import type { AIVoiceProfile, BusinessBrief } from "@/lib/ai-schema"
import { toast } from "sonner"
import { getSupabase } from "@/lib/supabase"
import { AIAssistantView } from "@/components/ai/AIAssistantView"
import { AIConfigureView } from "@/components/ai/AIConfigureView"
import Link from "next/link"

export default function TropiAIPage() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [voiceProfile, setVoiceProfile] = useState<AIVoiceProfile | null>(null)
  const [businessBrief, setBusinessBrief] = useState<BusinessBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoPilot, setAutoPilot] = useState(false)
  const [pilotSaving, setPilotSaving] = useState(false)
  const [view, setView] = useState<'landing' | 'assistant'>('landing')
  const [assistantLogs, setAssistantLogs] = useState<any[]>([])

  const fetchAssistantLogs = async () => {
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      if (!session) return
      const res = await fetch('/api/ai/assistant/chat', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      if (data.logs) setAssistantLogs(data.logs)
    } catch (err) {
      console.error("Failed to fetch logs", err)
    }
  }

  useEffect(() => {
    async function fetch() {
      const { data } = await getCurrentCustomer()
      setCustomer(data)
      const profile = data?.ai_voice_profile as AIVoiceProfile || null
      setVoiceProfile(profile)
      setBusinessBrief((data?.business_brief as BusinessBrief) || null)
      setAutoPilot(data?.ai_autopilot_enabled ?? false)
      setLoading(false)

      // If voice profile exists, default to assistant view
      if (profile) {
        setView('assistant')
        fetchAssistantLogs()
      }
    }
    fetch()
  }, [])

  const handleSaveConfig = async ({ voiceProfile: newVP, businessBrief: newBB }: { voiceProfile?: AIVoiceProfile; businessBrief?: BusinessBrief }) => {
    const { data: { session } } = await getSupabase().auth.getSession()
    const body: Record<string, unknown> = {}
    if (newVP) body.voiceProfile = newVP
    if (newBB) body.businessBrief = newBB
    const res = await fetch('/api/ai/voice-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!data.success) throw new Error('Save failed')
    if (newVP) setVoiceProfile(newVP)
    if (newBB) setBusinessBrief(newBB)
  }

  const handleResetVoiceProfile = async () => {
    try {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) return
      await getSupabase().from('customers').update({ ai_voice_profile: null }).eq('id', user.id)
      setVoiceProfile(null)
      setView('landing')
      toast.success('Voice profile reset — run setup to retrain your AI')
    } catch {
      toast.error('Failed to reset voice profile')
    }
  }

  const handleAutoPilotToggle = async (enabled: boolean) => {
    setPilotSaving(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch('/api/ai/autopilot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ enabled })
      })
      const data = await res.json()
      if (data.success) {
        setAutoPilot(enabled)
        toast.success(enabled 
          ? '🤖 Auto-Pilot ON — AI will reply on all channels' 
          : 'Auto-Pilot OFF — AI suggestions only')
      } else {
        toast.error('Failed to update Auto-Pilot')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setPilotSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3A9B9F]" />
      </div>
    )
  }

  return (
    <PlanGate plan={customer?.plan} feature="canTrainAI" className="min-h-full">
      <div className="flex flex-col min-h-full bg-white dark:bg-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-[#1C1C1C] flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black text-[#213138] dark:text-white flex items-center gap-2 uppercase tracking-tight">
              Tropi AI
              <span className="text-[10px] bg-[#3A9B9F]/10 text-[#3A9B9F] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-[#3A9B9F]/20">Beta</span>
            </h1>
            <p className="text-sm font-bold text-gray-500 dark:text-[#525252] mt-0.5">Your intelligent Sales Assistant powered by Gemini 2.5</p>
          </div>

          <div className="flex items-center gap-3">
            {voiceProfile && (
              <div className="flex p-1 bg-gray-100 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#1C1C1C]">
                <button
                  onClick={() => setView('assistant')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    view === 'assistant' 
                      ? "bg-white dark:bg-[#1C1C1C] text-[#3A9B9F] shadow-sm" 
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  )}
                >
                  Assistant
                </button>
                <button
                  onClick={() => setView('landing')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    view === 'landing' 
                      ? "bg-white dark:bg-[#1C1C1C] text-[#3A9B9F] shadow-sm" 
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  )}
                >
                  Configure
                </button>
              </div>
            )}
            
            <Link
              href="/dashboard/ai/simulator"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-[#1C1C1C] font-black uppercase tracking-widest text-[11px] hover:bg-[#3A9B9F]/10 hover:border-[#3A9B9F]/30 hover:text-[#3A9B9F] transition-all text-gray-700 dark:text-gray-300"
            >
              <Lightning className="text-amber-500 h-4 w-4" />
              Test Simulator
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {view === 'assistant' && voiceProfile ? (
            <AIAssistantView
              businessName={customer?.business_name || "Your Business"}
              recentLogs={assistantLogs}
              onRefreshLogs={fetchAssistantLogs}
            />
          ) : view === 'landing' && voiceProfile ? (
            <AIConfigureView
              voiceProfile={voiceProfile}
              businessBrief={businessBrief || DEFAULT_BUSINESS_BRIEF}
              autoPilot={autoPilot}
              onAutoPilotChange={handleAutoPilotToggle}
              onSave={handleSaveConfig}
              onResetVoiceProfile={handleResetVoiceProfile}
            />
          ) : (
            <div className="p-8">
              {/* Hero Section */}
              <div className="max-w-5xl mx-auto text-center mb-16 px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-[11px] font-black text-[#3A9B9F] uppercase tracking-[0.3em] mb-4">The AI for Caribbean Business</p>
                  <h2 className="text-4xl md:text-5xl font-black text-[#213138] dark:text-white mb-6 tracking-tight uppercase">
                    Your New <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A9B9F] to-[#2F8488]">Sales Assistant</span>
                  </h2>
                  <p className="text-gray-500 dark:text-[#525252] max-w-2xl mx-auto font-bold text-lg leading-relaxed">
                    Tropi AI doesn&apos;t just reply. It understands your business, remembers your customers, and works 24/7 to close bookings.
                  </p>
                </motion.div>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
                <AICard 
                  title="Smart Replies"
                  description="Your AI learns your voice and replies to customers on WhatsApp, IG, and Messenger with perfect Caribbean hospitality."
                  icon={<ChatCircleDots className="h-8 w-8 text-[#3A9B9F]" />}
                  delay={0.1}
                />
                <AICard 
                  title="Auto Bookings"
                  description="Move leads to customers. Your assistant knows your availability and pushes for the booking, every single time."
                  icon={<CalendarCheck className="h-8 w-8 text-[#3A9B9F]" />}
                  delay={0.2}
                />
                <AICard 
                  title="Lead Intelligence"
                  description="Ask your assistant anything. Who asked about tours today? Which customers need a follow-up? Stay ahead of the curve."
                  icon={<Target className="h-8 w-8 text-[#3A9B9F]" />}
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
                {!voiceProfile ? (
                  <Link
                    href="/dashboard/ai/simulator"
                    className="inline-flex items-center h-14 px-10 rounded-2xl bg-[#3A9B9F] hover:bg-[#2F8488] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3A9B9F]/20 group transition-colors"
                  >
                    Activate Your Assistant
                    <CaretRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <Button 
                      onClick={() => setView('assistant')}
                      className="h-14 px-10 rounded-2xl bg-[#3A9B9F] hover:bg-[#2F8488] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3A9B9F]/20 group"
                  >
                    Go to Assistant
                    <CaretRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
                <p className="mt-8 text-[11px] font-bold text-gray-400 dark:text-[#525252] uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Island-certified intelligence. Built for professional owners.
                </p>
              </motion.div>

              {/* Auto-Pilot Toggle Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="max-w-lg mx-auto mt-10 w-full"
              >
                <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${
                  autoPilot 
                    ? 'bg-[#3A9B9F]/5 border-[#3A9B9F]/30 shadow-lg shadow-[#3A9B9F]/5' 
                    : 'bg-gray-50 dark:bg-[#080808] border-gray-200 dark:border-[#1C1C1C]'
                }`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    autoPilot ? 'bg-[#3A9B9F]' : 'bg-gray-200 dark:bg-[#1C1C1C]'
                  }`}>
                    <Lightning className={`h-5 w-5 ${autoPilot ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold dark:text-white">Auto-Pilot</p>
                      {autoPilot && (
                        <span className="text-[9px] font-black text-[#3A9B9F] bg-[#3A9B9F]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-[#3A9B9F]/20">
                          Live
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">
                      {autoPilot 
                        ? 'Replying automatically on WhatsApp, Instagram & Messenger' 
                        : 'Suggestions only — auto-reply is off'}
                    </p>
                  </div>
                  <Switch 
                    checked={autoPilot} 
                    onCheckedChange={handleAutoPilotToggle}
                    disabled={pilotSaving || !voiceProfile}
                  />
                </div>
                {!voiceProfile && (
                  <p className="text-center text-[11px] text-amber-500 font-semibold mt-3">
                    ⚠️ Set up your Business Brief first to enable Auto-Pilot
                  </p>
                )}
              </motion.div>
            </div>
          )}
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
          Configure <CaretRight className="h-2.5 w-2.5" />
        </span>
      </div>
    </motion.div>
  )
}
