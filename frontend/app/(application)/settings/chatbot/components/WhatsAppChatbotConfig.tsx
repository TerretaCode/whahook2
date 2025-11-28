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
  Smartphone,
  ChevronDown,
  ChevronUp,
  Trash2,
  TestTube
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { toast } from "@/lib/toast"
import { ChatbotConfigForm } from "./ChatbotConfigForm"

interface WhatsAppSession {
  id: string
  phone: string
  name?: string
}

interface EcommerceConnection {
  id: string
  platform: string
  store_name: string
}

interface WhatsAppChatbotConfigProps {
  workspaceId: string
  onLoaded?: () => void
}

export function WhatsAppChatbotConfig({ workspaceId, onLoaded }: WhatsAppChatbotConfigProps) {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isPageReady, setIsPageReady] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [ecommerceConnections, setEcommerceConnections] = useState<EcommerceConnection[]>([])
  const [configs, setConfigs] = useState<Record<string, any>>({})
  
  // Persist expanded session state
  const getInitialExpandedSession = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('whatsapp-expanded-session')
    }
    return null
  }
  const [expandedSession, setExpandedSession] = useState<string | null>(getInitialExpandedSession())
  
  // Save expanded session to localStorage
  useEffect(() => {
    if (expandedSession) {
      localStorage.setItem('whatsapp-expanded-session', expandedSession)
    } else {
      localStorage.removeItem('whatsapp-expanded-session')
    }
  }, [expandedSession])

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

  // ============================================
  // SIMPLIFIED LOADING PATTERN
  // Single useEffect that loads everything and marks ready when done
  // ============================================
  useEffect(() => {
    console.log('🔄 [WhatsApp] useEffect triggered - user:', !!user, 'workspaceId:', workspaceId)
    
    if (!user || !workspaceId) {
      console.log('⚠️ [WhatsApp] Missing user or workspaceId, skipping load')
      return
    }
    
    let isMounted = true
    
    const loadAllData = async () => {
      console.log('🚀 [WhatsApp] Starting loadAllData...')
      try {
        // 1. Fetch sessions and ecommerce in parallel
        console.log('📡 [WhatsApp] Fetching sessions and ecommerce...')
        const [sessionsResult, ecommerceResult] = await Promise.all([
          fetchSessions(),
          fetchEcommerceConnections()
        ])
        
        console.log('✅ [WhatsApp] Fetched - sessions:', sessionsResult.length, 'ecommerce:', ecommerceResult.length)
        
        if (!isMounted) {
          console.log('⚠️ [WhatsApp] Component unmounted, aborting')
          return
        }
        
        // 2. Set sessions and ecommerce data
        setSessions(sessionsResult)
        setEcommerceConnections(ecommerceResult)
        
        // 3. Load configs for all sessions in parallel
        if (sessionsResult.length > 0) {
          console.log('📡 [WhatsApp] Fetching configs for', sessionsResult.length, 'sessions...')
          const configPromises = sessionsResult.map(session => fetchConfig(session.id))
          const configResults = await Promise.all(configPromises)
          
          console.log('✅ [WhatsApp] Fetched all configs')
          
          if (!isMounted) {
            console.log('⚠️ [WhatsApp] Component unmounted, aborting')
            return
          }
          
          // Build configs, formData, and originalData objects
          const newConfigs: Record<string, any> = {}
          const newFormData: Record<string, any> = {}
          const newOriginalData: Record<string, any> = {}
          
          configResults.forEach((result, index) => {
            const sessionId = sessionsResult[index].id
            if (result.config) {
              newConfigs[sessionId] = result.config
            }
            newFormData[sessionId] = result.formData
            newOriginalData[sessionId] = { ...result.formData }
          })
          
          setConfigs(newConfigs)
          setFormData(newFormData)
          setOriginalData(newOriginalData)
        } else {
          console.log('ℹ️ [WhatsApp] No sessions found, skipping config fetch')
        }
        
        // 4. Mark as ready
        if (isMounted) {
          console.log('✅ [WhatsApp] All data loaded, marking page ready')
          setIsPageReady(true)
          onLoaded?.()
          console.log('✅ [WhatsApp] onLoaded called')
        }
      } catch (error) {
        console.error('❌ [WhatsApp] Error loading data:', error)
        // Still mark as ready so user sees error state, not infinite loader
        if (isMounted) {
          console.log('⚠️ [WhatsApp] Marking page ready despite error')
          setIsPageReady(true)
          onLoaded?.()
        }
      }
    }
    
    loadAllData()
    
    return () => {
      console.log('🧹 [WhatsApp] Cleanup - setting isMounted = false')
      isMounted = false
    }
  }, [user, workspaceId, onLoaded])

  // ============================================
  // PURE DATA FETCHING FUNCTIONS (no state updates)
  // ============================================
  const fetchSessions = async (): Promise<WhatsAppSession[]> => {
    try {
      const response = await ApiClient.request<any>(`/api/whatsapp/sessions?workspace_id=${workspaceId}`)
      
      let sessionsData: any = null
      if (response.data?.sessions) {
        sessionsData = response.data.sessions
      } else if (response.data?.data?.sessions) {
        sessionsData = response.data.data.sessions
      } else if ((response as any).sessions) {
        sessionsData = (response as any).sessions
      } else if (Array.isArray(response.data)) {
        sessionsData = response.data
      }
      
      if (sessionsData && Array.isArray(sessionsData)) {
        return sessionsData.map((s: any) => ({
          id: s.session_id || s.id,
          phone: s.phone_number || s.session_id,
          name: s.label || s.name || s.phone_number
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching sessions:', error)
      return []
    }
  }

  const fetchEcommerceConnections = async (): Promise<EcommerceConnection[]> => {
    try {
      const response = await ApiClient.request<any>(`/api/ecommerce/connections?workspace_id=${workspaceId}`)
      
      let connectionsData: any = null
      if (response.data?.success && response.data?.data) {
        connectionsData = response.data.data
      } else if (response.data?.data) {
        connectionsData = response.data.data
      } else if (Array.isArray(response.data)) {
        connectionsData = response.data
      }
      
      if (connectionsData && Array.isArray(connectionsData)) {
        return connectionsData.map((c: any) => ({
          id: c.id,
          platform: c.platform || 'Unknown',
          store_name: c.name || c.store_name || c.shop_name || 'Unnamed Store'
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching ecommerce connections:', error)
      return []
    }
  }

  // Pure fetch function for config - returns data instead of updating state
  const fetchConfig = async (sessionId: string): Promise<{ config: any | null; formData: any }> => {
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
      business_hours_enabled: false,
      business_hours_timezone: "UTC",
      active_hours_start: "09:00",
      active_hours_end: "18:00",
      out_of_hours_message: "Gracias por contactarnos. Estamos fuera de horario.",
      handoff_enabled: false,
      handoff_keywords: ["humano", "agente", "representante", "soporte"],
      intent_classifier_max_tokens: 1000,
      debounce_delay_ms: 5000,
      max_wait_ms: 15000,
      max_batch_size: 20,
      max_consecutive_fallbacks: 1,
      fallback_uncertainty_phrases: ['no estoy seguro', 'no puedo ayudarte', 'no tengo información'],
      typing_indicator_delay_ms: 500,
      handoff_message: 'Te estoy transfiriendo con un agente humano.',
      handoff_frustration_detection: false,
      handoff_frustration_keywords: ['no sirve', 'inútil', 'mal servicio'],
      log_conversations: true,
      log_level: 'detailed',
      log_user_messages: true,
      log_bot_responses: true,
      data_retention_days: 90,
      auto_delete_enabled: true,
      soft_delete_enabled: true
    }

    try {
      const response: any = await ApiClient.request(`/api/chatbot/whatsapp/${sessionId}`)
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
          business_hours_enabled: config.business_hours_enabled || false,
          business_hours_timezone: config.business_hours_timezone || 'UTC',
          active_hours_start: config.active_hours_start || '09:00',
          active_hours_end: config.active_hours_end || '18:00',
          out_of_hours_message: config.out_of_hours_message || defaultFormData.out_of_hours_message,
          handoff_enabled: config.handoff_enabled || false,
          handoff_keywords: config.handoff_keywords || defaultFormData.handoff_keywords,
          intent_classifier_max_tokens: config.intent_classifier_max_tokens || 1000,
          debounce_delay_ms: config.debounce_delay_ms || 5000,
          max_wait_ms: config.max_wait_ms || 15000,
          max_batch_size: config.max_batch_size || 20,
          max_consecutive_fallbacks: 1,
          fallback_uncertainty_phrases: config.fallback_uncertainty_phrases || defaultFormData.fallback_uncertainty_phrases,
          typing_indicator_delay_ms: config.typing_indicator_delay_ms || 500,
          handoff_message: config.handoff_message || defaultFormData.handoff_message,
          handoff_frustration_detection: config.handoff_frustration_detection || false,
          handoff_frustration_keywords: config.handoff_frustration_keywords || defaultFormData.handoff_frustration_keywords,
          log_conversations: config.log_conversations !== undefined ? config.log_conversations : true,
          log_level: config.log_level || 'detailed',
          log_user_messages: config.log_user_messages !== undefined ? config.log_user_messages : true,
          log_bot_responses: config.log_bot_responses !== undefined ? config.log_bot_responses : true,
          data_retention_days: config.data_retention_days || 90,
          auto_delete_enabled: config.auto_delete_enabled !== undefined ? config.auto_delete_enabled : true,
          soft_delete_enabled: config.soft_delete_enabled !== undefined ? config.soft_delete_enabled : true
        }
        return { config, formData: configFormData }
      }
      return { config: null, formData: defaultFormData }
    } catch (error) {
      console.log('No config found for session:', sessionId)
      return { config: null, formData: defaultFormData }
    }
  }

  // Reload config for a single session (used after save)
  const reloadConfig = async (sessionId: string) => {
    const result = await fetchConfig(sessionId)
    if (result.config) {
      setConfigs(prev => ({ ...prev, [sessionId]: result.config }))
    }
    setFormData(prev => ({ ...prev, [sessionId]: result.formData }))
    setOriginalData(prev => ({ ...prev, [sessionId]: { ...result.formData } }))
  }

  const handleSave = async (sessionId: string) => {
    setIsSaving(true)

    try {
      const data = { ...formData[sessionId] }
      
      // Don't send placeholder api_key to backend
      if (data.api_key === '••••••••') {
        delete data.api_key
      }
      
      console.log('💾 Saving config for session:', sessionId)
      console.log('📦 Data to save:', data)
      
      // 1. Save main chatbot config
      const response = await ApiClient.request(`/api/chatbot/whatsapp/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      console.log('✅ Main config saved:', response)
      
      toast.success("Success", "Configuration saved successfully")
      
      // Reload config after a short delay to ensure DB is updated
      setTimeout(() => {
        reloadConfig(sessionId)
      }, 500)
    } catch (error) {
      console.error('❌ Error saving config:', error)
      toast.error("Error", "Failed to save configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this chatbot configuration?")) return

    setIsSaving(true)
    try {
      await ApiClient.request(`/api/chatbot/whatsapp/${sessionId}`, {
        method: 'DELETE'
      })
      
      toast.success("Success", "Configuration deleted successfully")
      setConfigs(prev => {
        const newConfigs = { ...prev }
        delete newConfigs[sessionId]
        return newConfigs
      })
      reloadConfig(sessionId) // Reset to defaults
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error("Error", "Failed to delete configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleAutoReply = async (sessionId: string, currentState: boolean) => {
    setIsSaving(true)
    try {
      // Get current config from server first
      const currentConfig = configs[sessionId]
      if (!currentConfig) {
        toast.error("Error", "No hay configuración guardada. Por favor, configura el bot primero.")
        return
      }
      
      const _currentData = formData[sessionId] || {}
      const newAutoReplyState = !currentState
      
      // Prepare data with all required fields
      const updateData = {
        // Required fields (must always be present)
        provider: currentConfig.provider,
        model: currentConfig.model,
        api_key: currentConfig.api_key || '••••••••', // Use placeholder if encrypted
        
        // Basic fields
        bot_name: currentConfig.bot_name,
        language: currentConfig.language,
        tone: currentConfig.tone,
        
        // The field we're updating
        auto_reply: newAutoReplyState,
        
        // All other fields from current config
        use_ecommerce_api: currentConfig.use_ecommerce_api,
        ecommerce_connection_ids: currentConfig.ecommerce_connection_ids,
        ecommerce_keywords: currentConfig.ecommerce_keywords,
        ecommerce_search_message: currentConfig.ecommerce_search_message,
        active_hours_start: currentConfig.active_hours_start,
        active_hours_end: currentConfig.active_hours_end,
        system_prompt: currentConfig.system_prompt,
        custom_instructions: currentConfig.custom_instructions,
        fallback_message: currentConfig.fallback_message,
        temperature: currentConfig.temperature,
        max_tokens: currentConfig.max_tokens,
        top_p: currentConfig.top_p,
        frequency_penalty: currentConfig.frequency_penalty,
        presence_penalty: currentConfig.presence_penalty,
        context_window: currentConfig.context_window,
        max_conversation_length: currentConfig.max_conversation_length,
        enable_memory: currentConfig.enable_memory,
        enable_typing_indicator: currentConfig.enable_typing_indicator,
        business_hours_enabled: currentConfig.business_hours_enabled,
        business_hours_timezone: currentConfig.business_hours_timezone,
        out_of_hours_message: currentConfig.out_of_hours_message,
        handoff_enabled: currentConfig.handoff_enabled,
        handoff_keywords: currentConfig.handoff_keywords,
        log_conversations: currentConfig.log_conversations,
        data_retention_days: currentConfig.data_retention_days
      }
      
      console.log('Toggling auto_reply:', { sessionId, from: currentState, to: newAutoReplyState, data: updateData })
      
      const response = await ApiClient.request(`/api/chatbot/whatsapp/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify(updateData)
      })
      
      console.log('Toggle response:', response)
      
      // Update local state
      setFormData(prev => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          auto_reply: newAutoReplyState
        }
      }))
      
      setConfigs(prev => ({
        ...prev,
        [sessionId]: {
          ...prev[sessionId],
          auto_reply: newAutoReplyState
        }
      }))
      
      toast.success(
        newAutoReplyState ? "IA Activada" : "IA Pausada", 
        newAutoReplyState 
          ? "El bot responderá automáticamente" 
          : "El bot NO responderá hasta que lo reactives"
      )
      
      // Reload config to confirm
      await reloadConfig(sessionId)
    } catch (error: any) {
      console.error('Error toggling auto reply:', error)
      toast.error("Error", error.message || "No se pudo cambiar el estado")
    } finally {
      setIsSaving(false)
    }
  }

  if (!user || !isPageReady) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Chatbot</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Configure AI for your WhatsApp business accounts
            </p>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No WhatsApp sessions available</p>
          <p className="text-xs mt-1">Please connect a WhatsApp session first in the Connections section</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isExpanded = expandedSession === session.id
            const hasConfig = configs[session.id]
            const data = formData[session.id] || {}
            const original = originalData[session.id] || {}
            
            // Enable save if there are changes OR if api_key is valid
            const hasChanges = JSON.stringify(data) !== JSON.stringify(original)
            const hasValidApiKey = data.api_key && data.api_key !== '••••••••'
            const canSave = hasValidApiKey || hasChanges
            
            // Use config from server for auto_reply state, not formData
            const currentAutoReply = hasConfig ? configs[session.id].auto_reply : true

            return (
              <div key={session.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{session.name || session.phone}</p>
                      {hasConfig && (
                        <p className="text-xs text-green-600 mt-0.5">
                          ✓ Configured with {configs[session.id].provider}
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
                          onCheckedChange={() => toggleAutoReply(session.id, currentAutoReply !== false)}
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
                      onFormDataChange={(newData) => setFormData(prev => ({ ...prev, [session.id]: newData }))}
                      onSave={() => handleSave(session.id)}
                      isLoading={isSaving}
                      showApiKey={showApiKey}
                      onToggleApiKey={() => setShowApiKey(!showApiKey)}
                      providerModels={providerModels}
                      ecommerceConnections={ecommerceConnections}
                      sessionId={session.id}
                    />
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 mt-4 border-t">
                      <Button 
                        onClick={() => handleSave(session.id)} 
                        disabled={isSaving || !canSave} 
                        className="flex-1"
                      >
                        {isSaving ? (
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
                      
                      {hasConfig && (
                        <>
                          <Link href={`/config/chatbot/test?sessionId=${session.id}`}>
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
                            onClick={() => handleDelete(session.id)}
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
