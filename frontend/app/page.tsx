'use client'

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { MessageSquare, Bot, Zap, Shield, BarChart3, Sparkles, CheckCircle, ArrowRight, Users, Globe, Smartphone } from "lucide-react"
import { HomePricingSection } from "@/components/home-pricing-section"

export default function Home() {
  const t = useTranslations('landing')
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-transparent">
        <div className="container mx-auto px-4 py-16 md:py-28 relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t('hero.badge')}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {t('hero.title1')}
              <span className="text-green-600"> {t('hero.title2')}</span>
              <br />{t('hero.title3')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-lg px-9 py-5 h-auto shadow-lg hover:shadow-xl transition-all group">
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-9 py-5 h-auto border-2 hover:border-green-600 hover:text-green-600">
                  {t('hero.signIn')}
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>{t('hero.noCreditCard')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>{t('hero.fiveMinSetup')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>{t('hero.cancelAnytime')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="90%" label={t('stats.fasterResponse')} />
            <StatCard number="24/7" label={t('stats.availability')} />
            <StatCard number="10x" label={t('stats.moreCapacity')} />
            <StatCard number="100%" label={t('stats.satisfaction')} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Bot className="w-8 h-8 text-green-600" />}
              title={t('features.aiAssistant.title')}
              description={t('features.aiAssistant.description')}
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-green-600" />}
              title={t('features.unifiedInbox.title')}
              description={t('features.unifiedInbox.description')}
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-green-600" />}
              title={t('features.smartAutomation.title')}
              description={t('features.smartAutomation.description')}
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-green-600" />}
              title={t('features.security.title')}
              description={t('features.security.description')}
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-green-600" />}
              title={t('features.analytics.title')}
              description={t('features.analytics.description')}
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-green-600" />}
              title={t('features.aiToggle.title')}
              description={t('features.aiToggle.description')}
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title={t('howItWorks.step1.title')}
              description={t('howItWorks.step1.description')}
            />
            <StepCard
              number="2"
              title={t('howItWorks.step2.title')}
              description={t('howItWorks.step2.description')}
            />
            <StepCard
              number="3"
              title={t('howItWorks.step3.title')}
              description={t('howItWorks.step3.description')}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t('benefits.title')}
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {t('benefits.subtitle')}
              </p>
              <ul className="space-y-4">
                <BenefitItem text={t('benefits.item1')} />
                <BenefitItem text={t('benefits.item2')} />
                <BenefitItem text={t('benefits.item3')} />
                <BenefitItem text={t('benefits.item4')} />
              </ul>
            </div>
            <div className="order-1 md:order-2 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-8 md:p-12">
              <div className="bg-white rounded-xl shadow-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">{t('benefits.demo.customer')}</p>
                    <p className="text-gray-900">{t('benefits.demo.question')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">{t('benefits.demo.aiAssistant')}</p>
                    <p className="text-gray-900">{t('benefits.demo.answer')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('useCases.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('useCases.subtitle')}
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <UseCaseCard
              icon={<Smartphone className="w-8 h-8 text-green-600" />}
              title={t('useCases.ecommerce.title')}
              description={t('useCases.ecommerce.description')}
            />
            <UseCaseCard
              icon={<Users className="w-8 h-8 text-green-600" />}
              title={t('useCases.services.title')}
              description={t('useCases.services.description')}
            />
            <UseCaseCard
              icon={<Globe className="w-8 h-8 text-green-600" />}
              title={t('useCases.agencies.title')}
              description={t('useCases.agencies.description')}
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <HomePricingSection />

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl md:text-2xl text-green-100 mb-10 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <Link href="/register" className="inline-block">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-5 h-auto shadow-xl hover:shadow-2xl transition-all group">
              {t('cta.button')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-green-100 mt-6 text-lg">
            ✓ {t('cta.noCommitment')}  ✓ {t('hero.cancelAnytime')}  ✓ {t('hero.noCreditCard')}
          </p>
        </div>
      </section>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">{number}</div>
      <div className="text-sm md:text-base text-gray-600">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all">
      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
      <span className="text-gray-700 text-lg leading-relaxed">{text}</span>
    </li>
  )
}

function UseCaseCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all">
      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}


