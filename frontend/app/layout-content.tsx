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

// Helper to check if we're on a custom domain
function getCustomDomainInfo(): { isCustomDomain: boolean; branding: any } {
  if (typeof window === 'undefined') return { isCustomDomain: false, branding: null }
  
  try {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    const customDomain = cookies['x-custom-domain']
    const brandingStr = cookies['x-custom-domain-branding']
    
    if (customDomain && brandingStr) {
      return {
        isCustomDomain: true,
        branding: JSON.parse(decodeURIComponent(brandingStr))
      }
    }
  } catch (e) {
    console.error('Error parsing custom domain branding:', e)
  }
  
  return { isCustomDomain: false, branding: null }
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [brandingReady, setBrandingReady] = useState(false);
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [customBranding, setCustomBranding] = useState<any>(null);
  
  // Check for custom domain on mount
  useEffect(() => {
    const { isCustomDomain: isCd, branding } = getCustomDomainInfo()
    setIsCustomDomain(isCd)
    setCustomBranding(branding)
    
    // Apply branding colors if custom domain
    if (isCd && branding?.primary_color) {
      document.documentElement.style.setProperty('--brand-primary', branding.primary_color)
      const hex = branding.primary_color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      document.documentElement.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`)
      
      // Update favicon
      const faviconUrl = branding.favicon_url || branding.logo_url
      if (faviconUrl) {
        const existingFavicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
        if (existingFavicon) {
          existingFavicon.href = faviconUrl
        }
      }
      
      // Update title
      const tabTitle = branding.tab_title || branding.agency_name || branding.logo_text
      if (tabTitle && !document.title.includes(tabTitle)) {
        document.title = `${tabTitle} - Panel`
      }
    }
    
    setBrandingReady(true)
  }, []);
  
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
  
  // On custom domains, hide Whahook footer and show loading until branding is ready
  const hideFooterOnCustomDomain = isCustomDomain;
  
  // Show loading screen while branding is being determined on custom domains
  // This prevents flash of Whahook branding
  if (!brandingReady) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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
          {/* Header: oculto en páginas de invitación/conexión y custom domains */}
          {!hideHeader && !isCustomDomain && <Header />}
          
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
