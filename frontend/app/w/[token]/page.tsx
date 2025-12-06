"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { 
  Loader2, 
  XCircle,
  LayoutDashboard,
  MessageSquare,
  Users,
  Megaphone,
  DollarSign
} from 'lucide-react'

interface WorkspaceAccess {
  member_id: string
  workspace_id: string
  workspace: {
    id: string
    name: string
    logo_url?: string
    white_label?: {
      enabled: boolean
      brand_name?: string
      brand_logo_url?: string
      brand_color?: string
      hide_whahook_branding?: boolean
    }
  }
  role: string
  permissions: {
    dashboard?: boolean
    messages?: boolean
    clients?: boolean
    campaigns?: boolean
    settings?: boolean
    ai_costs?: boolean
  }
}

export default function WorkspaceAccessPage() {
  const t = useTranslations('workspaceAccess')
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [data, setData] = useState<WorkspaceAccess | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/workspaces/access/${token}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || t('invalidLink'))
          return
        }

        setData(result.data)
        
        // Store access token in localStorage for API calls
        localStorage.setItem('workspace_access_token', token)
        localStorage.setItem('workspace_id', result.data.workspace_id)
        localStorage.setItem('workspace_role', result.data.role)
        localStorage.setItem('workspace_permissions', JSON.stringify(result.data.permissions))
        
      } catch {
        setError(t('verifyError'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccess()
  }, [token, apiUrl])

  // Get branding
  const whiteLabel = data?.workspace?.white_label
  const brandName = whiteLabel?.brand_name || data?.workspace?.name || 'Dashboard'
  const brandLogo = whiteLabel?.brand_logo_url || data?.workspace?.logo_url
  const brandColor = whiteLabel?.brand_color || '#10b981'
  const hideWhahook = whiteLabel?.hide_whahook_branding

  // Navigation items based on permissions
  const navItems = [
    { 
      key: 'dashboard', 
      label: t('nav.dashboard'), 
      icon: LayoutDashboard, 
      href: `/w/${token}/dashboard`,
      enabled: data?.permissions?.dashboard 
    },
    { 
      key: 'messages', 
      label: t('nav.messages'), 
      icon: MessageSquare, 
      href: `/w/${token}/messages`,
      enabled: data?.permissions?.messages 
    },
    { 
      key: 'clients', 
      label: t('nav.clients'), 
      icon: Users, 
      href: `/w/${token}/clients`,
      enabled: data?.permissions?.clients 
    },
    { 
      key: 'campaigns', 
      label: t('nav.campaigns'), 
      icon: Megaphone, 
      href: `/w/${token}/campaigns`,
      enabled: data?.permissions?.campaigns 
    },
    { 
      key: 'ai_costs', 
      label: t('nav.aiCosts'), 
      icon: DollarSign, 
      href: `/w/${token}/ai-costs`,
      enabled: data?.permissions?.ai_costs 
    },
  ].filter(item => item.enabled)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            {t('contactAdmin')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {brandLogo ? (
                <Image 
                  src={brandLogo} 
                  alt={brandName} 
                  width={120} 
                  height={32} 
                  className="object-contain"
                />
              ) : (
                <h1 className="text-xl font-bold" style={{ color: brandColor }}>
                  {brandName}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {data?.role === 'client' ? t('clientAccess') : data?.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('welcomeTo', { name: data?.workspace?.name || '' })}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('selectSection')}
          </p>
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <item.icon 
                  className="w-6 h-6 transition-colors" 
                  style={{ color: brandColor }}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                {item.label}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {item.key === 'dashboard' && t('desc.dashboard')}
                {item.key === 'messages' && t('desc.messages')}
                {item.key === 'clients' && t('desc.clients')}
                {item.key === 'campaigns' && t('desc.campaigns')}
                {item.key === 'ai_costs' && t('desc.aiCosts')}
              </p>
            </button>
          ))}
        </div>

        {navItems.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-600">
              {t('noSections')}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      {!hideWhahook && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
          <p className="text-xs text-gray-400 text-center">
            Powered by Whahook
          </p>
        </footer>
      )}
    </div>
  )
}
