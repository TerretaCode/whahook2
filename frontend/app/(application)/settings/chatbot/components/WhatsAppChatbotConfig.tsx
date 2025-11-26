"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { 
  Loader2,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Pause,
  Play
} from "lucide-react"
import { StructuredPromptConfig, defaultPromptData, type StructuredPromptData } from "./StructuredPromptConfig"

interface WhatsAppSession {
  id: string
  phone: string
  name?: string
}

interface ChatbotConfig {
  id?: string
  provider: string
  model: string
  api_key?: string
  has_api_key?: boolean
  bot_name: string
  language: string
  tone: string
  auto_reply: boolean
  use_ecommerce_api: boolean
  ecommerce_connection_ids: string[]
  ecommerce_search_message: string
}

const defaultConfig: ChatbotConfig = {
  provider: "google",
  model: "gemini-2.5-flash",
  bot_name: "Asistente",
  language: "es",
  tone: "professional",
  auto_reply: true,
  use_ecommerce_api: false,
  ecommerce_connection_ids: [],
  ecommerce_search_message: "Estoy buscando la mejor solución para ti..."
}

export function WhatsAppChatbotConfig() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [configs, setConfigs] = useState<Record<string, ChatbotConfig>>({})
  const [formData, setFormData] = useState<Record<string, ChatbotConfig>>({})
  const [promptData, setPromptData] = useState<Record<string, StructuredPromptData>>({})

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsInitialLoading(true)
    await loadSessions()
    setIsInitialLoading(false)
  }

  const loadSessions = async () => {
    try {
      const response = await ApiClient.request<any>('/api/whatsapp/sessions')
      
      let sessionsData: any = null
      if (response.data?.sessions) {
        sessionsData = response.data.sessions
      } else if (Array.isArray(response.data)) {
        sessionsData = response.data
      }
      
      if (sessionsData && Array.isArray(sessionsData)) {
        const mappedSessions = sessionsData.map((s: any) => ({
          id: s.session_id || s.id,
          phone: s.phone_number || s.session_id,
          name: s.label || s.name || s.phone_number
        }))
        setSessions(mappedSessions)
        
        // Load configs for all sessions
        for (const session of mappedSessions) {
          await loadConfig(session.id)
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadConfig = async (sessionId: string) => {
    try {
      const response: any = await ApiClient.request(`/api/chatbot/whatsapp/${sessionId}`)
      const config = response.data?.data || response.data
      
      if (config && config.id) {
        setConfigs(prev => ({ ...prev, [sessionId]: config }))
        
        const configData: ChatbotConfig = {
          ...defaultConfig,
          provider: config.provider || 'google',
          model: config.model || 'gemini-2.5-flash',
          api_key: config.has_api_key ? '••••••••' : '',
          has_api_key: config.has_api_key,
          bot_name: config.bot_name || 'Asistente',
          language: config.language || 'es',
          tone: config.tone || 'professional',
          auto_reply: config.auto_reply !== undefined ? config.auto_reply : true,
          use_ecommerce_api: config.use_ecommerce_api || false,
          ecommerce_connection_ids: config.ecommerce_connection_ids || [],
          ecommerce_search_message: config.ecommerce_search_message || 'Estoy buscando la mejor solución para ti...'
        }
        
        setFormData(prev => ({ ...prev, [sessionId]: configData }))
        
        // Load structured prompt data if exists
        const structuredPrompt = config.structured_prompt || {}
        setPromptData(prev => ({ ...prev, [sessionId]: { ...defaultPromptData, ...structuredPrompt } }))
      }
    } catch {
      // No config exists yet - set defaults
      setFormData(prev => ({ ...prev, [sessionId]: { ...defaultConfig } }))
      setPromptData(prev => ({ ...prev, [sessionId]: { ...defaultPromptData } }))
    }
  }

  const handleSave = async (sessionId: string) => {
    setIsLoading(true)
    try {
      const data = { ...formData[sessionId] }
      
      // Don't send placeholder api_key
      if (data.api_key === '••••••••') {
        delete data.api_key
      }
      
      // Include structured prompt data
      const saveData = {
        ...data,
        structured_prompt: promptData[sessionId] || defaultPromptData
      }
      
      await ApiClient.request(`/api/chatbot/whatsapp/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify(saveData)
      })
      
      // Reload config
      await loadConfig(sessionId)
    } catch {
      console.error('Error saving config')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestBot = (sessionId: string) => {
    // TODO: Implement bot testing
    alert('Bot testing coming soon! Session: ' + sessionId)
  }

  const updatePromptData = (sessionId: string, data: StructuredPromptData) => {
    setPromptData(prev => ({ ...prev, [sessionId]: data }))
  }

  const toggleAutoReply = async (sessionId: string, currentState: boolean) => {
    setIsLoading(true)
    try {
      const currentConfig = configs[sessionId]
      if (!currentConfig) return
      
      const newAutoReplyState = !currentState
      
      await ApiClient.request(`/api/chatbot/whatsapp/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({
          ...currentConfig,
          auto_reply: newAutoReplyState
        })
      })
      
      // Update local state
      setFormData(prev => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], auto_reply: newAutoReplyState }
      }))
      
      setConfigs(prev => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], auto_reply: newAutoReplyState }
      }))
      
      await loadConfig(sessionId)
    } catch (error) {
      console.error('Error toggling auto reply:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (sessionId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [sessionId]: { ...prev[sessionId], [field]: value }
    }))
  }

  if (isInitialLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Chatbot</h3>
            <p className="text-sm text-gray-600">Configure AI for your WhatsApp business accounts</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
          <p className="text-sm text-gray-500 mt-4">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Smartphone className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">WhatsApp Chatbot</h3>
          <p className="text-sm text-gray-600">Configure AI for your WhatsApp business accounts</p>
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
            const data = formData[session.id] || defaultConfig
            const currentAutoReply = hasConfig ? configs[session.id].auto_reply : true

            return (
              <div key={session.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Session Header */}
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
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleAutoReply(session.id, currentAutoReply !== false)
                          }}
                          variant={currentAutoReply === false ? "default" : "outline"}
                          size="sm"
                          disabled={isLoading}
                          className={currentAutoReply === false ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {currentAutoReply === false ? (
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
                          currentAutoReply === false 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {currentAutoReply === false ? '⏸ Pausado' : '✓ Activo'}
                        </span>
                      </>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Config Form - Prompt 2 */}
                {isExpanded && (
                  <div className="p-4 border-t">
                    <StructuredPromptConfig
                      sessionId={session.id}
                      useEcommerceApi={data.use_ecommerce_api || false}
                      onUseEcommerceApiChange={(checked) => updateField(session.id, 'use_ecommerce_api', checked)}
                      promptData={promptData[session.id] || defaultPromptData}
                      onPromptDataChange={(newData) => updatePromptData(session.id, newData)}
                      onSave={() => handleSave(session.id)}
                      onTest={() => handleTestBot(session.id)}
                      isLoading={isLoading}
                    />
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
