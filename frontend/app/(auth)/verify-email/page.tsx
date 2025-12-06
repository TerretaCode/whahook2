"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from 'next-intl'
import { AuthCard } from "../components/AuthCard"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useServerBranding } from "@/contexts/ServerBrandingContext"

function VerifyEmailContent() {
  const t = useTranslations('auth.verifyEmail')
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const { branding } = useServerBranding()
  const primaryColor = branding.primary_color

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      // TODO: Implement resend verification email API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch {
      // Silently fail
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthCard
      title={t('title')}
      description={t('subtitle')}
    >
      <div className="space-y-6">
        {/* Email Icon */}
        <div className="flex justify-center">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Mail className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
        </div>

        {/* Email Address */}
        {email && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">{t('sentTo')}</p>
            <p className="text-base font-semibold text-gray-900">{email}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">{t('checkInbox')}</p>
              <p className="text-green-700">
                {t('clickLink')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-900">
              <p className="font-medium mb-1">{t('cantFind')}</p>
              <p className="text-green-700">
                {t('checkSpam')}
              </p>
            </div>
          </div>
        </div>

        {/* Resend Button */}
        <div className="space-y-3">
          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-sm text-green-700 font-medium">
                ✓ {t('sentSuccess')}
              </p>
            </div>
          )}

          <Button
            onClick={handleResendEmail}
            disabled={isResending || resendSuccess}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('sending')}
              </>
            ) : resendSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('emailSent')}
              </>
            ) : (
              t('resend')
            )}
          </Button>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {t('alreadyVerified')}{" "}
            <Link 
              href="/login" 
              className="font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              {t('signIn')}
            </Link>
          </p>
        </div>

        {/* Help */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            {t('needHelp')}{" "}
            <a 
              href="mailto:support@whahook.com" 
              className="hover:underline"
              style={{ color: primaryColor }}
            >
              {t('contactSupport')}
            </a>
          </p>
        </div>
      </div>
    </AuthCard>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: 'var(--brand-primary, #22c55e)' }}
        />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

