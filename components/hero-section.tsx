"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
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
  const router = useRouter()

  const goToSignup = () => {
    router.push("/signup")
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-black pt-32 md:pt-48 lg:pt-56 pb-20">
      
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent z-10" />
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
              Caribbean's #1 Sales App
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl lg:text-[10rem] font-black text-white leading-[0.9] tracking-tighter mb-8 max-w-[15ch] uppercase"
            >
              Stop Losing <br className="hidden sm:block" /> 
              Customers <span className="text-[#007B85] drop-shadow-2xl italic underline decoration-8 underline-offset-[1.5rem]">Today.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-3xl text-gray-300 font-bold max-w-2xl mb-12 leading-tight uppercase tracking-tight opacity-95"
            >
              TropiChat answers your WhatsApp and Instagram messages automatically — <br className="hidden md:block" />
              so you don’t lose money when you’re too busy to reply.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-start gap-4"
            >
              <Button
                onClick={goToSignup}
                className="bg-[#007B85] hover:bg-[#2F8488] text-white text-xl md:text-2xl font-black h-24 px-12 md:px-16 rounded-full shadow-2xl shadow-teal-500/40 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto uppercase tracking-widest flex flex-col pt-4"
              >
                WE'LL SET IT UP FOR YOU FOR FREE
                <span className="text-[10px] font-black opacity-60 tracking-[0.3em] -mt-1">Limited spots available</span>
              </Button>
              <div className="flex flex-wrap items-center gap-6 pl-6 text-[#007B85] font-black uppercase tracking-[0.2em] text-[10px]">
                 <span className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="h-4 w-4" /> Ready in minutes
                 </span>
                 <span className="flex items-center gap-2">
                    <CheckCircle weight="fill" className="h-4 w-4" /> Works with WhatsApp, IG & Facebook
                 </span>
              </div>
            </motion.div>

            {/* Integration Logos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-16 md:mt-24 flex flex-wrap items-center justify-center sm:justify-start gap-10 md:gap-14 opacity-60 text-white"
            >
               <div className="flex items-center gap-2">
                  <Whatsapp size={32} weight="fill" className="text-green-500" />
                  <span className="text-[11px] font-black tracking-widest uppercase whitespace-nowrap">WhatsApp</span>
               </div>
               <div className="flex items-center gap-2">
                  <Instagram size={32} weight="fill" className="text-pink-500" />
                  <span className="text-[11px] font-black tracking-widest uppercase whitespace-nowrap">Instagram</span>
               </div>
               <div className="flex items-center gap-2">
                  <Messenger size={32} weight="fill" className="text-blue-500" />
                  <span className="text-[11px] font-black tracking-widest uppercase whitespace-nowrap">Messenger</span>
               </div>
            </motion.div>
          </div>

          <div className="relative lg:col-span-4 h-full min-h-[400px] md:min-h-[600px] hidden lg:block">
             {/* Animated Chat Bubbles */}
             <FloatingBubble 
                position={{ top: "30%", right: "0%" }} 
                delay={0.2}
                className="bg-white text-black"
             >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                   <Whatsapp weight="fill" size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                   <p className="text-sm font-black whitespace-nowrap">"How much is this?"</p>
                </div>
             </FloatingBubble>

             <FloatingBubble 
                position={{ top: "50%", left: "-10%" }} 
                delay={1.2}
                className="bg-[#007B85] text-white border-none shadow-[0_20px_50px_rgba(0,123,133,0.3)]"
             >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                   <Robot size={20} weight="fill" />
                </div>
                <div>
                   <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Tropi AI</p>
                   <p className="text-sm font-black whitespace-nowrap">"Price sent! Check your DM."</p>
                </div>
             </FloatingBubble>

             <FloatingBubble 
                position={{ bottom: "15%", right: "10%" }} 
                delay={2.2}
                className="bg-white text-black shadow-2xl"
             >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                   <Sparkles weight="bold" size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sale Made</p>
                   <p className="text-sm font-black whitespace-nowrap">+$150.00 Received</p>
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

