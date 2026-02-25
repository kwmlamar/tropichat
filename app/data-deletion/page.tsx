import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Trash2, Mail, AlertTriangle, Shield, Clock, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Data Deletion Request - TropiChat by TropiTech Solutions LLC",
  description:
    "Request deletion of your data from TropiChat. Learn how to delete your account and all associated data from our platform.",
}

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center group">
            <Image
              src="/tropichat-full-logo2.png"
              alt="TropiChat"
              width={320}
              height={88}
              unoptimized
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 md:h-16"
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#3A9B9F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h1 className="mb-2 text-3xl font-bold text-[#213138] md:text-4xl">
          Data Deletion Request
        </h1>
        <p className="mb-10 text-sm text-gray-500">
          Last updated: February 25, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-[#213138]/90 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#213138] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#213138] [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:leading-relaxed [&_a]:text-[#3A9B9F] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#2F8488]">
          <p>
            At TropiChat, we respect your privacy and your right to control your
            data. This page explains how to request deletion of your data from
            our platform and what to expect during the process.
          </p>

          {/* What Data We Store */}
          <h2>What Data We Store</h2>
          <p>
            When you use TropiChat, we store the following types of data
            associated with your account:
          </p>
          <ul>
            <li>
              <strong>Account information</strong> — email address, name,
              business name, and profile details
            </li>
            <li>
              <strong>Messaging data</strong> — WhatsApp, Instagram, and
              Facebook Messenger conversations managed through TropiChat
            </li>
            <li>
              <strong>Customer contacts</strong> — names, phone numbers, profile
              pictures, tags, and notes for your business contacts
            </li>
            <li>
              <strong>Booking records</strong> — appointments, calendar data,
              and booking history
            </li>
            <li>
              <strong>Templates and automations</strong> — quick replies,
              message templates, and workflow configurations
            </li>
            <li>
              <strong>Usage data</strong> — analytics, activity logs, and
              service usage records
            </li>
          </ul>
          <p>
            For full details on what we collect and how we use it, see our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>

          {/* How to Request Data Deletion */}
          <h2>How to Request Data Deletion</h2>

          {/* Option 1 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3A9B9F]/10">
                <Trash2 className="h-4 w-4 text-[#3A9B9F]" />
              </div>
              <h3 className="!mt-0 !mb-0 text-lg">
                Option 1: Delete Your Account (Self-Service)
              </h3>
            </div>
            <p>
              You can delete your TropiChat account and all associated data
              directly from your dashboard:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Log in to your TropiChat account at{" "}
                <a href="https://tropichat.chat/login">tropichat.chat/login</a>
              </li>
              <li>
                Navigate to <strong>Settings</strong>
              </li>
              <li>
                Scroll to the <strong>Account</strong> section
              </li>
              <li>
                Click <strong>&quot;Delete Account&quot;</strong>
              </li>
              <li>Confirm the deletion when prompted</li>
            </ol>
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div className="text-sm text-red-800">
                  <strong>Warning:</strong> Account deletion is permanent and
                  cannot be undone. All your data — including messages, contacts,
                  bookings, and templates — will be permanently deleted.
                </div>
              </div>
            </div>
          </div>

          {/* Option 2 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3A9B9F]/10">
                <Mail className="h-4 w-4 text-[#3A9B9F]" />
              </div>
              <h3 className="!mt-0 !mb-0 text-lg">
                Option 2: Request Deletion via Email
              </h3>
            </div>
            <p>
              If you cannot access your account or prefer to have us handle the
              deletion:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Send an email to{" "}
                <a href="mailto:support@tropichat.chat">
                  support@tropichat.chat
                </a>
              </li>
              <li>
                Use the subject line:{" "}
                <strong>&quot;Data Deletion Request&quot;</strong>
              </li>
              <li>
                Include your <strong>registered email address</strong> and{" "}
                <strong>business name</strong> so we can locate your account
              </li>
            </ol>
            <p>
              We will verify your identity, process the request within 30 days,
              and send you a confirmation email once deletion is complete.
            </p>
          </div>

          {/* What Happens After Deletion */}
          <h2>What Happens After Deletion</h2>
          <div className="space-y-4">
            <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3A9B9F]/10">
                <Shield className="h-4 w-4 text-[#3A9B9F]" />
              </div>
              <div>
                <p className="font-semibold text-[#213138]">
                  Immediate Effects
                </p>
                <p className="text-sm">
                  Your account access is terminated immediately. You will be
                  logged out and will no longer be able to sign in. All connected
                  messaging channels (WhatsApp, Instagram, Messenger) are
                  disconnected.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3A9B9F]/10">
                <Clock className="h-4 w-4 text-[#3A9B9F]" />
              </div>
              <div>
                <p className="font-semibold text-[#213138]">
                  Within 30 Days
                </p>
                <p className="text-sm">
                  All personal data is permanently deleted from our systems,
                  including your account information, stored messages, customer
                  contacts, booking records, templates, and automations.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3A9B9F]/10">
                <Trash2 className="h-4 w-4 text-[#3A9B9F]" />
              </div>
              <div>
                <p className="font-semibold text-[#213138]">
                  Permanently Deleted Data
                </p>
                <ul className="mt-1 space-y-0.5 text-sm list-disc pl-4">
                  <li>Your account profile and settings</li>
                  <li>All stored messages and conversation history</li>
                  <li>All customer contacts and associated notes</li>
                  <li>All booking records and calendar data</li>
                  <li>Message templates and automation workflows</li>
                  <li>Connected platform tokens and credentials</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Retention Exceptions */}
          <h2>Data Retention Exceptions</h2>
          <p>
            Certain data may be retained after account deletion as required by
            law:
          </p>
          <ul>
            <li>
              <strong>Financial transaction records</strong> — billing and
              payment records are retained for up to 7 years to comply with tax
              and accounting regulations
            </li>
            <li>
              <strong>Legal hold data</strong> — if your account is subject to
              an active legal proceeding or investigation, relevant data may be
              preserved until the matter is resolved
            </li>
            <li>
              <strong>Anonymized analytics</strong> — aggregated, anonymized
              usage data that contains no personal identifiers may be retained
              for service improvement purposes
            </li>
          </ul>

          {/* Meta Platform Data */}
          <h2>Meta Platform Data</h2>
          <p>
            Deleting your TropiChat account removes all data stored by
            TropiChat. However, data associated with your Facebook, Instagram, or
            WhatsApp accounts is managed directly by Meta. To manage or delete
            data held by Meta:
          </p>
          <ul>
            <li>
              <strong>Facebook:</strong> Visit{" "}
              <a
                href="https://www.facebook.com/settings"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook Settings
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>{" "}
              &rarr; Your Facebook Information &rarr; Delete Your Information
            </li>
            <li>
              <strong>Instagram:</strong> Visit{" "}
              <a
                href="https://www.instagram.com/accounts/privacy_and_security/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram Privacy Settings
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>{" "}
              &rarr; Data Download or Account Deletion
            </li>
            <li>
              <strong>WhatsApp:</strong> Open the WhatsApp app &rarr; Settings
              &rarr; Account &rarr; Delete My Account
            </li>
          </ul>
          <p>
            For more information about how Meta handles your data, see{" "}
            <a
              href="https://www.facebook.com/privacy/policy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Meta&apos;s Privacy Policy
            </a>
            .
          </p>

          {/* Questions */}
          <h2>Questions or Concerns</h2>
          <p>
            If you have questions about data deletion or our privacy practices,
            we are here to help:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@tropichat.chat">support@tropichat.chat</a>
            </li>
            <li>
              <strong>Privacy Policy:</strong>{" "}
              <Link href="/privacy">tropichat.chat/privacy</Link>
            </li>
            <li>
              <strong>Terms of Service:</strong>{" "}
              <Link href="/terms">tropichat.chat/terms</Link>
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} TropiTech Solutions LLC. All
            rights reserved.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              href="/"
              className="transition-colors hover:text-[#3A9B9F]"
            >
              Home
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/privacy"
              className="transition-colors hover:text-[#3A9B9F]"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-[#3A9B9F]"
            >
              Terms of Service
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/data-deletion"
              className="font-medium text-[#3A9B9F]"
            >
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
