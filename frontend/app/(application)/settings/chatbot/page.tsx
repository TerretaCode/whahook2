"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { WhatsAppChatbotConfig } from "./components/WhatsAppChatbotConfig"
import { WebChatbotConfig } from "./components/WebChatbotConfig"
import { Smartphone, Globe, Loader2 } from "lucide-react"

function ChatbotSettingsContent() {
  const searchParams = useSearchParams()
  const widgetParam = searchParams.get('widget')
  
  // If widget param exists, default to web tab
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'web'>(widgetParam ? 'web' : 'whatsapp')

  // Update tab when URL param changes
  useEffect(() => {
    if (widgetParam) {
      setActiveTab('web')
    }
  }, [widgetParam])

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'whatsapp'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            WhatsApp Chatbot
          </button>
          <button
            onClick={() => setActiveTab('web')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'web'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Globe className="w-5 h-5" />
            Chatbot Web
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'whatsapp' ? (
        <WhatsAppChatbotConfig />
      ) : (
        <WebChatbotConfig selectedWidgetId={widgetParam} />
      )}
    </div>
  )
}

export default function ChatbotSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    }>
      <ChatbotSettingsContent />
    </Suspense>
  )
}
