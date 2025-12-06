'use client'

import { useTranslations } from 'next-intl'

export default function APIReferencePage() {
  const t = useTranslations('apiReferencePage')
  
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
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">{t('authentication')}</h2>
              <code className="block bg-gray-900 text-green-400 p-4 rounded">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">{t('sendMessage')}</h2>
              <code className="block bg-gray-900 text-green-400 p-4 rounded text-sm">
                POST /api/v1/messages<br/>
                {`{ "to": "+1234567890", "message": "Hello" }`}
              </code>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">{t('getConversations')}</h2>
              <code className="block bg-gray-900 text-green-400 p-4 rounded">
                GET /api/v1/conversations
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

