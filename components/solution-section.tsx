"use client"

import { motion } from "framer-motion"
import { Tags, UserCircle, Zap, UsersRound } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Tags,
    title: "Find Any Customer in 3 Seconds Flat",
    outcome: "Never scroll through hundreds of messages again.",
    description:
      "Tag customers as VIP, New, Payment Pending, or anything you want. Click someone's name → see all conversations, orders, and notes instantly. Like magic, but it's just good organization.",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    badge: "Most Popular",
  },
  {
    icon: UserCircle,
    title: "Remember Every Customer Like They're Your Only Customer",
    outcome: "Provide VIP-level service even when you have 500 customers.",
    description:
      "TropiChat automatically builds a profile for every person: order history, preferences, last contact, payment status. You look like a pro, every single time.",
    gradient: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: Zap,
    title: "Stop Typing the Same Thing 50 Times a Day",
    outcome: "Reply in 10 seconds instead of 2 minutes.",
    description:
      "Save your common responses (pricing, hours, menu, delivery info). Hit a button, message sent. Works for text, images, even voice notes.",
    gradient: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50",
  },
  {
    icon: UsersRound,
    title: "Your Team Stays on the Same Page (Finally)",
    outcome: "No more 'I thought you handled that' awkwardness.",
    description:
      "Assign conversations, leave internal notes, see who's handling what. Your helper can see you already replied. You can see they took the order.",
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    badge: "New",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
}

export function SolutionSection() {
  return (
    <section className="relative bg-white py-20 md:py-28 overflow-hidden">
      {/* Subtle background mesh gradient */}
      <div className="absolute inset-0 -z-10 bg-mesh-gradient" />
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
            What If You Could Handle 3x More Customers—
            <br />
            <span className="bg-gradient-to-r from-[#25D366] to-emerald-600 bg-clip-text text-transparent">
              Without the Chaos?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            TropiChat takes the WhatsApp you already use and adds the one thing it's missing: organization.
            <br />
            <strong className="text-gray-900">
              No app switching. No complicated setup. Just your WhatsApp, supercharged.
            </strong>
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="group h-full overflow-hidden border-2 border-gray-100 transition-all duration-300 hover:border-[#25D366] hover:shadow-2xl hover:shadow-[#25D366]/10 hover:-translate-y-1">
                <CardContent className="p-8">
                  {/* Badge */}
                  {feature.badge && (
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      {feature.badge}
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`mb-6 inline-flex rounded-2xl ${feature.bgColor} p-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                  >
                    <div
                      className={`rounded-xl bg-gradient-to-br ${feature.gradient} p-3 transition-transform duration-300 group-hover:rotate-3`}
                    >
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-2xl font-bold text-gray-900">
                    {feature.title}
                  </h3>

                  {/* Outcome */}
                  <p className="mb-3 text-base font-semibold text-[#25D366]">
                    The outcome: {feature.outcome}
                  </p>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover indicator */}
                  <div className="mt-6 flex items-center text-sm font-medium text-[#25D366] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Learn more
                    <svg
                      className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16"
        >
          <h3 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Real Results From Caribbean Businesses
          </h3>
          <div className="grid gap-8 md:grid-cols-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-8">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-[#25D366]">3x</div>
              <div className="text-sm font-medium text-gray-900">Faster Response Time</div>
              <div className="text-xs text-gray-600">(2 min → 40 sec avg)</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-[#25D366]">$2,400</div>
              <div className="text-sm font-medium text-gray-900">Extra Revenue/Month</div>
              <div className="text-xs text-gray-600">(From not missing leads)</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-[#25D366]">12 hrs</div>
              <div className="text-sm font-medium text-gray-900">Saved Every Week</div>
              <div className="text-xs text-gray-600">(Time you get back)</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-[#25D366]">0</div>
              <div className="text-sm font-medium text-gray-900">Missed Opportunities</div>
              <div className="text-xs text-gray-600">(Smart reminders work)</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
