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
    <section className="relative bg-[#F8FAFB] dark:bg-[#0A0A0A] py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-[#222222] to-transparent" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] px-4 py-1.5 text-sm font-semibold text-slate-500 dark:text-gray-400 shadow-sm">
            How It Works
          </div>
          <h2 className="mb-4  text-4xl font-bold tracking-tight text-[#213138] dark:text-white md:text-5xl">
            Up and running in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007B85] to-teal-700">
              3 simple steps
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-gray-400 leading-relaxed">
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
                {/* Number Badge */}
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-[#222222] text-sm font-bold text-slate-600 dark:text-gray-300 select-none shadow-sm">
                  {step.number}
                </div>

                {/* Content */}
                 <h3 className="mb-3 text-xl font-bold text-[#213138] dark:text-white">
                  {step.title}
                </h3>
                 <p className="text-slate-500 dark:text-gray-400 leading-relaxed text-[15px]">
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
           <div className="inline-flex items-center gap-2.5 rounded-full border border-teal-200 dark:border-teal-900/30 bg-white dark:bg-[#0A0A0A] px-6 py-3 text-sm font-semibold text-teal-800 dark:text-teal-400 shadow-sm">
            <Clock className="h-4 w-4 text-[#007B85]" />
            Setup takes less than 5 minutes
          </div>
        </motion.div>
      </div>
    </section>
  )
}
