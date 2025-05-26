'use client'

import { useEffect, useRef } from 'react'
import Navbar from './_components/Navbar'
import Hero from './_components/Hero'
import VideoSection from './_components/VideoSection'
import ProcessSection from './_components/ProcessSection'
import FeaturesSection from './_components/FeaturesSection'
import BenefitsSection from './_components/BenefitsSection'
import PricingSection from './_components/PricingSection'
import FAQSection from './_components/FAQSection'
import ContactSection from './_components/ContactSection'
import CTASection from './_components/CTASection'
import Footer from './_components/Footer'
// import ShaderBackground from '@/components/ShaderBackground'

export default function ContractualLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative min-h-screen flex flex-col">
      {/* <div className="fixed inset-0 z-0">
        <ShaderBackground 
          color1="#ffffff" 
          color2="#0080ff" 
          color3="#004db8"
          noiseSizeProp={100} 
          grainAlpha={0.2} 
        />
      </div> */}

      {/* Navbar */}
      <Navbar />

      <main className="relative z-10 flex-grow pt-16">
        {/* Hero Section */}
        <Hero />

        {/* Video Section */}
        <VideoSection />

        {/* Process Section */}
        <ProcessSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Benefits Section */}
        <BenefitsSection />

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
