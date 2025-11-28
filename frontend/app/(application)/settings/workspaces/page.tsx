"use client"

import { useState, useEffect, useRef } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/lib/toast"
import {
  Loader2,
  Plus,
  Building2,
  Smartphone,
  Globe,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Crown,
  Link as LinkIcon,
  QrCode,
  Settings,
  Copy,
  ExternalLink,
  Key,
  Palette,
  ChevronDown,
  ChevronUp,
  Users
} from "lucide-react"
import Link from "next/link"
import { WorkspacesSkeleton } from "@/components/skeletons/SettingsSkeletons"
import { getCached, setCache, getFromSession, persistToSession } from "@/lib/cache"

interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
  created_at: string
  updated_at: string
}

interface WorkspacesData {
  workspaces: Workspace[]
  limits: {
    max: number
    used: number
    canCreate: boolean
  }
  plan: string
}

const CACHE_KEY = 'workspaces-data'

export default function WorkspacesPage() {
  const [data, setData] = useState<WorkspacesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialLoadDone = useRef(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Plan features
  const isProfessionalOrHigher = data?.plan === 'professional' || data?.plan === 'enterprise'
  const isEnterprise = data?.plan === 'enterprise'

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      loadWorkspaces()
    }
  }, [])

  const loadWorkspaces = async () => {
    // Try cache first
    const cached = getCached<WorkspacesData>(CACHE_KEY) || getFromSession<WorkspacesData>(CACHE_KEY)
    if (cached) {
      setData(cached)
      setIsLoading(false)
      // Revalidate in background
      revalidateInBackground()
      return
    }

    try {
      setIsLoading(true)
      const response = await ApiClient.request<WorkspacesData>('/api/workspaces')
      console.log('Workspaces response:', response)
      if (response.success && response.data) {
        setData(response.data)
        setCache(CACHE_KEY, response.data)
        persistToSession(CACHE_KEY, response.data)
      } else {
        console.error('Failed to load workspaces:', response)
        // Set default data so UI shows create button
        setData({
          workspaces: [],
          limits: { max: 1, used: 0, canCreate: true },
          plan: 'trial'
        })
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
      toast.error('Failed to load workspaces')
      // Set default data so UI shows create button
      setData({
        workspaces: [],
        limits: { max: 1, used: 0, canCreate: true },
        plan: 'trial'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const revalidateInBackground = async () => {
    try {
      const response = await ApiClient.request<WorkspacesData>('/api/workspaces')
      if (response.success && response.data) {
        setData(response.data)
        setCache(CACHE_KEY, response.data)
        persistToSession(CACHE_KEY, response.data)
      }
    } catch (error) {
      console.warn('Background revalidation failed:', error)
    }
  }

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Workspace name is required')
      return
    }

    try {
      setIsCreating(true)
      const response = await ApiClient.request('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: newWorkspaceName.trim(),
          description: newWorkspaceDescription.trim() || null
        })
      })

      if (response.success) {
        toast.success('Workspace created!')
        setNewWorkspaceName("")
        setNewWorkspaceDescription("")
        setShowCreateForm(false)
        loadWorkspaces()
      } else {
        toast.error(response.error || 'Failed to create workspace')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Workspace name is required')
      return
    }

    try {
      const response = await ApiClient.request(`/api/workspaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          name: editName.trim(),
          description: editDescription.trim() || null
        })
      })

      if (response.success) {
        toast.success('Workspace updated!')
        setEditingId(null)
        loadWorkspaces()
      } else {
        toast.error(response.error || 'Failed to update workspace')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update workspace')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace? All associated data will be lost.')) {
      return
    }

    try {
      setDeletingId(id)
      const response = await ApiClient.request(`/api/workspaces/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        toast.success('Workspace deleted!')
        loadWorkspaces()
      } else {
        toast.error(response.error || 'Failed to delete workspace')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete workspace')
    } finally {
      setDeletingId(null)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const generateClientAccessLink = (workspaceId: string) => {
    // TODO: Implement actual token generation on backend
    return `${window.location.origin}/w/${workspaceId.slice(0, 8)}`
  }

  const generateQRConnectionLink = (workspaceId: string) => {
    // TODO: Implement actual token generation on backend
    return `${window.location.origin}/connect/${workspaceId.slice(0, 8)}`
  }

  if (isLoading) {
    return <WorkspacesSkeleton />
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your workspaces, connections, and client access
          </p>
        </div>
        
        {/* Usage Badge */}
        {data && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {data.limits.used} / {data.limits.max} workspaces
            </span>
          </div>
        )}
      </div>

      {/* Plan Limit Warning */}
      {data && !data.limits.canCreate && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Workspace limit reached
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Your {data.plan} plan allows {data.limits.max} workspace{data.limits.max > 1 ? 's' : ''}.{' '}
              <Link href="/settings/billing" className="underline font-medium">
                Upgrade your plan
              </Link>{' '}
              to create more.
            </p>
          </div>
        </div>
      )}

      {/* Create Workspace Button/Form */}
      {showCreateForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Create New Workspace
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Workspace Name *</Label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g., My Business, Client Name, Restaurant ABC..."
                className="mt-1"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be visible to you and your team
              </p>
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                placeholder="Brief description of this workspace, client details, notes..."
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newWorkspaceName.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workspace
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewWorkspaceName("")
                  setNewWorkspaceDescription("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        data?.limits.canCreate && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Workspace
          </Button>
        )
      )}

      {/* Workspaces List */}
      <div className="space-y-4">
        {data?.workspaces.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workspaces yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first workspace to start connecting WhatsApp, configuring chatbots, and managing your clients.
            </p>
            {data?.limits.canCreate && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Workspace
              </Button>
            )}
          </div>
        ) : (
          data?.workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              {/* Workspace Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === workspace.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="max-w-md"
                          placeholder="Workspace name"
                          autoFocus
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="max-w-md"
                          placeholder="Description (optional)"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(workspace.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {workspace.name}
                            </h3>
                            {workspace.description && (
                              <p className="text-sm text-gray-500">
                                {workspace.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Connection Status Badges */}
                        <div className="flex items-center gap-3 mt-4">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                            workspace.whatsapp_session_id 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Smartphone className="w-4 h-4" />
                            <span>
                              {workspace.whatsapp_session_id ? 'WhatsApp Connected' : 'No WhatsApp'}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                            workspace.web_widget_id 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Globe className="w-4 h-4" />
                            <span>
                              {workspace.web_widget_id ? 'Web Widget Active' : 'No Web Widget'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== workspace.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(workspace.id)
                          setEditName(workspace.name)
                          setEditDescription(workspace.description || "")
                        }}
                        title="Edit workspace"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(expandedId === workspace.id ? null : workspace.id)}
                        title="More options"
                      >
                        {expandedId === workspace.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      {data && data.workspaces.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(workspace.id)}
                          disabled={deletingId === workspace.id}
                          title="Delete workspace"
                        >
                          {deletingId === workspace.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  {!workspace.whatsapp_session_id ? (
                    <Link href={`/settings/connections?workspace=${workspace.id}`}>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        <Smartphone className="w-4 h-4 mr-2" />
                        Connect WhatsApp
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/settings/chatbot?workspace=${workspace.id}`}>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Chatbot
                      </Button>
                    </Link>
                  )}
                  
                  {!workspace.web_widget_id ? (
                    <Link href={`/settings/connections?workspace=${workspace.id}&tab=web`}>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        <Globe className="w-4 h-4 mr-2" />
                        Create Web Widget
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/settings/chatbot?workspace=${workspace.id}&tab=web`}>
                      <Button size="sm" variant="outline">
                        <Globe className="w-4 h-4 mr-2" />
                        Web Widget Settings
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Expanded Options (Professional+ features) */}
              {expandedId === workspace.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-6">
                  {/* Client Access Link (Professional+) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-gray-900">Client Access Link</h4>
                      {!isProfessionalOrHigher && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          Professional+
                        </span>
                      )}
                    </div>
                    {isProfessionalOrHigher ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Share this link with your client so they can access their workspace dashboard.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={generateClientAccessLink(workspace.id)}
                            readOnly
                            className="flex-1 bg-gray-50"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generateClientAccessLink(workspace.id), 'Client access link')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(generateClientAccessLink(workspace.id), '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Upgrade to Professional to generate client access links.
                      </p>
                    )}
                  </div>

                  {/* Remote QR Connection (Professional+) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <QrCode className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium text-gray-900">Remote WhatsApp Connection</h4>
                      {!isProfessionalOrHigher && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          Professional+
                        </span>
                      )}
                    </div>
                    {isProfessionalOrHigher ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Send this link to your client so they can scan the QR code from their phone without being present.
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            value={generateQRConnectionLink(workspace.id)}
                            readOnly
                            className="flex-1 bg-gray-50"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generateQRConnectionLink(workspace.id), 'QR connection link')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Upgrade to Professional to enable remote WhatsApp connection.
                      </p>
                    )}
                  </div>

                  {/* API Key per Workspace (Professional+) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="w-5 h-5 text-orange-600" />
                      <h4 className="font-medium text-gray-900">Workspace API Key</h4>
                      {!isProfessionalOrHigher && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          Professional+
                        </span>
                      )}
                    </div>
                    {isProfessionalOrHigher ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Configure a separate AI API key for this workspace to track costs independently.
                        </p>
                        <Link href={`/settings/chatbot?workspace=${workspace.id}&tab=apikeys`}>
                          <Button size="sm" variant="outline">
                            <Key className="w-4 h-4 mr-2" />
                            Configure API Key
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Upgrade to Professional to configure API keys per workspace.
                      </p>
                    )}
                  </div>

                  {/* White-Label (Enterprise only) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-5 h-5 text-pink-600" />
                      <h4 className="font-medium text-gray-900">White-Label Branding</h4>
                      {!isEnterprise && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Enterprise
                        </span>
                      )}
                    </div>
                    {isEnterprise ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Customize branding for this workspace. Hide Whahook branding and use your own logo and colors.
                        </p>
                        <Button size="sm" variant="outline" disabled>
                          <Palette className="w-4 h-4 mr-2" />
                          Configure Branding (Coming Soon)
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Upgrade to Enterprise to customize branding and hide Whahook branding.
                      </p>
                    )}
                  </div>

                  {/* Custom Domain (Enterprise only) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">Custom Domain</h4>
                      {!isEnterprise && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Enterprise
                        </span>
                      )}
                    </div>
                    {isEnterprise ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Use your own domain for client access (e.g., panel.youragency.com).
                        </p>
                        <Button size="sm" variant="outline" disabled>
                          <Globe className="w-4 h-4 mr-2" />
                          Configure Domain (Coming Soon)
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Upgrade to Enterprise to use custom domains.
                      </p>
                    )}
                  </div>

                  {/* Team Members (Professional+) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-teal-600" />
                      <h4 className="font-medium text-gray-900">Team Members</h4>
                      {!isProfessionalOrHigher && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          Professional+
                        </span>
                      )}
                    </div>
                    {isProfessionalOrHigher ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Invite team members to this workspace with custom roles and permissions.
                        </p>
                        <Button size="sm" variant="outline" disabled>
                          <Users className="w-4 h-4 mr-2" />
                          Manage Team (Coming Soon)
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Upgrade to Professional to add team members.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Workspaces</p>
            <p>
              Each workspace represents a separate business or client. It includes its own WhatsApp connection, 
              Web Widget, chatbot configuration, and client database. Use workspaces to keep everything organized 
              and isolated per project.
            </p>
            <p className="mt-2">
              <strong>Tip:</strong> Click the expand button on any workspace to access advanced features like 
              client access links, remote QR connection, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
