"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router    = useRouter()
  const pathname  = usePathname()

  useEffect(() => {
    // Dark bg when scrolled past hero entirely (400vh)
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 3.8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollTo = (href: string) => {
    setMenuOpen(false)
    if (pathname !== "/") { router.push("/" + href); return }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">

        {/* Bar */}
        <div className={`transition-all duration-700 ${
          scrolled
            ? "bg-black/75 backdrop-blur-xl border-b border-white/8 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
            : "bg-transparent"
        }`}>
          <div className="container mx-auto max-w-7xl px-8 h-24 flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <Image
                src="/tropichat-logo.png"
                alt="TropiChat"
                width={52}
                height={52}
                unoptimized
                className="h-13 w-13 object-contain transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              />
              <span className="hidden sm:block text-sm font-black uppercase tracking-[0.25em] text-white/70 group-hover:text-white transition-colors">
                TropiChat
              </span>
            </Link>

            {/* Desktop nav — centered */}
            <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Pricing",      href: "#pricing" },
              ].map(({ label, href }) => (
                <button
                  key={href}
                  onClick={() => scrollTo(href)}
                  className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors duration-200"
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/login"
                className="text-xs font-black uppercase tracking-widest text-white/35 hover:text-white transition-colors duration-200"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center text-xs font-black uppercase tracking-widest text-white px-8 h-11 rounded-full transition-all duration-200 hover:scale-105"
                style={{ background: "#007B85", boxShadow: "0 0 24px rgba(0,123,133,0.35)" }}
              >
                Get Access
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white/60 hover:text-white transition-colors p-1"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden bg-black/96 backdrop-blur-xl flex flex-col items-center justify-center gap-10"
          >
            <button
              className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} />
            </button>

            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Pricing",      href: "#pricing" },
            ].map(({ label, href }) => (
              <button
                key={href}
                onClick={() => scrollTo(href)}
                className="text-4xl font-black uppercase tracking-tighter text-white"
              >
                {label}
              </button>
            ))}

            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="text-sm font-black uppercase tracking-widest text-white/30">
              Log In
            </Link>

            <Link href="/signup" onClick={() => setMenuOpen(false)}
              className="text-sm font-black uppercase tracking-widest text-white px-12 h-14 rounded-full flex items-center"
              style={{ background: "#007B85" }}>
              Get Access
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
