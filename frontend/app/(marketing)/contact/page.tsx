"use client"

import { useState } from "react"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MessageSquare, Phone, MapPin, Send } from "lucide-react"
import { toast } from "@/lib/toast"

export default function ContactPage() {
  const t = useTranslations('contactPage')
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    toast.success(t('toast.success'), t('toast.successDesc'))
    setFormData({ name: "", email: "", subject: "", message: "" })
    setIsSubmitting(false)
  }

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

      {/* Contact Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6">{t('form.title')}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.name')}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('form.namePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.email')}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('form.emailPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.subject')}
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t('form.subjectPlaceholder')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('form.messagePlaceholder')}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isSubmitting ? (
                    t('form.sending')
                  ) : (
                    <>
                      {t('form.submit')}
                      <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold mb-6">{t('info.title')}</h2>
              <div className="space-y-6">
                <ContactInfo
                  icon={<Mail className="w-6 h-6 text-green-600" />}
                  title={t('info.email')}
                  content="support@whahook.com"
                  link="mailto:support@whahook.com"
                />
                <ContactInfo
                  icon={<MessageSquare className="w-6 h-6 text-green-600" />}
                  title={t('info.liveChat')}
                  content={t('info.liveChatHours')}
                />
                <ContactInfo
                  icon={<Phone className="w-6 h-6 text-green-600" />}
                  title={t('info.phone')}
                  content="+1 (555) 123-4567"
                  link="tel:+15551234567"
                />
                <ContactInfo
                  icon={<MapPin className="w-6 h-6 text-green-600" />}
                  title={t('info.office')}
                  content="123 Business Street, Suite 100, City, Country"
                />
              </div>

              {/* Business Hours */}
              <div className="mt-12 bg-green-50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">{t('hours.title')}</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>{t('hours.weekdays')}</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('hours.saturday')}</span>
                    <span className="font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('hours.sunday')}</span>
                    <span className="font-medium">{t('hours.closed')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{t('faq.title')}</h2>
            <div className="space-y-6">
              <FAQItem
                question={t('faq.q1')}
                answer={t('faq.a1')}
              />
              <FAQItem
                question={t('faq.q2')}
                answer={t('faq.a2')}
              />
              <FAQItem
                question={t('faq.q3')}
                answer={t('faq.a3')}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ContactInfo({ 
  icon, 
  title, 
  content, 
  link 
}: { 
  icon: React.ReactNode
  title: string
  content: string
  link?: string
}) {
  const Content = () => (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{content}</p>
      </div>
    </div>
  )

  if (link) {
    return (
      <a href={link} className="block hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
        <Content />
      </a>
    )
  }

  return <Content />
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  )
}

