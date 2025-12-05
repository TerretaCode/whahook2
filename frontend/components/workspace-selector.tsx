"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ApiClient } from "@/lib/api-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  Loader2, 
  Plus,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
  is_owner?: boolean
  is_member?: boolean
  member_role?: string
  member_permissions?: Record<string, boolean>
}

interface WorkspaceSelectorProps {
  onWorkspaceChange?: (workspace: Workspace | null) => void
  showCreateButton?: boolean
  className?: string
}

const STORAGE_KEY = 'selected-workspace-id'

export function WorkspaceSelector({ 
  onWorkspaceChange, 
  showCreateButton = true,
  className = ""
}: WorkspaceSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const initialLoadDone = useRef(false)

  // Handle URL param for workspace
  useEffect(() => {
    const urlWorkspaceId = searchParams.get('workspace')
    if (urlWorkspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === urlWorkspaceId)
      if (workspace) {
        setSelectedId(urlWorkspaceId)
        localStorage.setItem(STORAGE_KEY, urlWorkspaceId)
        onWorkspaceChange?.(workspace)
      }
    }
  }, [searchParams, workspaces, onWorkspaceChange])

  const loadWorkspaces = useCallback(async () => {
    try {
      const response = await ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces')
      console.log('WorkspaceSelector response:', response)
      
      if (response.success && response.data?.workspaces) {
        const list = response.data.workspaces
        setWorkspaces(list)
        
        // Try to restore selected workspace
        const urlWorkspaceId = searchParams.get('workspace')
        const savedId = urlWorkspaceId || localStorage.getItem(STORAGE_KEY)
        
        if (savedId && list.find(w => w.id === savedId)) {
          setSelectedId(savedId)
          const workspace = list.find(w => w.id === savedId)
          if (workspace) {
            onWorkspaceChange?.(workspace)
          }
        } else if (list.length > 0) {
          // Auto-select first workspace
          setSelectedId(list[0].id)
          localStorage.setItem(STORAGE_KEY, list[0].id)
          onWorkspaceChange?.(list[0])
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    } finally {
      setIsInitialLoad(false)
    }
  }, [searchParams, onWorkspaceChange])

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      loadWorkspaces()
    }
  }, [loadWorkspaces])

  const handleChange = useCallback((workspaceId: string) => {
    setSelectedId(workspaceId)
    localStorage.setItem(STORAGE_KEY, workspaceId)
    
    const workspace = workspaces.find(w => w.id === workspaceId)
    onWorkspaceChange?.(workspace || null)
    
    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set('workspace', workspaceId)
    router.replace(url.pathname + url.search)
  }, [workspaces, onWorkspaceChange, router])

  if (isInitialLoad) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading workspaces...</span>
      </div>
    )
  }

  if (workspaces.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">No workspaces found</p>
            <p className="text-sm text-green-700 mt-1">
              Create a workspace first to configure connections and chatbots.
            </p>
            <Link href="/settings/workspaces">
              <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // If user only has access to one workspace (e.g., invited member), don't show selector
  // Just show the workspace name
  if (workspaces.length === 1) {
    const workspace = workspaces[0]
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building2 className={`w-4 h-4 ${workspace.is_owner ? 'text-green-600' : 'text-green-600'}`} />
        <span className="text-sm font-medium text-gray-700">{workspace.name}</span>
        {workspace.is_member && !workspace.is_owner && workspace.member_role && (
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
            {workspace.member_role}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Building2 className="w-4 h-4" />
        <span>Workspace:</span>
      </div>
      <Select value={selectedId || undefined} onValueChange={handleChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((workspace) => (
            <SelectItem key={workspace.id} value={workspace.id}>
              <div className="flex items-center gap-2">
                <Building2 className={`w-4 h-4 ${workspace.is_owner ? 'text-green-600' : 'text-green-600'}`} />
                <span>{workspace.name}</span>
                {workspace.is_member && !workspace.is_owner && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    {workspace.member_role}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showCreateButton && workspaces.some(w => w.is_owner) && (
        <Link href="/settings/workspaces">
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </Link>
      )}
    </div>
  )
}

// Hook to get current workspace
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const savedId = localStorage.getItem(STORAGE_KEY)
        if (!savedId) {
          setIsLoading(false)
          return
        }

        const response = await ApiClient.request<Workspace>(`/api/workspaces/${savedId}`)
        if (response.success && response.data) {
          setWorkspace(response.data)
        }
      } catch (error) {
        console.error('Error loading workspace:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkspace()
  }, [])

  return { workspace, isLoading, setWorkspace }
}

