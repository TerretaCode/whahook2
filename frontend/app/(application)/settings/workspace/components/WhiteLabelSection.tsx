"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Palette, 
  Loader2, 
  Save,
  Image as ImageIcon,
  Globe,
  Eye,
  EyeOff,
  Crown
} from 'lucide-react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'

interface WhiteLabelSettings {
  enabled: boolean
  brand_name: string | null
  brand_logo_url: string | null
  brand_color: string
  widget_footer_text: string | null
  widget_footer_url: string | null
  hide_whahook_branding: boolean
  show_ai_costs_to_client: boolean
}

interface WhiteLabelSectionProps {
  workspaceId: string
  initialSettings?: WhiteLabelSettings
  userPlan: string
}

export function WhiteLabelSection({ workspaceId, initialSettings, userPlan }: WhiteLabelSectionProps) {
  const [settings, setSettings] = useState<WhiteLabelSettings>(initialSettings || {
    enabled: false,
    brand_name: null,
    brand_logo_url: null,
    brand_color: '#10b981',
    widget_footer_text: null,
    widget_footer_url: null,
    hide_whahook_branding: false,
    show_ai_costs_to_client: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const isEnterprise = userPlan === 'enterprise'
  const isProfessionalOrHigher = ['professional', 'enterprise'].includes(userPlan)

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings)
    }
  }, [initialSettings])

  const handleChange = (key: keyof WhiteLabelSettings, value: any) => {
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
      toast.success('Saved!', 'White-label settings updated')
      setHasChanges(false)
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isProfessionalOrHigher) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">White-Label Branding</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize branding for your clients
            </p>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            🔒 White-label branding is available on Professional and Enterprise plans.
            Upgrade to customize your workspace branding.
          </p>
          <Button className="mt-3 bg-purple-600 hover:bg-purple-700">
            Upgrade Plan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">White-Label Branding</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize how your workspace appears to clients
            </p>
          </div>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Enable Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Enable White-Label</span>
            <p className="text-sm text-gray-500">Apply custom branding to client-facing pages</p>
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
          {/* Brand Name */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block">
              <span className="font-medium text-gray-900 dark:text-white">Brand Name</span>
              <p className="text-sm text-gray-500 mb-2">Displayed instead of "Whahook"</p>
              <Input
                value={settings.brand_name || ''}
                onChange={(e) => handleChange('brand_name', e.target.value || null)}
                placeholder="Your Agency Name"
              />
            </label>
          </div>

          {/* Brand Logo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white">Brand Logo URL</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">URL to your logo image (recommended: 200x50px)</p>
              <Input
                value={settings.brand_logo_url || ''}
                onChange={(e) => handleChange('brand_logo_url', e.target.value || null)}
                placeholder="https://example.com/logo.png"
              />
            </label>
          </div>

          {/* Brand Color */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white">Brand Color</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">Primary color for buttons and accents</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.brand_color}
                  onChange={(e) => handleChange('brand_color', e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={settings.brand_color}
                  onChange={(e) => handleChange('brand_color', e.target.value)}
                  placeholder="#10b981"
                  className="flex-1"
                />
              </div>
            </label>
          </div>

          {/* Widget Footer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">Widget Footer</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">Customize the "Powered by" text in chat widgets</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={settings.widget_footer_text || ''}
                onChange={(e) => handleChange('widget_footer_text', e.target.value || null)}
                placeholder="Powered by Your Agency"
              />
              <Input
                value={settings.widget_footer_url || ''}
                onChange={(e) => handleChange('widget_footer_url', e.target.value || null)}
                placeholder="https://youragency.com"
              />
            </div>
          </div>

          {/* Hide Whahook Branding (Enterprise only) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                {isEnterprise ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Crown className="w-5 h-5 text-purple-500" />
                )}
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Hide Whahook Branding
                  </span>
                  <p className="text-sm text-gray-500">
                    {isEnterprise 
                      ? 'Completely remove Whahook branding from client pages'
                      : 'Enterprise plan required'
                    }
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.hide_whahook_branding}
                onChange={(e) => handleChange('hide_whahook_branding', e.target.checked)}
                disabled={!isEnterprise}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 disabled:opacity-50"
              />
            </label>
          </div>

          {/* Show AI Costs to Client */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Show AI Costs to Client
                  </span>
                  <p className="text-sm text-gray-500">
                    Allow clients to see their AI usage and costs
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.show_ai_costs_to_client}
                onChange={(e) => handleChange('show_ai_costs_to_client', e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* Preview */}
      {settings.enabled && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</h4>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              {settings.brand_logo_url ? (
                <img 
                  src={settings.brand_logo_url} 
                  alt="Logo" 
                  className="h-8 object-contain"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : (
                <span 
                  className="text-xl font-bold"
                  style={{ color: settings.brand_color }}
                >
                  {settings.brand_name || 'Your Brand'}
                </span>
              )}
            </div>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: settings.brand_color }}
            >
              Sample Button
            </button>
            {!settings.hide_whahook_branding && (
              <p className="text-xs text-gray-400 mt-4">
                {settings.widget_footer_text || 'Powered by Whahook'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
