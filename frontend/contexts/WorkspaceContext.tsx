"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ApiClient } from '@/lib/api-client'
import { useAuth } from './AuthContext'

interface WorkspacePermissions {
  dashboard: boolean
  messages: boolean
  clients: boolean
  campaigns: boolean
  settings: boolean
  ai_costs: boolean
}

interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
  is_owner?: boolean
  is_member?: boolean
  member_role?: string
  member_permissions?: WorkspacePermissions
}

interface WorkspaceContextType {
  workspace: Workspace | null
  workspaces: Workspace[]
  permissions: WorkspacePermissions
  isOwner: boolean
  isLoading: boolean
  setWorkspace: (workspace: Workspace | null) => void
  refreshWorkspaces: () => Promise<void>
  hasPermission: (permission: keyof WorkspacePermissions) => boolean
}

const DEFAULT_PERMISSIONS: WorkspacePermissions = {
  dashboard: true,
  messages: true,
  clients: true,
  campaigns: true,
  settings: true,
  ai_costs: true
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const STORAGE_KEY = 'selected-workspace-id'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const { user, isLoading: authLoading } = useAuth()

  // Pages where we should NOT load workspaces
  const isAuthPage = 
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/change-password') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/connect') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms')

  const loadWorkspaces = async () => {
    // Don't load if on auth page or no user
    if (isAuthPage || !user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await ApiClient.request<{ workspaces: Workspace[] }>('/api/workspaces')
      
      if (response.success && response.data?.workspaces) {
        const list = response.data.workspaces
        setWorkspaces(list)
        
        // Try to restore selected workspace
        const savedId = localStorage.getItem(STORAGE_KEY)
        
        if (savedId) {
          const saved = list.find(w => w.id === savedId)
          if (saved) {
            setWorkspaceState(saved)
            return
          }
        }
        
        // Auto-select first workspace
        if (list.length > 0) {
          setWorkspaceState(list[0])
          localStorage.setItem(STORAGE_KEY, list[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only load workspaces when auth is done and user exists
    if (!authLoading) {
      loadWorkspaces()
    }
  }, [user, authLoading, isAuthPage])

  const setWorkspace = (ws: Workspace | null) => {
    setWorkspaceState(ws)
    if (ws) {
      localStorage.setItem(STORAGE_KEY, ws.id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Calculate permissions based on workspace ownership/membership
  const permissions: WorkspacePermissions = workspace?.is_owner 
    ? DEFAULT_PERMISSIONS 
    : workspace?.member_permissions || DEFAULT_PERMISSIONS

  const isOwner = workspace?.is_owner === true

  const hasPermission = (permission: keyof WorkspacePermissions): boolean => {
    if (isOwner) return true
    return permissions[permission] ?? false
  }

  return (
    <WorkspaceContext.Provider value={{
      workspace,
      workspaces,
      permissions,
      isOwner,
      isLoading,
      setWorkspace,
      refreshWorkspaces: loadWorkspaces,
      hasPermission
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}

// Hook for checking permissions
export function usePermissions() {
  const { permissions, isOwner, hasPermission } = useWorkspaceContext()
  return { permissions, isOwner, hasPermission }
}
