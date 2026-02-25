import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy - TropiChat by TropiTech Solutions LLC",
  description:
    "Privacy Policy for TropiChat, a unified messaging platform by TropiTech Solutions LLC. Learn how we collect, use, and protect your data.",
}

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-gray-500">
          Last updated: February 18, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-[#213138]/90 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#213138] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#213138] [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:leading-relaxed [&_a]:text-[#3A9B9F] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#2F8488]">
          <p>
            TropiTech Solutions LLC (&quot;TropiTech,&quot; &quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;) operates TropiChat
            (tropichat.com), a unified messaging platform that helps businesses
            manage customer conversations across WhatsApp, Facebook Messenger,
            and Instagram Direct. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our
            Service.
          </p>
          <p>
            By accessing or using TropiChat, you agree to this Privacy Policy
            and our <Link href="/terms">Terms of Service</Link>. If you do not
            agree, please do not use the Service.
          </p>

          {/* 1 */}
          <h2>1. Information We Collect</h2>

          <h3>1.1 Account Information</h3>
          <p>
            When you create a TropiChat account, we collect information you
            provide directly, including:
          </p>
          <ul>
            <li>Full name and business name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Business address and timezone</li>
            <li>Profile photo or avatar</li>
            <li>
              Authentication credentials (passwords are hashed and never stored
              in plain text)
            </li>
          </ul>

          <h3>1.2 Messaging and Conversation Data</h3>
          <p>
            To provide our unified inbox service, we collect and process the
            following data from your connected messaging platforms:
          </p>
          <ul>
            <li>
              Messages sent and received across WhatsApp, Facebook Messenger,
              and Instagram Direct
            </li>
            <li>
              Contact information for your customers (names, phone numbers,
              profile images)
            </li>
            <li>Conversation metadata (timestamps, message status, channel)</li>
            <li>Media attachments shared in conversations (images, documents, audio)</li>
            <li>Labels, tags, and notes you assign to contacts or conversations</li>
          </ul>

          <h3>1.3 Usage and Analytics Data</h3>
          <p>
            We automatically collect certain information when you interact with
            the Service:
          </p>
          <ul>
            <li>Browser type and version</li>
            <li>Pages visited and features used within TropiChat</li>
            <li>Date and time of access</li>
            <li>IP address and approximate location</li>
            <li>Device type and operating system</li>
          </ul>

          <h3>1.4 Third-Party Platform Data</h3>
          <p>
            When you connect WhatsApp, Facebook, or Instagram to TropiChat, we
            receive data through Meta&apos;s official APIs, including:
          </p>
          <ul>
            <li>Your Facebook/Instagram Page information</li>
            <li>WhatsApp Business Account details</li>
            <li>Access tokens required to send and receive messages on your behalf</li>
          </ul>

          {/* 2 */}
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>
              <strong>Provide the Service:</strong> Deliver, operate, and
              maintain the TropiChat messaging platform, including routing
              messages across WhatsApp, Facebook Messenger, and Instagram Direct
            </li>
            <li>
              <strong>Account Management:</strong> Create and manage your
              account, authenticate your identity, and provide customer support
            </li>
            <li>
              <strong>Service Improvement:</strong> Analyze usage patterns to
              improve features, fix bugs, and enhance the user experience
            </li>
            <li>
              <strong>Communications:</strong> Send you transactional emails
              (account verification, password resets) and, with your consent,
              product updates or marketing communications
            </li>
            <li>
              <strong>Security:</strong> Detect and prevent fraud, abuse, or
              unauthorized access to the Service
            </li>
            <li>
              <strong>Legal Compliance:</strong> Comply with applicable laws,
              regulations, and legal processes
            </li>
          </ul>

          {/* 3 */}
          <h2>3. How We Store and Protect Your Data</h2>
          <p>
            We take the security of your data seriously and implement
            appropriate technical and organizational measures:
          </p>
          <ul>
            <li>
              <strong>Infrastructure:</strong> Your data is stored on{" "}
              <strong>Supabase</strong>, a secure, SOC 2 Type II compliant cloud
              platform with data centers in the United States
            </li>
            <li>
              <strong>Encryption in Transit:</strong> All data transmitted
              between your browser and our servers is encrypted using TLS 1.2 or
              higher
            </li>
            <li>
              <strong>Encryption at Rest:</strong> Database contents are
              encrypted at rest using AES-256 encryption
            </li>
            <li>
              <strong>Access Controls:</strong> We use role-based access controls
              and authentication tokens to limit access to your data to
              authorized personnel only
            </li>
            <li>
              <strong>Regular Audits:</strong> We periodically review our
              security practices and update them as necessary
            </li>
          </ul>
          <p>
            While we strive to protect your information, no method of
            electronic transmission or storage is 100% secure. We cannot
            guarantee absolute security.
          </p>

          {/* 4 */}
          <h2>4. Third-Party Integrations and Disclosures</h2>

          <h3>4.1 Meta Platforms (WhatsApp, Facebook, Instagram)</h3>
          <p>
            TropiChat integrates with Meta&apos;s platforms through their
            official Business APIs to enable multi-channel messaging for your
            business:
          </p>
          <ul>
            <li>
              We connect to your WhatsApp Business Account, Facebook Page, and
              Instagram Business Account using Meta&apos;s official Graph API and
              WhatsApp Business API
            </li>
            <li>
              Message content is transmitted through Meta&apos;s servers before
              reaching TropiChat, in accordance with{" "}
              <a
                href="https://www.facebook.com/privacy/policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Meta&apos;s Privacy Policy
              </a>
            </li>
            <li>
              WhatsApp messages remain end-to-end encrypted between your
              customers and your WhatsApp Business number; once delivered to
              TropiChat through the official Business API, we store messages
              securely in our encrypted database
            </li>
            <li>
              We only access the data necessary to provide our messaging
              management service
            </li>
            <li>
              We do not sell, rent, or share your messaging data with third
              parties, including Meta, beyond what is required to operate the API
              integration
            </li>
          </ul>
          <p>
            For more information about how Meta handles data, please review:
          </p>
          <ul>
            <li>
              <a
                href="https://www.facebook.com/privacy/policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Meta Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="https://www.whatsapp.com/legal/business-terms/"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Business API Terms
              </a>
            </li>
          </ul>

          <h3>4.2 Other Third-Party Services</h3>
          <p>We may share data with the following categories of providers:</p>
          <ul>
            <li>
              <strong>Hosting and Infrastructure:</strong> Supabase (database
              and authentication), Vercel (application hosting)
            </li>
            <li>
              <strong>Analytics:</strong> Anonymized usage data for service
              improvement
            </li>
            <li>
              <strong>Payment Processing:</strong> If applicable, payment
              processors handle billing data; we do not store credit card
              numbers
            </li>
          </ul>
          <p>
            We do not sell your personal information to third parties. We only
            share data with third-party services as necessary to provide and
            improve the Service.
          </p>

          {/* 5 */}
          <h2>5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as
            needed to provide the Service. Specifically:
          </p>
          <ul>
            <li>
              <strong>Account Data:</strong> Retained while your account is
              active and for up to 30 days after account deletion to allow for
              reactivation
            </li>
            <li>
              <strong>Message Data:</strong> Retained while your account is
              active; deleted within 90 days of account closure
            </li>
            <li>
              <strong>Usage Logs:</strong> Retained for up to 12 months for
              analytics and security purposes
            </li>
          </ul>
          <p>
            You may request deletion of your data at any time. See our{" "}
            <Link href="/data-deletion">Data Deletion</Link> page for
            instructions, or contact us directly at{" "}
            <a href="mailto:support@tropichat.chat">support@tropichat.chat</a>.
          </p>

          {/* 6 */}
          <h2>6. Your Rights and Choices</h2>
          <p>
            Depending on your jurisdiction, you may have the following rights
            regarding your personal data:
          </p>
          <ul>
            <li>
              <strong>Access:</strong> Request a copy of the personal data we
              hold about you
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or
              incomplete data
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal data,
              subject to legal obligations
            </li>
            <li>
              <strong>Data Portability:</strong> Request your data in a
              structured, machine-readable format
            </li>
            <li>
              <strong>Opt-Out:</strong> Unsubscribe from marketing
              communications at any time via the unsubscribe link in our emails
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Revoke consent for data
              processing where consent is the legal basis
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:lamar@tropitech.org">lamar@tropitech.org</a>. We
            will respond to your request within 30 days.
          </p>

          {/* 7 */}
          <h2>7. Cookies and Tracking Technologies</h2>
          <p>TropiChat uses cookies and similar technologies to:</p>
          <ul>
            <li>Keep you signed in to your account</li>
            <li>Remember your preferences and settings</li>
            <li>Analyze usage patterns and improve the Service</li>
          </ul>
          <p>
            You can control cookies through your browser settings. Disabling
            cookies may affect the functionality of certain features.
          </p>

          {/* 8 */}
          <h2>8. Children&apos;s Privacy</h2>
          <p>
            TropiChat is not intended for use by individuals under the age of
            18. We do not knowingly collect personal information from children.
            If we become aware that we have collected data from a child under
            18, we will take steps to delete it promptly.
          </p>

          {/* 9 */}
          <h2>9. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other
            than your country of residence, including the United States, where
            our servers and service providers are located. By using TropiChat,
            you consent to the transfer of your data to these countries.
          </p>

          {/* 10 */}
          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make
            changes, we will update the &quot;Last updated&quot; date at the top
            of this page. We encourage you to review this Privacy Policy
            periodically. Continued use of TropiChat after any changes
            constitutes acceptance of the updated policy.
          </p>

          {/* 11 */}
          <h2>11. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this
            Privacy Policy, please contact us:
          </p>
          <ul>
            <li>
              <strong>Business:</strong> TropiTech Solutions LLC
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:lamar@tropitech.org">lamar@tropitech.org</a>
            </li>
            <li>
              <strong>Website:</strong>{" "}
              <a href="https://tropichat.chat">tropichat.chat</a>
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
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="transition-colors hover:text-[#3A9B9F]"
            >
              Home
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/privacy"
              className="font-medium text-[#3A9B9F]"
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
              className="transition-colors hover:text-[#3A9B9F]"
            >
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
