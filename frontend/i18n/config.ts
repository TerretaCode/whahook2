export const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

// Map browser language codes to our supported locales
export function getLocaleFromBrowser(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale
  
  // Check for Spanish variants first
  if (acceptLanguage.toLowerCase().startsWith('es')) {
    return 'es'
  }
  
  return defaultLocale
}
