"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Loader2, 
  Copy, 
  Check,
  Trash2,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'

interface ConnectionLink {
  id: string
  token: string
  status: 'pending' | 'connecting' | 'connected' | 'expired' | 'failed'
  expires_at: string
  connected_phone: string | null
  created_at: string
  connection_url?: string
}

interface ConnectionLinksSectionProps {
  workspaceId: string
  hasExistingConnection: boolean
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Waiting' },
  connecting: { icon: QrCode, color: 'text-blue-600 bg-blue-100', label: 'Connecting' },
  connected: { icon: CheckCircle2, color: 'text-green-600 bg-green-100', label: 'Connected' },
  expired: { icon: XCircle, color: 'text-gray-600 bg-gray-100', label: 'Expired' },
  failed: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Failed' }
}

export function ConnectionLinksSection({ workspaceId, hasExistingConnection }: ConnectionLinksSectionProps) {
  const [links, setLinks] = useState<ConnectionLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const fetchLinks = async () => {
    setIsLoading(true)
    try {
      const response = await ApiClient.request<{ data: ConnectionLink[] }>(
        `/api/workspaces/${workspaceId}/connection-links`
      )
      setLinks(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching connection links:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (workspaceId) {
      fetchLinks()
    }
  }, [workspaceId])

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const response = await ApiClient.request<{ data: ConnectionLink }>(
        `/api/workspaces/${workspaceId}/connection-links`,
        {
          method: 'POST',
          body: JSON.stringify({ expires_in_hours: 24 })
        }
      )

      toast.success('Created!', 'Connection link created successfully')
      fetchLinks()
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to create connection link')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this connection link?')) return

    try {
      await ApiClient.request(
        `/api/workspaces/${workspaceId}/connection-links/${linkId}`,
        { method: 'DELETE' }
      )
      toast.success('Deleted', 'Connection link has been deleted')
      fetchLinks()
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to delete connection link')
    }
  }

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/connect/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    toast.success('Copied!', 'Connection link copied to clipboard')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const openLink = (token: string) => {
    window.open(`${window.location.origin}/connect/${token}`, '_blank')
  }

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <QrCode className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Remote QR Connection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate links to connect WhatsApp remotely
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          disabled={isCreating || hasExistingConnection}
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
              Create Link
            </>
          )}
        </Button>
      </div>

      {hasExistingConnection && (
        <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ This workspace already has a WhatsApp connection. 
            Delete the existing connection first to create a new one.
          </p>
        </div>
      )}

      {/* Links List */}
      {links.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {links.map((link) => {
              const statusConfig = STATUS_CONFIG[link.status]
              const StatusIcon = statusConfig.icon

              return (
                <div key={link.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${statusConfig.color.split(' ')[1]}`}>
                        <StatusIcon className={`w-5 h-5 ${statusConfig.color.split(' ')[0]}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            Connection Link
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {link.status === 'connected' 
                            ? `Connected: ${link.connected_phone}`
                            : formatTimeLeft(link.expires_at)
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {link.status !== 'connected' && link.status !== 'expired' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(link.token)}
                            title="Copy link"
                          >
                            {copiedToken === link.token ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openLink(link.token)}
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(link.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Show link URL for pending/connecting */}
                  {(link.status === 'pending' || link.status === 'connecting') && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Share this link with your client:</p>
                      <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
                        {window.location.origin}/connect/{link.token}
                      </code>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <QrCode className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No connection links yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create a link to connect WhatsApp remotely
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
        <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
          💡 How Remote QR Works
        </h4>
        <ol className="text-sm text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
          <li>Create a connection link</li>
          <li>Send the link to your client via email or message</li>
          <li>Client opens the link on their phone</li>
          <li>Client scans the QR code with their WhatsApp</li>
          <li>WhatsApp is connected to this workspace!</li>
        </ol>
      </div>
    </div>
  )
}
