"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare,
  Zap,
  Shield,
  Bot,
  Key
} from "lucide-react"
import { ApiKeysTab } from "./ApiKeysTab"
import { ChatbotSettingsTab } from "./chatbot-settings"
import { WebChatbotSettingsTab } from "./webchatbot-settings"
import { ModelConfigTab } from "./ModelConfigTab"
import { ConversationConfigTab } from "./ConversationConfigTab"
import { AdvancedConfigTab } from "./AdvancedConfigTab"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = Record<string, any>

interface ChatbotConfigFormProps {
  formData: FormData
  onFormDataChange: (data: FormData) => void
  onSave: () => void
  isLoading: boolean
  showApiKey: boolean
  onToggleApiKey: () => void
  providerModels: Record<string, { value: string; label: string; description: string }[]>
  ecommerceConnections: { id: string; platform: string; store_name: string }[]
  sessionId?: string // WhatsApp session ID
  widgetId?: string // Widget ID
}

export function ChatbotConfigForm(props: ChatbotConfigFormProps) {
  const _router = useRouter()
  const searchParams = useSearchParams()
  
  // Get active tab from URL or localStorage
  const getInitialTab = () => {
    // First try URL param
    const urlTab = searchParams.get('tab')
    if (urlTab) return urlTab
    
    // Then try localStorage
    const storageKey = props.sessionId 
      ? `chatbot-tab-${props.sessionId}` 
      : props.widgetId 
        ? `chatbot-tab-widget-${props.widgetId}`
        : 'chatbot-tab'
    const savedTab = localStorage.getItem(storageKey)
    return savedTab || 'apikeys'
  }
  
  const [activeTab, setActiveTab] = useState(getInitialTab())
  
  // Persist tab changes to localStorage and URL
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // Save to localStorage
    const storageKey = props.sessionId 
      ? `chatbot-tab-${props.sessionId}` 
      : props.widgetId 
        ? `chatbot-tab-widget-${props.widgetId}`
        : 'chatbot-tab'
    localStorage.setItem(storageKey, value)
    
    // Update URL without navigation
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.replaceState({}, '', url.toString())
  }
  
  const updateField = (field: string, value: FormData[string]) => {
    props.onFormDataChange({ ...props.formData, [field]: value })
  }

  const updateArrayField = (field: string, index: number, value: string) => {
    const array = props.formData[field] || []
    const newArray = [...array]
    newArray[index] = value
    updateField(field, newArray)
  }

  const addArrayItem = (field: string) => {
    const array = props.formData[field] || []
    updateField(field, [...array, ''])
  }

  const removeArrayItem = (field: string, index: number) => {
    const array = props.formData[field] || []
    updateField(field, array.filter((_: unknown, i: number) => i !== index))
  }

  const tabProps = {
    ...props,
    updateField,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
    onFormDataChange: props.onFormDataChange // Pass through for batch updates
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="overflow-x-auto -mx-4 px-4 mb-4">
        <TabsList className="inline-flex w-auto min-w-full">
          <TabsTrigger value="apikeys" className="flex-shrink-0">
            <Key className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex-shrink-0">
            <Bot className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Assistant</span>
          </TabsTrigger>
          <TabsTrigger value="model" className="flex-shrink-0">
            <Zap className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Model</span>
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex-shrink-0">
            <MessageSquare className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex-shrink-0">
            <Shield className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="apikeys"><ApiKeysTab /></TabsContent>
      <TabsContent value="config">
          {props.widgetId ? (
            <WebChatbotSettingsTab {...tabProps} />
          ) : (
            <ChatbotSettingsTab {...tabProps} />
          )}
        </TabsContent>
      <TabsContent value="model"><ModelConfigTab {...tabProps} /></TabsContent>
      <TabsContent value="conversation"><ConversationConfigTab {...tabProps} /></TabsContent>
      <TabsContent value="advanced"><AdvancedConfigTab {...tabProps} /></TabsContent>
    </Tabs>
  )
}
