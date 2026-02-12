"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageSquare, Sparkles, PlayCircle } from "lucide-react"

export function HeroSection() {
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById("waitlist")
    waitlistSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/80 via-white to-white pt-20 pb-12 md:pt-28 md:pb-16">
      {/* Background decoration - Multiple floating gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Primary green orb - top center */}
        <div className="animate-float absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-br from-[#3A9B9F]/20 to-teal-200/30 blur-3xl" />
        {/* Secondary blue orb - right (Facebook Messenger blue) */}
        <div className="animate-float-delayed absolute -right-20 top-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-[#0084FF]/15 to-cyan-100/20 blur-3xl" />
        {/* Tertiary pink/purple orb - left (Instagram gradient) */}
        <div className="animate-float-slow absolute -left-20 bottom-1/4 h-[350px] w-[350px] rounded-full bg-gradient-to-tr from-[#E1306C]/15 to-[#833AB4]/10 blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      <div className="container mx-auto px-4">
        {/* Top section: text left, content centered on mobile */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center mb-12 lg:mb-16">
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
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-sm font-medium text-teal-800"
            >
              <Sparkles className="h-4 w-4" />
              🇧🇸 Built in the Bahamas • Now in Early Access
            </motion.div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              Manage All Your Customer Messages{" "}
              <span className="text-[#3A9B9F]">in One Place</span>
            </h1>

            {/* Subheadline */}
            <p className="mb-8 text-lg text-gray-600 md:text-xl leading-relaxed">
              WhatsApp, Instagram, Facebook Messenger — organized, never miss a conversation.
              <br />
              <strong className="text-gray-900">
                The multi-channel messaging tool built for how Caribbean businesses actually work.
              </strong>
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
              <Button
                onClick={scrollToWaitlist}
                size="lg"
                className="group relative bg-[#3A9B9F] text-white hover:bg-[#2F8488] text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl hover:shadow-[#3A9B9F]/25 transition-all duration-300 btn-press hover-shine overflow-hidden"
              >
                <MessageSquare className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                Start Free 14-Day Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="group border-2 border-gray-300 hover:border-[#3A9B9F] hover:text-[#3A9B9F] hover:bg-[#3A9B9F]/5 text-lg px-8 py-6 h-auto transition-all duration-300 btn-press"
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

          {/* Right side - Dashboard preview (visible on desktop only, inline) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Glow effect behind the image */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#3A9B9F]/20 via-transparent to-[#FF8B66]/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 shadow-2xl">
                <Image
                  src="/landing-page-photo.png"
                  alt="TropiChat dashboard — unified inbox for WhatsApp, Instagram, and Facebook"
                  width={1408}
                  height={768}
                  unoptimized
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-width dashboard image (mobile & tablet — stacked below text) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="relative lg:hidden"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[#3A9B9F]/20 via-transparent to-[#FF8B66]/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-xl border border-gray-200/60 shadow-2xl sm:rounded-2xl">
              <Image
                src="/landing-page-photo.png"
                alt="TropiChat dashboard — unified inbox for WhatsApp, Instagram, and Facebook"
                width={1408}
                height={768}
                unoptimized
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
