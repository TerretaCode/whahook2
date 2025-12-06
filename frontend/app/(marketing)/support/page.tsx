'use client'

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { MessageSquare, Mail, Book, HelpCircle } from "lucide-react"

export default function SupportPage() {
  const t = useTranslations('supportPage')
  
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Link href="/docs" className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all text-center">
              <Book className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('documentation.title')}</h3>
              <p className="text-gray-600">{t('documentation.desc')}</p>
            </Link>
            <Link href="/guides" className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all text-center">
              <HelpCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('guides.title')}</h3>
              <p className="text-gray-600">{t('guides.desc')}</p>
            </Link>
            <Link href="/contact" className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all text-center">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('emailSupport.title')}</h3>
              <p className="text-gray-600">{t('emailSupport.desc')}</p>
            </Link>
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-600 transition-all text-center">
              <MessageSquare className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('liveChat.title')}</h3>
              <p className="text-gray-600">{t('liveChat.desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

