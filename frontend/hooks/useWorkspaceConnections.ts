import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ApiClient } from '@/lib/api-client'

const STORAGE_KEY = 'selected-workspace-id'
const CACHE_KEY = 'connections-cache'
const CACHE_TTL = 30000 // 30 seconds

// Simple in-memory cache for instant loads
interface CacheEntry {
  data: any
  timestamp: number
}

const cache: Map<string, CacheEntry> = new Map()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() })
}

// Also persist to sessionStorage for page refreshes
function persistCache(workspaceId: string, data: any) {
  try {
    const cacheData = {
      workspaceId,
      data,
      timestamp: Date.now()
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    // Ignore storage errors
  }
}

function getPersistedCache(workspaceId: string): any | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { workspaceId: cachedId, data, timestamp } = JSON.parse(cached)
    if (cachedId !== workspaceId) return null
    if (Date.now() - timestamp > CACHE_TTL) return null
    
    return data
  } catch (e) {
    return null
  }
}

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
  created_at?: string
  updated_at?: string
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

interface UseConnectionsPageReturn {
  // Workspaces
  workspaces: Workspace[]
  selectedWorkspace: Workspace | null
  setSelectedWorkspace: (workspace: Workspace | null) => void
  
  // Connections data
  connectionsData: WorkspaceConnectionsData | null
  
  // Loading states
  isLoading: boolean
  isLoadingConnections: boolean
  
  // Error
  error: string | null
  
  // Actions
  refresh: () => Promise<void>
  
  // Convenience accessors
  whatsappSessions: WhatsAppSession[]
  widgets: ChatWidget[]
  ecommerceConnections: EcommerceConnection[]
  webhooks: Webhook[]
}

/**
 * Unified hook that loads workspaces AND connections in parallel
 * With client-side caching for instant subsequent loads
 */
