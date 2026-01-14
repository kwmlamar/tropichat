"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles, PlayCircle } from "lucide-react"

export function HeroSection() {
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById("waitlist")
    waitlistSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-green-50/80 via-white to-white py-20 md:py-32">
      {/* Background decoration - Multiple floating gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Primary green orb - top center */}
        <div className="animate-float absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-br from-[#25D366]/20 to-emerald-200/30 blur-3xl" />
        {/* Secondary blue orb - right */}
        <div className="animate-float-delayed absolute -right-20 top-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-blue-200/20 to-cyan-100/20 blur-3xl" />
        {/* Tertiary purple orb - left */}
        <div className="animate-float-slow absolute -left-20 bottom-1/4 h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-purple-200/15 to-pink-100/10 blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800"
            >
              <Sparkles className="h-4 w-4" />
              🇧🇸 Built in the Bahamas • Trusted by 240+ Caribbean businesses
            </motion.div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              Run Your Business Like a Pro—{" "}
              <span className="text-[#25D366]">Right From WhatsApp</span>
            </h1>

            {/* Subheadline */}
            <p className="mb-8 text-lg text-gray-600 md:text-xl leading-relaxed">
              Label customers. Save responses. Track orders. Never lose a conversation.
              <br />
              <strong className="text-gray-900">
                The WhatsApp Business tool built for how Caribbean businesses actually work.
              </strong>
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
              <Button
                onClick={scrollToWaitlist}
                size="lg"
                className="group relative bg-[#25D366] text-white hover:bg-[#20BD5B] text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl hover:shadow-[#25D366]/25 transition-all duration-300 btn-press hover-shine overflow-hidden"
              >
                <MessageSquare className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                Start Free 14-Day Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="group border-2 border-gray-300 hover:border-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/5 text-lg px-8 py-6 h-auto transition-all duration-300 btn-press"
              >
                <PlayCircle className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                Watch 2-Min Demo
              </Button>
            </div>

            {/* Trust line */}
            <p className="text-sm text-gray-500 text-center lg:text-left">
              ✓ No credit card required  •  ✓ Cancel anytime  •  ✓ Setup in 5 minutes
            </p>
          </motion.div>

          {/* Right side - Hero Image/Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative"
          >
            <div className="relative mx-auto aspect-[4/3] max-w-2xl overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl">
              {/* Placeholder for dashboard mockup */}
              <div className="flex h-full items-center justify-center p-8">
                <div className="w-full space-y-4">
                  {/* Mock chat interface */}
                  <div className="rounded-lg bg-white p-4 shadow-md">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500" />
                      <div className="flex-1">
                        <div className="h-3 w-32 rounded bg-gray-200" />
                        <div className="mt-1 h-2 w-20 rounded bg-gray-100" />
                      </div>
                      <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                        VIP
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-md">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <div className="h-3 w-40 rounded bg-gray-200" />
                        <div className="mt-1 h-2 w-24 rounded bg-gray-100" />
                      </div>
                      <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        New
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-md">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-500" />
                      <div className="flex-1">
                        <div className="h-3 w-36 rounded bg-gray-200" />
                        <div className="mt-1 h-2 w-28 rounded bg-gray-100" />
                      </div>
                      <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                        Follow-up
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp icon overlay */}
              <div className="absolute -right-4 -top-4 rounded-full bg-[#25D366] p-4 shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
