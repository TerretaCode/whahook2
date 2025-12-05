"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthCard } from "../components/AuthCard"
import { Eye, EyeOff, Lock, Loader2, CheckCircle } from "lucide-react"
import { toast } from "@/lib/toast"
import { ApiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/AuthContext"

function ChangePasswordContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Check if this is password reset (from forgot-password) or first login
  // Supabase sends the reset link with hash params, so we check if user is NOT logged in
  // If not logged in but on this page, it means they came from forgot-password email
  const isPasswordReset = !user
  const isFirstLogin = user?.profile?.metadata?.requires_password_change === true
  const requiresCurrentPassword = !isPasswordReset && !isFirstLogin

  // Capture reset token from URL hash (Supabase sends it as #access_token=xxx)
  useEffect(() => {
    if (isPasswordReset && typeof window !== 'undefined') {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      const token = params.get('access_token')
      
      if (token) {
        setResetToken(token)
      }
    }
  }, [isPasswordReset])

  useEffect(() => {
    // Calculate password strength
    const password = formData.newPassword
    let strength = 0
    
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    
    setPasswordStrength(strength)
  }, [formData.newPassword])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (requiresCurrentPassword && !formData.currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain uppercase, lowercase, and number"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (formData.currentPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password"
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
      if (isPasswordReset) {
        // Check if we have the reset token
        if (!resetToken) {
          toast.error("Error", "Reset token not found. Please request a new password reset link.")
          return
        }

        // Use backend API for password reset (from forgot-password)
        const response = await ApiClient.request('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resetToken}`
          },
          body: JSON.stringify({
            newPassword: formData.newPassword
          })
        })

        if (!response.success) {
          toast.error("Error", response.error || "Failed to reset password")
          return
        }

        toast.success("Success!", "Password reset successfully. Please log in.")
        
        // Redirect to login
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        // Use backend API for normal password change
        const response = await ApiClient.post('/api/users/change-password', {
          body: JSON.stringify({
            current_password: formData.currentPassword,
            new_password: formData.newPassword,
          }),
        })

        if (!response.success) {
          toast.error("Error", response.error || "Failed to change password")
          return
        }

        toast.success("Success!", "Password changed successfully")
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }

    } catch {
      toast.error("Error", "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak'
    if (passwordStrength <= 3) return 'Medium'
    return 'Strong'
  }

  return (
    <AuthCard
      title={isPasswordReset ? "Reset Your Password" : isFirstLogin ? "Set Your Password" : "Change Password"}
      description={isPasswordReset ? "Enter your new password" : isFirstLogin ? "Please set a new password for your account" : "Update your account password"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Login Warning */}
        {isFirstLogin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Password Change Required</p>
                <p>
                  For security reasons, you must change your password before continuing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Password (only if not password reset or first login) */}
        {requiresCurrentPassword && (
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className={`pl-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>
        )}

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="newPassword"
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className={`pl-10 ${errors.newPassword ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
          )}

          {/* Password Strength */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Password Strength:</span>
                <span className={`text-xs font-medium ${
                  passwordStrength <= 1 ? 'text-red-600' : 
                  passwordStrength <= 3 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Password Requirements */}
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-600">Password must contain:</p>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className={`w-3 h-3 ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-300'}`} />
              <span className={formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-300'}`} />
              <span className={/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className={`w-3 h-3 ${/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-300'}`} />
              <span className={/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className={`w-3 h-3 ${/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-300'}`} />
              <span className={/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}>
                One number
              </span>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Changing Password...
            </>
          ) : (
            "Change Password"
          )}
        </Button>

        {/* Cancel (if not first login) */}
        {!isFirstLogin && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Cancel
          </Button>
        )}
      </form>
    </AuthCard>
  )
}

export default function ChangePasswordPage() {
  return <ChangePasswordContent />
}

