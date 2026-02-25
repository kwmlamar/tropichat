import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service - TropiChat by TropiTech Solutions LLC",
  description:
    "Terms of Service for TropiChat, a unified messaging platform by TropiTech Solutions LLC.",
}

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="mb-4 text-sm text-gray-500">
          Last updated: February 25, 2026
        </p>
        <p className="mb-10 text-sm font-medium text-[#213138]/70">
          This is a legally binding agreement between you and TropiTech
          Solutions LLC. Please read these terms carefully before using
          TropiChat.
        </p>

        {/* Table of Contents */}
        <nav className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#213138]">
            Table of Contents
          </h2>
          <ol className="columns-1 gap-x-8 space-y-1.5 text-sm sm:columns-2">
            {[
              "Acceptance of Terms",
              "Service Description",
              "Account Registration & Use",
              "Subscription & Billing",
              "Meta Platform Terms Compliance",
              "User Data & Privacy",
              "Intellectual Property",
              "Prohibited Uses",
              "Service Availability",
              "Limitation of Liability",
              "Indemnification",
              "Termination",
              "Governing Law & Disputes",
              "Changes to These Terms",
              "Contact Information",
            ].map((title, i) => (
              <li key={i}>
                <a
                  href={`#section-${i + 1}`}
                  className="text-[#3A9B9F] underline-offset-2 transition-colors hover:text-[#2F8488] hover:underline"
                >
                  {i + 1}. {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose prose-gray max-w-none space-y-8 text-[#213138]/90 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#213138] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#213138] [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:leading-relaxed [&_a]:text-[#3A9B9F] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#2F8488]">
          <p>
            TropiTech Solutions LLC (&quot;TropiTech,&quot; &quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;) operates TropiChat, a unified
            customer messaging platform available at tropichat.chat (the
            &quot;Service&quot;). These Terms of Service (&quot;Terms&quot;)
            govern your access to and use of the Service.
          </p>

          {/* 1 */}
          <h2 id="section-1">1. Acceptance of Terms</h2>

          <h3>1.1 Agreement</h3>
          <p>
            By creating an account, accessing, or using TropiChat, you agree to
            be bound by these Terms, our{" "}
            <Link href="/privacy">Privacy Policy</Link>, and any additional
            policies referenced herein. If you do not agree to these Terms, do
            not use the Service.
          </p>

          <h3>1.2 Eligibility</h3>
          <p>
            You must be at least 18 years of age to use TropiChat. By using the
            Service, you represent and warrant that you are 18 or older and have
            the legal capacity to enter into this agreement. If you are using the
            Service on behalf of a business, you represent that you have the
            authority to bind that entity to these Terms.
          </p>

          <h3>1.3 Modifications</h3>
          <p>
            We reserve the right to modify these Terms at any time. When we make
            material changes, we will update the &quot;Last updated&quot; date
            and notify you via email or through the Service at least 14 days
            before the changes take effect. Your continued use of TropiChat
            after the effective date constitutes acceptance of the revised Terms.
          </p>

          {/* 2 */}
          <h2 id="section-2">2. Service Description</h2>

          <h3>2.1 Platform Overview</h3>
          <p>
            TropiChat is a customer communication platform designed for small
            businesses. The Service enables you to:
          </p>
          <ul>
            <li>
              Manage conversations across WhatsApp Business, Instagram Direct,
              and Facebook Messenger from a single unified inbox
            </li>
            <li>
              Organize contacts with tags, labels, and notes
            </li>
            <li>
              Use quick-reply templates and automated responses
            </li>
            <li>
              Manage bookings and appointments through integrated scheduling
              tools
            </li>
            <li>
              Collaborate with team members on customer conversations
            </li>
            <li>
              Access analytics and reporting on messaging activity
            </li>
          </ul>

          <h3>2.2 Third-Party Integrations</h3>
          <p>
            TropiChat integrates with Meta Platforms (WhatsApp, Facebook,
            Instagram) through their official Business APIs using server-to-server
            connections. The availability and functionality of these integrations
            depend on Meta&apos;s platform and are subject to change at
            Meta&apos;s discretion.
          </p>

          <h3>2.3 No Affiliation with Meta</h3>
          <p>
            TropiChat is an independent product of TropiTech Solutions LLC. We
            are not affiliated with, endorsed by, or sponsored by Meta Platforms,
            Inc. WhatsApp, Facebook, Instagram, and Messenger are trademarks of
            Meta Platforms, Inc.
          </p>

          {/* 3 */}
          <h2 id="section-3">3. Account Registration &amp; Use</h2>

          <h3>3.1 Account Creation</h3>
          <p>
            To use TropiChat, you must create an account by providing accurate
            and complete information, including your business name, email address,
            and a secure password. You agree to keep your account information
            current at all times.
          </p>

          <h3>3.2 Account Security</h3>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account. You must notify us immediately at{" "}
            <a href="mailto:lamar@tropitech.org">lamar@tropitech.org</a> if you
            suspect unauthorized access to your account.
          </p>

          <h3>3.3 One Account Per Business</h3>
          <p>
            Each TropiChat account is intended for use by a single business
            entity. You may not create multiple accounts for the same business
            or share accounts across unrelated businesses without our written
            consent.
          </p>

          <h3>3.4 Accurate Information</h3>
          <p>
            You represent that all information you provide during registration
            and through the use of the Service is accurate, truthful, and not
            misleading. We reserve the right to suspend accounts containing
            false or misleading information.
          </p>

          {/* 4 */}
          <h2 id="section-4">4. Subscription &amp; Billing</h2>

          <h3>4.1 Subscription Plans</h3>
          <p>
            TropiChat offers subscription plans starting at $29/month, with
            pricing varying based on features and team size. Current plan details
            and pricing are available on our website. All prices are quoted in
            U.S. dollars unless otherwise indicated.
          </p>

          <h3>4.2 Free Trial</h3>
          <p>
            New accounts receive a 14-day free trial with access to all
            features. No credit card is required to start a trial. At the end of
            the trial, you must subscribe to a paid plan to continue using the
            Service.
          </p>

          <h3>4.3 Auto-Renewal</h3>
          <p>
            Subscriptions automatically renew at the end of each billing cycle
            (monthly or annually) unless you cancel before the renewal date. You
            will be charged the applicable subscription fee at the start of each
            renewal period.
          </p>

          <h3>4.4 Cancellation</h3>
          <p>
            You may cancel your subscription at any time through your account
            settings or by contacting us. Cancellation takes effect at the end
            of the current billing period. You will retain access to the Service
            until the end of the period you have already paid for.
          </p>

          <h3>4.5 Refund Policy</h3>
          <p>
            We offer a 30-day money-back guarantee for new subscribers. If you
            are not satisfied with the Service within the first 30 days of your
            initial paid subscription, contact us at{" "}
            <a href="mailto:lamar@tropitech.org">lamar@tropitech.org</a> for a
            full refund. After 30 days, subscription fees are non-refundable.
          </p>

          <h3>4.6 Pricing Changes</h3>
          <p>
            We may change our pricing with at least 30 days&apos; notice. Price
            changes will apply at the start of your next billing cycle following
            the notice period. Existing promotional rates (such as early-adopter
            pricing) will be honored as stated at the time of purchase.
          </p>

          {/* 5 */}
          <h2 id="section-5">5. Meta Platform Terms Compliance</h2>

          <h3>5.1 Your Obligations</h3>
          <p>
            By using TropiChat to send and receive messages through Meta&apos;s
            platforms, you agree to comply with all applicable Meta policies,
            including:
          </p>
          <ul>
            <li>
              <a
                href="https://developers.facebook.com/terms/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Meta Platform Terms
              </a>
            </li>
            <li>
              <a
                href="https://www.whatsapp.com/legal/business-policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Business Policy
              </a>
            </li>
            <li>
              <a
                href="https://www.whatsapp.com/legal/commerce-policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Commerce Policy
              </a>
            </li>
            <li>
              <a
                href="https://developers.facebook.com/docs/messenger-platform/policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Messenger Platform Policy
              </a>
            </li>
            <li>
              <a
                href="https://developers.facebook.com/docs/instagram-platform/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram Platform Terms
              </a>
            </li>
          </ul>

          <h3>5.2 Messaging Compliance</h3>
          <p>
            You are solely responsible for the content of messages you send
            through TropiChat. You must ensure that your messaging practices
            comply with all applicable laws and Meta&apos;s messaging policies,
            including obtaining proper consent before contacting customers and
            honoring opt-out requests.
          </p>

          <h3>5.3 API Usage</h3>
          <p>
            TropiChat accesses Meta&apos;s APIs on your behalf to deliver the
            Service. You are responsible for your use of Meta&apos;s APIs
            through TropiChat, including compliance with rate limits and usage
            policies. We are not liable for any actions Meta takes against your
            account, including suspension or restriction of API access.
          </p>

          <h3>5.4 Platform Changes</h3>
          <p>
            Meta may modify, restrict, or discontinue their APIs or platform
            features at any time. TropiTech is not liable for any loss of
            functionality, service disruptions, or business impact caused by
            changes to Meta&apos;s platforms. We will make reasonable efforts to
            adapt to platform changes in a timely manner.
          </p>

          {/* 6 */}
          <h2 id="section-6">6. User Data &amp; Privacy</h2>

          <h3>6.1 Privacy Policy</h3>
          <p>
            Our collection and use of personal information is governed by our{" "}
            <Link href="/privacy">Privacy Policy</Link>, which is incorporated
            into these Terms by reference. By using TropiChat, you consent to
            the data practices described in the Privacy Policy.
          </p>

          <h3>6.2 Ownership of Your Data</h3>
          <p>
            You retain full ownership of all customer data, messages, contacts,
            and business information you upload to or create within TropiChat. We
            do not claim ownership of your content.
          </p>

          <h3>6.3 Data Storage &amp; Security</h3>
          <p>
            Messages, contacts, bookings, and other business data are stored
            securely on our infrastructure with encryption at rest and in
            transit. See our <Link href="/privacy">Privacy Policy</Link> for
            details on our security practices.
          </p>

          <h3>6.4 Data Export &amp; Deletion</h3>
          <p>
            You may request an export of your data or request deletion of your
            account and associated data at any time by contacting us at{" "}
            <a href="mailto:lamar@tropitech.org">lamar@tropitech.org</a>. We
            will process data export requests within 30 days and data deletion
            requests within 90 days, unless retention is required by law.
          </p>

          {/* 7 */}
          <h2 id="section-7">7. Intellectual Property</h2>

          <h3>7.1 Our Property</h3>
          <p>
            TropiChat, including its source code, design, user interface,
            branding, logos, and documentation, is the intellectual property of
            TropiTech Solutions LLC. You may not copy, modify, distribute,
            reverse engineer, or create derivative works based on the Service
            without our prior written consent.
          </p>

          <h3>7.2 Your Content</h3>
          <p>
            You retain all rights to the content and data you submit through the
            Service. By using TropiChat, you grant us a limited, non-exclusive
            license to store, process, and transmit your content solely for the
            purpose of providing the Service.
          </p>

          <h3>7.3 Feedback</h3>
          <p>
            If you provide us with feedback, suggestions, or feature requests,
            you grant us the right to use and incorporate that feedback into the
            Service without obligation or compensation.
          </p>

          {/* 8 */}
          <h2 id="section-8">8. Prohibited Uses</h2>
          <p>You may not use TropiChat to:</p>
          <ul>
            <li>
              Send spam, unsolicited messages, or bulk marketing messages
              without proper consent
            </li>
            <li>
              Violate any applicable law, regulation, or third-party rights
            </li>
            <li>
              Transmit malicious content, malware, or phishing attempts
            </li>
            <li>
              Engage in harassment, threats, or abusive behavior toward
              customers or other users
            </li>
            <li>
              Impersonate another person, business, or entity
            </li>
            <li>
              Attempt to access other users&apos; accounts or data
            </li>
            <li>
              Circumvent security measures, rate limits, or access controls
            </li>
            <li>
              Use the Service for any illegal activity, including fraud, money
              laundering, or the sale of illegal goods or services
            </li>
            <li>
              Resell, sublicense, or provide access to TropiChat to third
              parties without authorization
            </li>
          </ul>
          <p>
            Violation of these restrictions may result in immediate suspension or
            termination of your account.
          </p>

          {/* 9 */}
          <h2 id="section-9">9. Service Availability</h2>

          <h3>9.1 Uptime</h3>
          <p>
            We strive to maintain high availability of the Service but do not
            guarantee 100% uptime. The Service may be temporarily unavailable
            due to maintenance, updates, third-party platform outages, or
            circumstances beyond our control.
          </p>

          <h3>9.2 Maintenance</h3>
          <p>
            We may perform scheduled maintenance that temporarily affects
            Service availability. When possible, we will provide advance notice
            of planned maintenance through the Service or via email.
          </p>

          <h3>9.3 Suspension</h3>
          <p>
            We reserve the right to suspend or restrict your access to the
            Service if we reasonably believe you are violating these Terms, if
            your use poses a security risk, or if required by law.
          </p>

          {/* 10 */}
          <h2 id="section-10">10. Limitation of Liability</h2>

          <h3>10.1 Disclaimer</h3>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT.
          </p>

          <h3>10.2 Limitation</h3>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TROPITECH SOLUTIONS LLC
            SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
            LOSS OF REVENUE, LOST PROFITS, LOSS OF DATA, LOSS OF BUSINESS
            OPPORTUNITIES, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED
            TO YOUR USE OF THE SERVICE.
          </p>

          <h3>10.3 Cap on Liability</h3>
          <p>
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING UNDER OR RELATED
            TO THESE TERMS SHALL NOT EXCEED THE TOTAL AMOUNT OF SUBSCRIPTION
            FEES PAID BY YOU TO TROPITECH IN THE TWELVE (12) MONTHS PRECEDING
            THE EVENT GIVING RISE TO THE CLAIM.
          </p>

          {/* 11 */}
          <h2 id="section-11">11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless TropiTech Solutions LLC,
            its officers, directors, employees, and agents from and against any
            claims, liabilities, damages, losses, or expenses (including
            reasonable attorneys&apos; fees) arising out of or related to:
          </p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights, including Meta&apos;s platform policies</li>
            <li>The content of messages you send through the Service</li>
          </ul>

          {/* 12 */}
          <h2 id="section-12">12. Termination</h2>

          <h3>12.1 By You</h3>
          <p>
            You may cancel your subscription and terminate your account at any
            time through your account settings or by contacting us. Upon
            cancellation, you will retain access until the end of your current
            billing period.
          </p>

          <h3>12.2 By Us</h3>
          <p>
            We may suspend or terminate your account if you violate these Terms,
            fail to pay subscription fees, or if continued provision of the
            Service becomes impractical. We will provide reasonable notice when
            possible, except in cases of serious violations where immediate
            action is necessary.
          </p>

          <h3>12.3 Effect of Termination</h3>
          <p>
            Upon termination, your right to use the Service ceases immediately.
            We will retain your data for up to 90 days to allow for
            reactivation or data export, after which it will be permanently
            deleted. Sections of these Terms that by their nature should survive
            termination (including Limitation of Liability, Indemnification, and
            Governing Law) shall survive.
          </p>

          {/* 13 */}
          <h2 id="section-13">13. Governing Law &amp; Disputes</h2>

          <h3>13.1 Governing Law</h3>
          <p>
            These Terms are governed by and construed in accordance with the laws
            of the Commonwealth of The Bahamas, without regard to conflict-of-law
            principles.
          </p>

          <h3>13.2 Dispute Resolution</h3>
          <p>
            Any dispute arising out of or relating to these Terms or the Service
            shall first be addressed through good-faith negotiation between the
            parties. If the dispute cannot be resolved through negotiation within
            30 days, either party may pursue resolution through the courts of
            the Commonwealth of The Bahamas.
          </p>

          <h3>13.3 Severability</h3>
          <p>
            If any provision of these Terms is found to be unenforceable or
            invalid, that provision shall be limited or eliminated to the minimum
            extent necessary so that the remaining provisions remain in full
            force and effect.
          </p>

          {/* 14 */}
          <h2 id="section-14">14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time to reflect changes in our
            Service, legal requirements, or business practices. When we make
            material changes, we will update the &quot;Last updated&quot; date at
            the top of this page and notify you via email or through the Service.
            Continued use of TropiChat after changes take effect constitutes
            acceptance of the revised Terms. If you do not agree with the
            changes, you must stop using the Service before the effective date.
          </p>

          {/* 15 */}
          <h2 id="section-15">15. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please
            contact us:
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
              className="transition-colors hover:text-[#3A9B9F]"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/terms"
              className="font-medium text-[#3A9B9F]"
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
