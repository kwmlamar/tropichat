"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { SolutionSection } from "@/components/solution-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { SocialProofSection } from "@/components/social-proof-section"
import { PricingSection } from "@/components/pricing-section"
import { TrustHighlights } from "@/components/trust-highlights"
import { Footer } from "@/components/footer"

export default function Home() {
  const router = useRouter()

  // Removed legacy invitation catch-all logic that was hijacking OAuth logins.
  // Invitations are now handled directly by the /accept-invite page.

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <HeroSection />
        <ProblemSection />
        <section id="features">
          <SolutionSection />
        </section>
        <section id="testimonials">
          <SocialProofSection />
        </section>
        <section id="how-it-works">
          <HowItWorksSection />
        </section>
        <section id="pricing">
          <PricingSection />
        </section>
        <TrustHighlights />
        <Footer />
      </main>
    </>
  )
}
