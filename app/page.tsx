"use client"

import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { RolloutSection } from "@/components/rollout-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { PricingSection } from "@/components/pricing-section"
import { Footer } from "@/components/footer"

export default function Home() {
  const router = useRouter()

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <HeroSection />
        <RolloutSection />
        <HowItWorksSection />
        <PricingSection />
        <Footer />
      </main>
    </>
  )
}



