"use client"

import { motion } from "framer-motion"
import { 
  LinkSimple as LinkIcon, 
  ChatCircleDots as ChatIcon, 
  TrendUp as SellIcon,
  ArrowRight
} from "@phosphor-icons/react"

const steps = [
  {
    icon: LinkIcon,
    label: "CONNECT",
    sub: "WhatsApp in one click — no tech skills needed",
    color: "bg-blue-500",
    shadow: "shadow-blue-500/40"
  },
  {
    icon: ChatIcon,
    label: "SEE EVERYONE",
    sub: "All messages in one place (WhatsApp, IG & Facebook) — no switching apps",
    color: "bg-[#007B85]",
    shadow: "shadow-teal-500/40"
  },
  {
    icon: SellIcon,
    label: "REPLY INSTANTLY",
    sub: "Don't lose customers even when you're busy",
    color: "bg-amber-500",
    shadow: "shadow-amber-500/40"
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-black py-24 md:py-48 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#007B85]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-20 md:mb-32"
        >
           <h2 className="text-4xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none">
              Ready in <span className="text-[#007B85]">seconds.</span>
           </h2>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center">
              {/* Step Circle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center group"
              >
                <div className={`w-32 h-32 md:w-56 md:h-56 rounded-[2.5rem] ${step.color} flex items-center justify-center text-white mb-8 ${step.shadow} transition-transform group-hover:scale-110 duration-500 shadow-2xl`}>
                   <step.icon size={64} weight="bold" className="md:w-32 md:h-32" />
                </div>
                <h3 className="text-3xl md:text-6xl font-black text-white tracking-widest mb-2 uppercase italic">{step.label}</h3>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs md:text-sm">{step.sub}</p>
              </motion.div>

              {/* Connector (Only between steps) */}
              {idx < steps.length - 1 && (
                <motion.div 
                   initial={{ opacity: 0, width: 0 }}
                   whileInView={{ opacity: 1, width: "auto" }}
                   viewport={{ once: true }}
                   transition={{ delay: (idx * 0.2) + 0.1, duration: 0.8 }}
                   className="hidden md:flex items-center px-10 self-start mt-28 overflow-hidden"
                >
                   <div className="h-1 w-20 bg-gradient-to-r from-white/20 to-transparent rounded-full" />
                </motion.div>
              )}
            </div>
          ))}
        </div>

        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ delay: 0.8 }}
           className="mt-32 text-center"
        >
           <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-xs md:text-sm">
              Connect your WhatsApp. That's it.
           </p>
        </motion.div>
      </div>
    </section>
  )
}

