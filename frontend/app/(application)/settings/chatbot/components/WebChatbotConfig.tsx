/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { 
  Save,
  Loader2,
  Globe,
  ChevronDown,
  ChevronUp,
  Trash2,
  TestTube
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { ChatbotConfigForm } from "./ChatbotConfigForm"

interface ChatWidget {
  id: string
  name: string
  domain: string
  primary_color: string
  is_active: boolean
}

interface EcommerceConnection {
  id: string
  platform: string
  store_name: string
}

interface WebChatbotConfigProps {
  selectedWidgetId?: string | null
  workspaceId?: string
  onLoaded?: () => void
}

export function WebChatbotConfig({ selectedWidgetId, workspaceId, onLoaded }: WebChatbotConfigProps) {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isPageReady, setIsPageReady] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [widgets, setWidgets] = useState<ChatWidget[]>([])
  const [ecommerceConnections, setEcommerceConnections] = useState<EcommerceConnection[]>([])
  const [configs, setConfigs] = useState<Record<string, any>>({})
  
  // Persist expanded widget state
  const getInitialExpandedWidget = () => {
    if (typeof window !== 'undefined') {
      return selectedWidgetId || localStorage.getItem('web-expanded-widget')
    }
    return selectedWidgetId || null
  }
  const [expandedWidget, setExpandedWidget] = useState<string | null>(getInitialExpandedWidget())
  
  // Save expanded widget to localStorage
  useEffect(() => {
    if (expandedWidget) {
      localStorage.setItem('web-expanded-widget', expandedWidget)
    } else {
      localStorage.removeItem('web-expanded-widget')
    }
  }, [expandedWidget])

  const providerModels: Record<string, { value: string; label: string; description: string }[]> = {
    google: [
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Best Price/Performance" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Most Capable" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Stable & Fast" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Very Capable" },
    ],
    openai: [
      { value: "gpt-4o", label: "GPT-4o", description: "Fastest GPT-4" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Best Value" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Most Capable" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Fast & Affordable" },
    ],
    anthropic: [
      { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", description: "Best Overall" },
      { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", description: "Fast & Affordable" },
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus", description: "Most Capable" },
    ],
  }

  const [formData, setFormData] = useState<Record<string, any>>({})
  const [originalData, setOriginalData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (selectedWidgetId) {
      setExpandedWidget(selectedWidgetId)
    }
  }, [selectedWidgetId])

  // ============================================
  // SIMPLIFIED LOADING PATTERN
  // ============================================
  useEffect(() => {
    if (!user) return
    
    let isMounted = true
    
    const loadAllData = async () => {
      try {
        // 1. Fetch widgets and ecommerce in parallel
        const [widgetsResult, ecommerceResult] = await Promise.all([
          fetchWidgets(),
          fetchEcommerceConnections()
        ])
        
        if (!isMounted) return
        
        setWidgets(widgetsResult)
        setEcommerceConnections(ecommerceResult)
        
        // 2. Load configs for all widgets in parallel
        if (widgetsResult.length > 0) {
          const configPromises = widgetsResult.map(widget => fetchConfig(widget.id))
          const configResults = await Promise.all(configPromises)
          
          if (!isMounted) return
          
          const newConfigs: Record<string, any> = {}
          const newFormData: Record<string, any> = {}
          const newOriginalData: Record<string, any> = {}
          
          configResults.forEach((result, index) => {
            const widgetId = widgetsResult[index].id
            if (result.config) {
              newConfigs[widgetId] = result.config
            }
            newFormData[widgetId] = result.formData
            newOriginalData[widgetId] = { ...result.formData }
          })
          
          setConfigs(newConfigs)
          setFormData(newFormData)
          setOriginalData(newOriginalData)
        }
        
        // 3. Mark as ready
        if (isMounted) {
          setIsPageReady(true)
          onLoaded?.()
        }
      } catch (error) {
        console.error('Error loading data:', error)
        if (isMounted) {
          setIsPageReady(true)
          onLoaded?.()
        }
      }
    }
    
    loadAllData()
    
    return () => {
      isMounted = false
    }
  }, [user, workspaceId, onLoaded])

  // ============================================
  // PURE DATA FETCHING FUNCTIONS
  // ============================================
  const fetchWidgets = async (): Promise<ChatWidget[]> => {
    try {
      const url = workspaceId 
        ? `/api/chat-widgets?workspace_id=${workspaceId}`
        : '/api/chat-widgets'
      const response = await ApiClient.request(url)
      
      if (response.success && response.data) {
        return response.data as ChatWidget[]
      }
      return []
    } catch (error) {
      console.error('Error fetching widgets:', error)
      return []
    }
  }

  const fetchEcommerceConnections = async (): Promise<EcommerceConnection[]> => {
    try {
      const url = workspaceId 
        ? `/api/ecommerce/connections?workspace_id=${workspaceId}`
        : '/api/ecommerce/connections'
      const response = await ApiClient.request(url)
      
      if (response.success && response.data) {
        return (response.data as any[]).map((conn: any) => ({
          id: conn.id,
          platform: conn.platform,
          store_name: conn.store_name || conn.shop_name || conn.store_url || 'Unknown Store'
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching ecommerce connections:', error)
      return []
    }
  }

  const fetchConfig = async (widgetId: string): Promise<{ config: any | null; formData: any }> => {
    const defaultFormData = {
      api_key: "",
      provider: "google",
      model: "gemini-2.5-flash",
      bot_name: "Asistente",
      language: "es",
      tone: "professional",
      auto_reply: true,
      use_ecommerce_api: false,
      ecommerce_connection_ids: [],
      ecommerce_search_message: "Estoy buscando la mejor solución para ti...",
      system_prompt: "Eres un asistente útil y profesional.",
      custom_instructions: "",
      fallback_message: "Disculpa, no estoy seguro de cómo ayudarte con eso.",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      response_format: "text",
      context_window: 10,
      max_conversation_length: 20,
      enable_memory: true,
      enable_typing_indicator: true,
      collect_visitor_data: false,
      collect_name: false,
      collect_email: false,
      collect_phone: false,
      collect_data_timing: 'during_chat',
      human_handoff_email: '',
      handoff_enabled: false,
      handoff_keywords: ['humano', 'agente', 'representante', 'soporte'],
      handoff_message: 'Entiendo que necesitas ayuda adicional.',
    }

    try {
      const response: any = await ApiClient.request(`/api/chatbot/web/${widgetId}`)
      const config = response.data?.data || response.data
      
      if (config && config.id) {
        const configFormData = {
          api_key: config.has_api_key ? '••••••••' : '',
          provider: config.provider || 'google',
          model: config.model || 'gemini-2.5-flash',
          bot_name: config.bot_name || 'Asistente',
          language: config.language || 'es',
          tone: config.tone || 'professional',
          auto_reply: config.auto_reply !== undefined ? config.auto_reply : true,
          use_ecommerce_api: config.use_ecommerce_api || false,
          ecommerce_connection_ids: config.ecommerce_connection_ids || [],
          ecommerce_search_message: config.ecommerce_search_message || defaultFormData.ecommerce_search_message,
          system_prompt: config.system_prompt || defaultFormData.system_prompt,
          custom_instructions: config.custom_instructions || '',
          fallback_message: config.fallback_message || defaultFormData.fallback_message,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.max_tokens ?? 1000,
          top_p: config.top_p ?? 1.0,
          frequency_penalty: config.frequency_penalty ?? 0.0,
          presence_penalty: config.presence_penalty ?? 0.0,
          response_format: config.response_format || 'text',
          context_window: config.context_window ?? 10,
          max_conversation_length: config.max_conversation_length ?? 20,
          enable_memory: config.enable_memory ?? true,
          enable_typing_indicator: config.enable_typing_indicator ?? true,
          collect_visitor_data: config.collect_visitor_data || false,
          collect_name: config.collect_name || false,
          collect_email: config.collect_email || false,
          collect_phone: config.collect_phone || false,
          collect_data_timing: config.collect_data_timing || 'during_chat',
          human_handoff_email: config.human_handoff_email || '',
          handoff_enabled: config.handoff_enabled || false,
          handoff_keywords: config.handoff_keywords || defaultFormData.handoff_keywords,
          handoff_message: config.handoff_message || defaultFormData.handoff_message,
        }
        return { config, formData: configFormData }
      }
      return { config: null, formData: defaultFormData }
    } catch (error) {
      console.log('No config found for widget:', widgetId)
      return { config: null, formData: defaultFormData }
    }
  }

  const reloadConfig = async (widgetId: string) => {
    const result = await fetchConfig(widgetId)
    if (result.config) {
      setConfigs(prev => ({ ...prev, [widgetId]: result.config }))
    }
    setFormData(prev => ({ ...prev, [widgetId]: result.formData }))
    setOriginalData(prev => ({ ...prev, [widgetId]: { ...result.formData } }))
  }

  const handleSave = async (widgetId: string) => {
    setIsSaving(true)
    try {
      const data = formData[widgetId]
      console.log('Saving web chatbot config:', widgetId, data)
      
      const response = await ApiClient.request(`/api/chatbot/web/${widgetId}`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      if (response.success) {
        toast.success('Configuración guardada', 'Los cambios se han aplicado correctamente')
        await reloadConfig(widgetId)
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error', 'No se pudo guardar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (widgetId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) return
    
    setIsSaving(true)
    try {
      await ApiClient.request(`/api/chatbot/web/${widgetId}`, { method: 'DELETE' })
      toast.success('Configuración eliminada', 'La configuración ha sido eliminada')
      setConfigs(prev => {
        const newConfigs = { ...prev }
        delete newConfigs[widgetId]
        return newConfigs
      })
      await reloadConfig(widgetId)
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error('Error', 'No se pudo eliminar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleAutoReply = async (widgetId: string, currentlyEnabled: boolean) => {
    setIsSaving(true)
    try {
      const newValue = !currentlyEnabled
      console.log(`Toggling auto_reply for widget ${widgetId}: ${currentlyEnabled} -> ${newValue}`)
      
      const response = await ApiClient.request(`/api/chatbot/web/${widgetId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ auto_reply: newValue })
      })
      
      if (response.success) {
        // Update local state
        setConfigs(prev => ({
          ...prev,
          [widgetId]: { ...prev[widgetId], auto_reply: newValue }
        }))
        
        // Also update widget is_active
        await ApiClient.request(`/api/chat-widgets/${widgetId}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_active: newValue })
        })
        
        setWidgets(prev => prev.map(w => 
          w.id === widgetId ? { ...w, is_active: newValue } : w
        ))
        
        toast.success(
          newValue ? 'IA Activada' : 'IA Pausada',
          newValue ? 'El chatbot responderá automáticamente' : 'El chatbot no responderá hasta que lo reactives'
        )
      }
    } catch (error) {
      console.error('Error toggling auto_reply:', error)
      toast.error('Error', 'No se pudo cambiar el estado')
    } finally {
      setIsSaving(false)
    }
  }

  // Don't render while loading - parent handles the loader
  if (!isPageReady) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Chatbot Web</h3>
          <p className="text-sm text-gray-600">Configura la IA para tus widgets de chat web</p>
        </div>
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No hay widgets de chat disponibles</p>
          <p className="text-xs mt-1">Crea un widget en la sección de Conexiones primero</p>
          <Link href="/settings/connections">
            <Button className="mt-4 bg-green-600 hover:bg-green-700">
              Ir a Conexiones
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {widgets.map((widget) => {
            const isExpanded = expandedWidget === widget.id
            const hasConfig = configs[widget.id]
            const data = formData[widget.id] || {}
            const original = originalData[widget.id] || {}
            
            const hasChanges = JSON.stringify(data) !== JSON.stringify(original)
            const hasValidApiKey = data.api_key && data.api_key !== '••••••••'
            const canSave = hasValidApiKey || hasChanges
            
            const currentAutoReply = hasConfig ? configs[widget.id].auto_reply : widget.is_active

            return (
              <div key={widget.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedWidget(isExpanded ? null : widget.id)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: widget.primary_color + '20' }}
                    >
                      <Globe className="w-4 h-4" style={{ color: widget.primary_color }} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{widget.name}</p>
                      {widget.domain && (
                        <p className="text-xs text-gray-500">{widget.domain}</p>
                      )}
                      {hasConfig && (
                        <p className="text-xs text-green-600 mt-0.5">
                          ✓ Configurado con {configs[widget.id].provider}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasConfig && (
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-sm font-medium ${currentAutoReply !== false ? 'text-green-600' : 'text-gray-500'}`}>
                          {currentAutoReply !== false ? 'IA Activa' : 'IA Pausada'}
                        </span>
                        <Switch
                          checked={currentAutoReply !== false}
                          onCheckedChange={() => toggleAutoReply(widget.id, currentAutoReply !== false)}
                          disabled={isSaving}
                        />
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t">
                    <ChatbotConfigForm
                      formData={data}
                      onFormDataChange={(newData) => setFormData(prev => ({ ...prev, [widget.id]: newData }))}
                      onSave={() => handleSave(widget.id)}
                      isLoading={isSaving}
                      showApiKey={showApiKey}
                      onToggleApiKey={() => setShowApiKey(!showApiKey)}
                      providerModels={providerModels}
                      ecommerceConnections={ecommerceConnections}
                      widgetId={widget.id}
                    />
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 mt-4 border-t">
                      <Button 
                        onClick={() => handleSave(widget.id)}
                        disabled={isSaving || !canSave}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Guardar
                      </Button>
                      
                      {hasConfig && (
                        <>
                          <Link href={`/config/chatbot/test-web?widgetId=${widget.id}`}>
                            <Button 
                              variant="outline"
                              disabled={isSaving}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <TestTube className="w-4 h-4 mr-2" />
                              Probar Bot
                            </Button>
                          </Link>
                          
                          <Button 
                            variant="outline"
                            onClick={() => handleDelete(widget.id)}
                            disabled={isSaving}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
