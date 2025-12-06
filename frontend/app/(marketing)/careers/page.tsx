'use client'

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"

export default function CareersPage() {
  const t = useTranslations('careersPage')
  
  const positions = [
    { titleKey: 'positions.fullstack', locationKey: 'locations.remote', typeKey: 'types.fullTime' },
    { titleKey: 'positions.designer', locationKey: 'locations.remote', typeKey: 'types.fullTime' },
    { titleKey: 'positions.csm', locationKey: 'locations.hybrid', typeKey: 'types.fullTime' },
    { titleKey: 'positions.devops', locationKey: 'locations.remote', typeKey: 'types.fullTime' }
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
          <h2 className="text-3xl font-bold mb-8">{t('openPositions')}</h2>
          <div className="space-y-4">
            {positions.map((position, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-600 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t(position.titleKey)}</h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{t(position.locationKey)}</span>
                      <span>•</span>
                      <span>{t(position.typeKey)}</span>
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">{t('applyNow')}</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

