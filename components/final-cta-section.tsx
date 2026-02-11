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
      className="relative overflow-hidden py-24 md:py-32 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-1/4 top-0 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl" />
        <div className="absolute -left-1/4 bottom-0 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl" />
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-10" />
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

          <p className="mb-8 text-lg text-blue-100 md:text-xl">
            Join businesses that are already using TropiChat to unify their customer communications across WhatsApp, Email, and Phone.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="group bg-white text-blue-600 hover:bg-gray-100 text-base px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
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

          <p className="mt-8 text-sm text-blue-200">
            No credit card required • Get started in minutes • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}
