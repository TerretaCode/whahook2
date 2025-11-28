"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PricingCard, BillingToggle, PLANS } from "@/components/pricing-card"

export function HomePricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your business needs
          </p>
          <BillingToggle billingPeriod={billingPeriod} onToggle={setBillingPeriod} />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard plan={PLANS.starter} billingPeriod={billingPeriod} />
          <PricingCard plan={PLANS.professional} billingPeriod={billingPeriod} />
          <PricingCard plan={PLANS.enterprise} billingPeriod={billingPeriod} />
        </div>

        <div className="text-center mt-12">
          <Link href="/pricing">
            <Button variant="outline" size="lg" className="text-green-600 border-green-600 hover:bg-green-50">
              View Full Pricing Details
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
