"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from 'next-intl'
import { useAuth } from "@/contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WhatsAppAccountsSection } from "./components/WhatsAppAccountsSection"
import { ChatWidgetsSection } from "./components/ChatWidgetsSection"
import { EcommerceConnectionsSection } from "./components/EcommerceConnectionsSection"
import { WebhooksSection } from "./components/WebhooksSection"
import { EmailConnectionSection } from "./components/EmailConnectionSection"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Smartphone, Globe, Building2, AlertCircle, ShoppingCart, Webhook, Plus, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useConnectionsPage, Workspace } from "@/hooks/useWorkspaceConnections"
import { 
  ConnectionsPageSkeleton, 
  WhatsAppSkeleton, 
  ChatWidgetSkeleton, 
  EcommerceSkeleton, 
  WebhooksSkeleton 
} from "@/components/skeletons/ConnectionsSkeleton"
import Link from "next/link"

function ConnectionsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('settings.connections')
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('whatsapp')
  
  // Use unified hook that loads EVERYTHING in parallel
  const { 
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    connectionsData, 
    isLoading,
    isLoadingConnections, 
    refresh: refreshConnections
  } = useConnectionsPage()
  
  // Get tab from URL
  const tabParam = searchParams.get('tab')
  
  useEffect(() => {
    if (tabParam === 'web' || tabParam === 'ecommerce' || tabParam === 'webhooks' || tabParam === 'email') {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Show skeleton while loading (auth OR initial data)
  if (authLoading || isLoading) {
    return <ConnectionsPageSkeleton />
  }

  if (!user) {
    return <ConnectionsPageSkeleton />
  }

  // Handle workspace change
  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setSelectedWorkspace(workspace)
    }
  }

  // Determine if workspace has connections based on loaded data
  const hasWhatsAppConnection = (connectionsData?.whatsapp?.sessions?.length ?? 0) > 0 || !!selectedWorkspace?.whatsapp_session_id
  const hasWebWidgetConnection = (connectionsData?.widgets?.length ?? 0) > 0 || !!selectedWorkspace?.web_widget_id
  const hasEcommerceConnections = (connectionsData?.ecommerce?.length ?? 0) > 0
  const hasWebhooks = (connectionsData?.webhooks?.length ?? 0) > 0

  // No workspaces state
  if (workspaces.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{t('noWorkspaces')}</p>
              <p className="text-sm text-green-700 mt-1">
                {t('createWorkspaceFirst')}
              </p>
              <Link href="/settings/workspaces">
                <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createWorkspace')}
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
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Workspace Selector - Only show if user has multiple workspaces */}
      {workspaces.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{t('workspace')}:</span>
            </div>
            <Select value={selectedWorkspace?.id || undefined} onValueChange={handleWorkspaceChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder={t('selectWorkspace')} />
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
      )}

      {/* Content */}
      {selectedWorkspace ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
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
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
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
            {isLoadingConnections ? (
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
            {isLoadingConnections ? (
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
            {isLoadingConnections ? (
              <EcommerceSkeleton />
            ) : (
              <EcommerceConnectionsSection 
                workspaceId={selectedWorkspace.id}
                initialData={connectionsData?.ecommerce}
              />
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <EmailConnectionSection workspaceId={selectedWorkspace.id} />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            {isLoadingConnections ? (
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('selectWorkspace')}</h3>
          <p className="text-gray-500 mb-6">
            {t('chooseWorkspace')}
          </p>
          <Link href="/settings/workspaces">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              {t('manageWorkspaces')}
            </Button>
          </Link>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">{t('oneConnectionPerWorkspace')}</p>
            <p>
              {t('oneConnectionDescription')}
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

