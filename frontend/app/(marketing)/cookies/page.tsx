'use client'

import { useTranslations } from 'next-intl'

export default function CookiesPage() {
  const t = useTranslations('cookiesPage')
  
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-gray-600 mb-8">{t('lastUpdated')}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.what.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.what.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.how.title')}</h2>
            <p className="text-gray-700 mb-4">{t('sections.how.content')}</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('sections.how.items.0')}</li>
              <li>{t('sections.how.items.1')}</li>
              <li>{t('sections.how.items.2')}</li>
              <li>{t('sections.how.items.3')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.types.title')}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('sections.types.essential.title')}</h3>
                <p className="text-gray-700">{t('sections.types.essential.desc')}</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('sections.types.analytics.title')}</h3>
                <p className="text-gray-700">{t('sections.types.analytics.desc')}</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('sections.types.preference.title')}</h3>
                <p className="text-gray-700">{t('sections.types.preference.desc')}</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.managing.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.managing.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.contact.title')}</h2>
            <p className="text-gray-700">
              {t('sections.contact.content')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