export function useConnectionsPage(): UseConnectionsPageReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLoadDone = useRef(false)
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspaceState] = useState<Workspace | null>(null)
  const [connectionsData, setConnectionsData] = useState<WorkspaceConnectionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load everything on mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      loadInitialData()
    }
  }, [])

  const loadInitialData = async () => {
    setError(null)

    // Get workspace ID from URL or localStorage
    const urlWorkspaceId = searchParams.get('workspace')
    const savedWorkspaceId = urlWorkspaceId || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)

    // Try to load from cache first for instant display
    if (savedWorkspaceId) {
      const cachedWorkspaces = getCached<Workspace[]>('workspaces')
      const cachedConnections = getCached<WorkspaceConnectionsData>(`connections-${savedWorkspaceId}`) 
        || getPersistedCache(savedWorkspaceId)
      
      if (cachedWorkspaces && cachedConnections) {
        // Instant load from cache!
        setWorkspaces(cachedWorkspaces)
        setConnectionsData(cachedConnections)
        const workspace = cachedWorkspaces.find(w => w.id === savedWorkspaceId)
        if (workspace) {
          setSelectedWorkspaceState(workspace)
        }
        setIsLoading(false)
        
        // Revalidate in background (stale-while-revalidate pattern)
        revalidateInBackground(savedWorkspaceId)
        return
      }
    }

    setIsLoading(true)

    try {
      // If we have a workspace ID, load workspaces AND connections in parallel
      if (savedWorkspaceId) {
        const [workspacesResponse, connectionsResponse] = await Promise.all([
          ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces'),
          ApiClient.request<WorkspaceConnectionsData>(`/api/workspaces/${savedWorkspaceId}/connections`)
        ])

        if (workspacesResponse.success && workspacesResponse.data?.workspaces) {
          const list = workspacesResponse.data.workspaces
          setWorkspaces(list)
          setCache('workspaces', list)

          // Find and set the selected workspace
          const workspace = list.find(w => w.id === savedWorkspaceId)
          if (workspace) {
            setSelectedWorkspaceState(workspace)
            localStorage.setItem(STORAGE_KEY, workspace.id)
          } else if (list.length > 0) {
            // Fallback to first workspace
            setSelectedWorkspaceState(list[0])
            localStorage.setItem(STORAGE_KEY, list[0].id)
          }
        }

        if (connectionsResponse.success && connectionsResponse.data) {
          setConnectionsData(connectionsResponse.data)
          setCache(`connections-${savedWorkspaceId}`, connectionsResponse.data)
          persistCache(savedWorkspaceId, connectionsResponse.data)
        }
      } else {
        // No saved workspace, just load workspaces
        const workspacesResponse = await ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces')
        
        if (workspacesResponse.success && workspacesResponse.data?.workspaces) {
          const list = workspacesResponse.data.workspaces
          setWorkspaces(list)
          setCache('workspaces', list)

          // Auto-select first workspace and load its connections
          if (list.length > 0) {
            setSelectedWorkspaceState(list[0])
            localStorage.setItem(STORAGE_KEY, list[0].id)
            
            // Load connections for first workspace
            const connectionsResponse = await ApiClient.request<WorkspaceConnectionsData>(
              `/api/workspaces/${list[0].id}/connections`
            )
            if (connectionsResponse.success && connectionsResponse.data) {
              setConnectionsData(connectionsResponse.data)
              setCache(`connections-${list[0].id}`, connectionsResponse.data)
              persistCache(list[0].id, connectionsResponse.data)
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading initial data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Background revalidation (stale-while-revalidate)
  const revalidateInBackground = async (workspaceId: string) => {
    try {
      const [workspacesResponse, connectionsResponse] = await Promise.all([
        ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces'),
        ApiClient.request<WorkspaceConnectionsData>(`/api/workspaces/${workspaceId}/connections`)
      ])

      if (workspacesResponse.success && workspacesResponse.data?.workspaces) {
        const list = workspacesResponse.data.workspaces
        setWorkspaces(list)
        setCache('workspaces', list)
      }

      if (connectionsResponse.success && connectionsResponse.data) {
        setConnectionsData(connectionsResponse.data)
        setCache(`connections-${workspaceId}`, connectionsResponse.data)
        persistCache(workspaceId, connectionsResponse.data)
      }
    } catch (err) {
      // Silent fail for background revalidation
      console.warn('Background revalidation failed:', err)
    }
  }

  // Handle workspace change
  const setSelectedWorkspace = useCallback(async (workspace: Workspace | null) => {
    if (!workspace) {
      setSelectedWorkspaceState(null)
      setConnectionsData(null)
      return
    }

    setSelectedWorkspaceState(workspace)
    localStorage.setItem(STORAGE_KEY, workspace.id)
    
    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set('workspace', workspace.id)
    router.replace(url.pathname + url.search)

    // Try cache first for instant switch
    const cachedConnections = getCached<WorkspaceConnectionsData>(`connections-${workspace.id}`)
    if (cachedConnections) {
      setConnectionsData(cachedConnections)
      // Revalidate in background
      revalidateConnectionsInBackground(workspace.id)
      return
    }

    // Load connections for new workspace
    setIsLoadingConnections(true)
    try {
      const response = await ApiClient.request<WorkspaceConnectionsData>(
        `/api/workspaces/${workspace.id}/connections`
      )
      if (response.success && response.data) {
        setConnectionsData(response.data)
        setCache(`connections-${workspace.id}`, response.data)
        persistCache(workspace.id, response.data)
      }
    } catch (err: any) {
      console.error('Error loading connections:', err)
    } finally {
      setIsLoadingConnections(false)
    }
  }, [router])

  // Background revalidation for workspace switch
  const revalidateConnectionsInBackground = async (workspaceId: string) => {
    try {
      const response = await ApiClient.request<WorkspaceConnectionsData>(
        `/api/workspaces/${workspaceId}/connections`
      )
      if (response.success && response.data) {
        setConnectionsData(response.data)
        setCache(`connections-${workspaceId}`, response.data)
        persistCache(workspaceId, response.data)
      }
    } catch (err) {
      console.warn('Background revalidation failed:', err)
    }
  }

  // Refresh current workspace connections (and update cache)
  const refresh = useCallback(async () => {
    if (!selectedWorkspace) return

    setIsLoadingConnections(true)
    try {
      const response = await ApiClient.request<WorkspaceConnectionsData>(
        `/api/workspaces/${selectedWorkspace.id}/connections`
      )
      if (response.success && response.data) {
        setConnectionsData(response.data)
        setCache(`connections-${selectedWorkspace.id}`, response.data)
        persistCache(selectedWorkspace.id, response.data)
        // Update selected workspace with fresh data
        setSelectedWorkspaceState(response.data.workspace)
      }
    } catch (err: any) {
      console.error('Error refreshing connections:', err)
    } finally {
      setIsLoadingConnections(false)
    }
  }, [selectedWorkspace])

  return {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    connectionsData,
    isLoading,
    isLoadingConnections,
    error,
    refresh,
    // Convenience accessors
    whatsappSessions: connectionsData?.whatsapp?.sessions || [],
    widgets: connectionsData?.widgets || [],
    ecommerceConnections: connectionsData?.ecommerce || [],
    webhooks: connectionsData?.webhooks || []
  }
}

// Keep the old hook for backwards compatibility
export function useWorkspaceConnections(workspaceId: string | null) {
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
    workspace: data?.workspace || null,
    whatsappSessions: data?.whatsapp?.sessions || [],
    widgets: data?.widgets || [],
    ecommerceConnections: data?.ecommerce || [],
    webhooks: data?.webhooks || []
  }
}
