"use client"

import { motion } from "framer-motion"
import { Target, Briefcase, Clock, Crown, MessageSquare, Shield, Smartphone, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"

const earlyAdopterPerks = [
  {
    icon: Crown,
    text: "$29/month pricing locked in forever",
    detail: "Regular price $39 — save $10/month forever",
  },
  {
    icon: Clock,
    text: "30 days free trial",
    detail: "Instead of standard 14 days",
  },
  {
    icon: MessageSquare,
    text: "Priority support",
    detail: "Direct access to the founder",
  },
  {
    icon: Target,
    text: "Shape the product",
    detail: "Your feedback builds features we add next",
  },
]

const perfectFor = [
  {
    icon: Flag,
    text: "Tour operators managing bookings across platforms",
  },
  {
    icon: Briefcase,
    text: "Retailers handling customer inquiries",
  },
  {
    icon: Clock,
    text: "Service businesses coordinating appointments",
  },
  {
    icon: Smartphone,
    text: "Anyone drowning in WhatsApp, Instagram & Facebook",
  },
]

const trustItems = [
  {
    icon: Flag,
    label: "Built in the Bahamas",
    sub: "Made for the Caribbean, by the Caribbean",
  },
  {
    icon: Smartphone,
    label: "Multi-platform",
    sub: "WhatsApp, Instagram, Facebook",
  },
  {
    icon: Shield,
    label: "Bank-level security",
    sub: "Your data stays private",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42 } },
}

export function SocialProofSection() {
  return (
    <section className="relative bg-white dark:bg-[#121212] py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-[#2A2A2A] to-transparent" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-coral-200 dark:border-coral-900/30 bg-[#FF8B66]/10 px-4 py-1.5 text-sm font-bold text-[#FF8B66] shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF8B66] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF8B66]" />
            </span>
            Early Access — Limited Spots Available
          </div>
          <h2 className="mb-4 font-[family-name:var(--font-poppins)] text-4xl font-bold tracking-tight text-[#213138] dark:text-white md:text-5xl">
            Join Caribbean businesses
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A9B9F] to-teal-700">
              getting organized
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-gray-400 leading-relaxed">
            TropiChat is launching across the Caribbean. Be one of the first 10 customers and lock in exclusive early adopter pricing.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2 mb-12">
          {/* Early Adopter Perks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
            >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A9B9F] to-teal-400 rounded-t-2xl" />
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                <Target className="h-5 w-5 text-[#3A9B9F]" />
              </div>
              <h3 className="text-lg font-bold text-[#213138]">
                First 10 Customers Get:
              </h3>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-3"
            >
              {earlyAdopterPerks.map((perk, index) => {
                const Icon = perk.icon
                return (
                   <motion.div
                    key={index}
                    variants={item}
                    className="flex items-start gap-4 rounded-xl bg-slate-50 dark:bg-[#262626] p-4 transition-colors hover:bg-teal-50/60 dark:hover:bg-teal-900/20 cursor-default"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100/70">
                      <Icon className="h-4 w-4 text-[#3A9B9F]" />
                    </div>
                     <div>
                      <div className="font-semibold text-[#213138] dark:text-gray-200 text-sm">{perk.text}</div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{perk.detail}</div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Perfect For */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
            >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8B66] to-amber-400 rounded-t-2xl" />
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                <Briefcase className="h-5 w-5 text-[#FF8B66]" />
              </div>
               <h3 className="text-lg font-bold text-[#213138] dark:text-white">Perfect For:</h3>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-3"
            >
              {perfectFor.map((useCase, index) => {
                const Icon = useCase.icon
                return (
                   <motion.div
                    key={index}
                    variants={item}
                    className="flex items-start gap-4 rounded-xl bg-slate-50 dark:bg-[#262626] p-4 transition-colors hover:bg-orange-50/60 dark:hover:bg-orange-900/20 cursor-default"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100/70">
                      <Icon className="h-4 w-4 text-[#FF8B66]" />
                    </div>
                     <div className="font-medium text-slate-700 dark:text-gray-300 text-sm pt-1">
                      {useCase.text}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        </div>

        {/* CTA Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-gradient-to-br from-[#213138] to-[#2F8488] dark:from-[#0A0A0A] dark:to-[#2A2A2A] p-8 shadow-xl border border-transparent dark:border-[#2A2A2A]">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-300">
              Limited Early Access
            </p>
            <h3 className="mb-2 text-2xl font-bold text-white font-[family-name:var(--font-poppins)]">
              Lock in Early Adopter Pricing
            </h3>
            <p className="mb-6 text-sm text-slate-300">
              Only{" "}
              <span className="font-bold text-[#FF8B66]">7 spots</span>{" "}
              left at the founding member rate
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = "/signup")}
              className="rounded-full bg-white text-[#213138] hover:bg-teal-50 font-semibold px-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              Start Free Trial
            </Button>
          </div>
        </motion.div>

        {/* Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 grid gap-4 md:grid-cols-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-6 md:p-8"
        >
          {trustItems.map((t, i) => {
            const Icon = t.icon
            return (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-[#262626] shadow-sm ring-1 ring-slate-200 dark:ring-[#2A2A2A]">
                  <Icon className="h-5 w-5 text-[#3A9B9F]" />
                </div>
                 <div className="font-semibold text-[#213138] dark:text-white text-sm">{t.label}</div>
                <div className="text-xs text-slate-500 dark:text-gray-400">{t.sub}</div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
