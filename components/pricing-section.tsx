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
    name: "Busy Solopreneur",
    monthlyPrice: 15,
    annualPrice: 12,
    description: "Stop losing customers while you work. Auto-reply for WhatsApp + IG.",
    features: [
      "Up to 500 contacts",
      "All messages in one place (WhatsApp + IG)",
      "Auto-reply to common questions",
      "AI auto-replies using your saved answers",
      "Mobile App Access",
      "Community Support"
    ],
    cta: "Start Free",
    popular: false,
    color: "slate"
  },
  {
    name: "Growing Shop",
    monthlyPrice: 35,
    annualPrice: 28,
    description: "For shops that need more sales without hiring more staff.",
    features: [
      "Up to 2,500 contacts",
      "Broadcast messages to all customers",
      "WhatsApp QR code for your shop",
      "Automatic story mention replies",
      "Customer history & notes (know who's buying)",
      "Priority Email Support"
    ],
    cta: "Accelerate Growth",
    popular: false,
    color: "teal"
  },
  {
    name: "Team + Sales Growth",
    monthlyPrice: 75,
    annualPrice: 60,
    description: "The gold standard for scaling teams.",
    features: [
      "Up to 10,000 contacts",
      "Unlimited Team Members",
      "AI trained on your business specifically",
      "Direct Booking & Payment links",
      "Follow up with people who didn't book",
      "Direct Founder Support"
    ],
    cta: "Scale Your Business",
    popular: true,
    color: "main"
  },
  {
    name: "Done-For-You Partner",
    monthlyPrice: 399,
    annualPrice: 349,
    description: "We do the work, you get the sales. Your dedicated Caribbean Sales Partner.",
    features: [
      "Full Setup done by us",
      "We manage your WhatsApp & IG sales",
      "Custom AI strategy built for you",
      "Weekly reports on money made",
      "24/7 Priority Sales Support",
      "Unlimited Contacts & Growth"
    ],
    cta: "Partner With Us",
    popular: false,
    color: "dark"
  }
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section className="relative bg-[#F9FAFB] py-16 md:py-32 overflow-hidden px-4 md:px-6" id="pricing">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-16 px-4">
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-4xl md:text-7xl font-black text-[#213138] tracking-tighter leading-none mb-8"
           >
              Scale with your <br />
              <span className="text-gray-300">Caribbean success</span>
           </motion.h2>

           {/* Toggle */}
           <div className="flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-4 bg-white/50 w-fit mx-auto px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
                 <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", !isAnnual ? 'text-[#007B85]' : 'text-gray-400')}>Monthly</span>
                 <button 
                   onClick={() => setIsAnnual(!isAnnual)}
                   className="w-14 h-7 bg-gray-100 rounded-full p-1 relative transition-colors"
                   aria-label="Toggle annual pricing"
                 >
                    <motion.div 
                      animate={{ x: isAnnual ? 28 : 0 }}
                      className="w-5 h-5 bg-[#007B85] rounded-full shadow-md"
                    />
                 </button>
                 <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", isAnnual ? 'text-[#007B85]' : 'text-gray-400')}>
                   Annual <span className="text-[#007B85] font-black underline decoration-2 underline-offset-4 ml-1">Save 20%</span>
                 </span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-1.5 bg-[#007B85]/5 border border-[#007B85]/10 rounded-full">
                 <CheckCircle weight="fill" className="h-4 w-4 text-[#007B85]" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#007B85]">14-Day Free Trial • Cancel Anytime</span>
              </div>
           </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-300 group",
                tier.popular 
                  ? "bg-[#007B85] text-white scale-105 shadow-2xl z-20" 
                  : "bg-white border border-gray-100 hover:border-[#007B85]/30 hover:shadow-xl text-[#213138]"
              )}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 text-[#213138] rounded-full shadow-lg z-20">
                  <Star weight="fill" className="h-3 w-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Most Popular</span>
                </div>
              )}

              <div className="mb-8">
                <p className={cn("text-xs font-black uppercase tracking-[0.2em] mb-4", tier.popular ? "text-white/70" : "text-gray-400")}>
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter">
                    ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                  </span>
                  <span className={cn("text-sm font-bold", tier.popular ? "text-white/60" : "text-gray-400")}>/mo</span>
                </div>
                <p className={cn("text-sm font-medium mt-3 leading-relaxed", tier.popular ? "text-white/80" : "text-gray-500")}>
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle weight="fill" className={cn("h-5 w-5 shrink-0 mt-0.5", tier.popular ? "text-white" : "text-[#007B85]")} />
                    <span className={cn("text-[13px] font-bold leading-snug", tier.popular ? "text-white" : "text-[#213138]")}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Link 
                href={`/signup?plan=${tier.name.toLowerCase()}&billing=${isAnnual ? 'annual' : 'monthly'}`}
                className="w-full"
              >
                <Button 
                  variant={tier.popular ? "default" : "secondary"}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                    tier.popular 
                      ? "bg-white text-[#007B85] hover:bg-gray-100 hover:scale-[1.02]" 
                      : "bg-[#213138] text-white hover:bg-[#1a262c] hover:scale-[1.02]"
                  )}
                >
                  {tier.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
