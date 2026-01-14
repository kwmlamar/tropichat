"use client"

import { motion } from "framer-motion"
import { SearchX, MessageSquareX, Users, CircleHelp } from "lucide-react"

const problems = [
  {
    icon: SearchX,
    title: "\"Wait, Did I Reply to Ms. Johnson About the Birthday Cake?\"",
    description:
      "It's Thursday afternoon and you're scrolling through 300 messages trying to find that customer who ordered the cake for Saturday. Time wasted: 20 minutes. Customer impression: unprofessional.",
    stat: "You waste 2+ hours daily searching for messages",
  },
  {
    icon: MessageSquareX,
    title: "You Ghost Customers By Accident (And They Go to Your Competition)",
    description:
      "Someone asks for a quote Monday morning. By Monday evening, 50 new messages bury it. By Tuesday, they've bought from the shop down the road. Sale lost: $150. And you never even knew.",
    stat: "You lose 15-20% of sales due to missed messages",
  },
  {
    icon: Users,
    title: "Your Team Has No Clue What's Going On",
    description:
      "Your helper answers a customer, but they don't know this person already placed an order yesterday. No way to see conversation history. No way to coordinate. Result: confused customers, frustrated team.",
    stat: "Team chaos costs you $500+/month in mistakes",
  },
  {
    icon: CircleHelp,
    title: "You Can't Remember Who Owes What or Who's a Good Customer",
    description:
      "Is this person a regular who orders weekly, or someone who ghosted you last time? Did they pay yet? When did they last order? Your memory isn't a business system.",
    stat: "Zero visibility = zero growth strategy",
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

export function ProblemSection() {
  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-gray-100/50 py-20 md:py-28 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/4 h-[300px] w-[300px] rounded-full bg-red-100/30 blur-3xl" />
        <div className="absolute left-0 bottom-1/4 h-[250px] w-[250px] rounded-full bg-orange-100/20 blur-3xl" />
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />
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
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
            If Your WhatsApp Looks Like This,
            <br />
            <span className="text-gray-600">You're Not Alone</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Every Caribbean business owner knows this stress. And it's costing you money every single day.
          </p>
        </motion.div>

        {/* Problem Cards Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:gap-8"
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={item}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Accent border */}
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-red-500 to-orange-500 transition-all duration-300 group-hover:w-1.5" />

              {/* Icon */}
              <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 text-red-600 transition-all duration-300 group-hover:bg-red-100 group-hover:scale-110">
                <problem.icon className="h-6 w-6" />
              </div>

              {/* Title */}
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                {problem.title}
              </h3>

              {/* Description */}
              <p className="mb-4 text-gray-600 leading-relaxed">{problem.description}</p>

              {/* Stat */}
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
                {problem.stat}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Sound familiar? You're losing $2,000+ every month to WhatsApp chaos.
          </h3>
          <p className="text-lg text-gray-600">
            There's a better way. And it takes 5 minutes to set up. ⬇️
          </p>
        </motion.div>
      </div>
    </section>
  )
}
