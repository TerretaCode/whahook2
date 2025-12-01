"use client"

import { useState, useEffect } from 'react'
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
      toast.success('Guardado', 'Branding del workspace actualizado')
      setHasChanges(false)
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudo guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // Enterprise required
  if (!isEnterprise) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Branding del Workspace</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personaliza la marca para este cliente
            </p>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            🔒 El branding personalizado está disponible en el plan Enterprise.
            Actualiza tu plan para personalizar el branding de cada workspace.
          </p>
          <Link href="/settings/billing">
            <Button className="mt-3 bg-purple-600 hover:bg-purple-700">
              <Crown className="w-4 h-4 mr-2" />
              Actualizar a Enterprise
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
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Branding del Workspace</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personaliza la marca para este cliente específico
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
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Opcional:</strong> Si no configuras branding para este workspace, 
              se usará el branding de tu agencia configurado en <Link href="/settings/branding" className="underline font-medium">Settings &gt; Branding</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Usar branding personalizado</span>
            <p className="text-sm text-gray-500">Mostrar la marca del cliente en lugar de tu marca de agencia</p>
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
              <span className="font-medium text-gray-900 dark:text-white">Nombre del cliente</span>
              <p className="text-sm text-gray-500 mb-2">Se mostrará en el widget y paneles</p>
              <Input
                value={settings.client_name || ''}
                onChange={(e) => handleChange('client_name', e.target.value || null)}
                placeholder="Nombre de la empresa del cliente"
              />
            </label>
          </div>

          {/* Client Logo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block">
              <span className="font-medium text-gray-900 dark:text-white">Logo del cliente</span>
              <p className="text-sm text-gray-500 mb-2">URL del logo (recomendado: 200x50px)</p>
              <Input
                value={settings.logo_url || ''}
                onChange={(e) => handleChange('logo_url', e.target.value || null)}
                placeholder="https://cliente.com/logo.png"
              />
            </label>
          </div>

          {/* Client Color */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block">
              <span className="font-medium text-gray-900 dark:text-white">Color principal</span>
              <p className="text-sm text-gray-500 mb-2">Color de la marca del cliente</p>
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
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista previa</h4>
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
                  {settings.client_name || 'Cliente'}
                </span>
              )}
            </div>
            <button
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: settings.primary_color }}
            >
              Botón de ejemplo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
