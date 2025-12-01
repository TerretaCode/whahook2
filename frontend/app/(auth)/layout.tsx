import { headers } from 'next/headers'
import { Metadata } from 'next'

// Fetch branding data for custom domain
async function getBrandingData(hostname: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/domains/lookup/${hostname}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        return data.data
      }
    }
  } catch (e) {
    console.error('Error fetching branding:', e)
  }
  return null
}

// Check if hostname is a custom domain
function isCustomDomain(hostname: string): boolean {
  const mainDomains = [
    'localhost',
    '127.0.0.1',
    'whahook.com',
    'www.whahook.com',
    'app.whahook.com',
    'whahook2.vercel.app',
  ]
  
  const host = hostname.split(':')[0]
  
  if (mainDomains.some(domain => host === domain || host.endsWith(`.${domain}`))) {
    return false
  }
  
  if (host.endsWith('.vercel.app')) {
    return false
  }
  
  return true
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  
  // Default Whahook metadata
  const defaultMetadata: Metadata = {
    title: 'WhaHook - WhatsApp Multi-Tenant Platform',
    description: 'Manage multiple WhatsApp accounts with AI chatbot',
    icons: {
      icon: '/icon.svg',
      apple: '/icon.svg',
    },
    openGraph: {
      title: 'WhaHook - WhatsApp Multi-Tenant Platform',
      description: 'Manage multiple WhatsApp accounts with AI chatbot',
      type: 'website',
    },
  }
  
  // If not a custom domain, return default
  if (!isCustomDomain(hostname)) {
    return defaultMetadata
  }
  
  // Fetch branding for custom domain
  const branding = await getBrandingData(hostname)
  
  if (!branding) {
    return defaultMetadata
  }
  
  // Build custom metadata
  const agencyName = branding.tab_title || branding.agency_name || branding.logo_text || hostname
  const title = `${agencyName} - Panel de Cliente`
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
    twitter: {
      card: 'summary',
      title,
      description,
      images: branding.logo_url ? [branding.logo_url] : undefined,
    },
  }
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
