import Image from "next/image"
import { Mail, Twitter, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#213138] text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center">
              <Image
                src="/tropichat-full-logo2.png"
                alt="TropiChat"
                width={320}
                height={88}
                unoptimized
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="mb-4 text-sm text-gray-400">
              Helping Caribbean small businesses turn messaging chaos into
              organized success — across WhatsApp, Instagram & Facebook.
            </p>
            <p className="flex items-center gap-1 text-sm text-gray-400">
              Built by{" "}
              <span className="font-semibold text-white">
                TropiTech Solutions
              </span>{" "}
              🇧🇸
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/privacy"
                  className="transition-colors hover:text-[#3A9B9F]"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="transition-colors hover:text-[#3A9B9F]"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/data-deletion"
                  className="transition-colors hover:text-[#3A9B9F]"
                >
                  Data Deletion
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <div className="space-y-2 text-sm">
              <a
                href="mailto:support@tropichat.com"
                className="flex items-center gap-2 transition-colors hover:text-[#3A9B9F]"
              >
                <Mail className="h-4 w-4" />
                support@tropichat.com
              </a>
            </div>
            <div className="mt-4 flex gap-4">
              <a
                href="#"
                className="p-2 rounded-lg transition-all duration-300 hover:text-[#3A9B9F] hover:bg-[#3A9B9F]/10 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg transition-all duration-300 hover:text-[#3A9B9F] hover:bg-[#3A9B9F]/10 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg transition-all duration-300 hover:text-[#3A9B9F] hover:bg-[#3A9B9F]/10 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} TropiChat. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
