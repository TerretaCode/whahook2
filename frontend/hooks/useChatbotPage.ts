import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ApiClient } from '@/lib/api-client'
import { getCached, setCache, getFromSession, persistToSession } from '@/lib/cache'

const STORAGE_KEY = 'selected-workspace-id'
const WORKSPACES_CACHE_KEY = 'chatbot-workspaces'

export interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
}

export interface WhatsAppSession {
  id: string
  session_id: string
  user_id: string
  workspace_id: string
  label: string
  phone_number: string | null
  status: string
  created_at: string
}

export interface EcommerceConnection {
  id: string
  platform: string
  name: string
  store_url: string
  status: string
}

export interface ChatbotConfig {
  id: string
  whatsapp_session_id: string
  api_key?: string
  has_api_key?: boolean
  provider: string
  model: string
  bot_name: string
  language: string
  tone: string
  auto_reply: boolean
  system_prompt: string
  custom_instructions: string
  fallback_message: string
  temperature: number
  max_tokens: number
  use_ecommerce_api: boolean
  ecommerce_connection_ids: string[]
  // ... other config fields
  [key: string]: any
}

export interface AIConfig {
  id: string
  provider: string
  model: string
  has_api_key: boolean
  created_at?: string
  updated_at?: string
}

export interface ChatWidget {
  id: string
  name: string
  domain: string
  primary_color: string
  is_active: boolean
  workspace_id: string
}

export interface WebChatbotConfig {
  id: string
  widget_id: string
  provider: string
  model: string
  has_api_key?: boolean
  bot_name: string
  auto_reply: boolean
  [key: string]: any
}

export interface ChatbotPageData {
  workspace: Workspace
  sessions: WhatsAppSession[]
  ecommerceConnections: EcommerceConnection[]
  chatbotConfigs: Record<string, ChatbotConfig>
  aiConfig: AIConfig | null
  widgets: ChatWidget[]
  webChatbotConfigs: Record<string, WebChatbotConfig>
}

interface UseChatbotPageReturn {
  // Workspaces
  workspaces: Workspace[]
  selectedWorkspace: Workspace | null
  setSelectedWorkspace: (workspace: Workspace | null) => void
  
  // Chatbot data for selected workspace
  chatbotData: ChatbotPageData | null
  
  // Loading states
  isLoading: boolean
  isLoadingChatbot: boolean
  
  // Error
  error: string | null
  
  // Actions
  refresh: () => Promise<void>
}

/**
 * Unified hook that loads workspaces AND chatbot data in parallel
 */
