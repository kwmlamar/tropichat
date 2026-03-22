"use client"

import { motion } from "framer-motion"
import { Tags, UserCircle, Zap, UsersRound } from "lucide-react"

const features = [
  {
    icon: Tags,
    title: "One inbox. Every channel.",
    outcome: "Never switch apps to find a conversation again.",
    description:
      "All your messages from WhatsApp, Instagram DMs, and Facebook Messenger land in one unified inbox. Tag customers as VIP, New, or Payment Pending — and see every conversation across all platforms instantly.",
    gradient: "from-[#3A9B9F] to-teal-600",
    iconBg: "bg-teal-50",
    badge: "Most Popular",
    badgeStyle: "bg-teal-100 text-teal-800",
  },
  {
    icon: UserCircle,
    title: "Remember every customer.",
    outcome: "Deliver VIP service for all 500+ of them.",
    description:
      "TropiChat automatically builds a profile for every person across every channel — order history, preferences, last contact, payment status. Whether they messaged on WhatsApp or Instagram, you see the full picture.",
    gradient: "from-violet-500 to-purple-600",
    iconBg: "bg-violet-50",
    badge: null,
    badgeStyle: "",
  },
  {
    icon: Zap,
    title: "Stop typing the same thing 50× a day.",
    outcome: "Reply in 10 seconds instead of 2 minutes.",
    description:
      "Save your most common responses — pricing, hours, menu, delivery info. One tap and it's sent, on any platform. Works seamlessly across WhatsApp, Instagram, and Facebook Messenger.",
    gradient: "from-amber-400 to-orange-500",
    iconBg: "bg-amber-50",
    badge: null,
    badgeStyle: "",
  },
  {
    icon: UsersRound,
    title: "Your team stays on the same page.",
    outcome: "No more 'I thought you handled that' moments.",
    description:
      "Assign conversations from any channel, leave internal notes, see who's handling what — in real time. Your helper knows you replied on Instagram. You know they handled the WhatsApp order.",
    gradient: "from-[#3A9B9F] to-cyan-600",
    iconBg: "bg-cyan-50",
    badge: "New",
    badgeStyle: "bg-cyan-100 text-cyan-800",
  },
]

const stats = [
  { value: "3×", label: "Faster Response Time", sub: "2 min → 40 sec avg" },
  { value: "$2,400", label: "Extra Revenue/Month", sub: "From not missing leads" },
  { value: "12 hrs", label: "Saved Every Week", sub: "Time you get back" },
  { value: "0", label: "Missed Opportunities", sub: "Smart reminders work" },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function SolutionSection() {
  return (
    <section className="relative bg-white dark:bg-black py-24 md:py-32 overflow-hidden">
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-900/30 bg-teal-50 dark:bg-teal-900/10 px-4 py-1.5 text-sm font-semibold text-teal-800 dark:text-teal-400 shadow-sm">
            The Solution
          </div>
          <h2 className="mb-4 font-[family-name:var(--font-poppins)] text-4xl font-bold tracking-tight text-[#213138] dark:text-white md:text-5xl">
            Handle 3× more customers —
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A9B9F] to-teal-700">
              without the chaos.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-gray-400 leading-relaxed">
            TropiChat brings all your channels together in one organized inbox with the one thing they're all missing.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-5 md:grid-cols-2"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-[#333333] cursor-default flex flex-col justify-between"
            >
              <div>
                {/* Badge */}
                {feature.badge && (
                  <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-[#222222] bg-slate-50 dark:bg-[#111111] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3A9B9F] animate-pulse" />
                    {feature.badge}
                  </div>
                )}

                 {/* Title */}
                <h3 className="mb-2 text-xl font-bold text-[#213138] dark:text-white leading-snug">
                  {feature.title}
                </h3>

                {/* Outcome */}
                <p className="mb-6 text-sm font-semibold text-[#3A9B9F]">
                  {feature.outcome}
                </p>

                 {/* Description */}
                <p className="text-slate-500 dark:text-gray-400 leading-relaxed text-[15px]">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16"
        >
          <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-gray-500">
            Real Results From Caribbean Businesses
          </p>
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 dark:border-[#222222] bg-gradient-to-br from-teal-50/60 to-white dark:from-[#111111] dark:to-[#111111] p-6 md:grid-cols-4 md:p-10">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="mb-1 text-4xl font-bold text-[#3A9B9F]">{stat.value}</div>
                <div className="text-sm font-semibold text-[#213138] dark:text-gray-200">{stat.label}</div>
                <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
