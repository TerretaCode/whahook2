'use client'

import { useTranslations } from 'next-intl'

export default function TermsPage() {
  const t = useTranslations('termsPage')
  
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">

        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-gray-600 mb-8">{t('lastUpdated')}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.acceptance.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.acceptance.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.license.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.license.content')}
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('sections.license.items.0')}</li>
              <li>{t('sections.license.items.1')}</li>
              <li>{t('sections.license.items.2')}</li>
              <li>{t('sections.license.items.3')}</li>
              <li>{t('sections.license.items.4')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.accounts.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.accounts.content1')}
            </p>
            <p className="text-gray-700 mb-4">
              {t('sections.accounts.content2')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.acceptableUse.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.acceptableUse.content')}
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{t('sections.acceptableUse.items.0')}</li>
              <li>{t('sections.acceptableUse.items.1')}</li>
              <li>{t('sections.acceptableUse.items.2')}</li>
              <li>{t('sections.acceptableUse.items.3')}</li>
              <li>{t('sections.acceptableUse.items.4')}</li>
              <li>{t('sections.acceptableUse.items.5')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.payment.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.payment.content1')}
            </p>
            <p className="text-gray-700 mb-4">
              {t('sections.payment.content2')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.availability.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.availability.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.ip.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.ip.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.termination.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.termination.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.liability.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.liability.content')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('sections.changes.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('sections.changes.content')}
            </p>
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

