"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [copyVisible, setCopyVisible] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      if (!video.duration) return
      const p = video.currentTime / video.duration

      // Overlay darkens from 55% onward
      if (p > 0.55) {
        const t = Math.min(1, (p - 0.55) / 0.35)
        setOverlayOpacity(t * 0.58)
        setCopyVisible(true)
      } else {
        setOverlayOpacity(0)
        setCopyVisible(false)
      }

      // Freeze on last frame once done
      if (p >= 0.99) {
        video.pause()
      }
    }

    video.addEventListener("timeupdate", onTimeUpdate)
    return () => video.removeEventListener("timeupdate", onTimeUpdate)
  }, [])

  return (
    <section className="relative min-h-screen w-full overflow-hidden">

      {/* Video */}
      <video
        ref={videoRef}
        src="/hero.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover object-[70%_center] md:object-center"
      />

      {/* Darkening overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: `rgba(0,0,0,${overlayOpacity})`, transition: "background 0.1s linear" }}
      />

      {/* Left gradient */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 z-20 pointer-events-none"
        style={{ background: "linear-gradient(to top, #080F14, transparent)" }} />

      {/* Hero copy */}
      <div className="absolute inset-0 z-30 flex items-end md:items-center">
        <div className="relative w-full px-6 sm:px-8 pb-28 sm:pb-36 md:pb-0 md:container md:mx-auto md:max-w-7xl">
          <div className="max-w-xs sm:max-w-sm md:max-w-xl lg:max-w-2xl">

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={copyVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-black text-white leading-[0.88] tracking-tighter uppercase mb-4 sm:mb-6"
            >
              Stop Losing<br />Customers<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #FF7E36, #FFB347)" }}>
                Today.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={copyVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-6 sm:mb-8 md:mb-10"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Tropi AI replies to every message, answers every question,
              and closes every sale — automatically, while you're busy running your business.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={copyVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col items-start gap-3"
            >
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 text-white font-black text-[11px] uppercase tracking-widest px-7 sm:px-8 h-12 sm:h-14 rounded-full transition-all duration-300 hover:scale-105"
                style={{ background: "#007B85", boxShadow: "0 20px 50px rgba(0,123,133,0.45)" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,123,133,0.65)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,123,133,0.45)")}
              >
                Get Early Access
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.25)" }}>
                Free for 14 days · No credit card needed
              </p>
            </motion.div>

          </div>
        </div>
      </div>

    </section>
  )
}
