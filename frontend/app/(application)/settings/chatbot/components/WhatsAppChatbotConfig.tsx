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

interface AIConfig {
  id: string
  provider: string
  model: string
  has_api_key: boolean
}

interface InitialData {
  sessions: any[]
  ecommerceConnections: any[]
  chatbotConfigs: Record<string, any>
  aiConfig: AIConfig | null
}

interface WhatsAppChatbotConfigProps {
  workspaceId: string
  initialData?: InitialData
}

export function WhatsAppChatbotConfig({ workspaceId, initialData }: WhatsAppChatbotConfigProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(!initialData) // Skip loading if we have initialData
  const [showApiKey, setShowApiKey] = useState(false)
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [ecommerceConnections, setEcommerceConnections] = useState<EcommerceConnection[]>([])
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(initialData?.aiConfig || null)
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
  const [configs, setConfigs] = useState<Record<string, any>>({})
  const [loadingStates, setLoadingStates] = useState({
    sessions: false,
    ecommerce: false,
    configs: false
  })

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
    if (user && workspaceId) {
      // If we have initialData, use it instead of fetching
      if (initialData) {
        processInitialData()
      } else {
        loadInitialData()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, workspaceId, initialData])
  
  // Process pre-loaded data from parent
  const processInitialData = () => {
    if (!initialData) return
    
    // Process sessions
    const mappedSessions = (initialData.sessions || []).map((s: any) => ({
      id: s.session_id || s.id,
      phone: s.phone_number || s.session_id,
      name: s.label || s.name || s.phone_number
    }))
    setSessions(mappedSessions)
    
    // Process ecommerce connections
    const mappedConnections = (initialData.ecommerceConnections || []).map((c: any) => ({
      id: c.id,
      platform: c.platform || 'Unknown',
      store_name: c.name || c.store_name || c.shop_name || 'Unnamed Store'
    }))
    setEcommerceConnections(mappedConnections)
    
    // Process chatbot configs
    const newFormData: Record<string, any> = {}
    const newOriginalData: Record<string, any> = {}
    const newConfigs: Record<string, any> = {}
    
    for (const session of mappedSessions) {
      const config = initialData.chatbotConfigs[session.id]
      if (config) {
        newConfigs[session.id] = config
        const configData = {
          api_key: config.has_api_key ? '••••••••' : '',
          provider: config.provider || 'google',
          model: config.model || 'gemini-2.5-flash',
          bot_name: config.bot_name || 'Asistente',
          language: config.language || 'es',
          tone: config.tone || 'professional',
          auto_reply: config.auto_reply !== undefined ? config.auto_reply : true,
          use_ecommerce_api: config.use_ecommerce_api || false,
          ecommerce_connection_ids: config.ecommerce_connection_ids || [],
          ecommerce_search_message: config.ecommerce_search_message || 'Estoy buscando la mejor solución para ti...',
          system_prompt: config.system_prompt || 'Eres un asistente útil y profesional.',
          custom_instructions: config.custom_instructions || '',
          fallback_message: config.fallback_message || 'Disculpa, no estoy seguro de cómo ayudarte con eso.',
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
          out_of_hours_message: config.out_of_hours_message || 'Gracias por contactarnos. Estamos fuera de horario.',
          handoff_enabled: config.handoff_enabled || false,
          handoff_keywords: config.handoff_keywords || ['humano', 'agente', 'representante', 'soporte'],
          intent_classifier_max_tokens: config.intent_classifier_max_tokens || 1000,
          debounce_delay_ms: config.debounce_delay_ms || 5000,
          max_wait_ms: config.max_wait_ms || 15000,
          max_batch_size: config.max_batch_size || 20,
          max_consecutive_fallbacks: 1,
          fallback_uncertainty_phrases: config.fallback_uncertainty_phrases || ['no estoy seguro', 'no puedo ayudarte', 'no tengo información', 'no entiendo', 'disculpa, no comprendo'],
          typing_indicator_delay_ms: config.typing_indicator_delay_ms || 500,
          handoff_message: config.handoff_message || 'Entiendo que necesitas ayuda adicional. Te estoy transfiriendo con un agente humano que podrá asistirte mejor. Por favor, espera un momento...',
          handoff_frustration_detection: config.handoff_frustration_detection || false,
          handoff_frustration_keywords: config.handoff_frustration_keywords || ['no sirve', 'inútil', 'mal servicio', 'horrible', 'pésimo'],
          log_conversations: config.log_conversations !== undefined ? config.log_conversations : true,
          log_level: config.log_level || 'detailed',
          log_user_messages: config.log_user_messages !== undefined ? config.log_user_messages : true,
          log_bot_responses: config.log_bot_responses !== undefined ? config.log_bot_responses : true,
          data_retention_days: config.data_retention_days || 90,
          auto_delete_enabled: config.auto_delete_enabled !== undefined ? config.auto_delete_enabled : true,
          soft_delete_enabled: config.soft_delete_enabled !== undefined ? config.soft_delete_enabled : true
        }
        newFormData[session.id] = configData
        newOriginalData[session.id] = { ...configData }
      } else {
        // No config exists - set defaults
        const defaultData = getDefaultConfigData()
        newFormData[session.id] = defaultData
        newOriginalData[session.id] = { ...defaultData }
      }
    }
    
    setConfigs(newConfigs)
    setFormData(newFormData)
    setOriginalData(newOriginalData)
    
    // Auto-expand first session if none expanded
    if (mappedSessions.length > 0 && !expandedSession) {
      setExpandedSession(mappedSessions[0].id)
    }
    
    // Mark loading as complete immediately
    setIsInitialLoading(false)
  }
  
  const getDefaultConfigData = () => ({
    api_key: "",
    provider: "google",
    model: "gemini-2.5-flash",
    bot_name: "Asistente",
    language: "es",
    tone: "professional",
    auto_reply: true,
    use_ecommerce_api: false,
    ecommerce_connection_ids: [],
    ecommerce_search_message: 'Estoy buscando la mejor solución para ti...',
    system_prompt: 'Eres un asistente útil y profesional.',
    custom_instructions: '',
    fallback_message: 'Disculpa, no estoy seguro de cómo ayudarte con eso.',
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    response_format: 'text',
    context_window: 10,
    max_conversation_length: 20,
    enable_memory: true,
    enable_typing_indicator: true,
    business_hours_enabled: false,
    business_hours_timezone: 'UTC',
    active_hours_start: '09:00',
    active_hours_end: '18:00',
    out_of_hours_message: 'Gracias por contactarnos. Estamos fuera de horario.',
    handoff_enabled: false,
    handoff_keywords: ['humano', 'agente', 'representante', 'soporte'],
    intent_classifier_max_tokens: 1000,
    debounce_delay_ms: 5000,
    max_wait_ms: 15000,
    max_batch_size: 20,
    max_consecutive_fallbacks: 1,
    fallback_uncertainty_phrases: ['no estoy seguro', 'no puedo ayudarte', 'no tengo información', 'no entiendo', 'disculpa, no comprendo'],
    typing_indicator_delay_ms: 500,
    handoff_message: 'Entiendo que necesitas ayuda adicional. Te estoy transfiriendo con un agente humano que podrá asistirte mejor. Por favor, espera un momento...',
    handoff_frustration_detection: false,
    handoff_frustration_keywords: ['no sirve', 'inútil', 'mal servicio', 'horrible', 'pésimo'],
    log_conversations: true,
    log_level: 'detailed',
    log_user_messages: true,
    log_bot_responses: true,
    data_retention_days: 90,
    auto_delete_enabled: true,
    soft_delete_enabled: true
  })
  
  // Check if all loading is complete (only for non-initialData case)
  useEffect(() => {
    if (initialData) return // Skip if using initialData
    
    const allLoaded = !loadingStates.sessions && !loadingStates.ecommerce && !loadingStates.configs
    if (allLoaded) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setIsInitialLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [loadingStates, initialData])
  
  const loadInitialData = async () => {
    setIsInitialLoading(true)
    await Promise.all([
      loadSessions(),
      loadEcommerceConnections()
    ])
  }

  const loadSessions = async () => {
    setLoadingStates(prev => ({ ...prev, sessions: true }))
    try {
      const response = await ApiClient.request<any>(`/api/whatsapp/sessions?workspace_id=${workspaceId}`)
      console.log('WhatsApp sessions full response:', response)
      console.log('Response data:', response.data)
      
      // Intentar diferentes estructuras de respuesta
      let sessionsData: any = null
      
      // Caso 1: response.data.sessions (estructura actual)
      if (response.data?.sessions) {
        sessionsData = response.data.sessions
      }
      // Caso 2: response.data.data.sessions
      else if (response.data?.data?.sessions) {
        sessionsData = response.data.data.sessions
      }
      // Caso 3: response.sessions
      else if ((response as any).sessions) {
        sessionsData = (response as any).sessions
      }
      // Caso 4: response.data es array directamente
      else if (Array.isArray(response.data)) {
        sessionsData = response.data
      }
      
      console.log('Sessions data extracted:', sessionsData)
      
      if (sessionsData && Array.isArray(sessionsData)) {
        const sessions = sessionsData.map((s: any) => ({
          id: s.session_id || s.id,
          phone: s.phone_number || s.session_id,
          name: s.label || s.name || s.phone_number
        }))
        console.log('Mapped sessions:', sessions)
        setSessions(sessions)
        
        // Load configs for all sessions
        if (sessions.length > 0) {
          setLoadingStates(prev => ({ ...prev, configs: true }))
          await Promise.all(sessions.map((session: WhatsAppSession) => loadConfig(session.id)))
          setLoadingStates(prev => ({ ...prev, configs: false }))
        } else {
          // No sessions, mark configs as loaded
          setLoadingStates(prev => ({ ...prev, configs: false }))
        }
      } else {
        console.warn('No sessions data found in response')
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, sessions: false }))
    }
  }

  const loadEcommerceConnections = async () => {
    setLoadingStates(prev => ({ ...prev, ecommerce: true }))
    try {
      const response = await ApiClient.request<any>(`/api/ecommerce/connections?workspace_id=${workspaceId}`)
      console.log('Ecommerce connections full response:', response)
      console.log('Ecommerce response data:', response.data)
      
      // Intentar diferentes estructuras de respuesta
      let connectionsData: any = null
      
      if (response.data?.success && response.data?.data) {
        connectionsData = response.data.data
      } else if (response.data?.data) {
        connectionsData = response.data.data
      } else if (Array.isArray(response.data)) {
        connectionsData = response.data
      }
      
      console.log('Connections data extracted:', connectionsData)
      
      if (connectionsData && Array.isArray(connectionsData)) {
        const connections = connectionsData.map((c: any) => ({
          id: c.id,
          platform: c.platform || 'Unknown',
          store_name: c.name || c.store_name || c.shop_name || 'Unnamed Store'
        }))
        console.log('Mapped ecommerce connections:', connections)
        setEcommerceConnections(connections)
      } else {
        console.warn('No ecommerce connections data found in response')
      }
    } catch (error) {
      console.error('Error loading ecommerce connections:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, ecommerce: false }))
    }
  }

  const loadConfig = async (sessionId: string) => {
    try {
      console.log('Loading config for WhatsApp session:', sessionId)
      const response: any = await ApiClient.request(`/api/chatbot/whatsapp/${sessionId}`)
      console.log('WhatsApp config response:', response)
      
      // The config data is directly in response.data, not response.data.data
      const config = response.data?.data || response.data
      
      if (config && config.id) {
        console.log('WhatsApp config data:', config)
        console.log('🔍 auto_reply value from server:', config.auto_reply, 'type:', typeof config.auto_reply)
        setConfigs(prev => ({ ...prev, [sessionId]: config }))
        
        // Preserve existing api_key if already set in form
        const existingApiKey = formData[sessionId]?.api_key
        const shouldKeepApiKey = existingApiKey && existingApiKey !== '••••••••'
        
        const configData = {
          api_key: shouldKeepApiKey ? existingApiKey : (config.has_api_key ? '••••••••' : ''),
          provider: config.provider || 'google',
          model: config.model || 'gemini-2.5-flash',
          bot_name: config.bot_name || 'Asistente',
          language: config.language || 'es',
          tone: config.tone || 'professional',
          auto_reply: config.auto_reply !== undefined ? config.auto_reply : true, // CRITICAL: Load auto_reply state
          use_ecommerce_api: config.use_ecommerce_api || false,
          ecommerce_connection_ids: config.ecommerce_connection_ids || [],
          ecommerce_search_message: config.ecommerce_search_message || 'Estoy buscando la mejor solución para ti...',
          system_prompt: config.system_prompt || 'Eres un asistente útil y profesional.',
          custom_instructions: config.custom_instructions || '',
          fallback_message: config.fallback_message || 'Disculpa, no estoy seguro de cómo ayudarte con eso.',
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
          out_of_hours_message: config.out_of_hours_message || 'Gracias por contactarnos. Estamos fuera de horario.',
          handoff_enabled: config.handoff_enabled || false,
          handoff_keywords: config.handoff_keywords || ['humano', 'agente', 'representante', 'soporte'],
          intent_classifier_max_tokens: config.intent_classifier_max_tokens || 1000,
          debounce_delay_ms: config.debounce_delay_ms || 5000,
          max_wait_ms: config.max_wait_ms || 15000,
          max_batch_size: config.max_batch_size || 20,
          max_consecutive_fallbacks: 1, // V2: Always 1, fallback triggers immediate pause
          fallback_uncertainty_phrases: config.fallback_uncertainty_phrases || ['no estoy seguro', 'no puedo ayudarte', 'no tengo información', 'no entiendo', 'disculpa, no comprendo'],
          typing_indicator_delay_ms: config.typing_indicator_delay_ms || 500,
          handoff_message: config.handoff_message || 'Entiendo que necesitas ayuda adicional. Te estoy transfiriendo con un agente humano que podrá asistirte mejor. Por favor, espera un momento...',
          handoff_frustration_detection: config.handoff_frustration_detection || false,
          handoff_frustration_keywords: config.handoff_frustration_keywords || ['no sirve', 'inútil', 'mal servicio', 'horrible', 'pésimo'],
          log_conversations: config.log_conversations !== undefined ? config.log_conversations : true,
          log_level: config.log_level || 'detailed',
          log_user_messages: config.log_user_messages !== undefined ? config.log_user_messages : true,
          log_bot_responses: config.log_bot_responses !== undefined ? config.log_bot_responses : true,
          data_retention_days: config.data_retention_days || 90,
          auto_delete_enabled: config.auto_delete_enabled !== undefined ? config.auto_delete_enabled : true,
          soft_delete_enabled: config.soft_delete_enabled !== undefined ? config.soft_delete_enabled : true
        }
        
        setFormData(prev => ({ ...prev, [sessionId]: configData }))
        setOriginalData(prev => ({ ...prev, [sessionId]: { ...configData } }))
      }
    } catch (error) {
      console.log('No config found for session, setting defaults:', sessionId)
      console.error('Error loading config:', error)
      // No config exists yet - set defaults
      const defaultData = {
        api_key: "",
        provider: "google",
        model: "gemini-2.5-flash",
        bot_name: "Asistente",
        language: "es",
        tone: "professional",
        use_ecommerce_api: false,
        ecommerce_connection_ids: [],
        ecommerce_keywords: [],
        ecommerce_search_message: "Estoy buscando la mejor solución para ti...",
        system_prompt: "Eres un asistente útil y profesional.",
        custom_instructions: "",
        fallback_message: "Disculpa, no estoy seguro de cómo ayudarte con eso. ¿Podrías reformular tu pregunta?",
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        context_window: 10,
        max_conversation_length: 20,
        enable_memory: true,
        enable_typing_indicator: true,
        business_hours_enabled: false,
        business_hours_timezone: "UTC",
        active_hours_start: "09:00",
        active_hours_end: "18:00",
        out_of_hours_message: "Gracias por contactarnos. Estamos fuera de horario. Nuestro horario de atención es de {hours}.",
        handoff_enabled: false,
        handoff_keywords: ["humano", "agente", "representante", "soporte"],
        intent_classifier_max_tokens: 1000,
        debounce_delay_ms: 5000,
        max_wait_ms: 15000,
        max_batch_size: 20,
        max_consecutive_fallbacks: 1, // V2: Always 1, fallback triggers immediate pause
        fallback_uncertainty_phrases: ['no estoy seguro', 'no puedo ayudarte', 'no tengo información', 'no entiendo', 'disculpa, no comprendo'],
        typing_indicator_delay_ms: 500,
        handoff_message: 'Entiendo que necesitas ayuda adicional. Te estoy transfiriendo con un agente humano que podrá asistirte mejor. Por favor, espera un momento...',
        handoff_frustration_detection: false,
        handoff_frustration_keywords: ['no sirve', 'inútil', 'mal servicio', 'horrible', 'pésimo'],
        log_conversations: true,
        log_level: 'detailed',
        log_user_messages: true,
        log_bot_responses: true,
        data_retention_days: 90,
        auto_delete_enabled: true,
        soft_delete_enabled: true
      }
      
      setFormData(prev => ({ ...prev, [sessionId]: defaultData }))
      setOriginalData(prev => ({ ...prev, [sessionId]: { ...defaultData } }))
    }
  }

  const handleSave = async (sessionId: string) => {
    setIsLoading(true)

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
        loadConfig(sessionId)
      }, 500)
    } catch (error) {
      console.error('❌ Error saving config:', error)
      toast.error("Error", "Failed to save configuration")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this chatbot configuration?")) return

    setIsLoading(true)
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
      loadConfig(sessionId) // Reset to defaults
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error("Error", "Failed to delete configuration")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAutoReply = async (sessionId: string, currentState: boolean) => {
    setIsLoading(true)
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
      await loadConfig(sessionId)
    } catch (error: any) {
      console.error('Error toggling auto reply:', error)
      toast.error("Error", error.message || "No se pudo cambiar el estado")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  // Show global loader while initial data is loading
  if (isInitialLoading) {
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
        
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Cargando configuración...</p>
            <p className="text-xs text-gray-500 mt-1">
              {loadingStates.sessions && "Cargando sesiones de WhatsApp..."}
              {loadingStates.ecommerce && "Cargando conexiones de ecommerce..."}
              {loadingStates.configs && "Cargando configuraciones..."}
            </p>
          </div>
        </div>
      </div>
    )
  }

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
                          disabled={isLoading}
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
                      isLoading={isLoading}
                      showApiKey={showApiKey}
                      onToggleApiKey={() => setShowApiKey(!showApiKey)}
                      providerModels={providerModels}
                      ecommerceConnections={ecommerceConnections}
                      sessionId={session.id}
                      aiConfig={aiConfig}
                    />
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 mt-4 border-t">
                      <Button 
                        onClick={() => handleSave(session.id)} 
                        disabled={isLoading || !canSave} 
                        className="flex-1"
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
                      
                      {hasConfig && (
                        <>
                          <Link href={`/config/chatbot/test?sessionId=${session.id}`}>
                            <Button 
                              variant="outline"
                              disabled={isLoading}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <TestTube className="w-4 h-4 mr-2" />
                              Probar Bot
                            </Button>
                          </Link>
                          
                          <Button 
                            variant="outline"
                            onClick={() => handleDelete(session.id)}
                            disabled={isLoading}
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
