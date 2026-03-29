"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  ArrowRight, 
  Lightning, 
  Users, 
  Star, 
  Crown,
  WhatsappLogo,
  Robot
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

const tiers = [
  {
    name: "Starter",
    price: 15,
    description: "Perfect for personal brands & side hustles.",
    features: [
      "Up to 500 contacts",
      "Unified Inbox (IG, WA, Messenger)",
      "Instagram Comment Auto-Replies (Coming Soon)",
      "Basic AI Smart Replies",
      "Mobile App Access",
      "Community Support"
    ],
    cta: "Start Free",
    popular: false,
    color: "slate"
  },
  {
    name: "Medium",
    price: 35,
    description: "For growing local businesses in the Bahamas.",
    features: [
      "Up to 2,500 contacts",
      "Bulk WhatsApp Broadcasts",
      "WhatsApp Link & QR Generator",
      "Story Mention Auto-Replies (Coming Soon)",
      "Full CRM Profile Tracking",
      "Priority Email Support"
    ],
    cta: "Accelerate Growth",
    popular: false,
    color: "teal"
  },
  {
    name: "Pro",
    price: 75,
    description: "The gold standard for scaling teams.",
    features: [
      "Up to 10,000 contacts",
      "Unlimited Team Members",
      "AI Knowledge Base Training",
      "Booking & Payment Links",
      "Abandoned Cart Recovery",
      "Direct Founder Support"
    ],
    cta: "Scale Your Business",
    popular: true,
    color: "teal"
  },
  {
    name: "Elite",
    price: 150,
    description: "World-class automation for top enterprises.",
    features: [
      "Unlimited Contacts",
      "White-label Dashboard",
      "Custom API Integrations",
      "Dedicated Account Manager",
      "24/7 VIP Multi-channel Support",
      "Custom Bot Development"
    ],
    cta: "Request Demo",
    popular: false,
    color: "amber"
  }
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <section className="relative bg-white py-16 md:py-32 overflow-hidden px-4 md:px-6">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-16 px-4">
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-3xl md:text-7xl font-black text-[#213138] tracking-tighter leading-none mb-8"
           >
              Scale with your <br />
              <span className="text-gray-200">Caribbean success</span>
           </motion.h2>

           {/* Toggle */}
           <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-black uppercase tracking-widest ${!isAnnual ? 'text-[#007B85]' : 'text-gray-400'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-16 h-8 bg-gray-100 rounded-full p-1 relative transition-colors"
              >
                 <motion.div 
                   animate={{ x: isAnnual ? 32 : 0 }}
                   className="w-6 h-6 bg-[#007B85] rounded-full shadow-lg"
                 />
              </button>
              <span className={`text-sm font-black uppercase tracking-widest ${isAnnual ? 'text-[#007B85]' : 'text-gray-400'}`}>
                Annual <span className="text-[#007B85] font-black underline decoration-dotted decoration-2 underline-offset-4 ml-1">Save 20%</span>
              </span>
           </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
           {tiers.map((tier, idx) => (
             <motion.div
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.1 }}
               className={`relative p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border ${
                 tier.popular 
                 ? 'bg-[#007B85] text-white border-transparent shadow-2xl shadow-teal-500/20 z-10 md:scale-105' 
                 : 'bg-gray-50 border-gray-100 text-[#213138]'
               } flex flex-col transition-all duration-300 hover:translate-y-[-8px]`}
             >
                {tier.popular && (
                  <div className="absolute top-0 right-10 -translate-y-1/2 bg-amber-400 text-[#213138] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                     <Star weight="fill" /> Recommended
                  </div>
                )}

                <p className={`text-xs font-black uppercase tracking-widest mb-2 ${tier.popular ? 'text-white/60' : 'text-[#007B85]'}`}>
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-1 mb-4">
                   <span className="text-5xl font-black tracking-tighter text-inherit">
                      ${isAnnual ? Math.floor(tier.price * 0.8) : tier.price}
                   </span>
                   <span className="text-xs font-black uppercase tracking-widest opacity-60">/mo</span>
                </div>
                <p className="text-sm font-bold leading-relaxed mb-8 opacity-80">
                   {tier.description}
                </p>

                <ul className="space-y-4 mb-10 flex-1">
                   {tier.features.map((feature, fidx) => (
                     <li key={fidx} className="flex items-start gap-3">
                        <CheckCircle weight="fill" className={`h-5 w-5 shrink-0 mt-0.5 ${tier.popular ? 'text-white' : 'text-[#007B85]'}`} />
                        <span className="text-sm font-bold leading-tight">{feature}</span>
                     </li>
                   ))}
                </ul>

                <Button 
                   onClick={() => window.location.href = '/signup'}
                   className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                     tier.popular
                     ? 'bg-white text-[#007B85] hover:bg-white/90 shadow-xl'
                     : 'bg-[#213138] text-white hover:bg-[#007B85]'
                   }`}
                >
                   {tier.cta} <ArrowRight weight="bold" className="ml-2" />
                </Button>
             </motion.div>
           ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-24 border-t border-gray-100 pt-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
           <div>
              <h4 className="flex items-center justify-center md:justify-start gap-3 text-xl font-black text-[#213138] tracking-tighter mb-4">
                 <WhatsappLogo weight="fill" className="text-[#25D366] h-8 w-8" /> WhatsApp Official
              </h4>
              <p className="text-sm font-bold text-slate-500 uppercase leading-relaxed tracking-wide">
                 Official Meta Partner integration. Your account is 100% safe and secure.
              </p>
           </div>
           <div>
              <h4 className="flex items-center justify-center md:justify-start gap-3 text-xl font-black text-[#213138] tracking-tighter mb-4">
                 <Robot weight="fill" className="text-[#007B85] h-8 w-8" /> AI Intelligence
              </h4>
              <p className="text-sm font-bold text-slate-500 uppercase leading-relaxed tracking-wide">
                 Powered by Gemini 1.5 Flash. Smart, fast, and always on brand.
              </p>
           </div>
           <div>
              <h4 className="flex items-center justify-center md:justify-start gap-3 text-xl font-black text-[#213138] tracking-tighter mb-4">
                 <CheckCircle weight="fill" className="text-amber-500 h-8 w-8" /> Risk Free
              </h4>
              <p className="text-sm font-bold text-slate-500 uppercase leading-relaxed tracking-wide">
                 Start a 14-day free trial on any tier. No credit card required to begin.
              </p>
           </div>
        </div>

      </div>
    </section>
  )
}
