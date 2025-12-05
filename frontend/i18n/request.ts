import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, getLocaleFromBrowser, Locale, locales } from './config'

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined
  
  let locale: Locale = defaultLocale
  
  if (localeCookie && locales.includes(localeCookie)) {
    locale = localeCookie
  } else {
    // Fall back to browser language
    const headersList = await headers()
    const acceptLanguage = headersList.get('accept-language')
    locale = getLocaleFromBrowser(acceptLanguage)
  }
  
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
