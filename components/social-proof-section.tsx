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
    detail: "Your feedback builds the features we add next",
  },
]

const perfectFor = [
  {
    emoji: "🏝️",
    text: "Tour operators managing bookings across platforms",
  },
  {
    emoji: "🛍️",
    text: "Retailers handling customer inquiries",
  },
  {
    emoji: "📅",
    text: "Service businesses coordinating appointments",
  },
  {
    emoji: "📱",
    text: "Anyone drowning in WhatsApp, Instagram, and Facebook messages",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function SocialProofSection() {
  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50/50 py-20 md:py-28 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="animate-float-slow absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[#3A9B9F]/5 blur-3xl" />
        <div className="animate-float-delayed absolute right-1/4 bottom-0 h-[350px] w-[350px] rounded-full bg-[#FF8B66]/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FF8B66]/10 px-4 py-2 text-sm font-semibold text-[#FF8B66]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF8B66] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF8B66]" />
            </span>
            Early Access — Limited Spots Available
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
            Join Caribbean Businesses
            <br />
            <span className="text-[#3A9B9F]">Getting Organized</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            TropiChat is launching across the Caribbean. Be one of the first 10
            customers and lock in exclusive early adopter pricing.
          </p>
        </motion.div>

        {/* Two-column layout: Early Adopter Perks + Perfect For */}
        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          {/* First 10 Customers Get */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl border-2 border-[#3A9B9F]/20 bg-white p-8 shadow-lg"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A9B9F] to-[#FF8B66]" />
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3A9B9F]/10">
                <Target className="h-5 w-5 text-[#3A9B9F]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                First 10 Customers Get:
              </h3>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {earlyAdopterPerks.map((perk, index) => {
                const Icon = perk.icon
                return (
                  <motion.div
                    key={index}
                    variants={item}
                    className="flex items-start gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-[#3A9B9F]/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3A9B9F]/10">
                      <Icon className="h-4 w-4 text-[#3A9B9F]" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {perk.text}
                      </div>
                      <div className="text-sm text-gray-500">{perk.detail}</div>
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
            className="relative overflow-hidden rounded-2xl border-2 border-[#FF8B66]/20 bg-white p-8 shadow-lg"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8B66] to-[#3A9B9F]" />
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF8B66]/10">
                <Briefcase className="h-5 w-5 text-[#FF8B66]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Perfect For:</h3>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {perfectFor.map((useCase, index) => (
                <motion.div
                  key={index}
                  variants={item}
                  className="flex items-start gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-[#FF8B66]/5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF8B66]/10 text-lg">
                    {useCase.emoji}
                  </div>
                  <div className="font-medium text-gray-700 pt-1.5">
                    {useCase.text}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <div className="mx-auto max-w-xl rounded-2xl bg-gradient-to-r from-[#3A9B9F] to-[#2F8488] p-8 shadow-xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/70">
              Limited Early Access
            </p>
            <h3 className="mb-3 text-2xl font-bold text-white">
              Lock in Early Adopter Pricing
            </h3>
            <p className="mb-6 text-sm text-white/80">
              Only <span className="font-bold text-[#FF8B66]">7 spots</span>{" "}
              left at the founding member rate
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = "/signup")}
              className="bg-white text-[#3A9B9F] hover:bg-gray-100 font-semibold px-8 py-6 h-auto text-base shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              Start Free Trial
            </Button>
          </div>
        </motion.div>

        {/* Trust Bar — only truthful items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 grid gap-6 md:grid-cols-3 rounded-2xl bg-teal-50 p-8"
        >
          <div className="text-center">
            <div className="mb-2 text-2xl">🇧🇸</div>
            <div className="font-semibold text-gray-900">
              Built in the Bahamas
            </div>
            <div className="text-sm text-gray-600">
              Made for the Caribbean, by the Caribbean
            </div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-2xl">
              <Smartphone className="h-6 w-6 mx-auto text-[#3A9B9F]" />
            </div>
            <div className="font-semibold text-gray-900">Multi-platform</div>
            <div className="text-sm text-gray-600">
              WhatsApp, Instagram, Facebook
            </div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-2xl">
              <Shield className="h-6 w-6 mx-auto text-[#3A9B9F]" />
            </div>
            <div className="font-semibold text-gray-900">
              Bank-level security
            </div>
            <div className="text-sm text-gray-600">Your data stays private</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
