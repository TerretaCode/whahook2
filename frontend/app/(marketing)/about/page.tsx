"use client"

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Zap, Shield } from "lucide-react"

export default function AboutPage() {
  const t = useTranslations('aboutPage')
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">{t('title')}</h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">{t('story.title')}</h2>
            <div className="prose prose-lg text-gray-700">
              <p className="mb-4">{t('story.p1')}</p>
              <p className="mb-4">{t('story.p2')}</p>
              <p>{t('story.p3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{t('values.title')}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('values.customer.title')}</h3>
                <p className="text-gray-600">
                  {t('values.customer.desc')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('values.innovation.title')}</h3>
                <p className="text-gray-600">
                  {t('values.innovation.desc')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('values.security.title')}</h3>
                <p className="text-gray-600">
                  {t('values.security.desc')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('values.transparency.title')}</h3>
                <p className="text-gray-600">
                  {t('values.transparency.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
                <div className="text-gray-600">{t('stats.businesses')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">10M+</div>
                <div className="text-gray-600">{t('stats.messages')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">99.9%</div>
                <div className="text-gray-600">{t('stats.uptime')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-600">{t('stats.support')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.subtitle')}
          </p>
          <Link href="/register">
            <Button size="lg" variant="outline" className="bg-white text-green-600 hover:bg-gray-100">
              {t('cta.button')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

