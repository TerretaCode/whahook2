"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { 
  Loader2,
  Globe,
  ChevronDown,
  ChevronUp,
  Bot,
  Pause,
  Play,
  TestTube,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { WebChatbotConfigForm } from "./WebChatbotConfigForm"

interface ChatWidget {
  id: string
  name: string
  domain: string
  primary_color: string
  is_active: boolean
  assistant_name?: string
  system_prompt?: string
  greeting_message?: string
  fallback_message?: string
  collect_visitor_data?: boolean
  collect_name?: boolean
  collect_email?: boolean
  collect_phone?: boolean
  collect_data_timing?: 'before_chat' | 'during_chat' | 'end_of_chat'
  human_handoff_email?: string
  ecommerce_connection_id?: string
}

interface EcommerceConnection {
  id: string
  platform: string
  store_name: string
}

interface FormData {
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

interface WebChatbotConfigProps {
  selectedWidgetId?: string | null
}

const defaultFormData: FormData = {
  assistant_name: 'Asistente',
  system_prompt: '',
  greeting_message: '',
  fallback_message: 'Lo siento, no he podido entender tu mensaje. ¿Podrías reformularlo?',
  collect_visitor_data: false,
  collect_name: false,
  collect_email: false,
  collect_phone: false,
  collect_data_timing: 'during_chat',
  human_handoff_email: '',
  ecommerce_connection_id: ''
}

export function WebChatbotConfig({ selectedWidgetId }: WebChatbotConfigProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<ChatWidget[]>([])
  const [expandedWidget, setExpandedWidget] = useState<string | null>(selectedWidgetId || null)
  const [formData, setFormData] = useState<Record<string, FormData>>({})
  const [ecommerceConnections, setEcommerceConnections] = useState<EcommerceConnection[]>([])

  useEffect(() => {
    fetchWidgets()
    fetchEcommerceConnections()
  }, [])

  useEffect(() => {
    if (selectedWidgetId) {
      setExpandedWidget(selectedWidgetId)
    }
  }, [selectedWidgetId])

  const fetchWidgets = async () => {
    try {
      const response = await ApiClient.request('/api/chat-widgets')
      if (response.success) {
        const widgetsData = response.data as ChatWidget[]
        setWidgets(widgetsData)
        
        // Initialize form data for each widget
        const initialFormData: Record<string, FormData> = {}
        widgetsData.forEach(widget => {
          initialFormData[widget.id] = {
            assistant_name: widget.assistant_name || defaultFormData.assistant_name,
            system_prompt: widget.system_prompt || defaultFormData.system_prompt,
            greeting_message: widget.greeting_message || defaultFormData.greeting_message,
            fallback_message: widget.fallback_message || defaultFormData.fallback_message,
            collect_visitor_data: widget.collect_visitor_data || defaultFormData.collect_visitor_data,
            collect_name: widget.collect_name || defaultFormData.collect_name,
            collect_email: widget.collect_email || defaultFormData.collect_email,
            collect_phone: widget.collect_phone || defaultFormData.collect_phone,
            collect_data_timing: widget.collect_data_timing || defaultFormData.collect_data_timing,
            human_handoff_email: widget.human_handoff_email || defaultFormData.human_handoff_email,
            ecommerce_connection_id: widget.ecommerce_connection_id || defaultFormData.ecommerce_connection_id
          }
        })
        setFormData(initialFormData)
      }
    } catch (error) {
      console.error('Error fetching widgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEcommerceConnections = async () => {
    try {
      const response = await ApiClient.request('/api/ecommerce/connections')
      if (response.success) {
        setEcommerceConnections(response.data as EcommerceConnection[])
      }
    } catch (error) {
      console.error('Error fetching ecommerce connections:', error)
    }
  }

  const handleSave = async (widgetId: string) => {
    setIsSaving(widgetId)
    try {
      const data = formData[widgetId]
      const response = await ApiClient.request(`/api/chat-widgets/${widgetId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
      
      if (response.success) {
        toast.success('Guardado', 'La configuración se ha guardado correctamente')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error', 'No se pudo guardar la configuración')
    } finally {
      setIsSaving(null)
    }
  }

  const toggleWidgetActive = async (widgetId: string, currentlyActive: boolean) => {
    setIsToggling(widgetId)
    try {
      const response = await ApiClient.request(`/api/chat-widgets/${widgetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentlyActive })
      })
      
      if (response.success) {
        setWidgets(prev => prev.map(w => 
          w.id === widgetId ? { ...w, is_active: !currentlyActive } : w
        ))
        toast.success(
          !currentlyActive ? 'IA Activada' : 'IA Pausada',
          !currentlyActive 
            ? 'El chatbot responderá automáticamente' 
            : 'El chatbot no responderá hasta que lo reactives'
        )
      }
    } catch (error) {
      console.error('Error toggling widget:', error)
      toast.error('Error', 'No se pudo cambiar el estado del chatbot')
    } finally {
      setIsToggling(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (widgets.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Chatbots Web</h3>
        <p className="text-sm text-gray-600 mb-4">
          First, create a Chatbot Web in the Connections section
        </p>
        <Link href="/settings/connections">
          <Button className="bg-green-600 hover:bg-green-700">
            Go to Connections
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Chatbot Web Configuration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure the AI behavior for your web chatbots
          </p>
        </div>
      </div>

      {/* Widget List */}
      <div className="space-y-3">
        {widgets.map((widget) => {
          const isExpanded = expandedWidget === widget.id

          return (
            <div 
              key={widget.id} 
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              {/* Widget Header */}
              <button
                onClick={() => setExpandedWidget(isExpanded ? null : widget.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: widget.primary_color + '20' }}
                  >
                    <Bot className="w-5 h-5" style={{ color: widget.primary_color }} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">{widget.name}</h4>
                    {widget.domain && (
                      <p className="text-sm text-gray-500">{widget.domain}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Pause/Resume Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleWidgetActive(widget.id, widget.is_active)
                    }}
                    variant={!widget.is_active ? "default" : "outline"}
                    size="sm"
                    disabled={isToggling === widget.id}
                    className={!widget.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {isToggling === widget.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : !widget.is_active ? (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Reanudar IA
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Pausar IA
                      </>
                    )}
                  </Button>
                  
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    !widget.is_active 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {!widget.is_active ? '⏸ Pausado' : '✓ Activo'}
                  </span>
                  
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Configuration */}
              {isExpanded && formData[widget.id] && (
                <div className="border-t bg-white p-6">
                  {/* Configuration Form */}
                  <WebChatbotConfigForm
                    formData={formData[widget.id]}
                    onFormDataChange={(newData) => setFormData(prev => ({ ...prev, [widget.id]: newData }))}
                    onSave={() => handleSave(widget.id)}
                    isLoading={isSaving === widget.id}
                    ecommerceConnections={ecommerceConnections}
                  />

                  {/* Test Bot Button */}
                  <div className="mt-6 pt-4 border-t flex gap-2">
                    <Link href={`/config/chatbot/test-web?widgetId=${widget.id}`}>
                      <Button 
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Probar Bot
                      </Button>
                    </Link>
                    {widget.domain && (
                      <a 
                        href={widget.domain.startsWith('http') ? widget.domain : `https://${widget.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button 
                          variant="outline"
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver en sitio
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
