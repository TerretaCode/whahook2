"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AuthCard } from "../components/AuthCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react"
import { toast } from "@/lib/toast"
import { useAuth } from "@/contexts/AuthContext"

// Helper to check if we're on a custom domain
function getCustomDomainBranding(): { isCustomDomain: boolean; branding: any } {
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

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: authLogin, user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})
  
  // Custom domain state - initialize from cookies immediately to prevent flash
  const [brandingLoaded, setBrandingLoaded] = useState(false)
  const [isCustomDomain, setIsCustomDomain] = useState(() => {
    if (typeof window === 'undefined') return false
    const { isCustomDomain } = getCustomDomainBranding()
    return isCustomDomain
  })
  const [customBranding, setCustomBranding] = useState<any>(() => {
    if (typeof window === 'undefined') return null
    const { branding } = getCustomDomainBranding()
    return branding
  })
  
  // Check for custom domain on mount and apply branding
  useEffect(() => {
    const { isCustomDomain: isCd, branding } = getCustomDomainBranding()
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
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      document.documentElement.style.setProperty('--brand-text', luminance > 0.5 ? '#000000' : '#ffffff')
    }
    
    setBrandingLoaded(true)
  }, [])

  // Show success message if coming from email verification
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast.success("Email verified!", "You can now log in to your account.")
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const validateForm = () => {
    const newErrors: typeof errors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const success = await authLogin(formData.email, formData.password, rememberMe)

      if (!success) {
        toast.error("Login failed", "Invalid email or password")
        setIsLoading(false)
        return
      }

      toast.success("Logged in", "Welcome back!")
      // useEffect will handle the redirect when user updates
    } catch {
      toast.error("Login failed", "Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  // Custom header for branded login
  const brandedHeader = isCustomDomain && customBranding ? (
    <div className="text-center mb-6">
      {customBranding.logo_url ? (
        <img 
          src={customBranding.logo_url} 
          alt={customBranding.agency_name || 'Logo'} 
          className="h-12 mx-auto mb-4 object-contain"
        />
      ) : customBranding.logo_text ? (
        <h1 className="text-2xl font-bold mb-4" style={{ color: customBranding.primary_color }}>
          {customBranding.logo_text}
        </h1>
      ) : customBranding.agency_name ? (
        <h1 className="text-2xl font-bold mb-4" style={{ color: customBranding.primary_color }}>
          {customBranding.agency_name}
        </h1>
      ) : null}
    </div>
  ) : null

  // Show loading while branding is being determined on custom domains
  // This prevents the flash of Whahook branding
  if (!brandingLoaded && typeof window !== 'undefined') {
    // Check if we might be on a custom domain (not localhost or known domains)
    const hostname = window.location.hostname
    const isLikelyCustomDomain = !['localhost', '127.0.0.1', 'whahook.com', 'app.whahook.com'].includes(hostname) 
      && !hostname.endsWith('.vercel.app')
    
    if (isLikelyCustomDomain) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )
    }
  }

  // Get brand color for styling (fallback to green for Whahook)
  const brandColor = isCustomDomain && customBranding?.primary_color 
    ? customBranding.primary_color 
    : '#22c55e'

  return (
    <AuthCard
      title={isCustomDomain ? "Iniciar sesión" : "Welcome back"}
      description={isCustomDomain ? "Accede a tu cuenta para continuar" : "Sign in to your account to continue"}
      customHeader={brandedHeader}
      brandColor={isCustomDomain ? customBranding?.primary_color : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              {isCustomDomain ? "Contraseña" : "Password"}
            </label>
            {/* Hide forgot password link on custom domains */}
            {!isCustomDomain && (
              <Link
                href="/forgot-password"
                className="text-xs font-medium hover:opacity-80"
                style={{ color: brandColor }}
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 border-gray-300 rounded cursor-pointer"
            disabled={isLoading}
          />
          <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading}
          style={{
            backgroundColor: brandColor,
            color: 'var(--brand-text, #ffffff)'
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isCustomDomain ? "Iniciando sesión..." : "Signing in..."}
            </>
          ) : (
            isCustomDomain ? "Iniciar sesión" : "Sign in"
          )}
        </Button>

        {/* Social Login - Hidden on custom domains */}
        {!isCustomDomain && (
          <>
            {/* Divider */}
            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                Or continue with
              </span>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => toast.info("Coming soon", "Google login will be available soon")}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => toast.info("Coming soon", "GitHub login will be available soon")}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>
          </>
        )}
      </form>

      {/* Sign Up Link - Hidden on custom domains */}
      {!isCustomDomain && (
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium hover:opacity-80"
            style={{ color: brandColor }}
          >
            Sign up for free
          </Link>
        </p>
      )}
      
      {/* Custom domain message */}
      {isCustomDomain && (
        <p className="mt-6 text-center text-xs text-gray-500">
          Si no tienes cuenta, contacta con tu administrador para recibir una invitación.
        </p>
      )}
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
