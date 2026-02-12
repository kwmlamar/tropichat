"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function FinalCTASection() {
  const handleGetStarted = () => {
    window.location.href = "/signup"
  }

  return (
    <section
      id="get-started"
      className="relative overflow-hidden py-24 md:py-32 bg-gradient-to-br from-[#213138] via-[#213138] to-[#1a2a2b]"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-1/4 top-0 h-96 w-96 rounded-full bg-[#3A9B9F] opacity-10 blur-3xl" />
        <div className="absolute -left-1/4 bottom-0 h-96 w-96 rounded-full bg-[#FF8B66] opacity-10 blur-3xl" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm border border-white/20">
            <Sparkles className="h-4 w-4" />
            Ready to Transform Your Customer Communications?
          </div>

          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Start Managing All Your Customer Conversations in One Place
          </h2>

          <p className="mb-8 text-lg text-gray-300 md:text-xl">
            Join businesses that are already using TropiChat to unify their customer conversations across WhatsApp, Instagram, and Facebook Messenger.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="group bg-[#3A9B9F] text-white hover:bg-[#2F8488] text-base px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              onClick={() => window.location.href = "mailto:sales@tropichat.com?subject=Sales Inquiry"}
              variant="outline"
              size="lg"
              className="group border-white/30 bg-transparent text-white hover:bg-white/10 hover:border-white/50 text-base px-8 py-6 h-auto transition-all duration-300"
            >
              Talk to Sales
            </Button>
          </div>

          <p className="mt-8 text-sm text-gray-400">
            No credit card required • Get started in minutes • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}
