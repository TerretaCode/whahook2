'use client'

import { useLocale as useNextIntlLocale } from 'next-intl'
import { useCallback } from 'react'
import { Locale, locales } from '@/i18n/config'

export function useLocale() {
  const locale = useNextIntlLocale() as Locale

  const setLocale = useCallback((newLocale: Locale) => {
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
    // Reload to apply new locale
    window.location.reload()
  }, [])

  return {
    locale,
    setLocale,
    locales,
    isSpanish: locale === 'es',
    isEnglish: locale === 'en'
  }
}
