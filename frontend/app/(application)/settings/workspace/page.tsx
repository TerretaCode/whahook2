"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Building2, 
  Loader2, 
  Save,
  Users,
  QrCode,
  Palette,
  Settings
} from 'lucide-react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'
import { WorkspaceMembersSection } from './components/WorkspaceMembersSection'
import { ConnectionLinksSection } from './components/ConnectionLinksSection'
import { WhiteLabelSection } from './components/WhiteLabelSection'

interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
  white_label?: Record<string, unknown>
  created_at: string
}

type TabType = 'general' | 'members' | 'remote-qr' | 'white-label'

function WorkspaceSettingsContent() {
  const searchParams = useSearchParams()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [userPlan, setUserPlan] = useState('trial')

  // Load workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await ApiClient.request<{ data: { workspaces: Workspace[], plan: string } }>('/api/workspaces')
        const data = response.data?.data
        setWorkspaces(data?.workspaces || [])
        setUserPlan(response.data?.data?.plan || 'trial')
        
        // Select workspace from URL or first one
        const urlWorkspaceId = searchParams.get('workspace')
        const savedId = localStorage.getItem('selected-workspace-id')
        const targetId = urlWorkspaceId || savedId
        
        const workspace = data?.workspaces?.find((w: Workspace) => w.id === targetId) || data?.workspaces?.[0]
        if (workspace) {
          setCurrentWorkspace(workspace)
          setName(workspace.name || '')
          setDescription(workspace.description || '')
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchWorkspaces()
  }, [searchParams])

  const _handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
      setName(workspace.name || '')
      setDescription(workspace.description || '')
      localStorage.setItem('selected-workspace-id', workspaceId)
    }
  }

  const refreshWorkspaces = async () => {
    try {
      const response = await ApiClient.request<{ data: { workspaces: Workspace[] } }>('/api/workspaces')
      setWorkspaces(response.data?.data?.workspaces || [])
      if (currentWorkspace) {
        const updated = response.data?.data?.workspaces?.find((w: Workspace) => w.id === currentWorkspace.id)
        if (updated) setCurrentWorkspace(updated)
      }
    } catch (error) {
      console.error('Error refreshing workspaces:', error)
    }
  }

  const handleSave = async () => {
    if (!currentWorkspace) return

    setIsSaving(true)
    try {
      await ApiClient.request(
        `/api/workspaces/${currentWorkspace.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name, description })
        }
      )
      toast.success('Saved!', 'Workspace settings updated')
      refreshWorkspaces()
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings },
    { id: 'members' as TabType, label: 'Team', icon: Users },
    { id: 'remote-qr' as TabType, label: 'Remote QR', icon: QrCode },
    { id: 'white-label' as TabType, label: 'White-Label', icon: Palette },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">No workspace selected</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workspace Settings
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your workspace configuration, team members, and branding
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Workspace Name */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                General Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Workspace Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Business"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this workspace"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Workspace Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Workspace Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ID:</span>
                  <p className="font-mono text-gray-700 dark:text-gray-300 truncate">
                    {currentWorkspace.id}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    {new Date(currentWorkspace.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">WhatsApp:</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    {currentWorkspace.whatsapp_session_id ? '✅ Connected' : '❌ Not connected'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Web Widget:</span>
                  <p className="text-gray-700 dark:text-gray-300">
                    {currentWorkspace.web_widget_id ? '✅ Configured' : '❌ Not configured'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <WorkspaceMembersSection workspaceId={currentWorkspace.id} />
        )}

        {activeTab === 'remote-qr' && (
          <ConnectionLinksSection 
            workspaceId={currentWorkspace.id}
            hasExistingConnection={!!currentWorkspace.whatsapp_session_id}
          />
        )}

        {activeTab === 'white-label' && (
          <WhiteLabelSection 
            workspaceId={currentWorkspace.id}
            initialSettings={currentWorkspace.white_label as any}
            userPlan={userPlan}
          />
        )}
      </div>
    </div>
  )
}

export default function WorkspaceSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    }>
      <WorkspaceSettingsContent />
    </Suspense>
  )
}
