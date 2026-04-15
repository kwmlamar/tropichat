"use client"

import { motion } from "framer-motion"
import { ShieldCheck, MessageCircle as ChatCircleDots, UserCheck as UserCircleCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function RolloutSection() {
  const router = useRouter()

  return (
    <section className="relative py-24 md:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
          
          {/* Left: Content */}
          <div className="flex-1 space-y-8 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#007B85]/5 border border-[#007B85]/10 text-[#007B85] text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <ShieldCheck className="h-4 w-4" />
              Limited Rollout Phase
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-[#213138] leading-[1.1] tracking-tighter uppercase"
            >
              Currently onboarding a few <span className="text-[#007B85] italic">Caribbean businesses</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-500 font-bold leading-relaxed"
            >
              We're not just giving you software. We will personally help you set up TropiChat and customize it for your business — entirely for free. 
              <br /><br />
              Try it for 14 days and let us know what you think. Your feedback helps us build the perfect tool for the islands.
            </motion.p>
          </div>

          {/* Right: Trust Cards */}
          <div className="flex-1 w-full max-w-sm space-y-4">
             <TrustCard 
                icon={<UserCircleCheck size={32} className="text-[#007B85]" />}
                title="Founder-Led Setup"
                desc="Lamar will personally ensure your WhatsApp is connected correctly."
                delay={0.3}
             />
             <TrustCard 
                icon={<ChatCircleDots size={32} className="text-[#007B85]" />}
                title="Customized Replies"
                desc="We'll help you save your hours, prices, and FAQs so the system is ready."
                delay={0.4}
             />
             
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="pt-6"
             >
                <Button 
                   onClick={() => router.push("/signup")}
                   className="w-full h-16 bg-[#213138] hover:bg-[#1a262c] text-white rounded-2xl font-black text-sm uppercase tracking-widest gap-3 shadow-xl group"
                >
                   Secure My Spot <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="mt-4 text-[10px] font-black text-center text-gray-400 uppercase tracking-widest">
                   Only 10 spots available this week
                </p>
             </motion.div>
          </div>

        </div>
      </div>
      
      {/* Background Accent */}
      <div className="absolute -right-24 top-1/4 w-96 h-96 bg-[#007B85]/5 rounded-full blur-[100px] pointer-events-none" />
    </section>
  )
}

function TrustCard({ icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="p-6 bg-gray-50 border border-gray-100 rounded-3xl space-y-2 hover:border-[#007B85]/20 transition-all group"
    >
      <div className="mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-sm font-black text-[#213138] uppercase tracking-tight">{title}</h3>
      <p className="text-xs text-gray-400 font-bold leading-relaxed">{desc}</p>
    </motion.div>
  )
}
