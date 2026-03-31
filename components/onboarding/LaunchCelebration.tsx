"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CopySimple, Check } from "@phosphor-icons/react"

interface LaunchCelebrationProps {
  handle: string
  businessName: string
  onGoToDashboard: () => void
}

export function LaunchCelebration({ handle, businessName, onGoToDashboard }: LaunchCelebrationProps) {
  const [copied, setCopied] = useState(false)
  const bookingUrl = `https://tropichat.com/${handle}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {/* ignore */}
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Book me at ${bookingUrl} 🌴`)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
  }

  const handleInstagram = () => {
    // Instagram doesn't support direct link sharing; copy to clipboard
    handleCopy()
    window.open("https://instagram.com", "_blank", "noopener,noreferrer")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center text-center px-6 py-10 min-h-[460px] bg-gradient-to-b from-[#0F172A] via-[#0D9488]/10 to-[#0F172A] rounded-2xl"
    >
      {/* Animated icons */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="text-5xl mb-4 flex gap-1"
      >
        🏝️🌴🎉
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-black text-white mb-1"
      >
        You&apos;re LIVE!
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-white/60 mb-2"
      >
        {businessName}
      </motion.p>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-xs text-white/40 mb-6"
      >
        Your booking link is ready to share.
      </motion.p>

      {/* URL display */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-xs bg-[#1E293B] border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-[#F4C430] text-center mb-6 break-all"
      >
        {bookingUrl}
      </motion.div>

      {/* Share row */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-xs space-y-3 mb-6"
      >
        <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Share on</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] text-sm font-bold border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
          >
            WhatsApp
          </button>
          <button
            onClick={handleInstagram}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-pink-500/10 text-pink-400 text-sm font-bold border border-pink-500/20 hover:bg-pink-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
          >
            Instagram
          </button>
          <button
            onClick={handleCopy}
            aria-label="Copy link"
            className="px-4 py-2.5 rounded-xl bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
          >
            {copied ? <Check weight="bold" className="h-4 w-4 text-[#0D9488]" /> : <CopySimple className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onGoToDashboard}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-xs bg-[#F4C430] text-[#0F172A] font-black py-3.5 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
      >
        Go to Dashboard →
      </motion.button>
    </motion.div>
  )
}
