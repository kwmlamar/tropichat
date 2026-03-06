"use client"

import { motion } from "framer-motion"
import { SearchX, MessageSquareX, Users, Eye } from "lucide-react"

const problems = [
  {
    icon: SearchX,
    title: "Hours lost hunting for a single message",
    description:
      "Thursday afternoon: you're checking WhatsApp, then Instagram DMs, then Facebook. Three apps. Three inboxes. Zero organization. That order from Ms. Johnson? Buried.",
    stat: "2+ hours lost daily to inbox chaos",
    accent: "from-red-500/20 to-rose-500/5",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    statColor: "text-red-600 bg-red-50",
  },
  {
    icon: MessageSquareX,
    title: "You ghost customers without meaning to",
    description:
      "A quote request on WhatsApp. A follow-up on Instagram. A third on Facebook. By Tuesday, messages are buried and they've already bought from the competition down the road.",
    stat: "15–20% of sales lost to missed messages",
    accent: "from-orange-500/20 to-amber-500/5",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    statColor: "text-orange-700 bg-orange-50",
  },
  {
    icon: Users,
    title: "Your team has no idea what's going on",
    description:
      "Your helper replies on WhatsApp, not knowing the same customer followed up on Instagram. No shared view. No coordination. Just confused customers and a frustrated team.",
    stat: "$500+/month lost to team miscommunication",
    accent: "from-purple-500/20 to-violet-500/5",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    statColor: "text-purple-700 bg-purple-50",
  },
  {
    icon: Eye,
    title: "You can't see who owes what",
    description:
      "Facebook last week, WhatsApp yesterday — are they a regular? Did they pay? You're piecing together one customer's entire history across three different apps with no single source of truth.",
    stat: "Zero visibility = zero growth strategy",
    accent: "from-slate-500/20 to-gray-500/5",
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    statColor: "text-slate-700 bg-slate-100",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function ProblemSection() {
  return (
    <section className="relative bg-[#F8FAFB] py-24 md:py-32 overflow-hidden">
      {/* Subtle top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-500 shadow-sm">
            Sound familiar?
          </div>
          <h2 className="mb-4 font-[family-name:var(--font-poppins)] text-4xl font-bold tracking-tight text-[#213138] md:text-5xl">
            The daily struggle every
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Caribbean business knows
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 leading-relaxed">
            WhatsApp, Instagram, Facebook — every inbox competes for your attention. And it's costing you real money, every single day.
          </p>
        </motion.div>

        {/* Problem Cards Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-5 md:grid-cols-2"
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={cardVariant}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-default"
            >
              {/* Subtle background gradient */}
              <div className={`absolute inset-0 -z-0 bg-gradient-to-br ${problem.accent} opacity-40 transition-opacity duration-300 group-hover:opacity-70`} />

              <div className="relative z-10">
                {/* Icon */}
                <div className={`mb-5 inline-flex rounded-xl ${problem.iconBg} p-3.5 transition-transform duration-300 group-hover:scale-105`}>
                  <problem.icon className={`h-6 w-6 ${problem.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="mb-3 text-lg font-semibold text-[#213138] leading-snug">
                  {problem.title}
                </h3>

                {/* Description */}
                <p className="mb-5 text-slate-600 leading-relaxed text-[15px]">{problem.description}</p>

                {/* Stat pill */}
                <div className={`inline-flex items-center rounded-lg px-3.5 py-1.5 text-sm font-semibold ${problem.statColor}`}>
                  {problem.stat}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-block rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
            <p className="text-xl font-bold text-[#213138]">
              You're losing <span className="text-red-500">$2,000+</span> every month to messaging chaos.
            </p>
            <p className="mt-2 text-slate-500 text-base">
              There's a better way — and it takes 5 minutes to set up.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
