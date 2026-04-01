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

const TOUR_CONVERSATION = [
  { id: 1, role: 'user', text: "Hey! Do you have any spots left for the Swimming with Pigs tour tomorrow morning in Exuma?", time: "15:30" },
  { id: 2, role: 'ai', text: "Yes! We have 4 spots left for the 9 AM departure tomorrow. Would you like me to reserve those for you now?", time: "15:31" },
]

export default function AISimulatorPage() {
  const [messages, setMessages] = useState([TOUR_CONVERSATION[0]])
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [isAutoPilot, setIsAutoPilot] = useState(false)
  const [demoStep, setDemoStep] = useState(0)

  useEffect(() => {
    // Reset simulation when demoStep changes to 0
    if (demoStep === 0) {
      setMessages([TOUR_CONVERSATION[0]])
      setSuggestion(null)
      setIsThinking(false)
      
      const timer1 = setTimeout(() => {
        setIsThinking(true)
        const timer2 = setTimeout(() => {
          setIsThinking(false)
          const text = TOUR_CONVERSATION[1].text
          
          if (isAutoPilot) {
            // AUTO-PILOT MODE: Auto-send after brief delay
            const timer3 = setTimeout(() => {
              setMessages(prev => [...prev, { ...TOUR_CONVERSATION[1], id: Date.now() }])
            }, 1000)
            return () => clearTimeout(timer3)
          } else {
            // MANUAL MODE: Show suggestion
            setSuggestion(text)
          }
        }, 2000)
        return () => clearTimeout(timer2)
      }, 1000)
      return () => clearTimeout(timer1)
    }
  }, [demoStep, isAutoPilot])

  const handleSend = () => {
    setMessages(prev => [...prev, { ...TOUR_CONVERSATION[1], id: Date.now() }])
    setSuggestion(null)
  }

  const resetDemo = () => {
    setDemoStep(prev => prev + 1)
    setTimeout(() => setDemoStep(0), 10)
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
                Tour Operator AI Demo
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">Auto-Pilot Ready</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Showcasing: Automated Booking & Availability</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Auto-Pilot Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
               <span className={cn("text-[10px] font-black uppercase tracking-widest transition-all", isAutoPilot ? "text-gray-400" : "text-[#007B85]")}>Manual</span>
               <button 
                  onClick={() => { setIsAutoPilot(!isAutoPilot); resetDemo(); }}
                  className={cn(
                    "w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center shadow-inner",
                    isAutoPilot ? "bg-emerald-500 justify-end" : "bg-gray-200 dark:bg-white/10 justify-start"
                  )}
               >
                  <motion.div layout className="h-4 w-4 bg-white rounded-full shadow-md" />
               </button>
               <span className={cn("text-[10px] font-black uppercase tracking-widest transition-all", isAutoPilot ? "text-emerald-500" : "text-gray-400")}>Auto-Pilot</span>
            </div>

            <Button onClick={resetDemo} variant="outline" className="h-10 rounded-xl border-gray-200 dark:border-white/5 font-black uppercase text-[10px] tracking-widest hover:bg-[#007B85]/10 hover:text-[#007B85]">
               Reset Demo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Phone Simulator */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-[#0C0C0C] rounded-[3.5rem] border border-gray-200 dark:border-[#1C1C1C] shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative aspect-[9/18] max-w-[380px] mx-auto border-[12px] border-gray-800 dark:border-[#121212]">
            {/* Phone Header */}
            <div className="bg-[#007B85] px-8 pt-14 pb-6 text-white">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center relative">
                  <User weight="bold" size={20} />
                  <div className="absolute bottom-0.5 right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-[#007B85]" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight italic">Exuma Explorer</h3>
                  <div className="flex items-center gap-1.5 opacity-70">
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Target: WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-8 space-y-8 h-[calc(100%-180px)] overflow-y-auto bg-gray-50/50 dark:bg-[#080808]">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.role === 'user' ? -20 : 20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    className={cn(
                      "max-w-[90%] p-5 rounded-[2.5rem] text-[15px] font-medium leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? "bg-white dark:bg-[#1C1C1C] text-[#213138] dark:text-white rounded-tl-none border border-gray-100 dark:border-white/5 mr-auto" 
                        : "bg-[#007B85] text-white rounded-tr-none ml-auto"
                    )}
                  >
                    {msg.text}
                    <div className={cn("text-[9px] font-black uppercase mt-3 opacity-40", msg.role === 'user' ? "text-right" : "text-left")}>
                      {msg.time} {msg.role === 'ai' && "• AUTO-PILOT SENT"}
                    </div>
                  </motion.div>
                ))}

                {isThinking && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 text-[11px] font-black text-[#007B85] uppercase tracking-[0.3em] italic ml-6"
                  >
                    <div className="flex gap-1.5">
                      <div className="h-1.5 w-1.5 bg-[#007B85] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="h-1.5 w-1.5 bg-[#007B85] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="h-1.5 w-1.5 bg-[#007B85] rounded-full animate-bounce" />
                    </div>
                    Tropi AI Analyzing...
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
                  className="absolute bottom-8 left-6 right-6 bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl border border-[#007B85]/30 rounded-[2.5rem] p-6 shadow-2xl z-20"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkle weight="fill" className="text-[#007B85] h-4 w-4" />
                    <span className="text-[11px] font-black text-[#007B85] uppercase tracking-[0.2em]">Knowledge-Based Suggestion</span>
                  </div>
                  <p className="text-[14px] font-medium text-[#213138] dark:text-gray-200 italic mb-6 leading-relaxed">
                    "{suggestion}"
                  </p>
                  <Button 
                    onClick={handleSend}
                    className="w-full bg-[#007B85] hover:bg-[#2F8488] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest gap-2 h-12 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                  >
                    <PaperPlaneTilt weight="fill" className="h-4 w-4" /> Send Text Instantly
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Demo Info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-[2.5rem] p-10 space-y-8 shadow-sm">
            <h2 className="text-[12px] font-black text-[#007B85] uppercase tracking-[0.3em]">The Auto-Pilot Advantage</h2>
            <div className="space-y-6">
              <FeatureItem 
                icon={<Robot weight="duotone" className="h-7 w-7 text-[#007B85]" />}
                title="No Approval Necessary"
                desc="Turn on Auto-Pilot and let Tropi AI handle the booking while you're offshore."
              />
              <FeatureItem 
                icon={<Lightning weight="duotone" className="h-7 w-7 text-[#007B85]" />}
                title="Immediate Conversion"
                desc="Leads are hottest in the first 2 minutes. Auto-Pilot closes them in 2 seconds."
              />
              <FeatureItem 
                icon={<ShieldCheck weight="duotone" className="h-7 w-7 text-[#007B85]" />}
                title="Knowledge Secured"
                desc="It only says what you tell it to. It knows your tours, your prices, and your rules."
              />
            </div>
          </div>

          <div className="bg-[#007B85] rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-xl shadow-teal-500/20">
            <h3 className="text-3xl font-black italic tracking-tight mb-4 uppercase leading-tight">"I'm out on the boat."</h3>
            <p className="text-base font-medium leading-relaxed opacity-80 mb-8 italic">
              "Tell them: When you're driving the boat or diving with customers, you're LOSING MONEY on the phone. Auto-Pilot keeps your calendar full so you don't even have to look at your screen to make $500."
            </p>
            <div className="flex items-center gap-4">
               <div className="h-3 w-3 bg-white rounded-full animate-ping" />
               <span className="text-[12px] font-black uppercase tracking-[0.3em]">The Lamar Standard Closing Logic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-5 p-5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-3xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/5">
      <div className="mt-1 p-2 bg-gray-50 dark:bg-white/5 rounded-xl">{icon}</div>
      <div>
        <h4 className="text-[15px] font-black text-[#213138] dark:text-white uppercase tracking-tight leading-none mb-2">{title}</h4>
        <p className="text-[13px] text-gray-400 font-bold leading-relaxed">{desc}</p>
      </div>
    </div>
)
}
