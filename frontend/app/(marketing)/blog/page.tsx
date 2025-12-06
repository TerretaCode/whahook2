'use client'

import { useTranslations } from 'next-intl'

export default function BlogPage() {
  const t = useTranslations('blogPage')
  
  const posts = [
    { titleKey: 'post1.title', date: "Nov 20, 2025", categoryKey: 'categories.tips' },
    { titleKey: 'post2.title', date: "Nov 15, 2025", categoryKey: 'categories.industry' },
    { titleKey: 'post3.title', date: "Nov 10, 2025", categoryKey: 'categories.caseStudy' },
    { titleKey: 'post4.title', date: "Nov 5, 2025", categoryKey: 'categories.bestPractices' }
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
          <div className="grid gap-6">
            {posts.map((post, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-600 transition-all">
                <span className="text-sm text-green-600 font-medium">{t(post.categoryKey)}</span>
                <h3 className="text-2xl font-semibold my-2">{t(post.titleKey)}</h3>
                <p className="text-gray-600">{post.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

