"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Eye,
  EyeOff,
  Building2,
  Lock
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface AgencyBranding {
  logo_url: string | null
  logo_text: string
  primary_color: string
  agency_name: string
}

// Generate lighter version of brand color for gradient background
function getBrandGradient(primaryColor: string): string {
  const hex = primaryColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // Create very light tint (92% white)
  const lightR = Math.round(r + (255 - r) * 0.92)
  const lightG = Math.round(g + (255 - g) * 0.92)
  const lightB = Math.round(b + (255 - b) * 0.92)
  return `linear-gradient(to bottom right, rgb(${lightR}, ${lightG}, ${lightB}), white, rgb(249, 250, 251))`
}

interface InvitationData {
  member_id: string
  workspace_id: string
  workspace_name: string
  workspace_logo?: string
  email: string
  role: string
  inviter_name?: string
  status: 'pending' | 'active' | 'expired'
  branding?: AgencyBranding
}

export default function AcceptInvitationPage() {
  const t = useTranslations('invite')
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string | undefined
  
  const [data, setData] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    if (!token) return

    async function fetchInvitation() {
      try {
        const response = await fetch(`${apiUrl}/api/invitations/${token}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          setError(result.error || t('invalidInvitation'))
          return
        }

        if (result.data.status === 'active') {
          // Already accepted, redirect to login
          router.push('/login?message=Invitation already accepted. Please login.')
          return
        }

        if (result.data.status === 'expired') {
          setError(t('expiredInvitation'))
          return
        }

        // Fetch branding for this workspace
        try {
          const brandingResponse = await fetch(`${apiUrl}/api/workspaces/${result.data.workspace_id}/branding`)
          const brandingResult = await brandingResponse.json()
          if (brandingResult.success && brandingResult.data) {
            result.data.branding = brandingResult.data
          }
        } catch {
          // Ignore branding errors, use default
        }

        setData(result.data)
      } catch {
        setError(t('loadError'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitation()
  }, [token, apiUrl, router])

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      setError(t('passwordMinLength'))
      return
    }
    
    if (password !== confirmPassword) {
      setError(t('passwordsNoMatch'))
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // 1. Create user in Supabase Auth
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data!.email,
        password,
        options: {
          data: {
            invited_to_workspace: data!.workspace_id
          }
        }
      })

      if (authError) {
        // Check if user already exists
        if (authError.message.includes('already registered')) {
          setError(t('emailExists'))
          return
        }
        throw authError
      }

      if (!authData.user) {
        throw new Error('Failed to create account')
      }

      // 2. Accept the invitation (link user_id to workspace_member)
      const response = await fetch(`${apiUrl}/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: authData.user.id
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to accept invitation')
      }

      // Check if email confirmation is required
      if (authData.user && !authData.session) {
        // User created but no session = needs email verification
        setNeedsVerification(true)
      } else {
        setSuccess(true)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login?message=Account created! Please login to continue.')
        }, 2000)
      }

    } catch (err: any) {
      console.error('Error creating account:', err)
      setError(err.message || 'Failed to create account')
    } finally {
      setIsCreating(false)
    }
  }

  // Get branding colors (available even during loading for consistent styling)
  const primaryColor = data?.branding?.primary_color || '#22c55e'
  const backgroundGradient = getBrandGradient(primaryColor)

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: backgroundGradient }}
      >
        <Card className="w-full max-w-md p-8 shadow-xl text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" style={{ color: primaryColor }} />
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </Card>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: backgroundGradient }}
      >
        <Card className="w-full max-w-md p-8 shadow-xl text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('invalidTitle')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/login')} variant="outline">
            {t('goToLogin')}
          </Button>
        </Card>
      </div>
    )
  }

  if (needsVerification) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: backgroundGradient }}
      >
        <Card className="w-full max-w-md p-8 shadow-xl text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('verifyEmail')}</h1>
          <p className="text-gray-600 mb-4">
            {t('verificationSent')} <strong>{data?.email}</strong>
          </p>
          <div 
            className="rounded-lg p-4 mb-6"
            style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30`, borderWidth: 1 }}
          >
            <p className="text-sm" style={{ color: primaryColor }}>
              📧 {t('checkInbox')}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {t('onceVerified')} <strong>{data?.workspace_name}</strong>.
          </p>
          <Button onClick={() => router.push('/login')} variant="outline">
            {t('goToLogin')}
          </Button>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: backgroundGradient }}
      >
        <Card className="w-full max-w-md p-8 shadow-xl text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: primaryColor }} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('accountCreated')}</h1>
          <p className="text-gray-600 mb-4">
            {t('accountCreatedDesc')} <strong>{data?.workspace_name}</strong>.
          </p>
          <p className="text-sm text-gray-500">{t('redirecting')}</p>
        </Card>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: backgroundGradient }}
    >
      <Card className="w-full max-w-md p-8 shadow-xl">
        {/* Header with Branding */}
        <div className="text-center mb-8">
          {/* Agency Logo - only image if exists, otherwise icon + text */}
          {data?.branding?.logo_url ? (
            <div className="flex items-center justify-center mb-4">
              <img 
                src={data.branding.logo_url} 
                alt={data.branding.agency_name || 'Logo'} 
                className="h-12 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Building2 className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              {data?.branding?.logo_text && (
                <span 
                  className="text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {data.branding.logo_text}
                </span>
              )}
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('youAreInvited')}</h1>
          <p className="text-gray-600">
            {data?.inviter_name ? (
              <>{t('invitedBy', { name: data.inviter_name })}</>
            ) : (
              <>{t('invitedToJoin')}</>
            )}
          </p>
          <p className="text-lg font-semibold mt-1" style={{ color: primaryColor }}>
            {data?.workspace_name}
          </p>
          <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
            {t('role')}: {t(`roles.${data?.role}`) || data?.role}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={data?.email || ''}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('emailNote')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('createPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPlaceholder')}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isCreating || !password || !confirmPassword}
            className="w-full text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('creating')}
              </>
            ) : (
              t('createAndJoin')
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {t('alreadyHaveAccount')}{' '}
            <a href="/login" className="hover:underline font-medium" style={{ color: primaryColor }}>
              {t('loginHere')}
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
