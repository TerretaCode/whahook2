'use client'

import { useTranslations } from 'next-intl'

export default function PrivacyPage() {
  const t = useTranslations('privacyPage')
  
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">

        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-gray-600 mb-8">{t('lastUpdated')}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.collect.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.collect.content')}
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('sections.collect.items.0')}</li>
              <li>{t('sections.collect.items.1')}</li>
              <li>{t('sections.collect.items.2')}</li>
              <li>{t('sections.collect.items.3')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.use.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.use.content')}
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('sections.use.items.0')}</li>
              <li>{t('sections.use.items.1')}</li>
              <li>{t('sections.use.items.2')}</li>
              <li>{t('sections.use.items.3')}</li>
              <li>{t('sections.use.items.4')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.security.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.security.content')}
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('sections.security.items.0')}</li>
              <li>{t('sections.security.items.1')}</li>
              <li>{t('sections.security.items.2')}</li>
              <li>{t('sections.security.items.3')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.retention.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.retention.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.rights.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.rights.content')}
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('sections.rights.items.0')}</li>
              <li>{t('sections.rights.items.1')}</li>
              <li>{t('sections.rights.items.2')}</li>
              <li>{t('sections.rights.items.3')}</li>
              <li>{t('sections.rights.items.4')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.cookies.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.cookies.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.thirdParty.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.thirdParty.content')}
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('sections.thirdParty.items.0')}</li>
              <li>{t('sections.thirdParty.items.1')}</li>
              <li>{t('sections.thirdParty.items.2')}</li>
              <li>{t('sections.thirdParty.items.3')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.contact.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.contact.content')}
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>{t('sections.contact.email')}</li>
              <li>{t('sections.contact.address')}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

