import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Metadata } from "next";
import "./globals.css";
import { LayoutContent } from "./layout-content";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Dynamic metadata based on custom domain
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const brandingStr = cookieStore.get('x-custom-domain-branding')?.value;
  
  // Default metadata for Whahook
  let title = "WhaHook - WhatsApp Multi-Tenant Platform";
  const description = "Manage multiple WhatsApp accounts with AI chatbot";
  let faviconUrl = '/icon.svg';
  
  // If custom domain, use tenant branding
  if (brandingStr) {
    try {
      const branding = JSON.parse(brandingStr);
      title = branding.tab_title || branding.agency_name || branding.logo_text || title;
      faviconUrl = branding.favicon_url || branding.logo_url || faviconUrl;
    } catch (e) {
      console.error('Error parsing branding metadata:', e);
    }
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
