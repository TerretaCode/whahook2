"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/toast"
import {
  Loader2,
  Save,
  Mail,
  User,
  Bell,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

interface ClientNotifications {
  whatsapp_connected: boolean
  whatsapp_disconnected: boolean
  daily_summary: boolean
}

interface ClientConfig {
  client_email: string | null
  client_name: string | null
  client_notifications: ClientNotifications
}

interface Props {
  workspaceId: string
}

const DEFAULT_NOTIFICATIONS: ClientNotifications = {
  whatsapp_connected: true,
  whatsapp_disconnected: true,
  daily_summary: false
}

export function ClientNotificationsSection({ workspaceId }: Props) {
  const [config, setConfig] = useState<ClientConfig>({
    client_email: null,
    client_name: null,
    client_notifications: DEFAULT_NOTIFICATIONS
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [workspaceId])

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      const response = await ApiClient.get<ClientConfig>(`/api/workspaces/${workspaceId}/client`)
      if (response.success && response.data) {
        setConfig({
          client_email: response.data.client_email || null,
          client_name: response.data.client_name || null,
          client_notifications: response.data.client_notifications || DEFAULT_NOTIFICATIONS
        })
      }
    } catch (error) {
      console.error('Error loading client config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate email if provided
    if (config.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.client_email)) {
      toast.error('Email inválido', 'Introduce un email válido')
      return
    }

    try {
      setIsSaving(true)
      const response = await ApiClient.put(`/api/workspaces/${workspaceId}/client`, config)
      if (response.success) {
        toast.success('Guardado', 'Configuración del cliente guardada')
      }
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudo guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleNotification = (key: keyof ClientNotifications) => {
    setConfig(prev => ({
      ...prev,
      client_notifications: {
        ...prev.client_notifications,
        [key]: !prev.client_notifications[key]
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notificaciones al Cliente</h3>
          <p className="text-sm text-gray-600">
            Configura el email del cliente para que reciba notificaciones de este workspace
          </p>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="client_name" className="mb-2 block">
              Nombre del cliente
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="client_name"
                value={config.client_name || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, client_name: e.target.value || null }))}
                placeholder="Nombre del cliente"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se usará para personalizar las notificaciones
            </p>
          </div>
          <div>
            <Label htmlFor="client_email" className="mb-2 block">
              Email del cliente
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="client_email"
                type="email"
                value={config.client_email || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, client_email: e.target.value || null }))}
                placeholder="cliente@ejemplo.com"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recibirá las notificaciones seleccionadas abajo
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      {config.client_email && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Notificaciones que recibirá el cliente</h4>
          </div>

          <div className="space-y-3">
            {/* WhatsApp Connected */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">WhatsApp conectado</p>
                  <p className="text-sm text-gray-500">Cuando el WhatsApp se conecta exitosamente</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.client_notifications.whatsapp_connected}
                  onChange={() => toggleNotification('whatsapp_connected')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* WhatsApp Disconnected */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900">WhatsApp desconectado</p>
                  <p className="text-sm text-gray-500">Cuando el WhatsApp se desconecta o hay problemas</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.client_notifications.whatsapp_disconnected}
                  onChange={() => toggleNotification('whatsapp_disconnected')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Daily Summary - Future feature */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Resumen diario</p>
                  <p className="text-sm text-gray-500">Resumen de actividad del día anterior</p>
                </div>
              </div>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Próximamente</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Para qué sirve esto?</p>
            <p>
              Si gestionas workspaces para clientes, puedes configurar su email para que reciban 
              notificaciones importantes directamente. Tú (el owner) siempre recibirás todas las 
              notificaciones, pero el cliente solo recibirá las que actives aquí.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
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
              Guardar configuración
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
