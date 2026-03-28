"use client"

import { motion } from "framer-motion"
import { 
  XCircle, 
  CheckCircle, 
  Clock, 
  ChatCircleDots, 
  TrendUp, 
  Users,
  Warning,
  Lightning
} from "@phosphor-icons/react"

const beforeList = [
  "Copy-pasting the same reply 40 times a day.",
  "Losing hot leads in buried WhatsApp chats.",
  "Missed sales because you were asleep.",
  "Team has no idea who already replied.",
  "Your inbox buried you deeper every hour."
]

const afterList = [
  "AI handles common questions instantly.",
  "Leads are tagged, organized, and tracked.",
  "Automations sell for you 24/7.",
  "One shared inbox for your entire team.",
  "Every interaction is a chance to convert."
]

export function ProblemSection() {
  return (
    <section className="relative bg-white py-24 md:py-32 overflow-hidden px-6">
      <div className="container mx-auto max-w-6xl">
        
        {/* Section Header */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-16 md:mb-24"
        >
           <h2 className="text-4xl md:text-6xl font-black text-[#213138] tracking-tighter leading-none mb-6">
              Your inbox: <br className="md:hidden" />
              <span className="text-gray-300">a before & after</span>
           </h2>
           <p className="text-lg md:text-xl font-bold text-slate-500 uppercase tracking-[0.2em]">More sales, less stress.</p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-stretch">
          
          {/* BEFORE CARD */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] bg-gray-50 p-10 md:p-12 border border-gray-100 flex flex-col"
          >
             <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Before TropiChat:</p>
             <h3 className="text-4xl md:text-5xl font-black text-[#213138] leading-none mb-10 tracking-tighter">
                All work <br /> and no play
             </h3>
             <ul className="space-y-6 flex-1">
                {beforeList.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                     <XCircle weight="fill" className="text-gray-300 h-6 w-6 shrink-0 mt-0.5" />
                     <p className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-wide leading-tight">{item}</p>
                  </li>
                ))}
             </ul>
             
             {/* Loss Indicator */}
             <div className="mt-12 pt-10 border-t border-gray-200">
                <div className="flex items-center gap-3 text-red-500 mb-2">
                   <Warning weight="bold" size={20} />
                   <span className="font-black text-sm uppercase tracking-widest">Revenue Drain</span>
                </div>
                <p className="text-3xl font-black text-[#213138] tracking-tighter">$2,000+ lost per month</p>
             </div>
          </motion.div>

          {/* AFTER CARD */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-[2.5rem] bg-[#007B85] p-10 md:p-12 text-white shadow-2xl shadow-teal-500/20 relative overflow-hidden flex flex-col"
          >
             {/* Decorative Background Pulsing Glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
             
             <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-6 relative z-10">After TropiChat:</p>
             <h3 className="text-4xl md:text-5xl font-black leading-none mb-10 tracking-tighter relative z-10">
                Less grind <br /> and more pay
             </h3>
             <ul className="space-y-6 flex-1 relative z-10">
                {afterList.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                     <CheckCircle weight="fill" className="text-white h-6 w-6 shrink-0 mt-0.5" />
                     <p className="text-sm md:text-base font-black uppercase tracking-wide leading-tight">{item}</p>
                  </li>
                ))}
             </ul>

             {/* Gain Indicator */}
             <div className="mt-12 pt-10 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-3 text-white/60 mb-2">
                   <Lightning weight="fill" size={20} className="text-amber-300" />
                   <span className="font-black text-sm uppercase tracking-widest">Growth Engine</span>
                </div>
                <p className="text-3xl font-black tracking-tighter">Scale beyond your phone</p>
             </div>
          </motion.div>

          {/* Center Connector (Arrow) OR Floating Icon */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 bg-white dark:bg-[#050505] border-4 border-gray-100 dark:border-[#222222] rounded-full items-center justify-center shadow-xl">
              <Lightning weight="fill" className="text-[#007B85] h-8 w-8 animate-pulse" />
          </div>

        </div>

        {/* Final Affirmation */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ delay: 0.5 }}
           className="mt-20 text-center"
        >
           <p className="text-xl md:text-2xl font-black text-[#213138] max-w-2xl mx-auto leading-tight">
              Don't let manual work cap your growth. <br />
              <span className="text-[#007B85]">TropiChat automates the conversation while you build the business.</span>
           </p>
        </motion.div>

      </div>
    </section>
  )
}
