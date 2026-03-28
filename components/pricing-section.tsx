"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight, Zap, Users } from "lucide-react"

// ManyChat-style Scaling Tiers
const pricingTiers = [
  { contacts: 500, price: 15 },
  { contacts: 2500, price: 25 },
  { contacts: 5000, price: 45 },
  { contacts: 10000, price: 65 },
  { contacts: 15000, price: 95 },
  { contacts: 20000, price: 125 },
  { contacts: 30000, price: 165 },
  { contacts: 40000, price: 195 },
  { contacts: 50000, price: 235 },
  { contacts: 100000, price: 435 },
]

export function PricingSection() {
  const [contacts, setContacts] = useState(500)
  const [isAnnual, setIsAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Find the current price based on the selected contact count
  const currentTier = useMemo(() => {
    return pricingTiers.find(t => t.contacts >= contacts) || pricingTiers[pricingTiers.length - 1]
  }, [contacts])

  const monthlyPrice = currentTier.price
  const displayPrice = isAnnual ? Math.floor(monthlyPrice * 0.8) : monthlyPrice

  const handleSignup = () => {
    window.location.href = "/signup"
  }

  const faqItems = [
    {
      question: "How do contacts work?",
      answer: "A contact is anyone who has messaged your business or exists in your TropiChat database. As your list grows, your plan automatically adjusts to the next tier.",
    },
    {
      question: "What happens if I exceed 100,000 contacts?",
      answer: "For lists larger than 100k, we offer custom Enterprise pricing with dedicated support and higher rate limits. Contact our sales team for a quote.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. TropiChat is a month-to-month service. You can cancel, upgrade, or downgrade your plan at any time from your billing dashboard.",
    },
    {
      question: "Do you accept Caribbean payment methods?",
      answer: "Absolutely. We accept all major credit/debit cards, and for Bahamas-based businesses, we even support local bank transfers for annual plans.",
    },
  ]

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
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] px-4 py-1.5 text-sm font-semibold text-slate-500 dark:text-gray-400 shadow-sm">
            Simple Scaling
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-[#213138] dark:text-white md:text-5xl">
            Scale as you{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007B85] to-teal-700">
              grow.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-gray-400">
            Start for free and only pay more as your business reaches more customers.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] p-1 shadow-sm">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${!isAnnual
                  ? "bg-[#213138] dark:bg-[#007B85] text-white shadow-sm"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${isAnnual
                  ? "bg-[#213138] dark:bg-[#007B85] text-white shadow-sm"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
                }`}
            >
              Annual
              <span className="rounded-full bg-[#007B85] px-2 py-0.5 text-[10px] font-bold text-white">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Grid */}
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12 items-start">
          
          {/* FREE PLAN */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0C0C0C] p-8 shadow-sm"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-[#213138] dark:text-white">Free</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                Perfect for testing the waters and small personal brands.
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-[#213138] dark:text-white">$0</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">Up to 500 contacts included</p>
            </div>

            <ul className="mb-10 space-y-4">
              {[
                "Unified Inbox (IG, WA, Messenger)",
                "Basic Contact Management",
                "1,000 Messages / month",
                "Community Support",
              ].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-gray-400">
                  <Check className="h-5 w-5 text-teal-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={handleSignup}
              variant="outline"
              className="w-full rounded-2xl h-12 border-slate-300 dark:border-[#222222] font-semibold hover:bg-slate-50 dark:hover:bg-[#111111]"
            >
              Get Started Free
            </Button>
          </motion.div>

          {/* PRO SCALING PLAN */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8 rounded-3xl border-2 border-[#007B85] bg-white dark:bg-[#0C0C0C] p-8 md:p-12 shadow-xl relative overflow-hidden"
          >
            {/* Urgency Badge */}
            <div className="absolute top-0 right-0 bg-[#007B85] text-white px-6 py-2 rounded-bl-3xl text-sm font-bold tracking-tight">
              PRO ACCESS
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-3xl font-bold text-[#213138] dark:text-white flex items-center gap-3">
                  Pro <Zap className="fill-[#007B85] text-[#007B85] h-6 w-6" />
                </h3>
                <p className="mt-4 text-slate-500 dark:text-gray-400 leading-relaxed">
                  Unlock the full power of TropiChat. Advanced automations, mass broadcasts, and Caribbean-ready integrations.
                </p>

                <div className="mt-10 space-y-4">
                  {[
                    "Unlimited Team Members",
                    "Advanced AI Automations",
                    "Bulk Broadcasts & Sequences",
                    "Detailed Analytics Dashboard",
                    "Remove TropiChat Branding",
                    "Priority WhatsApp Support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-gray-400 list-none">
                      <Check className="h-5 w-5 text-[#007B85] shrink-0" />
                      {f}
                    </li>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center bg-slate-50 dark:bg-[#111111] rounded-3xl p-8 border border-slate-100 dark:border-[#1A1A1A]">
                <div className="text-center mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#007B85] mb-2">Estimated Monthly Price</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-6xl font-black text-[#213138] dark:text-white transition-all duration-300">
                      ${displayPrice}
                    </span>
                    <span className="text-slate-500 font-medium">/mo</span>
                  </div>
                  {isAnnual && (
                    <p className="mt-2 text-xs font-bold text-teal-600 uppercase tracking-wide">Billed Annually (Save 20%)</p>
                  )}
                </div>

                {/* SLIDER */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm font-bold text-[#213138] dark:text-white">
                    <span className="flex items-center gap-2">
                       <Users className="h-4 w-4 text-[#007B85]" />
                       {contacts.toLocaleString()} Contacts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={contacts}
                    onChange={(e) => setContacts(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-[#222222] rounded-lg appearance-none cursor-pointer accent-[#007B85]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>500</span>
                    <span>100,000+</span>
                  </div>
                </div>

                <Button
                  onClick={handleSignup}
                  className="w-full mt-10 rounded-2xl h-14 bg-[#007B85] text-white hover:bg-[#2F8488] font-bold text-lg shadow-lg shadow-teal-500/20"
                >
                  Start Your 14-Day Free Trial
                </Button>
                <p className="text-center mt-4 text-xs text-slate-400">No credit card required to start</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-[#213138] dark:text-white mb-12">Common Questions</h3>
          <div className="space-y-4">
            {faqItems.map((faq, i) => (
              <div
                key={i}
                className="border border-slate-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] rounded-2xl overflow-hidden hover:border-[#007B85] transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-[#213138] dark:text-white"
                >
                  {faq.question}
                  <span className={`transition-transform duration-300 text-[#007B85] ${openFaq === i ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-slate-500 dark:text-gray-400 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
