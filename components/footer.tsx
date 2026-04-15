"use client"

import Image from "next/image"
import Link from "next/link"
import { Mail, MessageCircle } from "lucide-react"

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Data Deletion", href: "/data-deletion" },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-black text-gray-400 overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute left-1/2 -top-40 h-80 w-80 -translate-x-1/2 rounded-full bg-[#007B85]/10 blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 py-16">
        <div className="grid gap-10 md:grid-cols-4 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-3">
            <div className="mb-5 flex items-center">
              <Image
                src="/tropichat-logo.png"
                alt="TropiChat"
                width={80}
                height={80}
                unoptimized
                className="h-16 w-16 object-contain"
              />
            </div>
            <p className="mb-4 text-lg font-bold leading-relaxed text-gray-300 max-w-md">
              The easiest way for Caribbean businesses to sell on WhatsApp and Instagram.
            </p>
            <a
              href="mailto:lamar@tropitech.org"
              className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-[#007B85]"
            >
              <Mail className="h-4 w-4" />
              lamar@tropitech.org
            </a>
          </div>

          {/* Legal Links */}
          <div className="font-sans">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/60">
              Legal
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200 hover:text-[#007B85]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 dark:border-[#222222] pt-8 text-xs text-gray-500 md:flex-row font-sans">
          <p>&copy; {new Date().getFullYear()} TropiChat by TropiTech Solutions. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-gray-500">
            <MessageCircle className="h-3.5 w-3.5 text-[#007B85]" />
            Built with care in the Bahamas
          </p>
        </div>
      </div>
    </footer>
  )
}

