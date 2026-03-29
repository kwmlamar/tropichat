"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { List as Menu, X } from "@phosphor-icons/react"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
]

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    setIsMobileMenuOpen(false)
    
    // If we're not on the home page, navigate to home + anchor
    if (pathname !== "/") {
      router.push("/" + href)
      return
    }

    // If we're already on the home page, smooth scroll
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 pt-6`}
      >
        <div 
          className={`container mx-auto max-w-7xl h-20 rounded-full transition-all duration-500 flex items-center justify-between px-8 border ${
            isScrolled 
            ? "bg-white/90 dark:bg-black/90 backdrop-blur-xl border-gray-100 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]" 
            : "bg-black/20 backdrop-blur-md border-white/10 shadow-xl"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center group h-10 w-10 shrink-0">
            <Image
              src="/tropichat-logo.png"
              alt="TropiChat"
              width={50}
              height={50}
              unoptimized
              className="h-full w-full object-contain transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#007B85] transition-colors relative group"
              >
                {link.label}
                <motion.span 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#007B85] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  layoutId="nav-dot"
                />
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#213138] dark:hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Button
              asChild
              className="bg-[#007B85] text-white hover:bg-[#2F8488] text-[10px] font-black uppercase tracking-widest rounded-full px-8 h-12 shadow-xl shadow-teal-500/20 hover:scale-105 transition-all"
            >
              <Link href="/signup">Free Trial</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-3 bg-gray-50 dark:bg-white/5 rounded-full text-[#213138] dark:text-white"
          >
            {isMobileMenuOpen ? <X size={20} weight="bold" /> : <Menu size={20} weight="bold" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 md:hidden bg-white dark:bg-black p-6 pt-32"
          >
            <div className="flex flex-col gap-8 text-center">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="text-3xl font-black tracking-tighter text-[#213138] dark:text-white"
                >
                  {link.label}
                </button>
              ))}
              <hr className="border-gray-100 dark:border-white/5" />
              <Link
                href="/login"
                className="text-xl font-black text-slate-400"
              >
                Log In
              </Link>
              <Button
                asChild
                className="bg-[#007B85] py-8 text-lg font-black uppercase tracking-widest rounded-full"
              >
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  Start Free Trial
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
