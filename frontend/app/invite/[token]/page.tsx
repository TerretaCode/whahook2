"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  primary_color: string
  agency_name: string
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

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  client: 'Cliente',
  agent: 'Agente',
  viewer: 'Visor (CRM)'
}

export default function AcceptInvitationPage() {
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
          setError(result.error || 'Invalid or expired invitation')
          return
        }

        if (result.data.status === 'active') {
          // Already accepted, redirect to login
          router.push('/login?message=Invitation already accepted. Please login.')
          return
        }

        if (result.data.status === 'expired') {
          setError('This invitation has expired')
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
        setError('Failed to load invitation')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitation()
  }, [token, apiUrl, router])

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
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
          setError('This email already has an account. Please login instead.')
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/login')} variant="outline">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifica tu correo</h1>
          <p className="text-gray-600 mb-4">
            Hemos enviado un enlace de verificación a <strong>{data?.email}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📧 Revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Una vez verificado, podrás iniciar sesión y acceder a <strong>{data?.workspace_name}</strong>.
          </p>
          <Button onClick={() => router.push('/login')} variant="outline">
            Ir al Login
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h1>
          <p className="text-gray-600 mb-4">
            Your account has been created and you now have access to <strong>{data?.workspace_name}</strong>.
          </p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Get branding colors
  const primaryColor = data?.branding?.primary_color || '#22c55e'
  const hasCustomBranding = !!(data?.branding?.logo_url || data?.branding?.agency_name)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Header with Branding */}
        <div className="text-center mb-8">
          {/* Agency Logo or Icon */}
          {data?.branding?.logo_url ? (
            <img 
              src={data.branding.logo_url} 
              alt={data.branding.agency_name || 'Logo'} 
              className="h-12 object-contain mx-auto mb-4"
            />
          ) : (
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Building2 className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Estás invitado!</h1>
          <p className="text-gray-600">
            {data?.inviter_name ? (
              <><strong>{data.inviter_name}</strong> te ha invitado a unirte a</>
            ) : (
              <>Has sido invitado a unirte a</>
            )}
          </p>
          <p className="text-lg font-semibold mt-1" style={{ color: primaryColor }}>
            {data?.workspace_name}
          </p>
          <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
            Rol: {ROLE_LABELS[data?.role || ''] || data?.role}
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
              This is the email you were invited with
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Create Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
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
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta y unirme'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ¿Ya tienes una cuenta?{' '}
            <a href="/login" className="hover:underline font-medium" style={{ color: primaryColor }}>
              Inicia sesión aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
