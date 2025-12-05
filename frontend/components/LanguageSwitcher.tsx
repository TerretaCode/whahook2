'use client'

import { useLocale } from '@/hooks/useLocale'
import { Globe } from 'lucide-react'
import { useState } from 'react'

const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español'
}

const languageFlags: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸'
}

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'minimal'
  className?: string
}

export function LanguageSwitcher({ variant = 'dropdown', className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale, locales } = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocale(loc)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              locale === loc
                ? 'bg-green-100 text-green-700 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {languageFlags[loc]} {loc.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
        className={`flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors ${className}`}
        title={locale === 'en' ? 'Cambiar a Español' : 'Switch to English'}
      >
        <Globe className="w-4 h-4" />
        <span>{languageFlags[locale === 'en' ? 'es' : 'en']}</span>
      </button>
    )
  }

  // Default: dropdown
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{languageFlags[locale]} {languageNames[locale]}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setLocale(loc)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                  locale === loc ? 'bg-green-50 text-green-700' : 'text-gray-700'
                }`}
              >
                <span>{languageFlags[loc]}</span>
                <span>{languageNames[loc]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
