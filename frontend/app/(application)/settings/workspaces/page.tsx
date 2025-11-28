"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Crown
} from "lucide-react"
import Link from "next/link"

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

export default function WorkspacesPage() {
  const [data, setData] = useState<WorkspacesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true)
      const response = await ApiClient.request<{ data: WorkspacesData }>('/api/workspaces')
      if (response.success && response.data) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
      toast.error('Failed to load workspaces')
    } finally {
      setIsLoading(false)
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
        body: JSON.stringify({ name: editName.trim() })
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your workspaces and their connections
          </p>
        </div>
        
        {/* Usage Badge */}
        {data && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {data.limits.used} / {data.limits.max}
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

      {/* Create Workspace Form */}
      {showCreateForm ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Workspace</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g., My Business, Client Name..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                placeholder="Brief description of this workspace"
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={isCreating}
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
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Workspace
          </Button>
        )
      )}

      {/* Workspaces List */}
      <div className="space-y-4">
        {data?.workspaces.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first workspace to start configuring connections and chatbots.
            </p>
            {data?.limits.canCreate && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workspace
              </Button>
            )}
          </div>
        ) : (
          data?.workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingId === workspace.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(workspace.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {workspace.name}
                        </h3>
                      </div>
                      {workspace.description && (
                        <p className="text-sm text-gray-500 mt-1 ml-7">
                          {workspace.description}
                        </p>
                      )}
                    </>
                  )}

                  {/* Connection Status */}
                  <div className="flex items-center gap-4 mt-4 ml-7">
                    <div className={`flex items-center gap-2 text-sm ${
                      workspace.whatsapp_session_id ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <Smartphone className="w-4 h-4" />
                      <span>
                        {workspace.whatsapp_session_id ? 'WhatsApp connected' : 'No WhatsApp'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${
                      workspace.web_widget_id ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <Globe className="w-4 h-4" />
                      <span>
                        {workspace.web_widget_id ? 'Web Widget active' : 'No Web Widget'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {editingId !== workspace.id && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(workspace.id)
                        setEditName(workspace.name)
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {data && data.workspaces.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(workspace.id)}
                        disabled={deletingId === workspace.id}
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
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                {!workspace.whatsapp_session_id && (
                  <Link href={`/settings/connections?workspace=${workspace.id}`}>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Connect WhatsApp
                    </Button>
                  </Link>
                )}
                {!workspace.web_widget_id && (
                  <Link href={`/settings/connections?workspace=${workspace.id}&tab=web`}>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                      <Globe className="w-4 h-4 mr-2" />
                      Create Web Widget
                    </Button>
                  </Link>
                )}
                {(workspace.whatsapp_session_id || workspace.web_widget_id) && (
                  <Link href={`/settings/chatbot?workspace=${workspace.id}`}>
                    <Button size="sm" variant="outline">
                      Configure Chatbot
                    </Button>
                  </Link>
                )}
              </div>
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
              Each workspace can have one WhatsApp connection and one Web Widget. 
              Use workspaces to separate different businesses, clients, or projects.
              All chatbot settings and conversations are isolated per workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
