'use client'

import { useTranslations } from 'next-intl'

export default function ChangelogPage() {
  const t = useTranslations('changelogPage')
  
  const updates = [
    { version: "2.1.0", date: "Nov 20, 2025", changesKeys: ['v210.change1', 'v210.change2', 'v210.change3'] },
    { version: "2.0.0", date: "Nov 1, 2025", changesKeys: ['v200.change1', 'v200.change2', 'v200.change3'] },
    { version: "1.5.0", date: "Oct 15, 2025", changesKeys: ['v150.change1', 'v150.change2', 'v150.change3'] }
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
          <div className="space-y-8">
            {updates.map((update, index) => (
              <div key={index} className="border-l-4 border-green-600 pl-6 py-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl font-bold text-green-600">{update.version}</span>
                  <span className="text-gray-600">{update.date}</span>
                </div>
                <ul className="space-y-2">
                  {update.changesKeys.map((key, i) => (
                    <li key={i} className="text-gray-700">• {t(key)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

