"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, MessageSquare, Trash2, Code, Copy, Check, Loader2 } from 'lucide-react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'

interface ChatWidget {
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
  total_conversations: number
  total_messages: number
  created_at: string
}

export function ChatWidgetsSection() {
  const [widgets, setWidgets] = useState<ChatWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showEmbedCode, setShowEmbedCode] = useState<string | null>(null)
  const [embedCode, setEmbedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    primary_color: '#10B981',
    header_text: 'Chat Support',
    header_logo_url: '',
    welcome_message: '¡Hello! How can I help you today? 😊',
    placeholder_text: 'Type your message...',
    position: 'bottom-right',
  })

  useEffect(() => {
    fetchWidgets()
  }, [])

  const fetchWidgets = async () => {
    try {
      const response = await ApiClient.request('/api/chat-widgets')
      if (response.success) {
        setWidgets(response.data as ChatWidget[])
      }
    } catch (error) {
      console.error('Error fetching widgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await ApiClient.request('/api/chat-widgets', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      
      if (response.success) {
        setWidgets([response.data as ChatWidget, ...widgets])
        setShowForm(false)
        setFormData({
          name: '',
          domain: '',
          primary_color: '#10B981',
          header_text: 'Chat Support',
          header_logo_url: '',
          welcome_message: '¡Hello! How can I help you today? 😊',
          placeholder_text: 'Type your message...',
          position: 'bottom-right',
        })
        toast.success('Success!', 'Widget created successfully')
      }
    } catch (error) {
      console.error('Error creating widget:', error)
      toast.error('Error', 'Failed to create widget')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the widget "${name}"?`)) return

    try {
      const response = await ApiClient.request(`/api/chat-widgets/${id}`, {
        method: 'DELETE',
      })
      
      if (response.success) {
        setWidgets(widgets.filter(w => w.id !== id))
        toast.success('Success', 'Widget deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting widget:', error)
      toast.error('Error', 'Failed to delete widget')
    }
  }

  const handleGetEmbedCode = async (id: string) => {
    try {
      const response = await ApiClient.request(`/api/chat-widgets/${id}/embed-code`)
      if (response.success) {
        setEmbedCode((response.data as { embedCode: string }).embedCode)
        setShowEmbedCode(id)
      }
    } catch (error) {
      console.error('Error getting embed code:', error)
      toast.error('Error', 'Failed to get embed code')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!', 'Embed code copied to clipboard')
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
          <h3 className="text-lg font-semibold text-gray-900">Chat Widgets</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create custom chat widgets for your website
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Widget
        </Button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Widget Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Chat Widget"
                  required
                />
              </div>
              <div>
                <Label>Domain (optional)</Label>
                <Input
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="https://mystore.com"
                />
              </div>
              <div>
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#10B981"
                  />
                </div>
              </div>
              <div>
                <Label>Header Text</Label>
                <Input
                  value={formData.header_text}
                  onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                  placeholder="Chat Support"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label>Header Logo URL (optional)</Label>
                <Input
                  value={formData.header_logo_url}
                  onChange={(e) => setFormData({ ...formData, header_logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Welcome Message</Label>
                <textarea
                  className="w-full p-2 border rounded-md min-h-[80px]"
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Create Widget
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Widgets List */}
      {widgets.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Chat Widgets
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Create your first chat widget to embed on your website
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Widget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: widget.primary_color }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{widget.name}</h3>
                    <p className="text-sm text-gray-600">
                      {widget.total_conversations || 0} conversations • {widget.total_messages || 0} messages
                    </p>
                    {widget.domain && (
                      <p className="text-xs text-gray-500 mt-1">{widget.domain}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGetEmbedCode(widget.id)}
                    title="Get embed code"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(widget.id, widget.name)}
                    title="Delete"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Embed Code */}
              {showEmbedCode === widget.id && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-white">Embed Code for Your Website</Label>
                    <Button
                      size="sm"
                      onClick={copyToClipboard}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="text-xs text-green-400 overflow-x-auto p-3 bg-gray-800 rounded">
                    {embedCode}
                  </pre>
                  <p className="text-xs text-gray-400 mt-2">
                    Paste this code before the closing &lt;/body&gt; tag on your website
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
