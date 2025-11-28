import { useState, useEffect, useCallback } from 'react'
import { ApiClient } from '@/lib/api-client'

export interface WhatsAppSession {
  id: string
  user_id: string
  workspace_id: string
  session_id: string
  label: string
  phone_number: string | null
  status: 'ready' | 'error' | 'initializing' | 'qr_pending'
  qr_code: string | null
  error_message?: string | null
  created_at: string
  updated_at: string
}

export interface ChatWidget {
  id: string
  name: string
  domain: string
  is_active: boolean
  primary_color: string
  header_text: string
  header_logo_url: string
  welcome_message: string
  placeholder_text: string
  position: string
  launcher_animation: string
  z_index: number
  sound_enabled: boolean
  powered_by_enabled: boolean
  powered_by_text: string
  total_conversations: number
  total_messages: number
  created_at: string
}

export interface EcommerceConnection {
  id: string
  name: string
  platform: 'woocommerce' | 'shopify' | 'prestashop' | 'magento'
  store_url: string
  status: 'pending' | 'active' | 'error' | 'disabled'
  last_sync_at: string | null
  last_error: string | null
  created_at: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
  created_at: string
  updated_at: string
}

export interface WorkspaceConnectionsData {
  workspace: Workspace
  whatsapp: {
    accounts: WhatsAppSession[]
    sessions: WhatsAppSession[]
  }
  widgets: ChatWidget[]
  ecommerce: EcommerceConnection[]
  webhooks: Webhook[]
}

interface UseWorkspaceConnectionsReturn {
  data: WorkspaceConnectionsData | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  // Individual data accessors for convenience
  workspace: Workspace | null
  whatsappSessions: WhatsAppSession[]
  widgets: ChatWidget[]
  ecommerceConnections: EcommerceConnection[]
  webhooks: Webhook[]
}

export function useWorkspaceConnections(workspaceId: string | null): UseWorkspaceConnectionsReturn {
  const [data, setData] = useState<WorkspaceConnectionsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConnections = useCallback(async () => {
    if (!workspaceId) {
      setData(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await ApiClient.request<WorkspaceConnectionsData>(
        `/api/workspaces/${workspaceId}/connections`
      )

      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError('Failed to load connections')
      }
    } catch (err: any) {
      console.error('Error fetching workspace connections:', err)
      setError(err.message || 'Failed to load connections')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  return {
    data,
    isLoading,
    error,
    refresh: fetchConnections,
    // Convenience accessors
    workspace: data?.workspace || null,
    whatsappSessions: data?.whatsapp?.sessions || [],
    widgets: data?.widgets || [],
    ecommerceConnections: data?.ecommerce || [],
    webhooks: data?.webhooks || []
  }
}
