"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CopySimple, ArrowSquareOut, Check } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface BookingPagePreviewProps {
  handle: string
  businessName: string
  firstServiceName?: string
  firstServiceDuration?: number
  firstServicePrice?: number
  onLaunch: () => void
}

export function BookingPagePreview({
  handle,
  businessName,
  firstServiceName,
  firstServiceDuration,
  firstServicePrice,
  onLaunch,
}: BookingPagePreviewProps) {
  const [copied, setCopied] = useState(false)
  const bookingUrl = `https://tropichat.com/${handle}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select input
    }
  }

  const handleOpen = () => {
    window.open(bookingUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-4">
      {/* Phone frame preview */}
      <div className="flex justify-center">
        <div className="relative w-[220px]">
          {/* Phone outline */}
          <div className="bg-[#0F172A] border-2 border-white/20 rounded-[28px] overflow-hidden shadow-2xl">
            {/* Status bar */}
            <div className="flex justify-between items-center px-5 pt-3 pb-1">
              <span className="text-[10px] text-white/40 font-semibold">9:41</span>
              <div className="flex gap-1 items-center">
                <div className="w-4 h-2 border border-white/30 rounded-sm">
                  <div className="w-3/4 h-full bg-white/40 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4 space-y-3">
              {/* Business header */}
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#F4C430]/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-lg">🌴</span>
                </div>
                <p className="text-white font-black text-sm leading-tight">{businessName || "Your Business"}</p>
                <p className="text-white/50 text-[11px] mt-0.5">Book a service</p>
              </div>

              <div className="border-t border-white/10" />

              {/* Service preview */}
              {firstServiceName ? (
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-white text-xs font-semibold mb-0.5">{firstServiceName}</p>
                  <p className="text-white/50 text-[11px]">
                    {firstServiceDuration}min
                    {firstServicePrice !== undefined && firstServicePrice > 0 && ` · $${firstServicePrice}`}
                  </p>
                  <button className="mt-2 w-full bg-[#F4C430] text-[#0F172A] text-[10px] font-black py-1.5 rounded-lg">
                    Book Now
                  </button>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white/30 text-[11px]">No services yet</p>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="px-4 pb-4 pt-1 text-center">
              <p className="text-[9px] text-white/20">tropichat.com/{handle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* URL row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-[#1E293B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 truncate">
          {bookingUrl}
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy link"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
        >
          {copied ? (
            <Check className="h-4 w-4 text-[#0D9488]" />
          ) : (
            <CopySimple className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={handleOpen}
          aria-label="Open booking page"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
        >
          <ArrowSquareOut className="h-4 w-4" />
        </button>
      </div>

      {/* Launch CTA */}
      <motion.button
        onClick={onLaunch}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-[#F4C430] text-[#0F172A] font-black py-3.5 rounded-xl text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
      >
        I&apos;m Ready to Launch! 🚀
      </motion.button>
    </div>
  )
}
