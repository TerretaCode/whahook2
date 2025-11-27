"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Save,
  Loader2,
  Bot,
  MessageSquare,
  Users,
  ShoppingBag,
  Mail
} from "lucide-react"

interface EcommerceConnection {
  id: string
  platform: string
  store_name: string
}

interface WebChatbotFormData {
  assistant_name: string
  system_prompt: string
  greeting_message: string
  fallback_message: string
  collect_visitor_data: boolean
  collect_name: boolean
  collect_email: boolean
  collect_phone: boolean
  collect_data_timing: 'before_chat' | 'during_chat' | 'end_of_chat'
  human_handoff_email: string
  ecommerce_connection_id: string
}

interface WebChatbotConfigFormProps {
  formData: WebChatbotFormData
  onFormDataChange: (data: WebChatbotFormData) => void
  onSave: () => void
  isLoading: boolean
  ecommerceConnections: EcommerceConnection[]
}

export function WebChatbotConfigForm({
  formData,
  onFormDataChange,
  onSave,
  isLoading,
  ecommerceConnections
}: WebChatbotConfigFormProps) {
  const [activeSection, setActiveSection] = useState<string>('assistant')

  const updateField = (field: keyof WebChatbotFormData, value: WebChatbotFormData[keyof WebChatbotFormData]) => {
    onFormDataChange({ ...formData, [field]: value })
  }

  const sections = [
    { id: 'assistant', label: 'Asistente', icon: Bot },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'visitor', label: 'Visitantes', icon: Users },
    { id: 'ecommerce', label: 'Tienda', icon: ShoppingBag },
  ]

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Assistant Section */}
      {activeSection === 'assistant' && (
        <div className="space-y-4">
          <div>
            <Label>Nombre del Asistente</Label>
            <Input
              value={formData.assistant_name}
              onChange={(e) => updateField('assistant_name', e.target.value)}
              placeholder="Ej: Ana, Soporte, Asistente..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Este nombre se usará cuando la IA se presente
            </p>
          </div>

          <div>
            <Label>Prompt del Sistema</Label>
            <Textarea
              value={formData.system_prompt}
              onChange={(e) => updateField('system_prompt', e.target.value)}
              placeholder="Eres un asistente virtual amable y profesional para [nombre de tu empresa]. Tu objetivo es ayudar a los visitantes con sus consultas sobre productos, servicios y soporte..."
              rows={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Instrucciones que definen el comportamiento y personalidad de la IA
            </p>
          </div>
        </div>
      )}

      {/* Messages Section */}
      {activeSection === 'messages' && (
        <div className="space-y-4">
          <div>
            <Label>Mensaje de Bienvenida</Label>
            <Textarea
              value={formData.greeting_message}
              onChange={(e) => updateField('greeting_message', e.target.value)}
              placeholder="¡Hola! 👋 Soy [nombre], tu asistente virtual. ¿En qué puedo ayudarte hoy?"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Primer mensaje que verá el visitante al abrir el chat
            </p>
          </div>

          <div>
            <Label>Mensaje de Error</Label>
            <Textarea
              value={formData.fallback_message}
              onChange={(e) => updateField('fallback_message', e.target.value)}
              placeholder="Lo siento, no he podido entender tu mensaje. ¿Podrías reformularlo?"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mensaje cuando la IA no puede procesar la consulta
            </p>
          </div>

          <div>
            <Label>Email para Transferencia a Humano</Label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <Input
                type="email"
                value={formData.human_handoff_email}
                onChange={(e) => updateField('human_handoff_email', e.target.value)}
                placeholder="soporte@tuempresa.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recibirás un email cuando un visitante pida hablar con un humano
            </p>
          </div>
        </div>
      )}

      {/* Visitor Data Section */}
      {activeSection === 'visitor' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Recolección inteligente:</strong> La IA pedirá estos datos de forma natural durante la conversación 
              y los guardará automáticamente en tu base de datos de Clientes.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.collect_visitor_data}
                onChange={(e) => updateField('collect_visitor_data', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <div>
                <span className="font-medium text-gray-900">Activar recolección de datos</span>
                <p className="text-xs text-gray-500">La IA pedirá información del visitante</p>
              </div>
            </label>

            {formData.collect_visitor_data && (
              <>
                <div className="ml-6 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.collect_name}
                      onChange={(e) => updateField('collect_name', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Pedir nombre</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.collect_email}
                      onChange={(e) => updateField('collect_email', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Pedir email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.collect_phone}
                      onChange={(e) => updateField('collect_phone', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Pedir teléfono</span>
                  </label>
                </div>

                <div className="ml-6 mt-4">
                  <Label>¿Cuándo pedir los datos?</Label>
                  <select
                    value={formData.collect_data_timing}
                    onChange={(e) => updateField('collect_data_timing', e.target.value as WebChatbotFormData['collect_data_timing'])}
                    className="w-full mt-1 p-2 border rounded-md bg-white"
                  >
                    <option value="before_chat">Antes de empezar (formulario)</option>
                    <option value="during_chat">Durante la conversación (recomendado)</option>
                    <option value="end_of_chat">Al final si muestra interés</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.collect_data_timing === 'before_chat' && 'El visitante deberá completar un formulario antes de chatear'}
                    {formData.collect_data_timing === 'during_chat' && 'La IA pedirá los datos naturalmente durante la conversación'}
                    {formData.collect_data_timing === 'end_of_chat' && 'La IA pedirá los datos solo si el visitante muestra interés'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ecommerce Section */}
      {activeSection === 'ecommerce' && (
        <div className="space-y-4">
          <div>
            <Label>Conectar con Tienda</Label>
            <select
              value={formData.ecommerce_connection_id}
              onChange={(e) => updateField('ecommerce_connection_id', e.target.value)}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="">Sin conexión</option>
              {ecommerceConnections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.store_name} ({conn.platform})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Permite a la IA consultar productos, precios y estado de pedidos
            </p>
          </div>

          {ecommerceConnections.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                No tienes tiendas conectadas. Ve a <strong>Conexiones → Ecommerce</strong> para conectar tu tienda.
              </p>
            </div>
          )}

          {formData.ecommerce_connection_id && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ La IA podrá responder preguntas sobre productos, precios, disponibilidad y estado de pedidos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button 
          onClick={onSave}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
