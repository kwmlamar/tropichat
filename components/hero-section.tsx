"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Sparkle as Sparkles,
  WhatsappLogo as Whatsapp,
  InstagramLogo as Instagram,
  MessengerLogo as Messenger,
  ArrowRight,
  ChatCircleDots as MessageSquare,
  CheckCircle,
  TrendUp,
  Robot
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

// ─── Floating Chat Bubble Component ──────────────────────────────────────────

function FloatingBubble({ 
  children, 
  delay = 0, 
  className,
  position 
}: { 
  children: React.ReactNode, 
  delay?: number, 
  className?: string,
  position: { top?: string, left?: string, right?: string, bottom?: string }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay: delay + 1, 
        duration: 0.5, 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
      style={position}
      className={cn(
        "absolute z-30 hidden md:flex items-center gap-3 bg-white/90 dark:bg-black/80 backdrop-blur-md p-3 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.3)] border border-white/10",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// ─── Main Hero Section (Full-Bleed Version) ──────────────────────────────────

export function HeroSection() {
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById("pricing")
    waitlistSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-black pt-56 pb-20">
      
      {/* 📸 ULTRA-HD FULL-BLEED BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/hero_background_v2.png" 
          alt="Premium Caribbean Entrepreneur using TropiChat"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        {/* Dark Immersion Overlay (to ensure text contrast) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-10" />
      </div>
      
      <div className="container mx-auto px-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side: Content Overlay */}
          <div className="lg:col-span-8 flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <Sparkles weight="fill" className="h-4 w-4 text-amber-400" />
              Caribbean's #1 Social Sales Hub
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-8"
            >
              Make the <br /> most out of <br />
              <span className="text-[#007B85] drop-shadow-2xl">every chat.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-300 font-bold max-w-xl mb-12 leading-tight uppercase tracking-wide"
            >
              Sell more, engage better, and grow your Caribbean audience with powerful automations for Instagram, WhatsApp, and Messenger.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
            >
              <Button
                onClick={scrollToWaitlist}
                className="bg-[#007B85] hover:bg-[#2F8488] text-white text-lg font-black h-20 px-12 rounded-full shadow-2xl shadow-teal-500/40 transition-all hover:scale-105 active:scale-95"
              >
                GET STARTED FREE
              </Button>
            </motion.div>

            {/* Integration Logos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-20 flex flex-wrap items-center gap-10 opacity-60 text-white"
            >
               <div className="flex items-center gap-2">
                  <Whatsapp size={32} weight="fill" className="text-green-500" />
                  <span className="text-[10px] font-black tracking-widest uppercase">WhatsApp</span>
               </div>
               <div className="flex items-center gap-2">
                  <Instagram size={32} weight="fill" className="text-pink-500" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Instagram</span>
               </div>
               <div className="flex items-center gap-2">
                  <Messenger size={32} weight="fill" className="text-blue-500" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Messenger</span>
               </div>
            </motion.div>
          </div>

          <div className="relative lg:col-span-4 h-full min-h-[600px]">
             {/* Animated Chat Bubbles (Strategically placed over the entrepreneur) */}
             <FloatingBubble 
                position={{ top: "35%", right: "8%" }} 
                delay={0.2}
                className="bg-white text-black"
             >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                   <Whatsapp weight="fill" size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inquiry Received</p>
                   <p className="text-xs font-black whitespace-nowrap">"Do you deliver?"</p>
                </div>
             </FloatingBubble>

             <FloatingBubble 
                position={{ top: "60%", left: "-5%" }} 
                delay={1.2}
                className="bg-[#007B85] text-white border-none shadow-[0_20px_50px_rgba(0,123,133,0.3)]"
             >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                   <Robot size={20} weight="fill" />
                </div>
                <div>
                   <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">AI Agent Reply</p>
                   <p className="text-xs font-black whitespace-nowrap">"Yes! 🚚 Select your island."</p>
                </div>
             </FloatingBubble>

             <FloatingBubble 
                position={{ bottom: "10%", right: "2%" }} 
                delay={2.2}
                className="bg-white text-black shadow-2xl"
             >
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-[#007B85] shrink-0">
                   <TrendUp weight="bold" size={16} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Revenue Hub</p>
                   <p className="text-xs font-black whitespace-nowrap">Sale Tracked: $145.00</p>
                </div>
             </FloatingBubble>
          </div>
        </div>
      </div>
      
      {/* Decorative Blur and Grounding */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-10" />
    </section>
  )
}
