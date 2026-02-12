"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Keisha Thompson",
    business: "Keisha's Kitchen",
    location: "Trinidad",
    businessType: "🍽️ Catering",
    quote: "Before TropiChat, I was drowning in messages across WhatsApp, Instagram, and Facebook. I'd miss orders, forget who wanted what, stress out my whole team. Now? Everything is in one place and labeled. My sales went up 40% in 2 months just from not losing track of people.",
    resultTags: ["+40% sales", "Saves 10hrs/week"],
    avatar: "👩🏾‍🍳",
    featured: true,
  },
  {
    name: "Marcus Williams",
    business: "Island Auto Parts",
    location: "Barbados",
    businessType: "🔧 Retail",
    quote: "I have 3 employees now and before TropiChat we were constantly confused about who said what to customers — especially when messages came in on different platforms. Now everyone can see the full conversation history in one place. Game changer.",
    avatar: "👨🏽‍🔧",
    featured: false,
  },
  {
    name: "Simone Lewis",
    business: "Glow Up Beauty Bar",
    location: "Jamaica",
    businessType: "💅 Beauty Salon",
    quote: "Customers message me on Instagram, Facebook, and WhatsApp. The quick replies work across all of them and save me so much time. I'm not typing out my price list 20 times a day across three apps anymore.",
    avatar: "👩🏿‍💼",
    featured: false,
  },
  {
    name: "Richard Chen",
    business: "RC Landscaping",
    location: "St. Lucia",
    businessType: "🌴 Landscaping",
    quote: "I thought I'd need some fancy CRM software. TropiChat connects all the apps my customers already use — WhatsApp, Instagram, Facebook — and puts it in one simple dashboard. Simple is better.",
    avatar: "👨🏻‍🌾",
    featured: false,
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

export function SocialProofSection() {
  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50/50 py-20 md:py-28 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="animate-float-slow absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[#3A9B9F]/5 blur-3xl" />
        <div className="animate-float-delayed absolute right-1/4 bottom-0 h-[350px] w-[350px] rounded-full bg-yellow-100/30 blur-3xl" />
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
            Trusted by Caribbean Small Business Owners
            <br />
            <span className="text-[#3A9B9F]">Just Like You</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            From doubles stands to beauty salons, auto parts to catering—
            <br />
            TropiChat is helping businesses across the region get organized.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:gap-8 mb-12"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={item}
              className={`group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl ${
                testimonial.featured
                  ? "border-2 border-[#3A9B9F] md:col-span-2 lg:col-span-1"
                  : "border border-gray-200"
              }`}
            >
              {testimonial.featured && (
                <div className="absolute top-4 right-4 rounded-full bg-[#3A9B9F] px-3 py-1 text-xs font-semibold text-white">
                  ⭐ Featured
                </div>
              )}

              {/* Header */}
              <div className="mb-6 flex items-start gap-4">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.business} • {testimonial.location}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {testimonial.businessType}
                  </div>
                </div>
              </div>

              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-700 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Result Tags */}
              {testimonial.resultTags && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {testimonial.resultTags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid gap-6 md:grid-cols-4 rounded-2xl bg-teal-50 p-8"
        >
          <div className="text-center">
            <div className="mb-2 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <div className="font-semibold text-gray-900">4.9/5 rating</div>
            <div className="text-sm text-gray-600">From 240+ businesses</div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-2xl">🇧🇸🇯🇲🇹🇹🇧🇧</div>
            <div className="font-semibold text-gray-900">12 islands</div>
            <div className="text-sm text-gray-600">Across the Caribbean</div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-2xl">📱</div>
            <div className="font-semibold text-gray-900">Multi-platform</div>
            <div className="text-sm text-gray-600">WhatsApp, Instagram, Facebook</div>
          </div>

          <div className="text-center">
            <div className="mb-2 text-2xl">🔒</div>
            <div className="font-semibold text-gray-900">Bank-level security</div>
            <div className="text-sm text-gray-600">Your data stays private</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
