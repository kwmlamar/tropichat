"use client"

import { motion } from "framer-motion"
import { 
  WhatsappLogo, 
  Cpu, 
  ShieldCheck 
} from "@phosphor-icons/react"

const highlights = [
  {
    icon: WhatsappLogo,
    title: "WhatsApp Official",
    description: "OFFICIAL META PARTNER INTEGRATION. YOUR ACCOUNT IS 100% SAFE AND SECURE.",
    color: "text-[#25D366]"
  },
  {
    icon: Cpu,
    title: "AI Intelligence",
    description: "POWERED BY GEMINI 1.5 FLASH. SMART, FAST, AND ALWAYS ON BRAND.",
    color: "text-[#007B85]"
  },
  {
    icon: ShieldCheck,
    title: "Risk Free",
    description: "START A 14-DAY FREE TRIAL ON ANY TIER. NO CREDIT CARD REQUIRED TO BEGIN.",
    color: "text-amber-500"
  }
]

export function TrustHighlights() {
  return (
    <section className="bg-white py-24 px-4 md:px-6 border-t border-gray-50">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">
          {highlights.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-start space-y-4"
            >
              <div className="flex items-center gap-3">
                <item.icon weight="fill" className={`h-8 w-8 ${item.color}`} />
                <h3 className="text-xl font-black text-[#213138] tracking-tight">{item.title}</h3>
              </div>
              <p className="text-[12px] font-black leading-relaxed text-gray-500 tracking-widest uppercase">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
