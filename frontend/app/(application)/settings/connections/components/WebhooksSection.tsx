"use client"

import { useState, useEffect } from 'react'
import { Webhook, Plus, Trash2, Play, Check, AlertCircle, Loader2, RefreshCw, Copy, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/lib/toast"

type WebhookStatus = 'active' | 'paused' | 'failed'

interface WebhookData {
  id: string
  name: string
  url: string
  secret: string | null
  events: string[]
  status: WebhookStatus
  total_sent: number
  total_success: number
  total_failed: number
  last_triggered_at: string | null
  last_error: string | null
  created_at: string
}

interface WebhookEvent {
  name: string
  description: string
}

const EVENT_CATEGORIES = {
  'Messages': ['message.received', 'message.sent', 'message.delivered', 'message.read', 'message.failed'],
  'Sessions': ['session.ready', 'session.disconnected', 'session.qr'],
  'Contacts & Groups': ['contact.created', 'contact.updated', 'group.joined', 'group.left'],
}

interface WebhooksSectionProps {
  workspaceId?: string
}

export function WebhooksSection({ workspaceId }: WebhooksSectionProps) {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [availableEvents, setAvailableEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  })

  useEffect(() => {
    fetchWebhooks()
    fetchEvents()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await ApiClient.request('/api/webhooks')
      if (response.success) {
        setWebhooks(response.data as WebhookData[])
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await ApiClient.request('/api/webhooks/events')
      if (response.success) {
        setAvailableEvents(response.data as WebhookEvent[])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.events.length === 0) {
      toast.error('Error', 'Please select at least one event')
      return
    }

    try {
      const payload = workspaceId 
        ? { ...formData, workspace_id: workspaceId }
        : formData

      const response = await ApiClient.request('/api/webhooks', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.success) {
        setWebhooks([response.data as WebhookData, ...webhooks])
        setShowForm(false)
        resetForm()
        toast.success('Success!', 'Webhook created successfully')
      }
    } catch (error) {
      console.error('Error creating webhook:', error)
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create webhook')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const response = await ApiClient.request(`/api/webhooks/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        setWebhooks(webhooks.filter(w => w.id !== id))
        toast.success('Success', 'Webhook deleted')
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
      toast.error('Error', 'Failed to delete webhook')
    }
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const response = await ApiClient.request(`/api/webhooks/${id}/test`, {
        method: 'POST',
      })

      if (response.success) {
        const result = response.data as { success: boolean; status_code?: number; error?: string }
        if (result.success) {
          toast.success('Test Successful', `Webhook responded with status ${result.status_code}`)
        } else {
          toast.error('Test Failed', result.error || 'Webhook did not respond successfully')
        }
      }
    } catch (error) {
      console.error('Error testing webhook:', error)
      toast.error('Error', 'Failed to test webhook')
    } finally {
      setTesting(null)
    }
  }

  const handleToggleStatus = async (webhook: WebhookData) => {
    const newStatus = webhook.status === 'active' ? 'paused' : 'active'
    try {
      const response = await ApiClient.request(`/api/webhooks/${webhook.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.success) {
        setWebhooks(webhooks.map(w => w.id === webhook.id ? { ...w, status: newStatus } : w))
        toast.success('Success', `Webhook ${newStatus === 'active' ? 'activated' : 'paused'}`)
      }
    } catch (error) {
      console.error('Error updating webhook:', error)
      toast.error('Error', 'Failed to update webhook')
    }
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    toast.success('Copied', 'Secret copied to clipboard')
  }

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }))
  }

  const selectAllEvents = () => {
    setFormData(prev => ({
      ...prev,
      events: availableEvents.map(e => e.name)
    }))
  }

  const resetForm = () => {
    setFormData({ name: '', url: '', events: [] })
  }

  const getStatusBadge = (status: WebhookStatus) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1 text-green-600 text-xs"><Check className="w-3 h-3" /> Active</span>
      case 'failed':
        return <span className="flex items-center gap-1 text-red-600 text-xs"><AlertCircle className="w-3 h-3" /> Failed</span>
      case 'paused':
        return <span className="text-yellow-600 text-xs">Paused</span>
      default:
        return <span className="text-gray-500 text-xs">{status}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
          <p className="text-sm text-gray-600 mt-1">
            Receive real-time notifications about WhatsApp events
          </p>
        </div>
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Webhook Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Webhook"
                  required
                />
              </div>
              <div>
                <Label>Endpoint URL</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                  type="url"
                  required
                />
              </div>
            </div>

            {/* Events Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Events to Subscribe</Label>
                <Button type="button" variant="ghost" size="sm" onClick={selectAllEvents}>
                  Select All
                </Button>
              </div>
              <div className="space-y-4">
                {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
                  <div key={category}>
                    <p className="text-sm font-medium text-gray-700 mb-2">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {events.map(event => (
                        <button
                          key={event}
                          type="button"
                          onClick={() => toggleEvent(event)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            formData.events.includes(event)
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {event}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Create Webhook
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Webhooks List */}
      {webhooks.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Webhooks Configured
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Set up webhooks to receive real-time event notifications
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                    {getStatusBadge(webhook.status)}
                  </div>
                  <p className="text-sm text-gray-600 font-mono break-all">{webhook.url}</p>
                  
                  {/* Events */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {webhook.events.slice(0, 4).map(event => (
                      <span key={event} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {event}
                      </span>
                    ))}
                    {webhook.events.length > 4 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        +{webhook.events.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Sent: {webhook.total_sent}</span>
                    <span className="text-green-600">Success: {webhook.total_success}</span>
                    <span className="text-red-600">Failed: {webhook.total_failed}</span>
                    {webhook.last_triggered_at && (
                      <span>Last: {new Date(webhook.last_triggered_at).toLocaleString()}</span>
                    )}
                  </div>

                  {/* Secret */}
                  {webhook.secret && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">Secret:</span>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {showSecret[webhook.id] ? webhook.secret : '••••••••••••••••'}
                      </code>
                      <button onClick={() => setShowSecret(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))}>
                        {showSecret[webhook.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button onClick={() => copySecret(webhook.secret!)}>
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {webhook.last_error && (
                    <p className="text-xs text-red-500 mt-1">{webhook.last_error}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(webhook.id)}
                    disabled={testing === webhook.id}
                    title="Test webhook"
                  >
                    {testing === webhook.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(webhook)}
                    title={webhook.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(webhook.id, webhook.name)}
                    title="Delete"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
