"use client"

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // CSS variables are now applied via blocking script in layout.tsx <head>
  // This prevents any flash of default colors
  
  // Check if we're on a custom domain (for hiding footer/mobile nav)
  const isCustomDomain = typeof window !== 'undefined' && getCookie('x-custom-domain') !== null;
  
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
