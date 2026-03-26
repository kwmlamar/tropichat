"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"

export function SplashLoader({ isLoading }: { isLoading: boolean }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure the zoom animation feels smooth after data is ready
      const timer = setTimeout(() => setShow(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-black overflow-hidden"
        >
          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ 
              scale: 50, // Massive blow up like Twitter
              opacity: 0,
              transition: { 
                duration: 1.2, 
                ease: [0.7, 0, 0.3, 1], // Very aggressive ease in
              }
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut"
            }}
            className="relative w-24 h-24"
          >
            <div className="absolute inset-0 bg-[#007B85]/5 dark:bg-[#007B85]/10 blur-2xl rounded-full scale-150" />
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
              scale: 4,
              opacity: 0,
              transition: { duration: 0.8, ease: "easeInOut" }
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#007B85]/10 to-[#FF7E36]/5 blur-[120px] rounded-full opacity-50" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
