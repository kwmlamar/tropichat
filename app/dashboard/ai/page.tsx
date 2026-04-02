"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Sparkle, 
  ChatCircleDots, 
  CalendarCheck, 
  Target, 
  Lightning,
  CaretRight,
  X,
  PaperPlaneRight,
  DotsThreeCircle,
  MagicWand,
  Waveform
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PlanGate } from "@/components/billing/PlanGate"
import { getCurrentCustomer } from "@/lib/supabase"
import type { Customer } from "@/types/database"
import { AnimatePresence } from "framer-motion"
import { extractStyleFromSample, DEFAULT_VOICE_PROFILE } from "@/lib/ai-schema"
import type { AIVoiceProfile } from "@/lib/ai-schema"

export default function TropiAIPage() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [voiceProfile, setVoiceProfile] = useState<AIVoiceProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoOpen, setIsDemoOpen] = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data } = await getCurrentCustomer()
      setCustomer(data)
      setVoiceProfile(data?.ai_voice_profile as AIVoiceProfile || null)
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
      <div className="flex flex-col min-h-full bg-white dark:bg-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-[#1C1C1C] flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black text-[#213138] dark:text-white flex items-center gap-2 uppercase tracking-tight">
              Tropi AI
              <span className="text-[10px] bg-[#3A9B9F]/10 text-[#3A9B9F] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-[#3A9B9F]/20">Beta</span>
            </h1>
            <p className="text-sm font-bold text-gray-500 dark:text-[#525252] mt-0.5">Automate your customer communication with Gemini 1.5 Flash</p>
          </div>
          <Button 
            onClick={() => setIsDemoOpen(true)}
            variant="outline" 
            className="rounded-xl border-gray-200 dark:border-[#1C1C1C] font-black uppercase tracking-widest text-[11px] gap-2 hover:bg-[#3A9B9F]/10 hover:border-[#3A9B9F]/30 hover:text-[#3A9B9F] transition-all"
          >
            <Lightning weight="fill" className="text-amber-500 h-4 w-4" />
            Test My Agent
          </Button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
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
            <Button 
                onClick={() => setIsDemoOpen(true)}
                className="h-14 px-10 rounded-2xl bg-[#3A9B9F] hover:bg-[#2F8488] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3A9B9F]/20 group"
            >
              Activate Tropi AI
              <CaretRight weight="bold" className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-8 text-[11px] font-bold text-gray-400 dark:text-[#525252] uppercase tracking-widest flex items-center gap-2">
              <Sparkle weight="fill" className="h-3 w-3 text-amber-500" />
              Tropi AI is in Beta. Built for the modern Caribbean business.
            </p>
          </motion.div>
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
                  onVoiceProfileUpdate={(newProfile) => {
                    setVoiceProfile(newProfile)
                    // Persist to DB asynchronously
                    fetch('/api/ai/voice-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ voiceProfile: newProfile })
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
  onVoiceProfileUpdate
}: { 
  onClose: () => void,
  initialVoiceProfile: AIVoiceProfile | null,
  onVoiceProfileUpdate: (profile: AIVoiceProfile) => void
}) {
  const [businessType, setBusinessType] = useState("Bahamas Tours")
  const [services, setServices] = useState("Island tours, Snorkeling trips, Private charters, Airport transfers, Group excursions")
  
  const [voiceProfile, setVoiceProfile] = useState<AIVoiceProfile | null>(initialVoiceProfile)
  const [showQuickTrain, setShowQuickTrain] = useState(!initialVoiceProfile)
  const [trainingSample, setTrainingSample] = useState("")

  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  const handleTrainAI = () => {
    if (!trainingSample.trim()) return
    
    // 1-Question Extraction Magic
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
    onVoiceProfileUpdate(newProfile)
    setShowQuickTrain(false)
    
    // Start demo with an automatic incoming message
    setMessages([{ id: Date.now(), role: 'user', content: "Hey, how much is a tour for 4 people this Saturday?" }])
    
    // Automatically trigger AI reply
    setTimeout(async () => {
      setIsThinking(true)
      try {
        const res = await fetch("/api/ai/demo", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            message: "Hey, how much is a tour for 4 people this Saturday?",
            businessType,
            services,
            voiceProfile: newProfile
            })
        })
        const data = await res.json()
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: data.reply }])
      } catch (err) {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: "Hey! We'd love to take you out. It's $200 for 4 people. Let me know if you want to book! 😊" }])
      } finally {
        setIsThinking(false)
      }
    }, 1000)
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return
    
    const userMsg = { id: Date.now(), role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMsg])
    setInputValue("")
    setIsThinking(true)

    try {
      const res = await fetch("/api/ai/demo", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.content,
          businessType,
          services,
          voiceProfile: voiceProfile || DEFAULT_VOICE_PROFILE
        })
      })
      const data = await res.json()
      
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: "Hi there! This is Tropi AI. How can I help you with our services today? 😊" }])
    } finally {
      setIsThinking(false)
    }
  }

  // ─── Quick Train Screen ───
  if (showQuickTrain) {
    return (
      <div className="flex flex-col w-full h-full bg-white dark:bg-[#0C0C0C] relative">
        <div className="absolute top-8 right-8 z-10">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all">
                <X weight="bold" className="h-5 w-5 text-gray-500" />
            </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-8">
            <div className="w-16 h-16 bg-[#3A9B9F]/10 rounded-3xl flex items-center justify-center mb-8">
                <Sparkle weight="fill" className="h-8 w-8 text-[#3A9B9F]" />
            </div>
            
            <h2 className="text-3xl font-black text-[#213138] dark:text-white mb-2 text-center tracking-tight">Teach your AI how to talk</h2>
            <p className="text-sm font-bold text-gray-500 dark:text-[#525252] text-center mb-10">
                A chatbot shouldn't sound like a robot. <br/> Answer ONE question so it learns your style (takes 30 seconds).
            </p>

            <div className="w-full bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-3xl p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                    <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">👩🏽</span>
                    </div>
                    <div className="bg-white dark:bg-[#1C1C1C] px-5 py-3 rounded-2xl rounded-tl-none shadow-sm">
                        <p className="text-sm font-medium text-[#213138] dark:text-gray-200">
                            "Hey, how much is a tour for 4 people this Saturday?"
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">
                        Type how YOU would actually reply:
                    </label>
                    <textarea 
                        value={trainingSample}
                        onChange={(e) => setTrainingSample(e.target.value)}
                        placeholder="e.g. Hey! Thanks for reaching out. We'd love to take you out. It's $200 for 4 people. Let me know if you want to book! 😊"
                        className="w-full p-5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none transition-all h-32 resize-none shadow-inner"
                    />
                </div>
            </div>

            <Button 
                onClick={handleTrainAI}
                disabled={!trainingSample.trim()}
                className="w-full h-14 rounded-2xl bg-[#3A9B9F] hover:bg-[#2F8488] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-[#3A9B9F]/20 disabled:opacity-50"
            >
                Train AI & Start Demo
            </Button>
            
            <button 
                onClick={() => {
                    setVoiceProfile(DEFAULT_VOICE_PROFILE)
                    setShowQuickTrain(false)
                }}
                className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#3A9B9F] transition-colors"
            >
                Skip training (Use default casual voice)
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar: Context */}
      <div className="w-1/3 bg-gray-50/50 dark:bg-white/5 border-r border-gray-100 dark:border-[#1C1C1C] p-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-[#213138] dark:text-white uppercase tracking-tight">Simulator</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><X weight="bold" className="h-4 w-4" /></button>
        </div>
        
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Business Intelligence</label>
                <div className="relative group">
                    <MagicWand weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3A9B9F] h-4 w-4 opacity-50 transition-opacity group-focus-within:opacity-100" />
                    <input 
                        type="text" 
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        placeholder="e.g. Boutique Nassau"
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-1 focus:ring-[#3A9B9F] outline-none transition-all dark:text-white"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Services</label>
                <textarea 
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    placeholder="e.g. Delivery, Custom orders..."
                    className="w-full p-4 bg-white dark:bg-black border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-1 focus:ring-[#3A9B9F] outline-none transition-all h-24 resize-none dark:text-white"
                />
            </div>

            <div className="p-4 bg-[#3A9B9F]/5 rounded-2xl border border-[#3A9B9F]/10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkle weight="fill" className="text-[#3A9B9F] h-4 w-4" />
                        <h4 className="text-[10px] font-black uppercase text-[#3A9B9F] tracking-widest">Active Voice</h4>
                    </div>
                    <button 
                        onClick={() => setShowQuickTrain(true)}
                        className="text-[9px] font-bold uppercase text-gray-500 hover:text-[#3A9B9F] border border-gray-200 px-2 py-1 rounded transition-colors"
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
                            <span className="text-gray-500 font-medium">Length:</span>
                            <span className="font-bold text-[#213138] dark:text-gray-200 capitalize">{voiceProfile.responseLength}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                        Default generic voice is active.
                    </p>
                )}
            </div>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
            <p className="text-[9px] font-black text-gray-300 dark:text-[#333] uppercase tracking-[0.2em] text-center">Powered by Gemini 2.0 Flash</p>
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
                        <Waveform weight="bold" className="h-8 w-8" />
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
                        <DotsThreeCircle weight="fill" className="h-4 w-4 animate-bounce" />
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
                    <PaperPlaneRight weight="fill" className="h-4 w-4" />
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
          Configure <CaretRight weight="bold" className="h-2.5 w-2.5" />
        </span>
      </div>
    </motion.div>
  )
}
