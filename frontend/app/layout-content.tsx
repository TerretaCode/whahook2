"use client"

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ServerBrandingProvider } from "@/contexts/ServerBrandingContext";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import { Branding } from "@/lib/branding";

interface LayoutContentProps {
  children: React.ReactNode;
  branding: Branding;
  isCustomDomain: boolean;
}

export function LayoutContent({ children, branding, isCustomDomain }: LayoutContentProps) {
  const pathname = usePathname();
  
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
          <ServerBrandingProvider branding={branding} isCustomDomain={isCustomDomain}>
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
              {!hideBottomNav && <MobileBottomNav className="md:hidden" />}
            </div>
            
            <Toaster />
          </ServerBrandingProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
