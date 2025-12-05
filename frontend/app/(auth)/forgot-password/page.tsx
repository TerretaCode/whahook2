"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthCard } from "../components/AuthCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import { toast } from "@/lib/toast"
import { ApiClient } from "@/lib/api-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")

  const validateEmail = (email: string) => {
    if (!email) {
      return "Email is required"
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address"
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
        toast.error("Error", response.error || "Failed to send reset email")
        setError(response.error || "Failed to send reset email")
        return
      }

      // Success - show confirmation
      setEmailSent(true)
      toast.success("Email Sent!", "Check your inbox for password reset instructions")

    } catch {
      toast.error("Error", "Something went wrong. Please try again.")
      setError("Something went wrong. Please try again.")
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
        title="Check Your Email"
        description="We've sent you password reset instructions"
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
              We've sent a password reset link to:
            </p>
            <p className="font-medium text-gray-900">{email}</p>
            <p className="text-sm text-gray-600">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
          </div>

          {/* Didn't receive email */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive the email?
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false)
                setEmail("")
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </div>

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </AuthCard>
    )
  }

  // Form state - request reset
  return (
    <AuthCard
      title="Forgot Password?"
      description="Enter your email and we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
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
            <strong>Note:</strong> If an account exists with this email, you'll receive password reset instructions. For security reasons, we don't reveal whether an account exists.
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
              Sending Email...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </form>
    </AuthCard>
  )
}

