"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WhatsAppAccountsSection } from "./components/WhatsAppAccountsSection"
import { ChatWidgetsSection } from "./components/ChatWidgetsSection"
import { EcommerceConnectionsSection } from "./components/EcommerceConnectionsSection"
import { WebhooksSection } from "./components/WebhooksSection"
import { WorkspaceSelector } from "@/components/workspace-selector"
import { Loader2, Smartphone, Globe, Building2, AlertCircle, ShoppingCart, Webhook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import Link from "next/link"

interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
}

function ConnectionsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  
  // Function to refresh workspace data after connection changes
  const refreshWorkspace = useCallback(async () => {
    if (!selectedWorkspace) return
    
    try {
      const response = await ApiClient.request<Workspace>(`/api/workspaces/${selectedWorkspace.id}`)
      if (response.success && response.data) {
        setSelectedWorkspace(response.data)
      }
    } catch (error) {
      console.error('Error refreshing workspace:', error)
    }
  }, [selectedWorkspace])
  
  // Get tab from URL or default to whatsapp
  const tabParam = searchParams.get('tab')
  const defaultTab = tabParam === 'web' ? 'web' : 'whatsapp'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-sm text-gray-500">Cargando conexiones...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure WhatsApp and Web Widget for your workspace
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
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
              {selectedWorkspace.whatsapp_session_id && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Web Widget</span>
              {selectedWorkspace.web_widget_id && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="ecommerce" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">E-commerce</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="space-y-6">
            <WhatsAppAccountsSection 
              workspaceId={selectedWorkspace.id} 
              hasExistingConnection={!!selectedWorkspace.whatsapp_session_id}
              onConnectionChange={refreshWorkspace}
            />
          </TabsContent>

          <TabsContent value="web" className="space-y-6">
            <ChatWidgetsSection 
              workspaceId={selectedWorkspace.id}
              hasExistingConnection={!!selectedWorkspace.web_widget_id}
              onConnectionChange={refreshWorkspace}
            />
          </TabsContent>

          <TabsContent value="ecommerce" className="space-y-6">
            <EcommerceConnectionsSection workspaceId={selectedWorkspace.id} />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <WebhooksSection workspaceId={selectedWorkspace.id} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Workspace</h3>
          <p className="text-gray-500 mb-6">
            Choose a workspace above to configure its connections.
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
            <p className="font-medium mb-1">One connection per workspace</p>
            <p>
              Each workspace can have one WhatsApp connection and one Web Widget.
              This keeps your conversations and settings organized per client or project.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-sm text-gray-500">Cargando conexiones...</p>
      </div>
    }>
      <ConnectionsPageContent />
    </Suspense>
  )
}
