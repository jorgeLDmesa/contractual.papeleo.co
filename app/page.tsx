'use client'

import { useEffect, useRef } from 'react'
import { Navbar1 } from '@/components/blocks/navbar'
import Hero from './_components/Hero'
import VideoSection from './_components/VideoSection'
// import ProcessSection from './_components/ProcessSection'
import BenefitsSection from './_components/BenefitsSection'
import PricingSection from './_components/PricingSection'
import FAQSection from './_components/FAQSection'
import ContactSection from './_components/ContactSection'
import CTASection from './_components/CTASection'
import Footer from './_components/Footer'
import { TestimonialsSectionDemo } from './_components/Testimonials'
import FeaturesSection from './_components/FeatureSection'
import PopupDemoRequest from './_components/PopupDemoRequest'

export default function ContractualLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative min-h-screen flex flex-col">


      {/* Navbar */}
      <Navbar1 />

      <main className="relative z-10 flex-grow pt-12">
        {/* Hero Section */}
        <Hero />

        {/* Video Section */}
        <VideoSection />

        <PopupDemoRequest />

        {/* Process Section */}
        {/* <ProcessSection /> */}

        {/* Features Section */}
        <FeaturesSection />

        {/* Benefits Section */}
        <BenefitsSection />

        {/* Testimonials Section */}
        <TestimonialsSectionDemo />

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Contact Section */}
        <ContactSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />


    </div>
  )
}
