"use client"

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

interface CustomBranding {
  primary_color?: string
  favicon_url?: string
  logo_url?: string
  tab_title?: string
  agency_name?: string
  logo_text?: string
}

// Helper to check if we're on a custom domain
function getCustomDomainInfo(): { isCustomDomain: boolean; branding: CustomBranding | null } {
  if (typeof window === 'undefined') return { isCustomDomain: false, branding: null }
  
  try {
    const customDomain = getCookie('x-custom-domain')
    const brandingStr = getCookie('x-custom-domain-branding')
    
    if (customDomain && brandingStr) {
      // Try to parse - the cookie might be URL encoded or not
      let parsed
      try {
        parsed = JSON.parse(decodeURIComponent(brandingStr))
      } catch {
        // Try without decoding
        parsed = JSON.parse(brandingStr)
      }
      return {
        isCustomDomain: true,
        branding: parsed
      }
    }
  } catch (e) {
    console.error('Error parsing custom domain branding:', e)
  }
  
  return { isCustomDomain: false, branding: null }
}

// Check if current hostname is a custom domain (not Whahook's domains)
function isLikelyCustomDomain(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  const mainDomains = ['localhost', '127.0.0.1', 'whahook.com', 'www.whahook.com', 'app.whahook.com']
  if (mainDomains.includes(hostname)) return false
  if (hostname.endsWith('.vercel.app')) return false
  return true
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Start with brandingReady = false to always show loading first
  // This prevents any flash of wrong branding
  const [brandingReady, setBrandingReady] = useState(false);
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [customBranding, setCustomBranding] = useState<CustomBranding | null>(null);
  
  // Track if we've checked for custom domain
  const [checkedDomain, setCheckedDomain] = useState(false);
  
  // Check for custom domain on mount
  useEffect(() => {
    const { isCustomDomain: isCd, branding } = getCustomDomainInfo()
    
    // Debug logging
    console.log('[Branding] Custom domain check:', { 
      isCustomDomain: isCd, 
      hasBranding: !!branding,
      favicon: branding?.favicon_url,
      logo: branding?.logo_url,
      title: branding?.tab_title
    })
    
    setIsCustomDomain(isCd)
    setCustomBranding(branding)
    
    // Apply branding if custom domain
    if (isCd && branding) {
      // Apply colors
      if (branding.primary_color) {
        document.documentElement.style.setProperty('--brand-primary', branding.primary_color)
        const hex = branding.primary_color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        document.documentElement.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`)
      }
      
      // Update favicon - remove old and create new to force browser refresh
      const faviconUrl = branding.favicon_url || branding.logo_url
      if (faviconUrl) {
        // Remove all existing favicons
        document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach(el => el.remove())
        
        // Create new favicon with cache-busting
        const newFavicon = document.createElement('link')
        newFavicon.rel = 'icon'
        newFavicon.href = faviconUrl + (faviconUrl.includes('?') ? '&' : '?') + 't=' + Date.now()
        document.head.appendChild(newFavicon)
        
        // Also update apple-touch-icon
        const appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
        if (appleIcon) {
          appleIcon.href = faviconUrl
        }
      }
      
      // Update title - store original and always set custom
      const tabTitle = branding.tab_title || branding.agency_name || branding.logo_text
      if (tabTitle) {
        // Get current page name from title or pathname
        const currentPage = document.title.split(' - ').pop() || 'Panel'
        document.title = `${tabTitle} - ${currentPage}`
      }
    }
    
    setCheckedDomain(true)
    setBrandingReady(true)
  }, []);
  
  // Update title when pathname changes on custom domain
  useEffect(() => {
    if (isCustomDomain && customBranding) {
      const tabTitle = customBranding.tab_title || customBranding.agency_name || customBranding.logo_text
      if (tabTitle) {
        // Map pathname to page name
        let pageName = 'Panel'
        if (pathname.startsWith('/dashboard')) pageName = 'Dashboard'
        else if (pathname.startsWith('/conversations')) pageName = 'Mensajes'
        else if (pathname.startsWith('/clients')) pageName = 'Clientes'
        else if (pathname.startsWith('/settings')) pageName = 'Configuración'
        else if (pathname.startsWith('/config')) pageName = 'Configuración'
        
        document.title = `${tabTitle} - ${pageName}`
      }
      
      // Re-apply favicon on navigation (some browsers reset it)
      const faviconUrl = customBranding.favicon_url || customBranding.logo_url
      if (faviconUrl) {
        // Remove existing and create new to ensure it updates
        document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach(el => el.remove())
        const newFavicon = document.createElement('link')
        newFavicon.rel = 'icon'
        newFavicon.href = faviconUrl + (faviconUrl.includes('?') ? '&' : '?') + 't=' + Date.now()
        document.head.appendChild(newFavicon)
      }
    }
  }, [pathname, isCustomDomain, customBranding]);
  
  // Rutas donde NO debe aparecer el MobileBottomNav
  const hideBottomNav = 
    pathname === '/' || // Landing page
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/change-password') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/connect');
  
  // Rutas donde NO debe aparecer el Header (páginas públicas de invitación/conexión y auth)
  const hideHeader = 
    pathname.startsWith('/invite') ||
    pathname.startsWith('/connect') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/change-password');

  // Footer en páginas públicas (landing, marketing, legal)
  const showFooter = 
    pathname === '/' || 
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/features') ||
    pathname.startsWith('/integrations') ||
    pathname.startsWith('/changelog') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/api-reference') ||
    pathname.startsWith('/guides') ||
    pathname.startsWith('/support') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/careers') ||
    pathname.startsWith('/status') ||
    pathname.startsWith('/forgot-password');

  // Páginas que necesitan altura completa sin scroll (solo conversations)
  const isFullHeightPage = pathname.startsWith('/conversations');
  
  // Show loading screen while branding is being determined on custom domains
  // This prevents flash of Whahook branding
  // Only show loading if we haven't checked yet AND we're likely on a custom domain
  const shouldShowLoading = !checkedDomain && (typeof window !== 'undefined' && isLikelyCustomDomain())
  
  if (shouldShowLoading) {
    // Use branding color if already loaded, otherwise neutral gray
    const spinnerColor = customBranding?.primary_color || '#9ca3af'
    
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: spinnerColor }} />
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <WorkspaceProvider>
          <BrandingProvider>
        <div className={`flex flex-col ${isFullHeightPage ? 'h-screen' : 'min-h-screen'}`}>
          {/* Header: oculto en páginas de invitación/conexión */}
          {!hideHeader && <Header />}
          
          <main className={`flex-1 ${isFullHeightPage ? 'overflow-hidden' : ''} ${
            isFullHeightPage 
              ? 'pb-20 md:pb-0'
              : hideBottomNav 
                ? (pathname === '/' ? '' : 'pb-8') 
                : 'pb-20 md:pb-8'
          }`}>
            {children}
          </main>

          {showFooter && !isCustomDomain && <Footer />}
          {!hideBottomNav && !isCustomDomain && <MobileBottomNav className="md:hidden" />}
        </div>
        
        <Toaster />
          </BrandingProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
