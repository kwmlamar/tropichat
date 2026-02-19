"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Zap } from "lucide-react"

const plans = [
  {
    name: "Starter",
    description: "Perfect for solo entrepreneurs",
    monthlyPrice: 39,
    annualPrice: 31,
    period: "month",
    priceContext: "Less than $1.30/day",
    features: [
      "Single user account",
      "WhatsApp + Instagram + Facebook Messenger",
      "Unlimited conversations",
      "Contact management with tags & labels",
      "Quick reply templates",
      "Basic automations",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing businesses with a team",
    monthlyPrice: 79,
    annualPrice: 63,
    period: "month",
    priceContext: "Everything your team needs",
    features: [
      "Everything in Starter, plus:",
      "Up to 3 team members",
      "Advanced automations & workflows",
      "Message templates library",
      "Booking system integration",
      "Team collaboration tools",
      "Analytics & reporting",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large teams & custom needs",
    monthlyPrice: null,
    annualPrice: null,
    period: "month",
    priceContext: "Starting at $150/month",
    features: [
      "Everything in Pro, plus:",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated account manager",
      "API access",
      "Custom training",
      "SLA guarantee",
    ],
    cta: "Contact Us",
    popular: false,
  },
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById("waitlist")
    waitlistSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative bg-gradient-to-b from-white via-gray-50/50 to-gray-50 py-20 md:py-28 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="animate-float absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-[#3A9B9F]/5 blur-3xl" />
        <div className="animate-float-delayed absolute left-1/4 bottom-40 h-[350px] w-[350px] rounded-full bg-blue-100/10 blur-3xl" />
      </div>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
            Simple Pricing. No Surprises.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Try free for 14 days. No credit card required. Cancel anytime.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                !isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Annual
              <span className="rounded-full bg-[#3A9B9F] px-2 py-0.5 text-[10px] font-bold text-white">
                SAVE 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Early Adopter Offer Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl mb-10"
        >
          <div className="relative overflow-hidden rounded-2xl border-2 border-[#FF8B66] bg-gradient-to-r from-[#FF8B66]/10 via-orange-50 to-[#FF8B66]/10 p-6 md:p-8 shadow-lg">
            {/* Pulsing badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-[#FF8B66] px-3 py-1.5 text-xs font-bold text-white shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              ONLY 7 SPOTS LEFT
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  <span className="text-sm font-bold uppercase tracking-wider text-[#FF8B66]">
                    First 10 Customers Only
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  Lock in $29/month — Forever
                </h3>
                <p className="text-gray-600 text-sm">
                  <span className="font-semibold text-[#FF8B66]">Save $10/month forever</span>
                  {" "}(normally $39/month). Price never increases, even as we add features.
                </p>

                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    "All Starter features included",
                    "Locked-in pricing, never increases",
                    "Priority feature requests",
                    "Direct founder support",
                  ].map((perk, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 flex-shrink-0 text-[#FF8B66]" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col items-center gap-3 md:min-w-[200px]">
                <div className="text-center">
                  <div className="text-sm text-gray-500 line-through">$39/month</div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">$29</span>
                    <span className="text-gray-600">/mo</span>
                  </div>
                  <div className="text-xs font-semibold text-[#FF8B66] mt-1">locked in forever</div>
                </div>
                <Button
                  onClick={scrollToWaitlist}
                  className="w-full bg-[#FF8B66] text-white hover:bg-[#e87a55] font-semibold h-12 text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Lock in $29/month
                </Button>
                <p className="text-xs text-gray-500 text-center">14-day free trial · No credit card</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl ${
                plan.popular
                  ? "border-2 border-[#3A9B9F] md:scale-105"
                  : "border border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#3A9B9F] px-4 py-2 text-xs font-bold text-white rounded-bl-xl">
                  🔥 MOST POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.monthlyPrice !== null ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                    {isAnnual && (
                      <p className="mt-1 text-xs text-[#3A9B9F] font-semibold">
                        Billed annually · Save ${((plan.monthlyPrice! - plan.annualPrice!) * 12)}/yr
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">Custom</span>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">{plan.priceContext}</p>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-[#3A9B9F] mt-0.5" />
                    <span
                      className={
                        feature.includes("Everything")
                          ? "font-semibold text-gray-900"
                          : "text-gray-600"
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={plan.name === "Enterprise" ? undefined : scrollToWaitlist}
                className={`w-full h-12 text-base font-semibold transition-all duration-300 btn-press ${
                  plan.popular
                    ? "bg-[#3A9B9F] text-white hover:bg-[#2F8488] shadow-lg hover:shadow-xl hover:shadow-[#3A9B9F]/25 hover-shine overflow-hidden"
                    : plan.name === "Enterprise"
                    ? "bg-gray-900 text-white hover:bg-gray-700"
                    : "bg-white text-gray-900 border-2 border-gray-300 hover:border-[#3A9B9F] hover:text-[#3A9B9F] hover:bg-[#3A9B9F]/5"
                }`}
              >
                {plan.cta}
              </Button>

              {plan.popular && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  14-day free trial · No credit card
                </p>
              )}

              {plan.name === "Enterprise" && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  Custom pricing · Volume discounts
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-16 flex flex-wrap justify-center gap-6 text-sm text-gray-600"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#3A9B9F]" />
            14-day free trial
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#3A9B9F]" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#3A9B9F]" />
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#3A9B9F]" />
            Free onboarding
          </div>
        </motion.div>

        {/* ROI Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mx-auto max-w-4xl rounded-2xl bg-teal-50 p-8 md:p-12"
        >
          <h3 className="mb-8 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            💰 Quick Math: What's TropiChat Worth to You?
          </h3>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm text-gray-600">
                If you save just 1 hour per day...
              </div>
              <div className="text-lg text-gray-900">
                30 hrs/month × $25/hr = <strong className="text-[#3A9B9F]">$750 value</strong>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm text-gray-600">
                If you capture 3 extra sales per month...
              </div>
              <div className="text-lg text-gray-900">
                At $100 average = <strong className="text-[#3A9B9F]">$300 extra revenue</strong>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm text-gray-600">TropiChat Pro:</div>
              <div className="text-lg text-gray-900">
                $79/month
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#3A9B9F] p-6 text-center text-white">
            <div className="mb-2 text-lg font-semibold">Return on Investment</div>
            <div className="text-4xl font-bold">1,329%</div>
            <div className="mt-2 text-sm opacity-90">
              You make back $13.29 for every $1 spent
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <h3 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Pricing Questions
          </h3>

          <div className="space-y-4">
            <details className="group rounded-xl bg-white p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                What happens after the free trial?
                <span className="text-[#3A9B9F] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                After 14 days, you'll be asked to choose a plan. No surprise charges. If you don't select a plan, your account stays active in read-only mode (you can still access your data, just can't add new stuff).
              </p>
            </details>

            <details className="group rounded-xl bg-white p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                Can I change plans later?
                <span className="text-[#3A9B9F] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Absolutely. Upgrade or downgrade anytime. If you upgrade mid-month, we'll prorate the difference. If you downgrade, the change happens at your next billing cycle.
              </p>
            </details>

            <details className="group rounded-xl bg-white p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                Is there a setup fee?
                <span className="text-[#3A9B9F] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Nope. Zero setup fees. Zero hidden costs. Just the monthly price you see. We even include free onboarding to help you get started.
              </p>
            </details>

            <details className="group rounded-xl bg-white p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                Do you accept Caribbean payment methods?
                <span className="text-[#3A9B9F] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Yes! We accept all major credit cards, debit cards, and wire transfers. We understand Caribbean banking and make it easy for you.
              </p>
            </details>

            <details className="group rounded-xl bg-white p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                What is the early adopter offer exactly?
                <span className="text-[#3A9B9F] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                The first 10 customers get $29/month locked in permanently — that's $10/month less than the standard Starter price of $39/month. Your price never increases, even as we add features. Only 7 spots remain.
              </p>
            </details>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
