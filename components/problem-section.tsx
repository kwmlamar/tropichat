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
    <section className="relative bg-[#F8FAFB] dark:bg-[#0A0A0A] py-24 md:py-32 overflow-hidden">
      {/* Subtle top divider */}
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
            Sound familiar?
          </div>
          <h2 className="mb-4  text-4xl font-bold tracking-tight text-[#213138] dark:text-white md:text-5xl">
            The daily struggle every
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Caribbean business knows
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-gray-400 leading-relaxed">
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
              className="group relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-[#333333] cursor-default flex flex-col justify-between"
            >
              <div>
                {/* Title */}
                <h3 className="mb-3 text-lg font-bold text-[#213138] dark:text-white leading-snug">
                  {problem.title}
                </h3>
  
                {/* Description */}
                <p className="mb-8 text-slate-500 dark:text-gray-400 leading-relaxed text-[15px]">
                  {problem.description}
                </p>
              </div>

              {/* Minimalist Stat */}
              <div className="pt-4 border-t border-slate-100 dark:border-[#111111] font-semibold text-sm text-slate-900 dark:text-white">
                {problem.stat}
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
          <div className="inline-block rounded-2xl border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] px-8 py-6 shadow-sm">
            <p className="text-xl font-bold text-[#213138] dark:text-white">
              You're losing <span className="text-red-500"> $2,000+ </span> every month to messaging chaos.
            </p>
            <p className="mt-2 text-slate-500 dark:text-gray-400 text-base">
              There's a better way — and it takes 5 minutes to set up.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
