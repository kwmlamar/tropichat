"use client"

import { motion } from "framer-motion"
import { 
  Users, 
  TrendUp, 
  ChatCircleDots, 
  ShieldCheck,
  Globe,
  Buildings,
  Storefront,
  AirplaneTilt,
  Star
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

const stats = [
  {
    value: "50",
    label: "Beta Spots",
    description: "Accepting 50 founding merchants in our Nassau rollout.",
    icon: Star,
    color: "text-white"
  },
  {
    value: "14",
    label: "Islands",
    description: "Our regional roadmap for Caribbean sales automation.",
    icon: Globe,
    color: "text-white"
  },
  {
    value: "$0",
    label: "Setup Fee",
    description: "Concierge setup included for our first 10 partners.",
    icon: ShieldCheck,
    color: "text-white"
  },
  {
    value: "24/7",
    label: "AI Presence",
    description: "Never leave an Instagram lead on 'seen' again.",
    icon: ChatCircleDots,
    color: "text-white"
  }
]

const industries = [
  { name: "Hospitality & Tours", icon: AirplaneTilt },
  { name: "Luxury Real Estate", icon: Buildings },
  { name: "Modern Retail", icon: Storefront },
  { name: "Health & Wellness", icon: Users }
]

export function SocialProofSection() {
  return (
    <section className="relative bg-[#007B85] py-16 md:py-40 overflow-hidden px-4 md:px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-24">
           <motion.p 
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-4"
           >
              The Bahamas Launch
           </motion.p>
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none"
           >
              Join the first <br />
              <span className="text-white/40">wave of automated growth</span>
           </motion.h2>
        </div>

        {/* Big Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">
           {stats.map((stat, idx) => (
             <motion.div
               key={idx}
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.1 }}
               className="text-center group"
             >
                <div className="mb-6 inline-flex p-4 rounded-3xl bg-white/10 border border-white/20 group-hover:border-white transition-colors">
                   <stat.icon weight="fill" className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 group-hover:scale-110 transition-transform duration-500">
                   {stat.value}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4">
                   {stat.label}
                </p>
                <p className="text-white/60 font-bold text-xs uppercase leading-relaxed max-w-[180px] mx-auto opacity-70 group-hover:opacity-100 transition-opacity">
                   {stat.description}
                </p>
             </motion.div>
           ))}
        </div>

        {/* Founding Member Callout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-16 md:mt-32 p-8 md:p-20 bg-black/20 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 text-center relative overflow-hidden group"
        >
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Star weight="fill" className="h-32 w-32 text-white" />
           </div>

           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-8">
              Anchor Merchant Program
           </div>
           <h3 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-none">
              Become a <br className="hidden md:block" /> Founding Partner
           </h3>
           <p className="text-lg md:text-xl font-bold text-white/70 max-w-2xl mx-auto mb-12 uppercase tracking-wide leading-relaxed">
              We're selecting 10 businesses in Nassau and Eleuthera for direct founder-led onboarding and exclusive lifetime pricing.
           </p>
           <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Button 
                onClick={() => window.location.href = '#pricing'}
                className="w-full md:w-auto px-12 py-8 bg-white text-[#007B85] rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
              >
                 Apply for Early Access
              </Button>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                 <p className="text-xs font-black text-white/40 uppercase tracking-widest leading-none">
                    Only <span className="text-white">6 partner spots</span> remaining
                 </p>
              </div>
           </div>
        </motion.div>

        {/* Industry Focus */}
        <div className="mt-24 md:mt-32 pt-16 border-t border-white/10">
           <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-12">Initial Support Categories</p>
           <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {industries.map((industry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-white/40 hover:text-white transition-colors cursor-default group">
                   <industry.icon weight="bold" size={24} className="group-hover:scale-110 transition-transform" />
                   <span className="font-black uppercase text-xs tracking-widest">{industry.name}</span>
                </div>
              ))}
           </div>
        </div>

      </div>
    </section>
  )
}
