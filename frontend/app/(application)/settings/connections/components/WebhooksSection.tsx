"use client"

import { Webhook, Clock } from "lucide-react"

interface WebhooksSectionProps {
  workspaceId?: string
}

export function WebhooksSection({ workspaceId }: WebhooksSectionProps) {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 p-12">
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            Coming Soon
          </span>
        </div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-6">
            <Webhook className="w-8 h-8 text-gray-400" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Webhooks
          </h3>
          
          <p className="text-gray-600 max-w-md mb-6">
            Recibe notificaciones en tiempo real cuando ocurran eventos en tu cuenta. 
            Integra WhatsApp con tus sistemas externos de forma automática.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900">Mensajes</p>
              <p className="text-xs text-gray-500 mt-1">Recibidos, enviados, leídos</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900">Sesiones</p>
              <p className="text-xs text-gray-500 mt-1">Conexión, desconexión, QR</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900">Contactos</p>
              <p className="text-xs text-gray-500 mt-1">Nuevos, actualizados</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            Estamos trabajando en esta funcionalidad. ¡Pronto estará disponible!
          </p>
        </div>
      </div>
    </div>
  )
}
