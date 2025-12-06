"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from 'next-intl'
import { AuthCard } from "../components/AuthCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import { toast } from "@/lib/toast"
import { ApiClient } from "@/lib/api-client"

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")

  const validateEmail = (email: string) => {
    if (!email) {
      return t('emailRequired')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return t('emailInvalid')
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Send password reset email via backend
      const response = await ApiClient.post('/api/auth/forgot-password', { email })

      if (!response.success) {
        toast.error(t('error'), response.error || t('sendError'))
        setError(response.error || t('sendError'))
        return
      }

      // Success - show confirmation
      setEmailSent(true)
      toast.success(t('emailSent'), t('checkInbox'))

    } catch {
      toast.error(t('error'), t('somethingWrong'))
      setError(t('somethingWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) {
      setError("")
    }
  }

  // Success state - email sent
  if (emailSent) {
    return (
      <AuthCard
        title={t('checkYourEmail')}
        description={t('sentInstructions')}
      >
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              {t('sentLinkTo')}
            </p>
            <p className="font-medium text-gray-900">{email}</p>
            <p className="text-sm text-gray-600">
              {t('clickLink')}
            </p>
          </div>

          {/* Didn't receive email */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              {t('didntReceive')}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false)
                setEmail("")
              }}
              className="w-full"
            >
              {t('tryAgain')}
            </Button>
          </div>

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToLogin')}
            </Link>
          </div>
        </div>
      </AuthCard>
    )
  }

  // Form state - request reset
  return (
    <AuthCard
      title={t('title')}
      description={t('subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`pl-10 ${error ? 'border-red-500' : ''}`}
              disabled={isLoading}
              autoFocus
            />
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>{t('note')}:</strong> {t('securityNote')}
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('sending')}
            </>
          ) : (
            t('sendLink')
          )}
        </Button>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToLogin')}
          </Link>
        </div>
      </form>
    </AuthCard>
  )
}

