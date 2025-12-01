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

// Pages allowed on custom domains (no marketing, no register)
const ALLOWED_CUSTOM_DOMAIN_PATHS = [
  '/login',
  '/dashboard',
  '/conversations', // Chat/messages page
  '/clients',
  '/settings',
  '/config',
  '/chatbot',
  '/ecommerce',
  '/webhooks',
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

// Check if path is allowed on custom domain
function isAllowedPath(pathname: string): boolean {
  // Root should redirect to login
  if (pathname === '/') return false
  
  // Check if path starts with any allowed path
  return ALLOWED_CUSTOM_DOMAIN_PATHS.some(allowed => 
    pathname === allowed || pathname.startsWith(`${allowed}/`)
  )
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

  // Custom domain detected - fetch branding and validate
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/domains/lookup/${hostname}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      // Domain not found - redirect to main site
      return NextResponse.redirect('https://whahook.com')
    }

    const data = await response.json()
    
    if (!data.success || !data.data) {
      return NextResponse.redirect('https://whahook.com')
    }

    // Custom domain is valid - check if path is allowed
    
    // Redirect root and marketing pages to login
    if (!isAllowedPath(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      
      // Add branding info to the redirect
      const redirectResponse = NextResponse.redirect(url)
      redirectResponse.cookies.set('x-custom-domain', hostname, { path: '/' })
      redirectResponse.cookies.set('x-custom-domain-branding', JSON.stringify(data.data), { path: '/' })
      return redirectResponse
    }

    // Block register and forgot-password on custom domains
    if (pathname === '/register' || pathname === '/forgot-password') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Clone the request URL and add custom domain info to headers/cookies
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-custom-domain', hostname)
    requestHeaders.set('x-custom-domain-owner', data.data.owner_id)
    requestHeaders.set('x-custom-domain-branding', JSON.stringify(data.data))

    const response2 = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    // Also set cookies for client-side access
    response2.cookies.set('x-custom-domain', hostname, { path: '/' })
    response2.cookies.set('x-custom-domain-branding', JSON.stringify(data.data), { path: '/' })
    
    return response2
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to main site
    return NextResponse.redirect('https://whahook.com')
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
