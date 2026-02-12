"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
]

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    element?.scrollIntoView({ behavior: "smooth" })
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between md:h-24">
            {/* Logo */}
            <a href="/" className="flex items-center group">
              <Image
                src="/tropichat-full-logo2.png"
                alt="TropiChat"
                width={320}
                height={88}
                unoptimized
                className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 md:h-20"
              />
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="relative px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 group"
                >
                  {link.label}
                  {/* Hover underline */}
                  <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-[#3A9B9F] scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                </button>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                asChild
                className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button
                asChild
                className="bg-[#3A9B9F] text-white hover:bg-[#2F8488] text-sm font-semibold px-5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 md:hidden"
          >
            <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-lg">
              <div className="container mx-auto px-4 py-4">
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => scrollToSection(link.href)}
                      className="w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {link.label}
                    </button>
                  ))}
                  <hr className="my-2 border-gray-200" />
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Log In
                  </Link>
                  <Button
                    asChild
                    className="mt-2 w-full bg-[#3A9B9F] text-white hover:bg-[#2F8488] text-base font-semibold py-3 h-auto shadow-sm"
                  >
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Start Free Trial
                    </Link>
                  </Button>
                </nav>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-20 md:h-24" />
    </>
  )
}
