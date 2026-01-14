"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    description: "Perfect for solo entrepreneurs",
    price: 29,
    period: "month",
    priceContext: "Less than $1/day",
    features: [
      "Up to 500 customers",
      "Unlimited labels",
      "Unlimited quick replies",
      "Customer profiles & history",
      "Mobile & desktop access",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing businesses with team members",
    price: 59,
    period: "month",
    priceContext: "$2/day for unlimited growth",
    features: [
      "Everything in Starter, plus:",
      "Unlimited customers",
      "Up to 5 team members",
      "Team assignments & internal notes",
      "Analytics & reporting",
      "Priority support (< 2 hours)",
      "WhatsApp & phone support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
]

export function PricingSection() {
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById("waitlist")
    waitlistSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative bg-gradient-to-b from-white via-gray-50/50 to-gray-50 py-20 md:py-28 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="animate-float absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-[#25D366]/5 blur-3xl" />
        <div className="animate-float-delayed absolute left-1/4 bottom-40 h-[350px] w-[350px] rounded-full bg-blue-100/10 blur-3xl" />
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
            Simple Pricing. No Surprises.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Try free for 14 days. No credit card required. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl ${
                plan.popular ? "border-2 border-[#25D366] scale-105" : "border border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#25D366] px-4 py-2 text-xs font-bold text-white rounded-bl-xl">
                  🔥 MOST POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.priceContext}</p>
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-[#25D366] mt-0.5" />
                    <span className={feature.includes("Everything") ? "font-semibold text-gray-900" : "text-gray-600"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={scrollToWaitlist}
                className={`w-full h-12 text-base font-semibold transition-all duration-300 btn-press ${
                  plan.popular
                    ? "bg-[#25D366] text-white hover:bg-[#20BD5B] shadow-lg hover:shadow-xl hover:shadow-[#25D366]/25 hover-shine overflow-hidden"
                    : "bg-white text-gray-900 border-2 border-gray-300 hover:border-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/5"
                }`}
              >
                {plan.cta}
              </Button>

              {plan.popular && (
                <p className="mt-4 text-center text-sm text-gray-500">
                  14-day money-back guarantee
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
            <Check className="h-4 w-4 text-[#25D366]" />
            14-day free trial
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#25D366]" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#25D366]" />
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[#25D366]" />
            Free onboarding
          </div>
        </motion.div>

        {/* ROI Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mx-auto max-w-4xl rounded-2xl bg-green-50 p-8 md:p-12"
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
                30 hrs/month × $25/hr = <strong className="text-[#25D366]">$750 value</strong>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm text-gray-600">
                If you capture 3 extra sales per month...
              </div>
              <div className="text-lg text-gray-900">
                At $100 average = <strong className="text-[#25D366]">$300 extra revenue</strong>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-2 text-sm text-gray-600">TropiChat Professional:</div>
              <div className="text-lg text-gray-900">
                $59/month
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[#25D366] p-6 text-center text-white">
            <div className="mb-2 text-lg font-semibold">Return on Investment</div>
            <div className="text-4xl font-bold">1,678%</div>
            <div className="mt-2 text-sm opacity-90">
              You make back $17.78 for every $1 spent
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
                <span className="text-[#25D366] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                After 14 days, you'll be asked to choose a plan. No surprise charges. If you don't select a plan, your account stays active in read-only mode (you can still access your data, just can't add new stuff).
              </p>
            </details>

            <details className="group rounded-xl bg-white p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                Can I change plans later?
                <span className="text-[#25D366] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Absolutely. Upgrade or downgrade anytime. If you upgrade mid-month, we'll prorate the difference. If you downgrade, the change happens at your next billing cycle.
              </p>
            </details>

            <details className="group rounded-xl bg-white p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                Is there a setup fee?
                <span className="text-[#25D366] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Nope. Zero setup fees. Zero hidden costs. Just the monthly price you see. We even include free onboarding to help you get started.
              </p>
            </details>

            <details className="group rounded-xl bg-white p-6 shadow-sm">
              <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                Do you accept Caribbean payment methods?
                <span className="text-[#25D366] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Yes! We accept all major credit cards, debit cards, and wire transfers. We understand Caribbean banking and make it easy for you.
              </p>
            </details>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
