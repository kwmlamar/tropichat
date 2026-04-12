"use client"
import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Sparkles, 
  MessageSquare as ChatCircleDots, 
  Calendar as CalendarCheck, 
  Target, 
  Zap as Lightning,
  ChevronRight as CaretRight,
  X,
  Send as PaperPlaneRight,
  CircleEllipsis as DotsThreeCircle,
  Wand2 as MagicWand,
  Activity as Waveform
} from "lucide-react"
import { 
  Check, 
  Building2 as Buildings, 
  Banknote as Money, 
  DollarSign as CurrencyDollar, 
  Clock,
  LayoutDashboard,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { PlanGate } from "@/components/billing/PlanGate"
import { getCurrentCustomer } from "@/lib/supabase"
import type { Customer } from "@/types/database"
import { AnimatePresence } from "framer-motion"
import { extractStyleFromSample, DEFAULT_VOICE_PROFILE, DEFAULT_BUSINESS_BRIEF } from "@/lib/ai-schema"
import type { AIVoiceProfile, BusinessBrief } from "@/lib/ai-schema"
import { toast } from "sonner"
import { getSupabase } from "@/lib/supabase"
import { AIAssistantView } from "@/components/ai/AIAssistantView"

export default function TropiAIPage() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [voiceProfile, setVoiceProfile] = useState<AIVoiceProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
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
            
            <Button 
              onClick={() => setIsDemoOpen(true)}
              variant="outline" 
              className="rounded-xl border-gray-200 dark:border-[#1C1C1C] font-black uppercase tracking-widest text-[11px] gap-2 hover:bg-[#3A9B9F]/10 hover:border-[#3A9B9F]/30 hover:text-[#3A9B9F] transition-all"
            >
              <Lightning className="text-amber-500 h-4 w-4" />
              Test Simulator
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {view === 'assistant' && voiceProfile ? (
            <AIAssistantView 
              businessName={customer?.business_name || "Your Business"} 
              recentLogs={assistantLogs}
              onRefreshLogs={fetchAssistantLogs}
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
                  <Button 
                      onClick={() => setIsDemoOpen(true)}
                      className="h-14 px-10 rounded-2xl bg-[#3A9B9F] hover:bg-[#2F8488] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3A9B9F]/20 group"
                  >
                    Activate Your Assistant
                    <CaretRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
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

        {/* Demo Simulator Modal */}
        <AnimatePresence>
          {isDemoOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setIsDemoOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl h-[85vh] max-h-[800px] bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-[48px] shadow-2xl flex overflow-hidden mx-auto"
              >
                <AIDemoSimulator 
                  onClose={() => setIsDemoOpen(false)} 
                  initialVoiceProfile={voiceProfile}
                  initialBusinessBrief={customer?.business_brief as BusinessBrief || null}
                  customer={customer}
                  onVoiceProfileUpdate={(newProfile, newBrief) => {
                    setVoiceProfile(newProfile)
                    const body: Record<string, unknown> = { voiceProfile: newProfile }
                    if (newBrief) body.businessBrief = newBrief
                    getSupabase().auth.getSession().then(({ data: { session } }) => {
                      fetch('/api/ai/voice-profile', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session?.access_token}`
                        },
                        body: JSON.stringify(body)
                      })
                    })
                  }}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PlanGate>

  )
}

function AIDemoSimulator({ 
  onClose, 
  initialVoiceProfile,
  initialBusinessBrief,
  onVoiceProfileUpdate,
  customer
}: { 
  onClose: () => void, 
  initialVoiceProfile: AIVoiceProfile | null,
  initialBusinessBrief: BusinessBrief | null,
  onVoiceProfileUpdate: (profile: AIVoiceProfile, brief: BusinessBrief) => void,
  customer: Customer | null
}) {
  const [voiceProfile, setVoiceProfile] = useState<AIVoiceProfile | null>(initialVoiceProfile)
  const [businessBrief, setBusinessBrief] = useState<BusinessBrief>(
    initialBusinessBrief || (customer?.business_brief as BusinessBrief) || DEFAULT_BUSINESS_BRIEF
  )
  const [setupStep, setSetupStep] = useState(initialBusinessBrief ? -1 : 0)
  const [showSetup, setShowSetup] = useState(!initialVoiceProfile)
  const [trainingSample, setTrainingSample] = useState(initialVoiceProfile?.sampleReply || "")

  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isThinking])

  const PAYMENT_OPTIONS = ["Cash", "Zelle", "Card", "Wire Transfer", "WhatsApp Pay", "Pay Later"]
  const BUSINESS_TYPES = ["Tours & Experiences", "Boutique / Retail", "Salon & Beauty", "Restaurant / Food", "Bakery", "Real Estate", "Auto Services", "Photography", "Boat Charter", "General Services", "Other"]
  const AI_GOALS = [
    { value: "book", label: "Book Appointments", desc: "Move every chat toward a confirmed booking" },
    { value: "sell", label: "Close Sales", desc: "Guide customers to purchase your products" },
    { value: "capture", label: "Capture Leads", desc: "Collect info and build your pipeline" },
    { value: "faq", label: "Answer FAQs", desc: "Handle questions and triage to you" },
  ] as const

  const handleTrainAI = () => {
    if (!trainingSample.trim()) return
    const extracted = extractStyleFromSample(trainingSample)
    const newProfile: AIVoiceProfile = {
      tone: "casual",
      responseLength: trainingSample.split(/[.!?]/).length > 2 ? "medium" : "short",
      emojiUsage: extracted.emojiUsage,
      greeting: extracted.greeting,
      closer: "Let me know!",
      sampleReply: trainingSample,
      trainedAt: new Date().toISOString(),
      version: 1
    }
    setVoiceProfile(newProfile)
    onVoiceProfileUpdate(newProfile, businessBrief)
    setShowSetup(false)

    // Kick off the first demo message based on the business type
    const firstMsg = businessBrief.takesBookings
      ? `Hey! Do you have availability this week? How much would it be for 2 people?`
      : `Hi, what do you have available and how much does it cost?`

    setMessages([{ id: Date.now(), role: 'user', content: firstMsg }])
    setTimeout(async () => {
      setIsThinking(true)
      try {
        const { data: { session } } = await getSupabase().auth.getSession()
        const res = await fetch("/api/ai/demo", {
          method: "POST",
          headers: { 
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({
            message: firstMsg,
            businessType: businessBrief.businessType,
            services: businessBrief.services,
            voiceProfile: newProfile,
            brief: businessBrief,
            history: []
          })
        })
        const data = await res.json()
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: data.reply }])
      } catch {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: "Hey! Happy to help 😊 What are you looking for?" }])
      } finally {
        setIsThinking(false)
      }
    }, 900)
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return
    const historySnapshot = messages.map(m => ({ role: m.role as 'user' | 'ai', content: m.content }))
    const userMsg = { id: Date.now(), role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMsg])
    setInputValue("")
    setIsThinking(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch("/api/ai/demo", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          message: userMsg.content,
          businessType: businessBrief.businessType,
          services: businessBrief.services,
          voiceProfile: voiceProfile || DEFAULT_VOICE_PROFILE,
          brief: businessBrief,
          history: historySnapshot
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: "Let me check on that for you — what date were you thinking?" }])
    } finally {
      setIsThinking(false)
    }
  }

  const updateBrief = (patch: Partial<BusinessBrief>) =>
    setBusinessBrief(prev => ({ ...prev, ...patch }))

  const togglePayment = (method: string) => {
    const cur = businessBrief.paymentMethods
    updateBrief({ paymentMethods: cur.includes(method) ? cur.filter(m => m !== method) : [...cur, method] })
  }

  const STEPS = ["Identity", "Services", "Payment", "Booking", "Voice"]
  const canNext = [
    !!businessBrief.businessType,
    !!businessBrief.services.trim(),
    businessBrief.paymentMethods.length > 0,
    true,
    true
  ]

  // ─── Business Brief Setup Wizard ───
  if (showSetup) {
    return (
      <div className="flex flex-col w-full h-full bg-white dark:bg-[#0C0C0C] relative">
        <div className="absolute top-6 right-6 z-10">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-8 pt-8 pb-2">
          <div className="flex items-center gap-2 mb-4">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={cn(
                  "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all",
                  i < setupStep ? "text-[#3A9B9F]" : i === setupStep ? "text-[#213138] dark:text-white" : "text-gray-300 dark:text-gray-600"
                )}>
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all",
                    i < setupStep ? "bg-[#3A9B9F] text-white" : i === setupStep ? "bg-[#213138] dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-[#1C1C1C] text-gray-400"
                  )}>
                    {i < setupStep ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-px transition-all", i < setupStep ? "bg-[#3A9B9F]" : "bg-gray-100 dark:bg-[#1C1C1C]")} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <AnimatePresence mode="wait">
            {/* Step 0: Business Identity */}
            {setupStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-[#213138] dark:text-white tracking-tight">What kind of business are you?</h2>
                  <p className="text-sm text-gray-500 mt-1">Your AI will use this to sound like a real member of your team.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => updateBrief({ businessType: type })}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all text-left border",
                        businessBrief.businessType === type
                          ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                          : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-700 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">One-line tagline (optional)</label>
                  <input
                    value={businessBrief.tagline}
                    onChange={e => updateBrief({ tagline: e.target.value })}
                    placeholder={`e.g. ${businessBrief.businessType === 'Boutique / Retail' ? 'Caribbean-inspired women\'s fashion in Nassau' : 'Premium island tours from Nassau'}`}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none dark:text-white"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 1: Services & Pricing */}
            {setupStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#213138] dark:text-white tracking-tight">What do you offer and how much does it cost?</h2>
                  <p className="text-sm text-gray-500 mt-1">Your AI will quote exact prices from this list — be specific.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Services & Pricing</label>
                  <textarea
                    value={businessBrief.services}
                    onChange={e => updateBrief({ services: e.target.value })}
                    rows={6}
                    placeholder={businessBrief.businessType?.includes('Salon') 
                      ? "Women's cuts $50\nBlowout $35\nBraids from $80\nLocs maintenance $60\nChildren's cuts $30"
                      : businessBrief.businessType?.includes('Tour')
                      ? "Island tour for 2 – $150\nGroup tour (4+) – $100/person\nPrivate charter – $500/day\nAirport transfer – $45"
                      : "List each service on a new line with its price..."}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none resize-none dark:text-white font-mono"
                  />
                  <p className="text-[11px] text-gray-400">Format: Service name — price. One per line.</p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment & Logistics */}
            {setupStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#213138] dark:text-white tracking-tight">How do your customers pay?</h2>
                  <p className="text-sm text-gray-500 mt-1">Your AI will tell customers exactly how to pay — select all that apply.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_OPTIONS.map(method => (
                    <button
                      key={method}
                      onClick={() => togglePayment(method)}
                      className={cn(
                        "px-4 py-2 rounded-full text-[13px] font-bold transition-all border",
                        businessBrief.paymentMethods.includes(method)
                          ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                          : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                      )}
                    >
                      {businessBrief.paymentMethods.includes(method) && "✓ "}{method}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl">
                  <div>
                    <p className="text-[13px] font-bold dark:text-white">Delivery or Pickup available?</p>
                    <p className="text-[11px] text-gray-500">AI will mention this when relevant</p>
                  </div>
                  <Switch checked={businessBrief.hasDelivery} onCheckedChange={v => updateBrief({ hasDelivery: v })} />
                </div>
              </motion.div>
            )}

            {/* Step 3: Booking */}
            {setupStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#213138] dark:text-white tracking-tight">How do customers book or order?</h2>
                  <p className="text-sm text-gray-500 mt-1">Your AI will guide every conversation toward this action.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl">
                  <div>
                    <p className="text-[13px] font-bold dark:text-white">Do you take bookings / appointments?</p>
                    <p className="text-[11px] text-gray-500">Turn on if customers schedule in advance</p>
                  </div>
                  <Switch checked={businessBrief.takesBookings} onCheckedChange={v => updateBrief({ takesBookings: v })} />
                </div>

                {businessBrief.takesBookings && (
                  <div className="space-y-3 pl-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">How do they book?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["WhatsApp", "Phone Call", "Walk-in", "Online Link"].map(m => (
                        <button
                          key={m}
                          onClick={() => updateBrief({ bookingMethod: m })}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-[12px] font-bold border transition-all",
                            businessBrief.bookingMethod === m
                              ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                              : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300"
                          )}
                        >{m}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Typical availability / lead time</label>
                  <input
                    value={businessBrief.availability}
                    onChange={e => updateBrief({ availability: e.target.value })}
                    placeholder="e.g. Usually available same week, Book 24 hrs ahead, Walk-ins welcome"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">What should the AI focus on?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_GOALS.map(g => (
                      <button
                        key={g.value}
                        onClick={() => updateBrief({ aiGoal: g.value })}
                        className={cn(
                          "p-3 rounded-xl text-left border transition-all",
                          businessBrief.aiGoal === g.value
                            ? "bg-[#3A9B9F]/10 border-[#3A9B9F] text-[#3A9B9F]"
                            : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300"
                        )}
                      >
                        <p className="text-[12px] font-black">{g.label}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">{g.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Voice Training */}
            {setupStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-[#213138] dark:text-white tracking-tight">Teach it how you text</h2>
                  <p className="text-sm text-gray-500 mt-1">Show your AI one real reply you'd send a customer — it'll copy your style automatically.</p>
                </div>

                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-base flex-shrink-0">👤</div>
                    <div className="bg-white dark:bg-[#1C1C1C] px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm">
                      <p className="text-sm font-medium text-[#213138] dark:text-gray-200">
                        {businessBrief.takesBookings 
                          ? "Hey, do you have availability this Saturday for 2 people?"
                          : "Hi, what do you have available and how much?"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">How would YOU reply?</label>
                    <textarea
                      value={trainingSample}
                      onChange={e => setTrainingSample(e.target.value)}
                      rows={4}
                      placeholder={businessBrief.businessType?.includes('Salon')
                        ? "Hey! Yes we have openings this Saturday 😊 Women's cuts are $50 and blowouts are $35. Want to lock in a time?"
                        : "Hey! Sure do 😄 It's $150 for 2 people — want me to pencil you in for Saturday?"}
                      className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none resize-none dark:text-white"
                    />
                    <p className="text-[11px] text-gray-400">Your AI copies your tone, emoji style, and reply length from this.</p>
                  </div>
                </div>

                <Button
                  onClick={handleTrainAI}
                  className="w-full h-12 rounded-2xl bg-[#3A9B9F] hover:bg-[#2F8488] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3A9B9F]/20"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Train AI & Start Demo
                </Button>

                <button
                  onClick={() => {
                    setVoiceProfile(DEFAULT_VOICE_PROFILE)
                    setShowSetup(false)
                  }}
                  className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#3A9B9F] transition-colors text-center"
                >
                  Skip voice training — use default casual style
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {setupStep < 4 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setSetupStep(s => Math.max(0, s - 1))}
                className={cn("text-[12px] font-bold text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors", setupStep === 0 && "opacity-0 pointer-events-none")}
              >
                ← Back
              </button>
              <Button
                onClick={() => setSetupStep(s => s + 1)}
                disabled={!canNext[setupStep]}
                className="h-10 px-8 rounded-2xl bg-[#213138] dark:bg-white hover:opacity-90 text-white dark:text-black font-black text-[12px] uppercase tracking-widest disabled:opacity-40"
              >
                Continue →
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar: Context */}
      <div className="w-1/3 bg-gray-50/50 dark:bg-white/5 border-r border-gray-100 dark:border-[#1C1C1C] p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-[#213138] dark:text-white uppercase tracking-tight">Simulator</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Business Brief Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Business Brief</label>
            <button
              onClick={() => { setShowSetup(true); setSetupStep(0) }}
              className="text-[9px] font-bold uppercase text-gray-500 hover:text-[#3A9B9F] border border-gray-200 dark:border-[#1C1C1C] px-2 py-1 rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-[#1C1C1C] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Buildings className="h-3.5 w-3.5 text-[#3A9B9F] shrink-0" />
              <span className="text-[12px] font-bold dark:text-white truncate">{businessBrief.businessType || "Not set"}</span>
            </div>
            {businessBrief.tagline && (
              <p className="text-[11px] text-gray-400 italic pl-5 leading-snug">&ldquo;{businessBrief.tagline}&rdquo;</p>
            )}
            {businessBrief.services && (
              <div className="flex items-start gap-2 pt-1">
                <CurrencyDollar className="h-3.5 w-3.5 text-[#3A9B9F] mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-500 leading-snug whitespace-pre-line line-clamp-4">{businessBrief.services}</p>
              </div>
            )}
            {businessBrief.paymentMethods.length > 0 && (
              <div className="flex items-center gap-2">
                <Money className="h-3.5 w-3.5 text-[#3A9B9F] shrink-0" />
                <span className="text-[11px] text-gray-500">{businessBrief.paymentMethods.join(", ")}</span>
              </div>
            )}
            {businessBrief.availability && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#3A9B9F] shrink-0" />
                <span className="text-[11px] text-gray-500">{businessBrief.availability}</span>
              </div>
            )}
          </div>
        </div>

        {/* Voice Profile */}
        <div className="p-4 bg-[#3A9B9F]/5 rounded-2xl border border-[#3A9B9F]/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#3A9B9F] h-4 w-4" />
              <h4 className="text-[10px] font-black uppercase text-[#3A9B9F] tracking-widest">Active Voice</h4>
            </div>
            <button
              onClick={() => { setShowSetup(true); setSetupStep(4) }}
              className="text-[9px] font-bold uppercase text-gray-500 hover:text-[#3A9B9F] border border-gray-200 dark:border-[#1C1C1C] px-2 py-1 rounded-lg transition-colors"
            >
              Retrain
            </button>
          </div>
          {voiceProfile ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Tone:</span>
                <span className="font-bold text-[#213138] dark:text-gray-200 capitalize">{voiceProfile.tone}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Emojis:</span>
                <span className="font-bold text-[#213138] dark:text-gray-200 capitalize">{voiceProfile.emojiUsage}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Goal:</span>
                <span className="font-bold text-[#213138] dark:text-gray-200 capitalize">{businessBrief.aiGoal || "book"}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
              No voice trained yet.
            </p>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
          <p className="text-[9px] font-black text-gray-300 dark:text-[#333] uppercase tracking-[0.2em] text-center">Powered by Gemini 2.5 Flash</p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#080808] relative">
        {/* Chat Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-[#1C1C1C] flex items-center gap-4 bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-10 font-poppins">
            <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center p-2 shadow-lg shadow-green-500/20">
                <WhatsappLogo width="24" height="24" fill="white" />
            </div>
            <div>
                <h4 className="text-sm font-black text-[#213138] dark:text-white">Customer Demo (WhatsApp)</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">AI Status: Optimal</span>
                </div>
            </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar bg-[url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/whatsapp-bg-R3G9B9G9B9G9B9G9B9.png')] bg-fixed opacity-90 transition-all duration-500"
        >
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-12">
                    <div className="h-16 w-16 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                        <Waveform className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#213138] dark:text-white mb-2">Simulate a message</p>
                    <p className="text-[11px] font-bold text-gray-500 leading-relaxed max-w-[200px]">Type something like "Hey, do you deliver?" to see the protocol in action.</p>
                </div>
            )}
            
            {messages.map((m) => (
                <motion.div 
                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    key={m.id} 
                    className={cn(
                        "flex",
                        m.role === 'user' ? "justify-end" : "justify-start"
                    )}
                >
                    <div className={cn(
                        "max-w-[80%] px-5 py-3 rounded-2xl text-[14px] font-medium shadow-sm relative",
                        m.role === 'user' 
                            ? "bg-[#D9FDD3] dark:bg-[#005C4B] text-black dark:text-white rounded-tr-none" 
                            : "bg-white dark:bg-[#1C1C1C] text-[#213138] dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-white/5"
                    )}>
                        {m.content}
                        <div className={cn(
                            "text-[8px] mt-1 font-bold uppercase tracking-widest text-right opacity-40",
                            m.role === 'user' ? "text-green-900 dark:text-green-100" : "text-gray-500"
                        )}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </motion.div>
            ))}

            {isThinking && (
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-start"
                >
                    <div className="bg-white dark:bg-[#1C1C1C] text-[#3A9B9F] px-5 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-white/5 text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        <DotsThreeCircle className="h-4 w-4 animate-bounce" />
                        AI is thinking...
                    </div>
                </motion.div>
            )}
        </div>

        {/* Input */}
        <div className="p-8 bg-gray-50/50 dark:bg-black backdrop-blur-md border-t border-gray-100 dark:border-[#1C1C1C]">
            <div className="relative group">
                <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a customer question..."
                    className="w-full pl-6 pr-16 py-4 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-2xl text-sm font-bold outline-none focus:ring-1 focus:ring-[#3A9B9F] transition-all dark:text-white"
                />
                <button 
                  onClick={handleSend}
                  disabled={isThinking || !inputValue.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#3A9B9F] text-white rounded-xl hover:bg-[#2F8488] transition-all disabled:opacity-50"
                >
                    <PaperPlaneRight className="h-4 w-4" />
                </button>
            </div>
            <p className="mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Simulation: Customer sends a message to your business.</p>
        </div>
      </div>
    </div>
  )
}

function WhatsappLogo({ width, height, fill }: { width: string, height: string, fill: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill={fill}>
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.284l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.768-5.764-5.768zm3.393 8.204c-.185.52-.91 1.026-1.255 1.104-.343.077-.732.143-1.246-.023-.3-.096-.689-.258-1.18-.466-2.091-.884-3.418-2.981-3.523-3.12-.105-.14-.784-.94-.784-1.794 0-.853.447-1.272.607-1.442.16-.17.348-.214.464-.214.116 0 .232.001.332.005.105.004.246-.04.385.295.143.344.49 1.192.532 1.278.043.086.072.186.014.3-.058.114-.087.186-.174.286-.087.1-.183.224-.261.303-.09.09-.184.188-.08.367.104.179.463.764.993 1.236.684.609 1.26.799 1.44.89.179.089.284.075.39-.046.106-.121.455-.53.576-.711.121-.181.242-.151.408-.09.167.06 1.057.498 1.24.588.183.09.304.135.348.21.044.075.044.436-.142.956zM12 21.75c-5.376 0-9.75-4.374-9.75-9.75S6.624 2.25 12 2.25s9.75 4.374 9.75 9.75-4.374 9.75-9.75 9.75zm0-18C7.451 3.75 3.75 7.451 3.75 12c0 4.549 3.701 8.25 8.25 8.25 4.549 0 8.25-3.701 8.25-8.25 0-4.549-3.701-8.25-8.25-8.25z"/>
        </svg>
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
