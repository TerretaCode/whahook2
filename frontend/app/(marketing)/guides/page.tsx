'use client'

import Link from "next/link"
import { useTranslations } from 'next-intl'

export default function GuidesPage() {
  const t = useTranslations('guidesPage')
  
  const guides = [
    { titleKey: 'guides.gettingStarted', categoryKey: 'categories.beginner', time: "5 min" },
    { titleKey: 'guides.firstChatbot', categoryKey: 'categories.beginner', time: "10 min" },
    { titleKey: 'guides.advancedAI', categoryKey: 'categories.advanced', time: "15 min" },
    { titleKey: 'guides.crmIntegration', categoryKey: 'categories.integration', time: "12 min" },
    { titleKey: 'guides.conversationDesign', categoryKey: 'categories.bestPractices', time: "8 min" },
    { titleKey: 'guides.scalingOperations', categoryKey: 'categories.advanced', time: "20 min" }
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-4">
            {guides.map((guide, index) => (
              <Link key={index} href="#" className="block bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-600 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t(guide.titleKey)}</h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded">{t(guide.categoryKey)}</span>
                      <span>{guide.time} {t('readTime')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

