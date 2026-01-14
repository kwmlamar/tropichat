import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { SolutionSection } from "@/components/solution-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { SocialProofSection } from "@/components/social-proof-section"
import { PricingSection } from "@/components/pricing-section"
import { WaitlistSection } from "@/components/waitlist-section"
import { Footer } from "@/components/footer"

// testing 

export default function Home() {
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
        <WaitlistSection />
        <Footer />
      </main>
    </>
  )
}
