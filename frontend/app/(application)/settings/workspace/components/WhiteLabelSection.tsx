"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Palette, 
  Loader2, 
  Save,
  Upload,
  Crown,
  AlertCircle,
  Eye
} from 'lucide-react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'
import Link from 'next/link'

interface WorkspaceBranding {
  enabled: boolean
  logo_url: string | null
  primary_color: string
  client_name: string | null
}

interface WhiteLabelSectionProps {
  workspaceId: string
  initialSettings?: WorkspaceBranding
  userPlan: string
}

const DEFAULT_SETTINGS: WorkspaceBranding = {
  enabled: false,
  logo_url: null,
  primary_color: '#22c55e',
  client_name: null
}

export function WhiteLabelSection({ workspaceId, initialSettings, userPlan }: WhiteLabelSectionProps) {
  const t = useTranslations('settings.workspaceWhiteLabel')
  const tCommon = useTranslations('common')
  const [settings, setSettings] = useState<WorkspaceBranding>(initialSettings || DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const isEnterprise = userPlan === 'enterprise'

  useEffect(() => {
    if (initialSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...initialSettings })
    }
  }, [initialSettings])

  const handleChange = (key: keyof WorkspaceBranding, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await ApiClient.request(
        `/api/workspaces/${workspaceId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ white_label: settings })
        }
      )
      toast.success(t('saved'), t('brandingUpdated'))
      setHasChanges(false)
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  // Enterprise required
  if (!isEnterprise) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Crown className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            🔒 {t('enterpriseRequired')}
          </p>
          <Link href="/settings/billing">
            <Button className="mt-3 bg-green-600 hover:bg-green-700 text-white">
              <Crown className="w-4 h-4 mr-2" />
              {t('upgradeToEnterprise')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Palette className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('subtitleEnterprise')}
            </p>
          </div>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {tCommon('loading')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {tCommon('save')}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm text-green-800">
              <strong>{t('optional')}:</strong> {t('optionalDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{t('useCustomBranding')}</span>
            <p className="text-sm text-gray-500">{t('useCustomBrandingDesc')}</p>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
        </label>
      </div>

      {settings.enabled && (
        <div className="space-y-4">
          {/* Client Name */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block">
              <span className="font-medium text-gray-900 dark:text-white">{t('clientName')}</span>
              <p className="text-sm text-gray-500 mb-2">{t('clientNameDesc')}</p>
              <Input
                value={settings.client_name || ''}
                onChange={(e) => handleChange('client_name', e.target.value || null)}
                placeholder={t('clientNamePlaceholder')}
              />
            </label>
          </div>

          {/* Client Logo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block">
              <span className="font-medium text-gray-900 dark:text-white">{t('clientLogo')}</span>
              <p className="text-sm text-gray-500 mb-2">{t('clientLogoDesc')}</p>
              <Input
                value={settings.logo_url || ''}
                onChange={(e) => handleChange('logo_url', e.target.value || null)}
                placeholder={t('clientLogoPlaceholder')}
              />
            </label>
          </div>

          {/* Client Color */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block">
              <span className="font-medium text-gray-900 dark:text-white">{t('primaryColor')}</span>
              <p className="text-sm text-gray-500 mb-2">{t('primaryColorDesc')}</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  placeholder="#22c55e"
                  className="flex-1"
                />
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Preview */}
      {settings.enabled && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-gray-600" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('preview')}</h4>
          </div>
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
            style={{ borderTop: `4px solid ${settings.primary_color}` }}
          >
            <div className="flex items-center gap-3 mb-4">
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="h-8 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <span 
                  className="text-xl font-bold"
                  style={{ color: settings.primary_color }}
                >
                  {settings.client_name || t('client')}
                </span>
              )}
            </div>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: settings.primary_color }}
            >
              {t('exampleButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

