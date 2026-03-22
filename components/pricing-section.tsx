"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, Zap, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "month",
    priceContext: "Free forever",
    features: [
      "1 User limit",
      "Unified Inbox (WhatsApp, IG, Messenger)",
      "Standard chat & manual replies",
      "Basic contact management",
      "Community support",
    ],
    cta: "Start for Free",
    popular: false,
    variant: "default" as const,
  },
  {
    name: "Professional",
    description: "Founding Member Lifetime Deal",
    monthlyPrice: 29,
    annualPrice: 29,
    period: "month",
    priceContext: "Lifetime pricing for first 10 users",
    features: [
      "Everything in Free, plus:",
      "Up to 3 Team Members",
      "Advanced Automations & Workflows",
      "Broadcasts & Mass Messaging",
      "Detailed Analytics & Reports",
      "Priority VIP Support",
      "Lock in this price forever",
    ],
    cta: "Claim Lifetime Deal",
    popular: true,
    variant: "popular" as const,
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

  const handleSignup = () => {
    window.location.href = "/signup"
  }

  return (
    <section className="relative bg-[#F8FAFB] dark:bg-[#0A0A0A] py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-[#222222] to-transparent" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] px-4 py-1.5 text-sm font-semibold text-slate-500 dark:text-gray-400 shadow-sm">
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
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] p-1 shadow-sm">
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
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] p-6 md:px-8 md:py-7 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-[#111111] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#FF8B66]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF8B66] animate-pulse" />
                  ONLY 7 SPOTS LEFT
                </div>
                <h3 className="text-xl font-bold text-[#213138] dark:text-white mb-2">
                  First 10 Customers Only: Lock in $29/month
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm max-w-lg leading-relaxed">
                  Save $10/month forever. Your price will never increase, even as we add new features. Includes all priority integrations.
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                <div className="text-left md:text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#213138] dark:text-white">$29</span>
                    <span className="text-slate-500">/mo</span>
                  </div>
                  <div className="text-xs font-semibold text-[#FF8B66] mt-1">Locked in forever</div>
                </div>
                <Button
                  onClick={handleSignup}
                  className="rounded-full bg-[#FF8B66] text-white hover:bg-[#e87a55] font-semibold h-10 px-6 text-sm shadow-sm transition-all duration-300"
                >
                  Claim Offer
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2 mb-10">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative flex flex-col overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:shadow-lg ${plan.popular
                  ? "border border-[#3A9B9F] bg-white dark:bg-[#0A0A0A] shadow-sm md:scale-[1.02] z-10"
                  : "border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] shadow-sm"
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#3A9B9F]" />
              )}
              {plan.popular && (
                <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-teal-200 dark:border-teal-900/30 bg-teal-50 dark:bg-[#111111] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#3A9B9F]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3A9B9F] animate-pulse" />
                  MOST POPULAR
                </div>
              )}

               <div className="mb-5 flex-1">
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
                onClick={plan.name === "Enterprise" ? undefined : handleSignup}
                className={`w-full rounded-full h-11 text-sm font-semibold transition-all duration-300 ${plan.popular
                     ? "bg-[#3A9B9F] text-white hover:bg-[#2F8488] shadow-sm hover:shadow-md"
                    : plan.name === "Enterprise"
                      ? "bg-[#213138] dark:bg-[#3A9B9F] text-white hover:bg-slate-800 dark:hover:bg-[#2F8488]"
                      : "border border-slate-300 dark:border-[#222222] bg-white dark:bg-[#111111] text-slate-700 dark:text-gray-200 hover:border-[#3A9B9F] hover:text-[#3A9B9F]"
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
                className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
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
