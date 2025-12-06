'use client'

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Book, Code, Rocket, MessageSquare, Settings, Shield, ArrowRight } from "lucide-react"

export default function DocsPage() {
  const t = useTranslations('docsPage')
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">{t('title')}</h1>
            <p className="text-xl text-gray-600">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">{t('quickStart.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <QuickStartCard
                number="1"
                title={t('quickStart.step1.title')}
                description={t('quickStart.step1.desc')}
              />
              <QuickStartCard
                number="2"
                title={t('quickStart.step2.title')}
                description={t('quickStart.step2.desc')}
              />
              <QuickStartCard
                number="3"
                title={t('quickStart.step3.title')}
                description={t('quickStart.step3.desc')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">{t('categories.title')}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DocCard
                icon={<Rocket className="w-8 h-8 text-green-600" />}
                title={t('categories.gettingStarted.title')}
                description={t('categories.gettingStarted.desc')}
                topics={[t('categories.gettingStarted.topic1'), t('categories.gettingStarted.topic2'), t('categories.gettingStarted.topic3')]}
              />
              <DocCard
                icon={<MessageSquare className="w-8 h-8 text-green-600" />}
                title={t('categories.chatbot.title')}
                description={t('categories.chatbot.desc')}
                topics={[t('categories.chatbot.topic1'), t('categories.chatbot.topic2'), t('categories.chatbot.topic3')]}
              />
              <DocCard
                icon={<Code className="w-8 h-8 text-green-600" />}
                title={t('categories.api.title')}
                description={t('categories.api.desc')}
                topics={[t('categories.api.topic1'), t('categories.api.topic2'), t('categories.api.topic3')]}
              />
              <DocCard
                icon={<Settings className="w-8 h-8 text-green-600" />}
                title={t('categories.advanced.title')}
                description={t('categories.advanced.desc')}
                topics={[t('categories.advanced.topic1'), t('categories.advanced.topic2'), t('categories.advanced.topic3')]}
              />
              <DocCard
                icon={<Shield className="w-8 h-8 text-green-600" />}
                title={t('categories.security.title')}
                description={t('categories.security.desc')}
                topics={[t('categories.security.topic1'), t('categories.security.topic2'), t('categories.security.topic3')]}
              />
              <DocCard
                icon={<Book className="w-8 h-8 text-green-600" />}
                title={t('categories.bestPractices.title')}
                description={t('categories.bestPractices.desc')}
                topics={[t('categories.bestPractices.topic1'), t('categories.bestPractices.topic2'), t('categories.bestPractices.topic3')]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">{t('articles.title')}</h2>
            <div className="space-y-4">
              <ArticleLink
                title={t('articles.article1.title')}
                category={t('articles.article1.category')}
              />
              <ArticleLink
                title={t('articles.article2.title')}
                category={t('articles.article2.category')}
              />
              <ArticleLink
                title={t('articles.article3.title')}
                category={t('articles.article3.category')}
              />
              <ArticleLink
                title={t('articles.article4.title')}
                category={t('articles.article4.category')}
              />
              <ArticleLink
                title={t('articles.article5.title')}
                category={t('articles.article5.category')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-5 h-auto">
              {t('cta.button')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

function QuickStartCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function DocCard({ 
  icon, 
  title, 
  description, 
  topics 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  topics: string[]
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-200 transition-all">
      <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {topics.map((topic, index) => (
          <li key={index} className="text-sm text-green-600 hover:text-green-700 cursor-pointer">
            → {topic}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ArticleLink({ title, category }: { title: string; category: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-200 hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{category}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  )
}

