"use client"

import { motion } from "framer-motion"
import { 
  Plug, 
  Robot, 
  Coins,
  ArrowRight,
  WhatsappLogo,
  InstagramLogo,
  MessengerLogo,
  CheckCircle,
  Lightning
} from "@phosphor-icons/react"

const steps = [
  {
    number: "01",
    title: "Connect your channels",
    description: "Link WhatsApp, Instagram, and Facebook in 30 seconds. All your customers appear in one unified command center.",
    icons: [WhatsappLogo, InstagramLogo, MessengerLogo],
    color: "bg-[#007B85]",
    accent: "text-[#007B85]"
  },
  {
    number: "02",
    title: "Activate AI Automation",
    description: "Your AI Assistant handles the repetitive stuff. It answers pricing, checks stock, and collects lead info while you sleep.",
    icons: [Robot, Lightning],
    color: "bg-[#213138]",
    accent: "text-[#213138]"
  },
  {
    number: "03",
    title: "Convert more sales",
    description: "Tag VIPs, track pending payments, and scale your business without touching your phone 24/7.",
    icons: [Coins, CheckCircle],
    color: "bg-amber-500",
    accent: "text-amber-500"
  }
]

export function SolutionSection() {
  return (
    <section className="relative bg-[#050505] py-24 md:py-32 overflow-hidden px-6">
      <div className="container mx-auto max-w-6xl">
        
        {/* Section Header */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-20 md:mb-24"
        >
           <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-6">
              Three steps <br className="md:hidden" />
              <span className="text-gray-500">to world-class scale</span>
           </h2>
           <p className="text-lg md:text-xl font-bold text-[#007B85] uppercase tracking-[0.2em]">Simple. Fast. Profitable.</p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {steps.map((step, idx) => (
             <motion.div
               key={idx}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.2 }}
               className="group p-10 bg-[#111111] rounded-[2.5rem] border border-white/5 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col items-center text-center relative"
             >
                {/* Step Number Badge */}
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 ${step.color} text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg ring-8 ring-[#050505]`}>
                   {step.number}
                </div>

                <div className="flex gap-4 mb-8 mt-4">
                   {step.icons.map((Icon, i) => (
                     <Icon key={i} weight="fill" className={`h-10 w-10 ${step.accent} opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
                   ))}
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-4">
                   {step.title}
                </h3>
                
                <p className="text-gray-400 font-bold uppercase tracking-wide text-[11px] leading-relaxed mb-10">
                   {step.description}
                </p>

                <div className="mt-auto pt-8 border-t border-white/5 w-full">
                   <div className="flex items-center justify-center gap-2 group-hover:gap-4 transition-all text-[#007B85] font-black uppercase text-[10px] tracking-widest cursor-pointer">
                      Learn how <ArrowRight weight="bold" />
                   </div>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Dynamic CTA */}
        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ delay: 0.6 }}
           className="mt-24 bg-[#007B85] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
        >
           {/* Visual Flourish */}
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent" />
           <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-[100px]" />
           
           <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-8 relative z-10">
              Ready to claim your <br className="hidden md:block" /> time back?
           </h3>
           
           <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
              <button className="w-full md:w-auto px-10 py-5 bg-white text-[#007B85] rounded-full font-black text-lg uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
                 Get Started Free
              </button>
              <button className="w-full md:w-auto px-10 py-5 bg-transparent border-2 border-white/20 text-white rounded-full font-black text-lg uppercase tracking-widest hover:bg-white/10 transition-colors">
                 Watch the Demo
              </button>
           </div>
        </motion.div>

      </div>
    </section>
  )
}
