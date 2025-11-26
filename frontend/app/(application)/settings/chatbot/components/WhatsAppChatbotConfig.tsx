"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Save,
  Loader2,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Eye,
  EyeOff,
  Settings,
  FileText
} from "lucide-react"
import { StructuredPromptConfig, defaultPromptData, type StructuredPromptData } from "./StructuredPromptConfig"

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
  const [showApiKey, setShowApiKey] = useState(false)
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [ecommerceConnections, setEcommerceConnections] = useState<EcommerceConnection[]>([])
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [configs, setConfigs] = useState<Record<string, ChatbotConfig>>({})
  const [formData, setFormData] = useState<Record<string, ChatbotConfig>>({})
  const [promptData, setPromptData] = useState<Record<string, StructuredPromptData>>({})
  const [activeTab, setActiveTab] = useState<string>("basic")

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setIsInitialLoading(true)
    await Promise.all([
      loadSessions(),
      loadEcommerceConnections()
    ])
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

  const loadEcommerceConnections = async () => {
    try {
      const response = await ApiClient.request<any>('/api/ecommerce/connections')
      
      let connectionsData: any = null
      if (response.data?.success && response.data?.data) {
        connectionsData = response.data.data
      } else if (response.data?.data) {
        connectionsData = response.data.data
      } else if (Array.isArray(response.data)) {
        connectionsData = response.data
      }
      
      if (connectionsData && Array.isArray(connectionsData)) {
        const connections = connectionsData.map((c: any) => ({
          id: c.id,
          platform: c.platform || 'Unknown',
          store_name: c.name || c.store_name || c.shop_name || 'Unnamed Store'
        }))
        setEcommerceConnections(connections)
      }
    } catch (error) {
      console.error('Error loading ecommerce connections:', error)
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

                {/* Expanded Config Form with Tabs */}
                {isExpanded && (
                  <div className="p-4 border-t">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="basic" className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Basic Config
                        </TabsTrigger>
                        <TabsTrigger value="prompt" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Prompt 2
                        </TabsTrigger>
                      </TabsList>

                      {/* Basic Configuration Tab */}
                      <TabsContent value="basic">
                        <Card>
                          <CardHeader>
                            <CardTitle>Basic Configuration</CardTitle>
                            <CardDescription>Configure AI provider, model and credentials</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Provider */}
                            <div className="space-y-2">
                              <Label>AI Provider *</Label>
                              <Select 
                                value={data.provider || ''} 
                                onValueChange={(v) => updateField(session.id, 'provider', v)}
                              >
                                <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="google">Google Gemini</SelectItem>
                                  <SelectItem value="openai">OpenAI GPT</SelectItem>
                                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Model */}
                            {data.provider && (
                              <div className="space-y-2">
                                <Label>Model *</Label>
                                <Select 
                                  value={data.model || ''} 
                                  onValueChange={(v) => updateField(session.id, 'model', v)}
                                >
                                  <SelectTrigger><SelectValue placeholder="Select a model" /></SelectTrigger>
                                  <SelectContent>
                                    {providerModels[data.provider]?.map((m) => (
                                      <SelectItem key={m.value} value={m.value}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">{m.label}</span>
                                          <span className="text-xs text-muted-foreground">{m.description}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* API Key */}
                            <div className="space-y-2">
                              <Label>API Key *</Label>
                              <div className="flex gap-2">
                                <Input
                                  type={showApiKey ? "text" : "password"}
                                  value={data.api_key || ''}
                                  onChange={(e) => updateField(session.id, 'api_key', e.target.value)}
                                  placeholder="sk-..."
                                />
                                <Button type="button" variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>

                            {/* Bot Name */}
                            <div className="space-y-2">
                              <Label>Bot Name</Label>
                              <Input 
                                value={data.bot_name || ''} 
                                onChange={(e) => updateField(session.id, 'bot_name', e.target.value)} 
                                placeholder="Assistant" 
                              />
                            </div>

                            {/* Language */}
                            <div className="space-y-2">
                              <Label>Language</Label>
                              <Select 
                                value={data.language || 'es'} 
                                onValueChange={(v) => updateField(session.id, 'language', v)}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="es">Español</SelectItem>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="fr">Français</SelectItem>
                                  <SelectItem value="de">Deutsch</SelectItem>
                                  <SelectItem value="it">Italiano</SelectItem>
                                  <SelectItem value="pt">Português</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Tone */}
                            <div className="space-y-2">
                              <Label>Conversation Tone</Label>
                              <Select 
                                value={data.tone || 'professional'} 
                                onValueChange={(v) => updateField(session.id, 'tone', v)}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="friendly">Friendly</SelectItem>
                                  <SelectItem value="casual">Casual</SelectItem>
                                  <SelectItem value="formal">Formal</SelectItem>
                                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Save Button for Basic Tab */}
                        <div className="flex gap-3 pt-4 mt-4 border-t">
                          <Button 
                            onClick={() => handleSave(session.id)} 
                            disabled={isLoading} 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Configuration
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>

                      {/* Prompt 2 Tab */}
                      <TabsContent value="prompt">
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
                      </TabsContent>
                    </Tabs>
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
