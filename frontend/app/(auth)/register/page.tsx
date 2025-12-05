"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from 'next-intl'
import { AuthCard } from "../components/AuthCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Mail, Lock, User, Loader2, Building2 } from "lucide-react"
import { toast } from "@/lib/toast"
import { ApiClient } from "@/lib/api-client"
import { AuthStorage } from "@/lib/auth-storage"

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth.register')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  })
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    agreedToTerms?: string
  }>({})

  const validateForm = () => {
    const newErrors: typeof errors = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('fullNameRequired')
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('nameMinLength')
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = t('emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('emailInvalid')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('passwordRequired')
    } else if (formData.password.length < 8) {
      newErrors.password = t('passwordMinLength')
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('passwordRequirements')
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch')
    }

    // Terms validation
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = t('mustAgreeTerms')
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
      // Get current origin for redirect URL (supports multi-tenant)
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

      // Call backend API
      const response = await ApiClient.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        company_name: formData.company,
        redirect_url: currentOrigin,
      })

      if (!response.success || !response.data) {
        toast.error(t('registrationFailed'), response.error || t('couldNotCreate'))
        return
      }

      const { requires_email_verification, session, user } = response.data

      // Check if email verification is required
      if (requires_email_verification) {
        toast.success(
          t('accountCreated'), 
          t('checkEmailVerify')
        )
        // Redirect to email verification page
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        return
      }

      // If session is returned directly (no verification required), use it
      if (session) {
        AuthStorage.saveSession(
          session.access_token,
          session.refresh_token,
          user,
          true
        )
        toast.success(t('accountCreated'), t('welcome'))
        router.push("/dashboard")
        return
      }

      // Fallback: try to login
      const loginResponse = await ApiClient.login({
        email: formData.email,
        password: formData.password,
      })

      if (loginResponse.success && loginResponse.data && loginResponse.data.session) {
        const { user: loginUser, session: loginSession } = loginResponse.data

        // Save session (default to rememberMe = true for new users)
        AuthStorage.saveSession(
          loginSession.access_token,
          loginSession.refresh_token,
          loginUser,
          true
        )

        toast.success(t('accountCreated'), t('welcome'))
        router.push("/dashboard")
      } else {
        // Registration successful but auto-login failed
        toast.success(t('accountCreated'), t('pleaseLogin'))
        router.push("/login")
      }
    } catch {
      toast.error(t('registrationFailed'), t('somethingWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <AuthCard
      title={t('title')}
      description={t('subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name Input */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            {t('fullName')}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              className={`pl-10 ${errors.fullName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isLoading}
              autoComplete="name"
              autoFocus
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            {t('email')}
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
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Company Input (Optional) */}
        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-medium text-gray-700">
            {t('company')} <span className="text-gray-400 font-normal">({t('optional')})</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="company"
              name="company"
              type="text"
              placeholder="Your Company"
              value={formData.company}
              onChange={handleChange}
              className="pl-10"
              disabled={isLoading}
              autoComplete="organization"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            {t('password')}
          </label>
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
              autoComplete="new-password"
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
          {!errors.password && formData.password && (
            <p className="text-xs text-gray-500">
              {t('passwordHint')}
            </p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            {t('confirmPassword')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="space-y-2">
          <div className="flex items-start">
            <input
              id="agreedToTerms"
              name="agreedToTerms"
              type="checkbox"
              checked={formData.agreedToTerms}
              onChange={handleChange}
              className={`w-4 h-4 mt-0.5 border-gray-300 rounded cursor-pointer ${
                errors.agreedToTerms ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            <label htmlFor="agreedToTerms" className="ml-2 text-sm text-gray-600 cursor-pointer">
              {t('agreeTerms')}{" "}
              <Link href="/terms" className="text-green-600 hover:text-green-700 font-medium">
                {t('termsOfService')}
              </Link>{" "}
              {t('and')}{" "}
              <Link href="/privacy" className="text-green-600 hover:text-green-700 font-medium">
                {t('privacyPolicy')}
              </Link>
            </label>
          </div>
          {errors.agreedToTerms && (
            <p className="text-xs text-red-500">{errors.agreedToTerms}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('creatingAccount')}
            </>
          ) : (
            t('createAccount')
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
            {t('orContinueWith')}
          </span>
        </div>

        {/* Social Sign Up */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.info("Coming soon", "Google sign up will be available soon")}
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
            onClick={() => toast.info("Coming soon", "GitHub sign up will be available soon")}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </Button>
        </div>
      </form>

      {/* Sign In Link */}
      <p className="mt-6 text-center text-sm text-gray-600">
        {t('haveAccount')}{" "}
        <Link
          href="/login"
          className="font-medium text-green-600 hover:text-green-700"
        >
          {t('signIn')}
        </Link>
      </p>
    </AuthCard>
  )
}

