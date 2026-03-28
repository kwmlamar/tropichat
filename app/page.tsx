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
import { Footer } from "@/components/footer"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if we arrived here via a magic link or invitation (fragment contains access_token)
    if (window.location.hash.includes('access_token=') || window.location.hash.includes('type=invite')) {
      console.log("Invitation fragment detected on home page, redirecting to /accept-invite")
      router.replace(`/accept-invite${window.location.hash}`)
    }
  }, [router])

  return (
    <div className="light bg-white text-slate-900">
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
        <Footer />
      </main>
    </div>
  )
}
