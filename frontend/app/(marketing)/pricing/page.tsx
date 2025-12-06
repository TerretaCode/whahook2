"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { PricingCard, BillingToggle, PLANS } from "@/components/pricing-card"

export default function PricingPage() {
  const t = useTranslations('pricingPage')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">{t('title')}</h1>
            <p className="text-xl text-gray-600">
              {t('subtitle')}
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
            <h2 className="text-3xl font-bold text-center mb-12">{t('faq.title')}</h2>
            <div className="space-y-6">
              <FAQItem
                question={t('faq.changePlans.q')}
                answer={t('faq.changePlans.a')}
              />
              <FAQItem
                question={t('faq.aiCosts.q')}
                answer={t('faq.aiCosts.a')}
              />
              <FAQItem
                question={t('faq.freeTrial.q')}
                answer={t('faq.freeTrial.a')}
              />
              <FAQItem
                question={t('faq.workspaces.q')}
                answer={t('faq.workspaces.a')}
              />
              <FAQItem
                question={t('faq.whiteLabel.q')}
                answer={t('faq.whiteLabel.a')}
              />
              <FAQItem
                question={t('faq.cancel.q')}
                answer={t('faq.cancel.a')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-5 h-auto">
              {t('cta.button')}
            </Button>
          </Link>
          <p className="text-green-100 mt-6">
            {t('cta.benefits')}
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

