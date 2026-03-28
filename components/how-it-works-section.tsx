"use client"

import { motion } from "framer-motion"
import { Plug, Sparkles, Rocket, Clock } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Plug,
    title: "Connect your channels",
    description:
      "Simple one-click connection for each platform. Link your WhatsApp Business, Instagram, and Facebook Messenger accounts in minutes. Your messages stay secure and private.",
    color: "text-[#007B85]",
    bgColor: "bg-teal-50",
    ringColor: "ring-teal-100",
    barColor: "bg-teal-500",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "TropiChat organizes everything",
    description:
      "Our system pulls messages from all your platforms into one inbox, categorizes contacts, tags conversations, and builds your customer database — across every channel.",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    ringColor: "ring-violet-100",
    barColor: "bg-violet-500",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Respond faster. Sell more.",
    description:
      "Manage all your customer conversations from one dashboard. Never miss a message on any platform and close more deals than ever before.",
    color: "text-[#FF7E36]",
    bgColor: "bg-orange-50",
    ringColor: "ring-orange-100",
    barColor: "bg-[#FF7E36]",
  },
]

export function HowItWorksSection() {
  return (
    <section className="relative bg-[#FF7E36] py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white shadow-sm">
            How It Works
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
             Up and running in{" "}
             <span className="text-white/60 underline decoration-white/30 underline-offset-8">
               3 simple steps
             </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80 leading-relaxed font-bold uppercase tracking-wide">
             No complicated setup. No technical skills needed. Just connect and start organizing.
          </p>
        </motion.div>

        {/* Steps — Horizontal on desktop */}
        <div className="relative mx-auto max-w-5xl">
          <div className="grid gap-12 md:gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.55 }}
                className="group flex flex-col items-center text-center"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-black text-[#FF7E36] select-none shadow-xl">
                  {step.number}
                </div>

                <h3 className="mb-3 text-xl font-black text-white uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="text-white/70 font-bold leading-relaxed text-[15px] uppercase tracking-wide">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 flex justify-center"
        >
           <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white shadow-sm uppercase tracking-widest">
            <Clock className="h-4 w-4" />
            Setup takes less than 5 minutes
          </div>
        </motion.div>
      </div>
    </section>
  )
}
