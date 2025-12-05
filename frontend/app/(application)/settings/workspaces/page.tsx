"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslations } from 'next-intl'
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  ChevronDown,
  ChevronUp,
  Users,
  Bot
} from "lucide-react"
import Link from "next/link"
import { WorkspacesSkeleton } from "@/components/skeletons/SettingsSkeletons"
import { WorkspaceMembersSection } from "../workspace/components/WorkspaceMembersSection"
import { getCached, setCache, getFromSession, persistToSession } from "@/lib/cache"

interface Workspace {
  id: string
  name: string
  description: string | null
  whatsapp_session_id: string | null
  web_widget_id: string | null
  white_label?: Record<string, unknown>
  access_token?: string
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
  const t = useTranslations('settings.workspaces')
  const tCommon = useTranslations('common')
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

  const loadWorkspaces = useCallback(async () => {
    // Try cache first
    const cached = getCached<WorkspacesData>(CACHE_KEY) || getFromSession<WorkspacesData>(CACHE_KEY)
    if (cached) {
      setData(cached)
      setIsLoading(false)
      // Revalidate in background
      ApiClient.request<WorkspacesData>('/api/workspaces').then(response => {
        if (response.success && response.data) {
          setData(response.data)
          setCache(CACHE_KEY, response.data)
          persistToSession(CACHE_KEY, response.data)
        }
      }).catch(() => {})
      return
    }

    try {
      setIsLoading(true)
      const response = await ApiClient.request<WorkspacesData>('/api/workspaces')
      if (response.success && response.data) {
        setData(response.data)
        setCache(CACHE_KEY, response.data)
        persistToSession(CACHE_KEY, response.data)
      } else {
        console.error('Failed to load workspaces:', response)
        setData({
          workspaces: [],
          limits: { max: 1, used: 0, canCreate: true },
          plan: 'trial'
        })
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
      toast.error(t('loadError'))
      setData({
        workspaces: [],
        limits: { max: 1, used: 0, canCreate: true },
        plan: 'trial'
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCreate = useCallback(async () => {
    if (!newWorkspaceName.trim()) {
      toast.error(t('nameRequired'))
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
        toast.success(t('created'))
        setNewWorkspaceName("")
        setNewWorkspaceDescription("")
        setShowCreateForm(false)
        loadWorkspaces()
      } else {
        toast.error(response.error || t('createError'))
      }
    } catch (error: any) {
      toast.error(error.message || t('createError'))
    } finally {
      setIsCreating(false)
    }
  }, [newWorkspaceName, newWorkspaceDescription])

  const handleUpdate = useCallback(async (id: string) => {
    if (!editName.trim()) {
      toast.error(t('nameRequired'))
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
        toast.success(t('updated'))
        setEditingId(null)
        loadWorkspaces()
      } else {
        toast.error(response.error || t('updateError'))
      }
    } catch (error: any) {
      toast.error(error.message || t('updateError'))
    }
  }, [editName, editDescription])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t('confirmDelete'))) {
      return
    }

    try {
      setDeletingId(id)
      const response = await ApiClient.request(`/api/workspaces/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        toast.success(t('deleted'))
        loadWorkspaces()
      } else {
        toast.error(response.error || t('deleteError'))
      }
    } catch (error: any) {
      toast.error(error.message || t('deleteError'))
    } finally {
      setDeletingId(null)
    }
  }, [loadWorkspaces])

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      loadWorkspaces()
    }
  }, [loadWorkspaces])

  if (isLoading) {
    return <WorkspacesSkeleton />
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('subtitle')}
          </p>
        </div>
        
        {/* Usage Badge */}
        {data && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('usage', { used: data.limits.used, max: data.limits.max })}
            </span>
          </div>
        )}
      </div>

      {/* Plan Limit Warning */}
      {data && !data.limits.canCreate && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Crown className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              {t('limitReached')}
            </p>
            <p className="text-sm text-green-700 mt-1">
              {t('limitDescription', { plan: data.plan, max: data.limits.max })}{' '}
              <Link href="/settings/billing" className="underline font-medium">
                {t('upgradePlan')}
              </Link>{' '}
              {t('toCreateMore')}
            </p>
          </div>
        </div>
      )}

      {/* Create Workspace Button/Form */}
      {showCreateForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            {t('createNew')}
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('nameLabel')} *</Label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="mt-1"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('nameHint')}
              </p>
            </div>
            <div>
              <Label htmlFor="description">{t('descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newWorkspaceName.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {tCommon('loading')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('create')}
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
                {tCommon('cancel')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        data?.limits.canCreate && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('create')}
          </Button>
        )
      )}

      {/* Workspaces List */}
      <div className="space-y-4">
        {data?.workspaces.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noWorkspaces')}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {t('noWorkspacesDescription')}
            </p>
            {data?.limits.canCreate && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('createFirst')}
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
                          placeholder={t('nameLabel')}
                          autoFocus
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="max-w-md"
                          placeholder={t('descriptionLabel')}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(workspace.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {tCommon('save')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            {tCommon('cancel')}
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
                              {workspace.whatsapp_session_id ? t('whatsappConnected') : t('noWhatsApp')}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                            workspace.web_widget_id 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Globe className="w-4 h-4" />
                            <span>
                              {workspace.web_widget_id ? t('webWidgetActive') : t('noWebWidget')}
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
                        {t('connectWhatsApp')}
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/settings/chatbot?workspace=${workspace.id}`}>
                      <Button size="sm" variant="outline">
                        <Bot className="w-4 h-4 mr-2" />
                        {t('configureChatbot')}
                      </Button>
                    </Link>
                  )}
                  
                  {!workspace.web_widget_id ? (
                    <Link href={`/settings/connections?workspace=${workspace.id}&tab=web`}>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        <Globe className="w-4 h-4 mr-2" />
                        {t('createWebWidget')}
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/settings/chatbot?workspace=${workspace.id}&tab=web`}>
                      <Button size="sm" variant="outline">
                        <Globe className="w-4 h-4 mr-2" />
                        {t('webWidgetSettings')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Expanded Settings - Members/Invitations */}
              {expandedId === workspace.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('membersAndInvitations')}</h3>
                      <p className="text-sm text-gray-600">
                        {t('membersDescription')}
                      </p>
                    </div>
                  </div>
                  <WorkspaceMembersSection workspaceId={workspace.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">{t('aboutWorkspaces')}</p>
            <p>
              {t('aboutDescription')}
            </p>
            <p className="mt-2">
              <strong>{t('tip')}:</strong> {t('tipDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

