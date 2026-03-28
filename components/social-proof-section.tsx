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
  Flashlight
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

const stats = [
  {
    value: "10,000+",
    label: "Conversations Automated",
    description: "AI handling the repetitive questions 24/7.",
    icon: ChatCircleDots,
    color: "text-[#007B85]"
  },
  {
    value: "$100k+",
    label: "Revenue Tracked",
    description: "Total capital through our integrated pipes.",
    icon: TrendUp,
    color: "text-[#007B85]"
  },
  {
    value: "300+",
    label: "Caribbean Businesses",
    description: "Scaling from Nassau to Kingston.",
    icon: Globe,
    color: "text-[#007B85]"
  },
  {
    value: "99.9%",
    label: "Instant Reply Rate",
    description: "Never leave a customer ghosted again.",
    icon: ShieldCheck,
    color: "text-[#007B85]"
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
    <section className="relative bg-[#007B85] py-24 md:py-40 overflow-hidden px-6">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-24">
           <motion.p 
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-4"
           >
              The Caribbean Standard
           </motion.p>
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none"
           >
              Powering the next <br />
              <span className="text-white/40">wave of local growth</span>
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
                   <stat.icon weight="fill" className={`h-8 w-8 text-white`} />
                </div>
                <h3 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2 group-hover:scale-110 transition-transform duration-500">
                   {stat.value}
                </h3>
                <p className="text-sm font-black uppercase tracking-widest text-white/60 mb-4">
                   {stat.label}
                </p>
                <p className="text-white/60 font-bold text-xs uppercase leading-relaxed max-w-[200px] mx-auto">
                   {stat.description}
                </p>
             </motion.div>
           ))}
        </div>

        {/* Industry Focus */}
        <div className="border-t border-white/10 pt-24">
           <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-12">Built for the region's top industries</p>
           <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {industries.map((industry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-white/50 hover:text-white transition-colors cursor-default">
                   <industry.icon weight="bold" size={32} />
                   <span className="font-black uppercase text-sm tracking-widest">{industry.name}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Founding Member Callout (Simpler, non-contradictory version) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 md:p-20 bg-black/20 rounded-[3rem] border border-white/10 text-center"
        >
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-8">
              Limited Founder Access
           </div>
           <h3 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-none">
              Be one of our first <br className="hidden md:block" /> 10 success stories
           </h3>
           <p className="text-lg md:text-xl font-bold text-white/60 max-w-2xl mx-auto mb-12 uppercase tracking-wide">
              Lock in $29/mo forever and get direct strategy access with our founding team.
           </p>
           <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Button 
                onClick={() => window.location.href = '/signup'}
                className="w-full md:w-auto px-12 py-8 bg-white text-[#007B85] rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 transition-transform"
              >
                 Claim Your Spot
              </Button>
              <p className="text-xs font-black text-white/40 uppercase tracking-widest leading-none">
                 Only <span className="text-white">4 spots</span> remaining
              </p>
           </div>
        </motion.div>

      </div>
    </section>
  )
}
