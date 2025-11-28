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
import { Smartphone, Globe, Building2, AlertCircle, ShoppingCart, Webhook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWorkspaceConnections } from "@/hooks/useWorkspaceConnections"
import { 
  ConnectionsPageSkeleton, 
  WhatsAppSkeleton, 
  ChatWidgetSkeleton, 
  EcommerceSkeleton, 
  WebhooksSkeleton 
} from "@/components/skeletons/ConnectionsSkeleton"
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
  const [activeTab, setActiveTab] = useState<string>('whatsapp')
  
  // Use unified hook to load all connections at once
  const { 
    data: connectionsData, 
    isLoading: connectionsLoading, 
    refresh: refreshConnections,
    workspace: workspaceData
  } = useWorkspaceConnections(selectedWorkspace?.id || null)
  
  // Update workspace data when connections are loaded
  useEffect(() => {
    if (workspaceData && selectedWorkspace) {
      setSelectedWorkspace(prev => prev ? {
        ...prev,
        whatsapp_session_id: workspaceData.whatsapp_session_id,
        web_widget_id: workspaceData.web_widget_id
      } : null)
    }
  }, [workspaceData])
  
  // Get tab from URL or default to whatsapp
  const tabParam = searchParams.get('tab')
  
  useEffect(() => {
    if (tabParam === 'web' || tabParam === 'ecommerce' || tabParam === 'webhooks') {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Show skeleton while auth is loading
  if (authLoading) {
    return <ConnectionsPageSkeleton />
  }

  if (!user) {
    return <ConnectionsPageSkeleton />
  }

  // Determine if workspace has connections based on loaded data
  const hasWhatsAppConnection = (connectionsData?.whatsapp?.sessions?.length ?? 0) > 0 || !!selectedWorkspace?.whatsapp_session_id
  const hasWebWidgetConnection = (connectionsData?.widgets?.length ?? 0) > 0 || !!selectedWorkspace?.web_widget_id
  const hasEcommerceConnections = (connectionsData?.ecommerce?.length ?? 0) > 0
  const hasWebhooks = (connectionsData?.webhooks?.length ?? 0) > 0

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
              {hasWhatsAppConnection && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Web Widget</span>
              {hasWebWidgetConnection && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="ecommerce" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">E-commerce</span>
              {hasEcommerceConnections && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              <span className="hidden sm:inline">Webhooks</span>
              {hasWebhooks && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="space-y-6">
            {connectionsLoading ? (
              <WhatsAppSkeleton />
            ) : (
              <WhatsAppAccountsSection 
                workspaceId={selectedWorkspace.id} 
                hasExistingConnection={hasWhatsAppConnection}
                onConnectionChange={refreshConnections}
                initialData={connectionsData?.whatsapp}
              />
            )}
          </TabsContent>

          <TabsContent value="web" className="space-y-6">
            {connectionsLoading ? (
              <ChatWidgetSkeleton />
            ) : (
              <ChatWidgetsSection 
                workspaceId={selectedWorkspace.id}
                hasExistingConnection={hasWebWidgetConnection}
                onConnectionChange={refreshConnections}
                initialData={connectionsData?.widgets}
              />
            )}
          </TabsContent>

          <TabsContent value="ecommerce" className="space-y-6">
            {connectionsLoading ? (
              <EcommerceSkeleton />
            ) : (
              <EcommerceConnectionsSection 
                workspaceId={selectedWorkspace.id}
                initialData={connectionsData?.ecommerce}
              />
            )}
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            {connectionsLoading ? (
              <WebhooksSkeleton />
            ) : (
              <WebhooksSection 
                workspaceId={selectedWorkspace.id}
                initialData={connectionsData?.webhooks}
              />
            )}
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
    <Suspense fallback={<ConnectionsPageSkeleton />}>
      <ConnectionsPageContent />
    </Suspense>
  )
}
