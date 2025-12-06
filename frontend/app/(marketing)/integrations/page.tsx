'use client'

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Calendar, Zap, Database, Mail, ShoppingCart, Code } from "lucide-react"

export default function IntegrationsPage() {
  const t = useTranslations('integrationsPage')
  
  const integrations = [
    { icon: <Calendar className="w-8 h-8" />, nameKey: 'integrations.calendar.name', descKey: 'integrations.calendar.desc' },
    { icon: <Zap className="w-8 h-8" />, nameKey: 'integrations.zapier.name', descKey: 'integrations.zapier.desc' },
    { icon: <Database className="w-8 h-8" />, nameKey: 'integrations.crm.name', descKey: 'integrations.crm.desc' },
    { icon: <Mail className="w-8 h-8" />, nameKey: 'integrations.email.name', descKey: 'integrations.email.desc' },
    { icon: <ShoppingCart className="w-8 h-8" />, nameKey: 'integrations.ecommerce.name', descKey: 'integrations.ecommerce.desc' },
    { icon: <Code className="w-8 h-8" />, nameKey: 'integrations.api.name', descKey: 'integrations.api.desc' }
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-600">{t('subtitle')}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-green-600">
                  {integration.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{t(integration.nameKey)}</h3>
                <p className="text-gray-600">{t(integration.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-green-600 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-xl mb-8">{t('cta.subtitle')}</p>
          <Link href="/api-reference">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">{t('cta.button')}</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

