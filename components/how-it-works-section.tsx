"use client"

import { motion } from "framer-motion"
import { Plug, Sparkles, Rocket } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Plug,
    title: "Connect Your WhatsApp Business Account",
    description:
      "Simple one-click connection. Your messages stay secure and private.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Let TropiChat Organize Your Customers Automatically",
    description:
      "Our smart system categorizes contacts, tags conversations, and builds your customer database.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Respond Faster, Track Better, Sell More",
    description:
      "Watch your business grow as you never miss a customer and close more deals.",
    color: "text-[#25D366]",
    bgColor: "bg-green-50",
  },
]

export function HowItWorksSection() {
  return (
    <section className="relative bg-gradient-to-b from-gray-50 via-white to-white py-20 md:py-28 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/3 h-[300px] w-[300px] rounded-full bg-blue-100/20 blur-3xl" />
        <div className="absolute right-0 top-2/3 h-[250px] w-[250px] rounded-full bg-purple-100/15 blur-3xl" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
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
            Get Organized in{" "}
            <span className="text-[#25D366]">3 Simple Steps</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            No complicated setup. No technical skills needed. Just connect and
            start organizing.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mx-auto max-w-4xl">
          {/* Connecting line - hidden on mobile */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 md:block" />

          <div className="space-y-16 md:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative"
              >
                <div
                  className={`flex flex-col items-center gap-8 md:flex-row ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="mb-4 inline-flex">
                      <span className="text-5xl font-bold text-gray-200">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-lg text-gray-600">{step.description}</p>
                  </div>

                  {/* Icon Circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`flex h-24 w-24 items-center justify-center rounded-full ${step.bgColor} shadow-lg ring-4 ring-white`}
                    >
                      <step.icon className={`h-12 w-12 ${step.color}`} />
                    </motion.div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden flex-1 md:block" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-6 py-3 text-sm font-medium text-green-800">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Setup takes less than 5 minutes
          </div>
        </motion.div>
      </div>
    </section>
  )
}
