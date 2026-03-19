"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Zap, ArrowRight } from "lucide-react"

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
    variant: "default" as const,
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
    variant: "popular" as const,
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
    variant: "enterprise" as const,
  },
]

const faqItems = [
  {
    question: "What happens after the free trial?",
    answer: "After 14 days, you'll be asked to choose a plan. No surprise charges. If you don't select a plan, your account stays active in read-only mode — you can still access your data.",
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. Upgrade or downgrade anytime. If you upgrade mid-month, we'll prorate the difference. If you downgrade, the change happens at your next billing cycle.",
  },
  {
    question: "Is there a setup fee?",
    answer: "Nope. Zero setup fees. Zero hidden costs. Just the monthly price you see. We even include free onboarding to help you get started.",
  },
  {
    question: "Do you accept Caribbean payment methods?",
    answer: "Yes! We accept all major credit cards, debit cards, and wire transfers. We understand Caribbean banking and make it easy for you.",
  },
  {
    question: "What is the early adopter offer exactly?",
    answer: "The first 10 customers get $29/month locked in permanently — $10/month less than the standard Starter price. Your price never increases, even as we add features. Only 7 spots remain.",
  },
]

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById("waitlist")
    waitlistSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative bg-[#F8FAFB] dark:bg-[#0A0A0A] py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-[#2A2A2A] to-transparent" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] px-4 py-1.5 text-sm font-semibold text-slate-500 dark:text-gray-400 shadow-sm">
            Pricing
          </div>
          <h2 className="mb-4 font-[family-name:var(--font-poppins)] text-4xl font-bold tracking-tight text-[#213138] dark:text-white md:text-5xl">
            Simple pricing.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A9B9F] to-teal-700">
              No surprises.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-gray-400">
            Try free for 14 days. No credit card required. Cancel anytime.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] p-1 shadow-sm">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${!isAnnual
                  ? "bg-[#213138] dark:bg-[#3A9B9F] text-white shadow-sm"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${isAnnual
                  ? "bg-[#213138] dark:bg-[#3A9B9F] text-white shadow-sm"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
                }`}
            >
              Annual
              <span className="rounded-full bg-[#3A9B9F] px-2 py-0.5 text-[10px] font-bold text-white">
                SAVE 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Early Adopter Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl mb-10"
        >
          <div className="relative overflow-hidden rounded-2xl border border-[#FF8B66]/50 dark:border-[#FF8B66]/30 bg-gradient-to-r from-[#FF8B66]/10 via-orange-50 to-[#FF8B66]/10 dark:from-[#FF8B66]/5 dark:via-transparent dark:to-[#FF8B66]/5 p-6 md:px-8 md:py-7 shadow-sm">
            {/* Pulsing badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-[#FF8B66] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              ONLY 7 SPOTS LEFT
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-6 pr-24 md:pr-0">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#FF8B66]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF8B66]">
                    First 10 Customers Only
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#213138] dark:text-white mb-1">
                  Lock in $29/month — Forever
                </h3>
                <p className="text-slate-600 dark:text-gray-400 text-sm">
                  <span className="font-semibold text-[#FF8B66]">Save $10/month forever</span>{" "}
                  (normally $39/month). Price never increases, even as we add features.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    "All Starter features included",
                    "Locked-in pricing, never increases",
                    "Priority feature requests",
                    "Direct founder support",
                  ].map((perk, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
                      <Check className="h-4 w-4 flex-shrink-0 text-[#FF8B66]" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col items-center gap-3 md:min-w-[200px]">
                <div className="text-center">
                  <div className="text-sm text-slate-400 line-through">$39/month</div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-[#213138] dark:text-white">$29</span>
                    <span className="text-slate-500">/mo</span>
                  </div>
                  <div className="text-xs font-semibold text-[#FF8B66] mt-1">locked in forever</div>
                </div>
                <Button
                  onClick={scrollToWaitlist}
                  className="w-full rounded-full bg-[#FF8B66] text-white hover:bg-[#e87a55] font-semibold h-11 text-sm shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Lock in $29/month
                </Button>
                <p className="text-xs text-slate-400 text-center">14-day free trial · No credit card</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3 mb-10">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:shadow-lg ${plan.popular
                  ? "border-2 border-[#3A9B9F] bg-white dark:bg-[#1E1E1E] shadow-[0_8px_40px_rgba(58,155,159,0.15)] md:scale-[1.03]"
                  : "border border-slate-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A9B9F] to-teal-400" />
              )}
              {plan.popular && (
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  MOST POPULAR
                </div>
              )}

               <div className="mb-5">
                <h3 className="text-xl font-bold text-[#213138] dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.monthlyPrice !== null ? (
                  <>
                     <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-[#213138] dark:text-white">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-slate-500 dark:text-gray-400">/{plan.period}</span>
                    </div>
                    {isAnnual && (
                      <p className="mt-1 text-xs text-[#3A9B9F] font-semibold">
                        Billed annually · Save ${((plan.monthlyPrice! - plan.annualPrice!) * 12)}/yr
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#213138]">Custom</span>
                  </div>
                )}
                <p className="mt-1.5 text-xs text-slate-400">{plan.priceContext}</p>
              </div>

              <ul className="mb-8 space-y-2.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.popular ? "text-[#3A9B9F]" : "text-slate-400"}`} />
                     <span
                      className={`text-sm ${feature.includes("Everything")
                          ? "font-semibold text-[#213138] dark:text-white"
                          : "text-slate-600 dark:text-gray-400"
                        }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={plan.name === "Enterprise" ? undefined : scrollToWaitlist}
                className={`w-full rounded-full h-11 text-sm font-semibold transition-all duration-300 ${plan.popular
                     ? "bg-[#3A9B9F] text-white hover:bg-[#2F8488] shadow-sm hover:shadow-md"
                    : plan.name === "Enterprise"
                      ? "bg-[#213138] dark:bg-[#3A9B9F] text-white hover:bg-slate-800 dark:hover:bg-[#2F8488]"
                      : "border border-slate-300 dark:border-[#2A2A2A] bg-white dark:bg-[#262626] text-slate-700 dark:text-gray-200 hover:border-[#3A9B9F] hover:text-[#3A9B9F]"
                  }`}
              >
                {plan.cta}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>

              {plan.popular && (
                <p className="mt-3 text-center text-xs text-slate-400">
                  14-day free trial · No credit card
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
          className="mb-16 flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-gray-400"
        >
          {["14-day free trial", "No credit card required", "Cancel anytime", "Free onboarding"].map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#3A9B9F]" />
              {t}
            </div>
          ))}
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mx-auto max-w-3xl"
        >
         <h3 className="mb-8 text-center text-2xl font-bold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)]">
            Pricing questions
          </h3>
          <div className="space-y-3">
            {faqItems.map((faq, i) => (
               <div
                key={i}
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
              >
                 <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-[#213138] dark:text-white hover:text-[#3A9B9F] transition-colors duration-200"
                >
                  {faq.question}
                  <span
                    className={`ml-4 shrink-0 text-[#3A9B9F] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? "auto" : 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                   <p className="px-6 pb-5 text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
