"use client"

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Bot, 
  Calendar, 
  Users, 
  BarChart3, 
  Zap,
  Shield,
  Globe,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react"

export default function FeaturesPage() {
  const t = useTranslations('featuresPage')
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

      {/* Main Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Bot className="w-8 h-8 text-green-600" />}
              title={t('features.aiChatbot.title')}
              description={t('features.aiChatbot.desc')}
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-green-600" />}
              title={t('features.multiAccount.title')}
              description={t('features.multiAccount.desc')}
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8 text-green-600" />}
              title={t('features.scheduling.title')}
              description={t('features.scheduling.desc')}
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-green-600" />}
              title={t('features.crm.title')}
              description={t('features.crm.desc')}
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-green-600" />}
              title={t('features.analytics.title')}
              description={t('features.analytics.desc')}
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-green-600" />}
              title={t('features.instant.title')}
              description={t('features.instant.desc')}
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-green-600" />}
              title={t('features.security.title')}
              description={t('features.security.desc')}
            />
            <FeatureCard
              icon={<Globe className="w-8 h-8 text-green-600" />}
              title={t('features.multiLang.title')}
              description={t('features.multiLang.desc')}
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-green-600" />}
              title={t('features.availability.title')}
              description={t('features.availability.desc')}
            />
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-20">
            <DetailedFeature
              title={t('detailed.conversation.title')}
              description={t('detailed.conversation.desc')}
              features={[
                t('detailed.conversation.f1'),
                t('detailed.conversation.f2'),
                t('detailed.conversation.f3'),
                t('detailed.conversation.f4'),
                t('detailed.conversation.f5')
              ]}
              reverse={false}
            />
            <DetailedFeature
              title={t('detailed.integrations.title')}
              description={t('detailed.integrations.desc')}
              features={[
                t('detailed.integrations.f1'),
                t('detailed.integrations.f2'),
                t('detailed.integrations.f3'),
                t('detailed.integrations.f4'),
                t('detailed.integrations.f5')
              ]}
              reverse={true}
            />
            <DetailedFeature
              title={t('detailed.team.title')}
              description={t('detailed.team.desc')}
              features={[
                t('detailed.team.f1'),
                t('detailed.team.f2'),
                t('detailed.team.f3'),
                t('detailed.team.f4'),
                t('detailed.team.f5')
              ]}
              reverse={false}
            />
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
              <ArrowRight className="ml-2 w-5 h-5" />
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

function DetailedFeature({ 
  title, 
  description, 
  features, 
  reverse 
}: { 
  title: string
  description: string
  features: string[]
  reverse: boolean
}) {
  return (
    <div className={`grid md:grid-cols-2 gap-12 items-center ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <div className={reverse ? 'md:order-2' : ''}>
        <h3 className="text-3xl font-bold mb-4">{title}</h3>
        <p className="text-gray-600 text-lg mb-6">{description}</p>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-8 ${reverse ? 'md:order-1' : ''}`}>
        <div className="aspect-video bg-white rounded-lg shadow-lg flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-2" />
            <p className="text-sm">Feature Preview</p>
          </div>
        </div>
      </div>
    </div>
  )
}

