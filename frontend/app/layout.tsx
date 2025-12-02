import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Metadata } from "next";
import "./globals.css";
import { LayoutContent } from "./layout-content";
import { Branding, DEFAULT_BRANDING, mergeBranding, hexToRgb, getContrastColor } from "@/lib/branding";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * Get branding from cookies (set by middleware for custom domains)
 * Returns merged branding with defaults
 */
async function getBrandingFromCookies(): Promise<{ branding: Branding; isCustomDomain: boolean }> {
  const cookieStore = await cookies();
  const brandingStr = cookieStore.get('x-custom-domain-branding')?.value;
  const isCustomDomain = !!cookieStore.get('x-custom-domain')?.value;
  
  if (brandingStr) {
    try {
      const customBranding = JSON.parse(brandingStr);
      return {
        branding: mergeBranding(customBranding),
        isCustomDomain: true,
      };
    } catch {
      // Parse error - use defaults
    }
  }
  
  return {
    branding: DEFAULT_BRANDING,
    isCustomDomain,
  };
}

// Dynamic metadata based on branding
export async function generateMetadata(): Promise<Metadata> {
  const { branding } = await getBrandingFromCookies();
  
  const title = branding.tab_title || branding.agency_name || branding.logo_text;
  const faviconUrl = branding.favicon_url || branding.logo_url || '/icon.svg';
  
  return {
    title: {
      default: title,
      template: `%s - ${branding.agency_name}`,
    },
    description: `${branding.agency_name} - WhatsApp Multi-Tenant Platform`,
    icons: {
      icon: faviconUrl,
      apple: faviconUrl,
    },
  };
}

/**
 * Generate inline CSS for branding colors.
 * This is applied directly in the HTML so there's no flash.
 */
function generateBrandingStyles(branding: Branding): string {
  const rgb = hexToRgb(branding.primary_color);
  const textColor = getContrastColor(branding.primary_color);
  
  return `
    :root {
      --brand-primary: ${branding.primary_color};
      --brand-primary-rgb: ${rgb};
      --brand-text: ${textColor};
    }
  `;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { branding, isCustomDomain } = await getBrandingFromCookies();
  const brandingStyles = generateBrandingStyles(branding);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline CSS for branding colors - no flash because it's in the HTML */}
        <style dangerouslySetInnerHTML={{ __html: brandingStyles }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LayoutContent branding={branding} isCustomDomain={isCustomDomain}>
          {children}
        </LayoutContent>
      </body>
    </html>
  );
}
