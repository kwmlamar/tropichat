"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const overlayRef   = useRef<HTMLDivElement>(null)
  const headlineRef  = useRef<HTMLDivElement>(null)
  const subRef       = useRef<HTMLDivElement>(null)
  const ctaRef       = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const video = videoRef.current
    if (!video) return

    const init = () => {
      const ctx = gsap.context(() => {

        gsap.set(overlayRef.current,  { background: "rgba(0,0,0,0)" })
        gsap.set(headlineRef.current, { opacity: 0, y: 40 })
        gsap.set(subRef.current,      { opacity: 0, y: 24 })
        gsap.set(ctaRef.current,      { opacity: 0, y: 20 })

        // Scrub video with scroll
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            if (video.readyState >= 2) {
              video.currentTime = self.progress * video.duration
            }
          },
        })

        // Copy fades in over the last 45% of scroll
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "55% top",
            end: "bottom bottom",
            scrub: 1,
          },
          defaults: { ease: "power2.out" },
        })

        tl.to(overlayRef.current,  { background: "rgba(0,0,0,0.55)", duration: 1 }, 0)
        tl.to(headlineRef.current, { opacity: 1, y: 0, duration: 1 },               0.2)
        tl.to(subRef.current,      { opacity: 1, y: 0, duration: 1 },               0.5)
        tl.to(ctaRef.current,      { opacity: 1, y: 0, duration: 0.8 },             0.8)

      }, containerRef)

      return () => ctx.revert()
    }

    if (video.readyState >= 1) {
      init()
    } else {
      video.addEventListener("loadedmetadata", init, { once: true })
    }

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <section ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Video */}
        <video
          ref={videoRef}
          src="/hero.mp4"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-[70%_center] md:object-center"
        />

        {/* Darkening overlay */}
        <div ref={overlayRef} className="absolute inset-0 z-10" />

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 z-20 pointer-events-none"
          style={{ background: "linear-gradient(to top, #080F14, transparent)" }} />

        {/* Hero copy */}
        <div className="absolute inset-0 z-30 flex items-end md:items-center">
          {/* Left gradient so text stays readable on mobile */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }} />

          <div className="relative w-full px-6 sm:px-8 pb-28 sm:pb-36 md:pb-0 md:container md:mx-auto md:max-w-7xl">
            <div className="max-w-xs sm:max-w-sm md:max-w-xl lg:max-w-2xl">

              <div ref={headlineRef}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-black text-white leading-[0.88] tracking-tighter uppercase mb-4 sm:mb-6">
                  Stop Losing<br />Customers<br />
                  <span className="text-transparent bg-clip-text"
                    style={{ backgroundImage: "linear-gradient(135deg, #FF7E36, #FFB347)" }}>
                    Today.
                  </span>
                </h1>
              </div>

              <div ref={subRef}>
                <p className="text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-6 sm:mb-8 md:mb-10"
                  style={{ color: "rgba(255,255,255,0.65)" }}>
                  Tropi AI replies to every message, answers every question,
                  and closes every sale — automatically, while you're busy running your business.
                </p>
              </div>

              <div ref={ctaRef} className="flex flex-col items-start gap-3">
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
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
