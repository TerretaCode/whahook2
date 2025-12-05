'use client'

import Link from 'next/link'
import { Github, Twitter, Linkedin, Mail, Activity } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LogoIcon } from '@/components/icons/LogoIcon'

export function Footer() {
  const t = useTranslations('footer')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div>
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <LogoIcon className="w-8 h-8 text-green-600" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-gray-900 leading-tight">
                    WhaHook
                  </span>
                  <span className="text-[10px] leading-tight ml-0.5">
                    <span className="text-gray-900">by </span>
                    <span className="text-green-600">TerretaCode</span>
                  </span>
                </div>
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              {t('description')}
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="mailto:contact@whahook.com"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('product')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('features')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('pricing')}
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('integrations')}
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('changelog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('resources')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('documentation')}
                </Link>
              </li>
              <li>
                <Link href="/api-reference" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('apiReference')}
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('guides')}
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('support')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('company')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('blog')}
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('careers')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-sm text-gray-600">
                © {currentYear} WhaHook. {t('allRightsReserved')}
              </p>
              <a 
                href="https://stats.uptimerobot.com/9INndKjW9t" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 transition-colors font-medium"
              >
                <Activity className="w-4 h-4" />
                <span>{t('systemStatus')}</span>
              </a>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t('privacyPolicy')}
              </Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t('termsOfService')}
              </Link>
              <Link href="/cookies" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {t('cookiePolicy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

