"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"

import { createPortal } from "react-dom"

export function SplashLoader({ isLoading }: { isLoading: boolean }) {
  const [show, setShow] = useState(true)
  const [minTimePassed, setMinTimePassed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setMinTimePassed(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoading && minTimePassed) {
      const timer = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading, minTimePassed])

  // Don't render anything during SSR
  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white dark:bg-black overflow-hidden"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ 
              scale: 25, 
              rotate: 360, 
              opacity: 0,
              transition: { 
                duration: 1.5, 
                ease: [0.7, 0, 0.3, 1],
              }
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut"
            }}
            className="relative w-24 h-24"
            style={{ willChange: "transform, opacity" }}
          >
            <img 
              src="/tropichat-logo.png" 
              alt="TropiChat" 
              className="w-full h-full object-contain relative z-10 drop-shadow-sm"
            />
          </motion.div>
          
          {/* Background splash effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              scale: 5,
              opacity: 0,
              transition: { duration: 1.2, ease: "easeInOut" }
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#007B85]/20 to-[#FF7E36]/10 blur-[120px] rounded-full opacity-60" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
