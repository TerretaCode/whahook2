import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Metadata } from "next";
import "./globals.css";
import { LayoutContent } from "./layout-content";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Get branding from cookies
async function getBranding() {
  const cookieStore = await cookies();
  const brandingStr = cookieStore.get('x-custom-domain-branding')?.value;
  
  if (brandingStr) {
    try {
      return JSON.parse(brandingStr);
    } catch {
      return null;
    }
  }
  return null;
}

// Dynamic metadata based on custom domain
export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  
  // Default metadata for Whahook
  let title = "WhaHook - WhatsApp Multi-Tenant Platform";
  const description = "Manage multiple WhatsApp accounts with AI chatbot";
  let faviconUrl = '/icon.svg';
  
  // If custom domain, use tenant branding
  if (branding) {
    title = branding.tab_title || branding.agency_name || branding.logo_text || title;
    faviconUrl = branding.favicon_url || branding.logo_url || faviconUrl;
  }
  
  return {
    title: {
      default: title,
      template: `%s - ${title}`,
    },
    description,
    icons: {
      icon: faviconUrl,
      apple: faviconUrl,
    },
  };
}

/**
 * Generate a blocking script that applies CSS variables BEFORE the browser paints.
 * This prevents the flash of default branding colors.
 * The script runs synchronously in the <head> before any content is rendered.
 */
function generateBrandingScript(branding: { primary_color?: string; logo_url?: string; logo_text?: string; agency_name?: string } | null): string {
  if (!branding) {
    return '';
  }
  
  const color = branding.primary_color || '#22c55e';
  
  // This script runs immediately, blocking render until CSS variables are set
  // It also sets a data attribute to indicate custom domain for CSS-based hiding
  return `
    (function() {
      var color = '${color}';
      var hex = color.replace('#', '');
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);
      var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      var textColor = luminance > 0.5 ? '#000000' : '#ffffff';
      
      document.documentElement.style.setProperty('--brand-primary', color);
      document.documentElement.style.setProperty('--brand-primary-rgb', r + ', ' + g + ', ' + b);
      document.documentElement.style.setProperty('--brand-text', textColor);
      document.documentElement.setAttribute('data-custom-domain', 'true');
    })();
  `;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBranding();
  const brandingScript = generateBrandingScript(branding);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script to apply branding colors BEFORE render - prevents flash */}
        {brandingScript && (
          <script
            dangerouslySetInnerHTML={{ __html: brandingScript }}
          />
        )}
        {/* Store branding data for client-side access */}
        {branding && (
          <script
            id="branding-data"
            type="application/json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({ isCustomDomain: true, branding })
            }}
          />
        )}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
