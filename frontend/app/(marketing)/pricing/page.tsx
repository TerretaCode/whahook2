"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PricingCard, BillingToggle, PLANS } from "@/components/pricing-card"

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your business. Start with a 7-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <BillingToggle billingPeriod={billingPeriod} onToggle={setBillingPeriod} />

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard plan={PLANS.starter} billingPeriod={billingPeriod} />
            <PricingCard plan={PLANS.professional} billingPeriod={billingPeriod} />
            <PricingCard plan={PLANS.enterprise} billingPeriod={billingPeriod} />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <FAQItem
                question="Can I change plans later?"
                answer="Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
              />
              <FAQItem
                question="What about AI costs?"
                answer="AI costs are not included in the plans. You use your own Google Gemini API key and pay directly to Google. This gives you full control over your AI spending."
              />
              <FAQItem
                question="Is there a free trial?"
                answer="Yes! All plans come with a 7-day free trial with full Starter plan features. No credit card required."
              />
              <FAQItem
                question="What are Workspaces?"
                answer="Workspaces are isolated environments for different businesses or clients. Perfect for agencies managing multiple clients - each workspace has its own WhatsApp connections, clients, and conversations."
              />
              <FAQItem
                question="What is White-label?"
                answer="With Enterprise plan, you can hide the Whahook brand from your clients. The widget footer and client panel will show your agency's brand instead."
              />
              <FAQItem
                question="Can I cancel anytime?"
                answer="Yes, you can cancel your subscription at any time. No questions asked."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Customer Service?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses already automating their WhatsApp conversations
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-5 h-auto">
              Start Free Trial Now
            </Button>
          </Link>
          <p className="text-green-100 mt-6">
            ✓ No commitment  ✓ Cancel anytime  ✓ No credit card required
          </p>
        </div>
      </section>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  )
}