export function useChatbotPage(): UseChatbotPageReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLoadDone = useRef(false)
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspaceState] = useState<Workspace | null>(null)
  const [chatbotData, setChatbotData] = useState<ChatbotPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingChatbot, setIsLoadingChatbot] = useState(false)
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
      const cachedWorkspaces = getCached<Workspace[]>(WORKSPACES_CACHE_KEY) || getFromSession<Workspace[]>(WORKSPACES_CACHE_KEY)
      const cachedChatbot = getCached<ChatbotPageData>(`chatbot-${savedWorkspaceId}`) || getFromSession<ChatbotPageData>(`chatbot-${savedWorkspaceId}`)
      
      if (cachedWorkspaces && cachedChatbot) {
        // Instant load from cache!
        setWorkspaces(cachedWorkspaces)
        setChatbotData(cachedChatbot)
        const workspace = cachedWorkspaces.find(w => w.id === savedWorkspaceId)
        if (workspace) {
          setSelectedWorkspaceState(workspace)
        }
        setIsLoading(false)
        
        // Revalidate in background
        revalidateInBackground(savedWorkspaceId)
        return
      }
    }

    setIsLoading(true)

    try {
      // If we have a workspace ID, load workspaces AND chatbot data in parallel
      if (savedWorkspaceId) {
        const [workspacesResponse, chatbotResponse] = await Promise.all([
          ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces'),
          ApiClient.request<ChatbotPageData>(`/api/workspaces/${savedWorkspaceId}/chatbot`)
        ])

        if (workspacesResponse.success && workspacesResponse.data?.workspaces) {
          const list = workspacesResponse.data.workspaces
          setWorkspaces(list)
          setCache(WORKSPACES_CACHE_KEY, list)
          persistToSession(WORKSPACES_CACHE_KEY, list)

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

        if (chatbotResponse.success && chatbotResponse.data) {
          setChatbotData(chatbotResponse.data)
          setCache(`chatbot-${savedWorkspaceId}`, chatbotResponse.data)
          persistToSession(`chatbot-${savedWorkspaceId}`, chatbotResponse.data)
        }
      } else {
        // No saved workspace, just load workspaces
        const workspacesResponse = await ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces')
        
        if (workspacesResponse.success && workspacesResponse.data?.workspaces) {
          const list = workspacesResponse.data.workspaces
          setWorkspaces(list)
          setCache(WORKSPACES_CACHE_KEY, list)
          persistToSession(WORKSPACES_CACHE_KEY, list)

          // Auto-select first workspace and load its chatbot data
          if (list.length > 0) {
            setSelectedWorkspaceState(list[0])
            localStorage.setItem(STORAGE_KEY, list[0].id)
            
            // Load chatbot data for first workspace
            const chatbotResponse = await ApiClient.request<ChatbotPageData>(
              `/api/workspaces/${list[0].id}/chatbot`
            )
            if (chatbotResponse.success && chatbotResponse.data) {
              setChatbotData(chatbotResponse.data)
              setCache(`chatbot-${list[0].id}`, chatbotResponse.data)
              persistToSession(`chatbot-${list[0].id}`, chatbotResponse.data)
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

  // Background revalidation
  const revalidateInBackground = async (workspaceId: string) => {
    try {
      const [workspacesResponse, chatbotResponse] = await Promise.all([
        ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces'),
        ApiClient.request<ChatbotPageData>(`/api/workspaces/${workspaceId}/chatbot`)
      ])

      if (workspacesResponse.success && workspacesResponse.data?.workspaces) {
        const list = workspacesResponse.data.workspaces
        setWorkspaces(list)
        setCache(WORKSPACES_CACHE_KEY, list)
        persistToSession(WORKSPACES_CACHE_KEY, list)
      }

      if (chatbotResponse.success && chatbotResponse.data) {
        setChatbotData(chatbotResponse.data)
        setCache(`chatbot-${workspaceId}`, chatbotResponse.data)
        persistToSession(`chatbot-${workspaceId}`, chatbotResponse.data)
      }
    } catch (err) {
      console.warn('Background revalidation failed:', err)
    }
  }

  // Handle workspace change
  const setSelectedWorkspace = useCallback(async (workspace: Workspace | null) => {
    if (!workspace) {
      setSelectedWorkspaceState(null)
      setChatbotData(null)
      return
    }

    setSelectedWorkspaceState(workspace)
    localStorage.setItem(STORAGE_KEY, workspace.id)
    
    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set('workspace', workspace.id)
    router.replace(url.pathname + url.search)

    // Try cache first for instant switch
    const cachedChatbot = getCached<ChatbotPageData>(`chatbot-${workspace.id}`)
    if (cachedChatbot) {
      setChatbotData(cachedChatbot)
      // Revalidate in background
      revalidateChatbotInBackground(workspace.id)
      return
    }

    // Load chatbot data for new workspace
    setIsLoadingChatbot(true)
    try {
      const response = await ApiClient.request<ChatbotPageData>(
        `/api/workspaces/${workspace.id}/chatbot`
      )
      if (response.success && response.data) {
        setChatbotData(response.data)
        setCache(`chatbot-${workspace.id}`, response.data)
        persistToSession(`chatbot-${workspace.id}`, response.data)
      }
    } catch (err: any) {
      console.error('Error loading chatbot data:', err)
    } finally {
      setIsLoadingChatbot(false)
    }
  }, [router])

  // Background revalidation for workspace switch
  const revalidateChatbotInBackground = async (workspaceId: string) => {
    try {
      const response = await ApiClient.request<ChatbotPageData>(
        `/api/workspaces/${workspaceId}/chatbot`
      )
      if (response.success && response.data) {
        setChatbotData(response.data)
        setCache(`chatbot-${workspaceId}`, response.data)
        persistToSession(`chatbot-${workspaceId}`, response.data)
      }
    } catch (err) {
      console.warn('Background revalidation failed:', err)
    }
  }

  // Refresh current workspace chatbot data
  const refresh = useCallback(async () => {
    if (!selectedWorkspace) return

    setIsLoadingChatbot(true)
    try {
      const response = await ApiClient.request<ChatbotPageData>(
        `/api/workspaces/${selectedWorkspace.id}/chatbot`
      )
      if (response.success && response.data) {
        setChatbotData(response.data)
        setCache(`chatbot-${selectedWorkspace.id}`, response.data)
        persistToSession(`chatbot-${selectedWorkspace.id}`, response.data)
      }
    } catch (err: any) {
      console.error('Error refreshing chatbot data:', err)
    } finally {
      setIsLoadingChatbot(false)
    }
  }, [selectedWorkspace])

  return {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    chatbotData,
    isLoading,
    isLoadingChatbot,
    error,
    refresh
  }
}
