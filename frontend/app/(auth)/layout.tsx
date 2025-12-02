import { cookies } from 'next/headers'
import { Metadata } from 'next'

// Get branding from cookies (set by middleware)
async function getBrandingFromCookies() {
  const cookieStore = await cookies()
  const brandingStr = cookieStore.get('x-custom-domain-branding')?.value
  
  if (brandingStr) {
    try {
      return JSON.parse(brandingStr)
    } catch {
      return null
    }
  }
  return null
}

export async function generateMetadata(): Promise<Metadata> {
  // Default Whahook metadata
  const defaultMetadata: Metadata = {
    title: 'WhaHook - Iniciar sesión',
    description: 'Manage multiple WhatsApp accounts with AI chatbot',
    icons: {
      icon: '/icon.svg',
      apple: '/icon.svg',
    },
  }
  
  // Get branding from cookies (set by middleware for custom domains)
  const branding = await getBrandingFromCookies()
  
  if (!branding) {
    return defaultMetadata
  }
  
  // Build custom metadata
  const agencyName = branding.tab_title || branding.agency_name || branding.logo_text || 'Panel'
  const title = `${agencyName} - Iniciar sesión`
  const description = `Accede a tu panel de ${agencyName}`
  
  // Use favicon_url if available, otherwise fall back to logo_url
  const faviconUrl = branding.favicon_url || branding.logo_url
  
  return {
    title,
    description,
    icons: faviconUrl ? {
      icon: faviconUrl,
      apple: faviconUrl,
    } : {
      icon: '/icon.svg',
      apple: '/icon.svg',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: branding.logo_url ? [branding.logo_url] : undefined,
    },
  }
}

// Server Component that provides branding context
async function BrandingWrapper({ children }: { children: React.ReactNode }) {
  const branding = await getBrandingFromCookies()
  const cookieStore = await cookies()
  const isCustomDomain = !!cookieStore.get('x-custom-domain')?.value
  
  // Inject branding data as a script tag for client-side access without hydration issues
  return (
    <>
      <script
        id="branding-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ isCustomDomain, branding })
        }}
      />
      {children}
    </>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <BrandingWrapper>{children}</BrandingWrapper>
}
