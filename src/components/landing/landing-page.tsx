"use client"

import Navigation from "./navigation"
import HeroSection from "./hero-section"
import FeaturesGrid from "./features-grid"
import StatsShowcase from "./stats-showcase"
import Testimonials from "./testimonials"
import CTAAndFooter from "./cta-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesGrid />
        <StatsShowcase />
        <Testimonials />
        <CTAAndFooter />
      </main>
    </div>
  )
}