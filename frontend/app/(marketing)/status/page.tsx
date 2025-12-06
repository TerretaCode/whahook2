'use client'

import { useTranslations } from 'next-intl'

export default function StatusPage() {
  const t = useTranslations('statusPage')
  
  const services = [
    { nameKey: 'services.api', statusKey: 'operational', uptime: "99.99%" },
    { nameKey: 'services.whatsapp', statusKey: 'operational', uptime: "99.98%" },
    { nameKey: 'services.dashboard', statusKey: 'operational', uptime: "99.99%" },
    { nameKey: 'services.database', statusKey: 'operational', uptime: "100%" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-green-600 font-semibold">{t('allOperational')}</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">{t(service.nameKey)}</h3>
                    <p className="text-sm text-gray-600">{t('uptime')}: {service.uptime}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
                    {t(service.statusKey)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-gray-600">
            <p>{t('lastUpdated')}: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

