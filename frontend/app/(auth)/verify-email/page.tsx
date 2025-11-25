"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { AuthCard } from "../components/AuthCard"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

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
      title="Verify Your Email"
      description="We've sent a verification link to your email"
    >
      <div className="space-y-6">
        {/* Email Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-green-600" />
          </div>
        </div>

        {/* Email Address */}
        {email && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Verification email sent to:</p>
            <p className="text-base font-semibold text-gray-900">{email}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Check your inbox</p>
              <p className="text-blue-700">
                Click the verification link in the email we sent you to activate your account.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Can&apos;t find the email?</p>
              <p className="text-blue-700">
                Check your spam or junk folder. The email should arrive within a few minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Resend Button */}
        <div className="space-y-3">
          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-sm text-green-700 font-medium">
                ✓ Verification email sent successfully!
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
                Sending...
              </>
            ) : resendSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Email Sent!
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already verified?{" "}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Help */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Need help?{" "}
            <a href="mailto:support@whahook.com" className="text-green-600 hover:text-green-700">
              Contact support
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
