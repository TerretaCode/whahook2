"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/toast"
import {
  Palette,
  Loader2,
  Upload,
  Save,
  Crown,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface AgencyBranding {
  logo_url: string | null
  logo_text: string           // Texto opcional al lado del logo
  primary_color: string       // Color de marca (botones, iconos, acentos)
  agency_name: string
  agency_slug: string         // URL slug para el portal de la agencia (ej: miagencia)
  powered_by_text: string
  show_powered_by: boolean
}

const DEFAULT_BRANDING: AgencyBranding = {
  logo_url: null,
  logo_text: '',
  primary_color: '#22c55e',
  agency_name: '',
  agency_slug: '',
  powered_by_text: '',
  show_powered_by: true
}

export default function AgencyBrandingPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  
  const [branding, setBranding] = useState<AgencyBranding>(DEFAULT_BRANDING)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const isEnterprise = user?.profile?.subscription_tier === 'enterprise'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadBranding()
    }
  }, [user])

  const loadBranding = async () => {
    try {
      setIsLoading(true)
      const response = await ApiClient.get<AgencyBranding>('/api/branding')
      if (response.success && response.data) {
        setBranding({ ...DEFAULT_BRANDING, ...response.data })
      }
    } catch (error) {
      console.error('Error loading branding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!isEnterprise) {
      toast.error('Plan Enterprise requerido', 'Actualiza tu plan para usar branding personalizado')
      return
    }

    try {
      setIsSaving(true)
      const response = await ApiClient.put('/api/branding', branding)
      if (response.success) {
        toast.success('Guardado', 'Branding actualizado correctamente')
      }
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudo guardar el branding')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isEnterprise) {
      toast.error('Plan Enterprise requerido', 'Actualiza tu plan para subir logos')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('logo', file)

      const response = await ApiClient.upload<{ url: string }>('/api/branding/logo', formData)

      if (response.success && response.data?.url) {
        setBranding(prev => ({
          ...prev,
          logo_url: response.data!.url
        }))
        toast.success('Logo subido', 'El logo se ha subido correctamente')
        // Auto-save after upload
        await handleSave()
      }
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudo subir el logo')
    } finally {
      setIsUploading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Palette className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branding de Agencia</h1>
            <p className="text-gray-600">
              Personaliza la apariencia de tu cuenta y widgets
            </p>
          </div>
        </div>
        {isEnterprise && (
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        )}
      </div>

      {/* Enterprise Required Banner */}
      {!isEnterprise && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-1">
                Plan Enterprise requerido
              </h3>
              <p className="text-purple-700 mb-4">
                El branding personalizado está disponible exclusivamente para el plan Enterprise.
                Personaliza tu logo, colores y elimina la marca "Powered by Whahook".
              </p>
              <Link href="/settings/billing">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Actualizar a Enterprise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Branding Form */}
      <div className={`space-y-6 ${!isEnterprise ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Logo Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo</h2>
          <div>
            <Label className="mb-2 block">Logo de la agencia</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors max-w-md">
              {branding.logo_url ? (
                <div className="space-y-3">
                  <img 
                    src={branding.logo_url} 
                    alt="Logo" 
                    className="max-h-16 mx-auto"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBranding(prev => ({ ...prev, logo_url: null }))}
                  >
                    Eliminar
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Haz clic para subir</p>
                  <p className="text-xs text-gray-400">PNG, JPG o SVG (max 2MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Logo Text */}
          <div className="mt-4">
            <Label htmlFor="logo_text" className="mb-2 block">
              Texto del logo <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="logo_text"
              value={branding.logo_text}
              onChange={(e) => setBranding(prev => ({ ...prev, logo_text: e.target.value }))}
              placeholder="Mi Agencia"
              className="max-w-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se mostrará al lado del logo. Déjalo vacío si tu logo ya incluye el nombre.
            </p>
          </div>
        </div>

        {/* Colors Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Color de marca</h2>
          <div>
            <Label htmlFor="primary_color" className="mb-2 block">Color principal</Label>
            <div className="flex gap-3 max-w-md">
              <input
                type="color"
                id="primary_color"
                value={branding.primary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <Input
                value={branding.primary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                placeholder="#22c55e"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Este color se aplicará a botones, iconos y elementos de acento en la aplicación.
              Los textos mantienen colores neutros para garantizar la legibilidad.
            </p>
          </div>
        </div>

        {/* Agency Info Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Agencia</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agency_name" className="mb-2 block">Nombre de la agencia</Label>
              <Input
                id="agency_name"
                value={branding.agency_name}
                onChange={(e) => setBranding(prev => ({ ...prev, agency_name: e.target.value }))}
                placeholder="Mi Agencia Digital"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se mostrará en lugar de "Whahook" en los widgets
              </p>
            </div>
          </div>
        </div>

        {/* Agency Portal URL Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portal de Acceso</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agency_slug" className="mb-2 block">URL del portal</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://app.whahook.com'}/a/
                </span>
                <Input
                  id="agency_slug"
                  value={branding.agency_slug}
                  onChange={(e) => setBranding(prev => ({ 
                    ...prev, 
                    agency_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                  }))}
                  placeholder="miagencia"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Este será el enlace que usarán tus clientes para acceder al panel con tu branding.
                Solo letras minúsculas, números y guiones.
              </p>
              {branding.agency_slug && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Tu portal:</span>{' '}
                    <code className="bg-green-100 px-2 py-0.5 rounded">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://app.whahook.com'}/a/{branding.agency_slug}
                    </code>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Los usuarios invitados accederán aquí para login (sin opción de registro)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Powered By Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Badge "Powered by"</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Mostrar badge "Powered by"</Label>
                <p className="text-sm text-gray-500">
                  Muestra un pequeño badge en la parte inferior del widget
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding.show_powered_by}
                  onChange={(e) => setBranding(prev => ({ ...prev, show_powered_by: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {branding.show_powered_by && (
              <div>
                <Label htmlFor="powered_by_text" className="mb-2 block">Texto personalizado</Label>
                <Input
                  id="powered_by_text"
                  value={branding.powered_by_text}
                  onChange={(e) => setBranding(prev => ({ ...prev, powered_by_text: e.target.value }))}
                  placeholder="Powered by Mi Agencia"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deja vacío para ocultar completamente el badge
                </p>
              </div>
            )}
          </div>
        </div>

        </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Sobre el branding</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Este branding se aplica a todos tus workspaces por defecto</li>
              <li>• Puedes personalizar el branding de cada workspace individualmente</li>
              <li>• Si un workspace no tiene branding propio, usará este branding de agencia</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
