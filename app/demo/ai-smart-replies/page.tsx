"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkle, 
  WhatsappLogo, 
  PaperPlaneTilt, 
  User, 
  Robot,
  Lightning,
  CaretRight,
  ShieldCheck,
  Globe,
  Info
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DEMO_CONVERSATION = [
  { id: 1, role: 'user', text: "Hey! Just saw your boutique online. Do you have those linen shirts in stock in Nassau?", time: "14:20" },
  { id: 2, role: 'ai-suggest', text: "Yes! We just got a fresh shipment of the Island Linen collection in our Nassau and Freeport shops. Which size were you looking for?", status: 'thinking' },
]

export default function AISimulatorPage() {
  const [messages, setMessages] = useState(DEMO_CONVERSATION.slice(0, 1))
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [hasSent, setHasSent] = useState(false)

  useEffect(() => {
    // Stage 1: Initial load, wait 2s then 'start thinking'
    setTimeout(() => {
      setIsThinking(true)
      // Stage 2: Wait 3s then show suggestion
      setTimeout(() => {
        setIsThinking(false)
        setSuggestion(DEMO_CONVERSATION[1].text)
      }, 2500)
    }, 1500)
  }, [])

  const handleSend = () => {
    setHasSent(true)
    setMessages([...messages, { id: Date.now(), role: 'ai', text: suggestion!, time: "14:21" }])
    setSuggestion(null)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-black font-sans selection:bg-[#007B85]/20">
      {/* Demo Header */}
      <div className="bg-white dark:bg-[#0C0C0C] border-b border-gray-100 dark:border-[#1C1C1C] px-8 py-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#007B85]/10 rounded-2xl flex items-center justify-center">
              <Sparkle weight="fill" className="text-[#007B85] h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#213138] dark:text-white uppercase tracking-tight flex items-center gap-2">
                Live AI Smart Reply Demo
                <span className="text-[9px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/20">LIVE SIMULATION</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Showcasing: Deep Business Knowledge Training</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-[#007B85] uppercase tracking-widest flex items-center gap-2 bg-[#007B85]/5 px-3 py-1.5 rounded-lg border border-[#007B85]/10">
              <ShieldCheck weight="fill" /> Lamar Standard Secure
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Phone Simulator */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#0C0C0C] rounded-[3rem] border border-gray-200 dark:border-[#1C1C1C] shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative aspect-[9/16] max-w-[380px] mx-auto border-[8px] border-gray-800 dark:border-[#1C1C1C]">
            {/* Phone Header */}
            <div className="bg-[#007B85] px-6 pt-12 pb-4 text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center relative">
                  <User weight="bold" />
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-[#007B85]" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight">Customer (Nassau)</h3>
                  <div className="flex items-center gap-1 opacity-60">
                    <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Active via WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-6 space-y-6 h-[calc(100%-160px)] overflow-y-auto bg-gray-50 dark:bg-[#080808]">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.role === 'user' ? -20 : 20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    className={cn(
                      "max-w-[85%] p-4 rounded-[2rem] text-sm font-medium leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-white dark:bg-[#1C1C1C] text-[#213138] dark:text-white rounded-tl-none shadow-sm mr-auto border border-gray-100 dark:border-white/5" 
                        : "bg-[#007B85] text-white rounded-tr-none shadow-lg ml-auto"
                    )}
                  >
                    {msg.text}
                    <div className={cn("text-[8px] font-black uppercase mt-2 opacity-40", msg.role === 'user' ? "text-right" : "text-left")}>
                      {msg.time}
                    </div>
                  </motion.div>
                ))}

                {isThinking && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-[10px] font-black text-[#007B85] uppercase tracking-widest italic ml-4"
                  >
                    <div className="flex gap-1">
                      <div className="h-1 w-1 bg-[#007B85] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="h-1 w-1 bg-[#007B85] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="h-1 w-1 bg-[#007B85] rounded-full animate-bounce" />
                    </div>
                    Tropi AI is thinking...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Suggestion Over-layer */}
            <AnimatePresence>
              {suggestion && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-6 left-4 right-4 bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl border border-[#007B85]/30 rounded-[2rem] p-5 shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkle weight="fill" className="text-[#007B85] h-3.5 w-3.5" />
                    <span className="text-[10px] font-black text-[#007B85] uppercase tracking-[0.2em]">Smart Reply Suggestion</span>
                  </div>
                  <p className="text-[13px] font-medium text-[#213138] dark:text-gray-200 italic mb-4 leading-relaxed">
                    "{suggestion}"
                  </p>
                  <Button 
                    onClick={handleSend}
                    className="w-full bg-[#007B85] hover:bg-[#2F8488] text-white rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 h-10 transition-all active:scale-95"
                  >
                    <PaperPlaneTilt weight="fill" /> Send Suggested Answer
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Demo Info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-[2.5rem] p-8 space-y-6">
            <h2 className="text-[11px] font-black text-[#007B85] uppercase tracking-[0.3em]">The Value Proposition</h2>
            <div className="space-y-4">
              <FeatureItem 
                icon={<Robot weight="duotone" className="h-6 w-6 text-[#007B85]" />}
                title="Business Intelligence"
                desc="Trained specifically on your stock, services, and local Caribbean context."
              />
              <FeatureItem 
                icon={<Lightning weight="duotone" className="h-6 w-6 text-[#007B85]" />}
                title="Instant Gratification"
                desc="Reply in 2 seconds while you're busy running your business."
              />
              <FeatureItem 
                icon={<Globe weight="duotone" className="h-6 w-6 text-[#007B85]" />}
                title="Multi-Channel"
                desc="Same intelligence works across WhatsApp, IG, and Messenger."
              />
            </div>
          </div>

          <div className="bg-[#007B85] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
            <h3 className="text-2xl font-black italic tracking-tight mb-3">Winning Strategy</h3>
            <p className="text-sm font-medium leading-relaxed opacity-80 mb-6">
              "Show them that the AI isn't generic. It knows their shop specifically. It feels like they just hired a sales assistant that never sleeps."
            </p>
            <div className="flex items-center gap-3">
               <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Lamar Standard Closing Logic</span>
            </div>
          </div>

          <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
            <Info weight="bold" className="text-amber-600 h-5 w-5 mt-0.5" />
            <p className="text-[11px] font-medium text-amber-900/60 dark:text-amber-500/40 uppercase tracking-widest leading-relaxed">
              Note: This is a simulation environment for demo purposes. Live AI activation requires Pro or Elite membership plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/5">
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="text-[13px] font-black text-[#213138] dark:text-white uppercase tracking-tight">{title}</h4>
        <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">{desc}</p>
      </div>
    </div>
)
}
