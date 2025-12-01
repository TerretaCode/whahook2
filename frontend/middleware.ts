import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Main Whahook domains - these should NOT be treated as custom domains
const MAIN_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'whahook.com',
  'www.whahook.com',
  'app.whahook.com',
  'whahook2.vercel.app', // Vercel preview
]

// Check if hostname is a main domain (not a custom domain)
function isMainDomain(hostname: string): boolean {
  // Remove port if present
  const host = hostname.split(':')[0]
  
  // Check against main domains
  if (MAIN_DOMAINS.some(domain => host === domain || host.endsWith(`.${domain}`))) {
    return true
  }
  
  // Check for Vercel preview URLs
  if (host.endsWith('.vercel.app')) {
    return true
  }
  
  return false
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next()
  }

  // If it's a main domain, continue normally
  if (isMainDomain(hostname)) {
    return NextResponse.next()
  }

  // Custom domain detected - fetch branding and rewrite
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/domains/lookup/${hostname}`, {
      headers: { 'Content-Type': 'application/json' },
      // Cache for 5 minutes
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      // Domain not found - redirect to main site
      return NextResponse.redirect('https://whahook.com')
    }

    const data = await response.json()
    
    if (!data.success || !data.data) {
      return NextResponse.redirect('https://whahook.com')
    }

    // Clone the request URL and add custom domain info to headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-custom-domain', hostname)
    requestHeaders.set('x-custom-domain-owner', data.data.owner_id)
    requestHeaders.set('x-custom-domain-branding', JSON.stringify(data.data))

    // Continue with the request, passing branding info in headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, continue normally
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
