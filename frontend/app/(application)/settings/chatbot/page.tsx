"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { WhatsAppChatbotConfig } from "./components/WhatsAppChatbotConfig"
import { WebChatbotConfig } from "./components/WebChatbotConfig"
import { WorkspaceSelector } from "@/components/workspace-selector"
import { Smartphone, Globe, Loader2, Building2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
}

function ChatbotSettingsContent() {
  const searchParams = useSearchParams()
  const widgetParam = searchParams.get('widget')
  const tabParam = searchParams.get('tab')
  
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  
  // Determine default tab
  const getDefaultTab = () => {
    if (tabParam) return tabParam as 'whatsapp' | 'web'
    if (widgetParam) return 'web'
    return 'whatsapp'
  }
  
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'web'>(getDefaultTab())

  // Update tab when URL param changes
  useEffect(() => {
    if (widgetParam) {
      setActiveTab('web')
    }
  }, [widgetParam])

  // Check if workspace has the required connection for the selected tab
  const hasWhatsAppConnection = selectedWorkspace?.whatsapp_session_id
  const hasWebWidgetConnection = selectedWorkspace?.web_widget_id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chatbot Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure AI chatbot settings for your workspace
        </p>
      </div>

      {/* Workspace Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <WorkspaceSelector 
          onWorkspaceChange={setSelectedWorkspace}
          showCreateButton={true}
        />
      </div>

      {/* Content - Only show if workspace is selected */}
      {selectedWorkspace ? (
        <>
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
                {hasWhatsAppConnection && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('web')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'web'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Globe className="w-5 h-5" />
                Web Widget Chatbot
                {hasWebWidgetConnection && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'whatsapp' ? (
            hasWhatsAppConnection ? (
              <WhatsAppChatbotConfig workspaceId={selectedWorkspace.id} />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <Smartphone className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-amber-900 mb-2">
                  No WhatsApp Connection
                </h3>
                <p className="text-amber-700 mb-4">
                  Connect a WhatsApp account to this workspace first to configure the chatbot.
                </p>
                <Link href={`/settings/connections?workspace=${selectedWorkspace.id}`}>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Connect WhatsApp
                  </Button>
                </Link>
              </div>
            )
          ) : (
            hasWebWidgetConnection ? (
              <WebChatbotConfig selectedWidgetId={selectedWorkspace.web_widget_id} workspaceId={selectedWorkspace.id} />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <Globe className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-amber-900 mb-2">
                  No Web Widget
                </h3>
                <p className="text-amber-700 mb-4">
                  Create a Web Widget for this workspace first to configure the chatbot.
                </p>
                <Link href={`/settings/connections?workspace=${selectedWorkspace.id}&tab=web`}>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Globe className="w-4 h-4 mr-2" />
                    Create Web Widget
                  </Button>
                </Link>
              </div>
            )
          )}
        </>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Workspace</h3>
          <p className="text-gray-500 mb-6">
            Choose a workspace above to configure its chatbot settings.
          </p>
          <Link href="/settings/workspaces">
            <Button className="bg-green-600 hover:bg-green-700">
              Manage Workspaces
            </Button>
          </Link>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Workspace-specific settings</p>
            <p>
              Chatbot configuration is unique to each workspace. Changes here only affect
              the selected workspace's WhatsApp and Web Widget chatbots.
            </p>
          </div>
        </div>
      </div>
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
