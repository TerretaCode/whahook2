"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { WhatsAppChatbotConfig } from "./components/WhatsAppChatbotConfig"
import { WebChatbotConfig } from "./components/WebChatbotConfig"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Smartphone, Globe, Building2, AlertCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChatbotSkeleton } from "@/components/skeletons/SettingsSkeletons"
import { ApiClient } from "@/lib/api-client"
import { getCached, setCache, getFromSession, persistToSession } from "@/lib/cache"

interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
}

const STORAGE_KEY = 'selected-workspace-id'
const CACHE_KEY = 'chatbot-workspaces'

function ChatbotSettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const widgetParam = searchParams.get('widget')
  const tabParam = searchParams.get('tab')
  const initialLoadDone = useRef(false)
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Determine default tab
  const getDefaultTab = () => {
    if (tabParam) return tabParam as 'whatsapp' | 'web'
    if (widgetParam) return 'web'
    return 'whatsapp'
  }
  
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'web'>(getDefaultTab())

  // Load workspaces on mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      loadWorkspaces()
    }
  }, [])

  // Update tab when URL param changes
  useEffect(() => {
    if (widgetParam) {
      setActiveTab('web')
    }
  }, [widgetParam])

  const loadWorkspaces = async () => {
    // Try cache first
    const cached = getCached<Workspace[]>(CACHE_KEY) || getFromSession<Workspace[]>(CACHE_KEY)
    if (cached && cached.length > 0) {
      setWorkspaces(cached)
      // Restore selected workspace
      const urlWorkspaceId = searchParams.get('workspace')
      const savedId = urlWorkspaceId || localStorage.getItem(STORAGE_KEY)
      const workspace = cached.find(w => w.id === savedId) || cached[0]
      setSelectedWorkspace(workspace)
      setIsLoading(false)
      // Revalidate in background
      revalidateInBackground()
      return
    }

    try {
      setIsLoading(true)
      const response = await ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces')
      if (response.success && response.data?.workspaces) {
        const list = response.data.workspaces
        setWorkspaces(list)
        setCache(CACHE_KEY, list)
        persistToSession(CACHE_KEY, list)
        
        // Restore selected workspace
        const urlWorkspaceId = searchParams.get('workspace')
        const savedId = urlWorkspaceId || localStorage.getItem(STORAGE_KEY)
        const workspace = list.find(w => w.id === savedId) || list[0]
        if (workspace) {
          setSelectedWorkspace(workspace)
          localStorage.setItem(STORAGE_KEY, workspace.id)
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const revalidateInBackground = async () => {
    try {
      const response = await ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces')
      if (response.success && response.data?.workspaces) {
        const list = response.data.workspaces
        setWorkspaces(list)
        setCache(CACHE_KEY, list)
        persistToSession(CACHE_KEY, list)
        
        // Update selected workspace if it exists in new list
        if (selectedWorkspace) {
          const updated = list.find(w => w.id === selectedWorkspace.id)
          if (updated) {
            setSelectedWorkspace(updated)
          }
        }
      }
    } catch (error) {
      console.warn('Background revalidation failed:', error)
    }
  }

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setSelectedWorkspace(workspace)
      localStorage.setItem(STORAGE_KEY, workspace.id)
      // Update URL
      const url = new URL(window.location.href)
      url.searchParams.set('workspace', workspace.id)
      router.replace(url.pathname + url.search)
    }
  }

  // Check if workspace has the required connection for the selected tab
  const hasWhatsAppConnection = selectedWorkspace?.whatsapp_session_id
  const hasWebWidgetConnection = selectedWorkspace?.web_widget_id

  // Show skeleton while loading
  if (isLoading) {
    return <ChatbotSkeleton />
  }

  // No workspaces
  if (workspaces.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbot Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure AI chatbot settings for your workspace
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">No workspaces found</p>
              <p className="text-sm text-amber-700 mt-1">
                Create a workspace first to configure chatbot settings.
              </p>
              <Link href="/settings/workspaces">
                <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workspace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chatbot Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure AI chatbot settings for your workspace
        </p>
      </div>

      {/* Workspace Selector - Inline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>Workspace:</span>
          </div>
          <Select value={selectedWorkspace?.id || undefined} onValueChange={handleWorkspaceChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <span>{workspace.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/settings/workspaces">
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
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
    <Suspense fallback={<ChatbotSkeleton />}>
      <ChatbotSettingsContent />
    </Suspense>
  )
}
