"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  ArrowRight, 
  Lightning, 
  Users, 
  Star, 
  Crown,
  WhatsappLogo,
  ShieldCheck,
  Robot,
  ChartBar,
  CaretRight
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const tiers = [
  {
    name: "Performance Based",
    subtitle: "Higher Conversions, Lower Costs",
    description: "Pay only for results. Our AI delivers conversions, and you pay based on actual outcomes.",
    features: [
      "Pay per conversion or qualified lead",
      "Risk-free model",
      "Aligned incentives",
      "Scale with confidence"
    ],
    cta: "Talk to the Founder",
    popular: true,
    icon: Lightning
  },
  {
    name: "Volume Based",
    subtitle: "Scale with Predictable Pricing",
    description: "Predictable pricing based on conversation volume. Perfect for high-volume operations.",
    features: [
      "Tiered pricing based on volume",
      "Bulk discounts available",
      "Predictable monthly costs",
      "Unlimited conversations option"
    ],
    cta: "Talk to the Founder",
    popular: false,
    icon: ChartBar
  },
  {
    name: "Custom",
    subtitle: "Tailored to Your Business",
    description: "Bespoke solutions built around your unique requirements, integrations, and workflows.",
    features: [
      "Fully customized implementation",
      "Dedicated account manager",
      "Custom integrations & APIs",
      "Enterprise SLA & support"
    ],
    cta: "Talk to the Founder",
    popular: false,
    icon: Robot
  }
]

export function PricingSection() {
  return (
    <section className="relative bg-[#F9FAFB] py-16 md:py-32 overflow-hidden px-4 md:px-6" id="pricing">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-16 px-4">
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-4xl md:text-6xl font-black text-[#213138] tracking-tighter leading-none mb-6"
           >
              Choose Your Pricing Options
           </motion.h2>
           <motion.p
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             className="text-base md:text-xl font-bold text-slate-400 capitalize tracking-tight max-w-2xl mx-auto"
           >
              Flexible options designed to match your business needs. <br className="hidden md:block" /> Only pay for real outcomes.
           </motion.p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "relative flex flex-col p-10 rounded-[2.5rem] transition-all duration-300 group bg-white",
                tier.popular 
                  ? "border-2 border-[#007B85] shadow-2xl z-20 scale-105" 
                  : "border border-gray-100 hover:border-[#007B85]/30 hover:shadow-xl"
              )}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-[#007B85] text-white rounded-full shadow-lg z-20">
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Most Popular</span>
                </div>
              )}

              <div className="mb-8">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
                  tier.popular ? "bg-[#007B85]/10 text-[#007B85]" : "bg-gray-50 text-gray-400"
                )}>
                  <tier.icon size={24} weight="fill" />
                </div>
                
                <h3 className="text-2xl font-black text-[#213138] tracking-tight mb-2">
                  {tier.name}
                </h3>
                <p className="text-xs font-black uppercase tracking-widest text-[#007B85] mb-6">
                  {tier.subtitle}
                </p>
                <p className="text-sm font-bold text-slate-400 leading-relaxed mb-8">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-12">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5 text-[#007B85]/20" />
                    <span className="text-[13px] font-bold leading-snug text-[#213138]">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <a 
                href={`https://wa.me/13342219466?text=${encodeURIComponent(`Hi Lamar! I'm interested in the ${tier.name} plan for my business. Can we talk about how it works?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button 
                  variant={tier.popular ? "default" : "outline"}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                    tier.popular 
                      ? "bg-[#007B85] text-white hover:bg-[#2F8488] shadow-lg shadow-teal-500/20" 
                      : "bg-white border-2 border-slate-100 text-slate-400 hover:border-[#007B85] hover:text-[#007B85]"
                  )}
                >
                  {tier.cta}
                </Button>
              </a>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
