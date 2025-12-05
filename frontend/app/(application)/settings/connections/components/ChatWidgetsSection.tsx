"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, MessageSquare, Trash2, Code, Copy, Check, Loader2, ExternalLink, ChevronDown, ChevronUp, Settings, Download, Puzzle, Bot } from 'lucide-react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'
import { useAuth } from '@/contexts/AuthContext'

type WebsitePlatform = 'wordpress' | 'shopify' | 'prestashop' | 'magento' | 'custom'

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
  launcher_animation: string
  z_index: number
  sound_enabled: boolean
  powered_by_enabled: boolean
  powered_by_text: string
  total_conversations: number
  total_messages: number
  created_at: string
}

interface PlatformIntegration {
  name: string
  pluginUrl: string
  pluginName: string
  settingsPath: string
  instructions: string[]
}

const platformIntegrations: Record<WebsitePlatform, PlatformIntegration> = {
  wordpress: {
    name: 'WordPress / WooCommerce',
    pluginUrl: 'https://wordpress.org/plugins/insert-headers-and-footers/',
    pluginName: 'WPCode (Insert Headers and Footers)',
    settingsPath: '/wp-admin/admin.php?page=wpcode-headers-footers',
    instructions: [
      'Install and activate the "WPCode" plugin',
      'Go to Code Snippets → Header & Footer',
      'Paste the code in the "Footer" section',
      'Click "Save Changes"',
    ],
  },
  shopify: {
    name: 'Shopify',
    pluginUrl: '',
    pluginName: 'Theme Editor (built-in)',
    settingsPath: '/admin/themes/current/editor',
    instructions: [
      'Go to Online Store → Themes → Edit code',
      'Open Layout → theme.liquid',
      'Paste the code just before </body>',
      'Click "Save"',
    ],
  },
  prestashop: {
    name: 'PrestaShop',
    pluginUrl: 'https://addons.prestashop.com/en/other-modules-addons/48921-webhooks-integration.html',
    pluginName: 'Custom Code Module',
    settingsPath: '/adminXXX/index.php?controller=AdminModules&configure=ps_customcode',
    instructions: [
      'Install "Custom Code" module from Module Manager',
      'Go to Modules → Module Manager → Custom Code',
      'Paste the code in "Footer" section',
      'Save changes',
    ],
  },
  magento: {
    name: 'Magento 2',
    pluginUrl: '',
    pluginName: 'Admin Configuration',
    settingsPath: '/admin/admin/system_config/edit/section/design/',
    instructions: [
      'Go to Content → Design → Configuration',
      'Edit your store view',
      'Expand "HTML Head" section',
      'Paste code in "Scripts and Style Sheets"',
      'Save Configuration',
    ],
  },
  custom: {
    name: 'Custom / Other',
    pluginUrl: '',
    pluginName: 'Manual Integration',
    settingsPath: '',
    instructions: [
      'Open your website\'s HTML file',
      'Find the closing </body> tag',
      'Paste the code just before </body>',
      'Save and upload the file',
    ],
  },
}

const getPluginInstallUrl = (domain: string, platform: WebsitePlatform): string => {
  if (!domain) return platformIntegrations[platform].pluginUrl
  let url = domain.trim()
  if (url.endsWith('/')) url = url.slice(0, -1)
  if (!url.startsWith('http')) url = 'https://' + url
  
  switch (platform) {
    case 'wordpress':
      return `${url}/wp-admin/plugin-install.php?s=wpcode&tab=search&type=term`
    case 'shopify':
      return `${url}/admin/themes`
    case 'prestashop':
      return `${url}/adminXXX/index.php?controller=AdminModules`
    case 'magento':
      return `${url}/admin/admin/system_config/edit/section/design/`
    default:
      return ''
  }
}

const getPluginSettingsUrl = (domain: string, platform: WebsitePlatform): string => {
  if (!domain) return ''
  let url = domain.trim()
  if (url.endsWith('/')) url = url.slice(0, -1)
  if (!url.startsWith('http')) url = 'https://' + url
  
  return url + platformIntegrations[platform].settingsPath
}

interface ChatWidgetsSectionProps {
  workspaceId?: string
  hasExistingConnection?: boolean
  onConnectionChange?: () => void
  initialData?: ChatWidget[]
}

export function ChatWidgetsSection({ workspaceId, hasExistingConnection = false, onConnectionChange, initialData }: ChatWidgetsSectionProps) {
  const { user } = useAuth()
  const isEnterprise = user?.profile?.subscription_tier === 'enterprise'
  
  const [widgets, setWidgets] = useState<ChatWidget[]>(initialData || [])
  const [loading, setLoading] = useState(!initialData)
  const [showForm, setShowForm] = useState(false)
  const [editingWidget, setEditingWidget] = useState<string | null>(null)
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null)
  const [embedCodes, setEmbedCodes] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<WebsitePlatform>('wordpress')
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    platform: 'wordpress' as WebsitePlatform,
    primary_color: '#10B981',
    header_text: 'Chat Support',
    header_logo_url: '',
    welcome_message: '¡Hola! ¿En qué puedo ayudarte hoy? 😊',
    placeholder_text: 'Escribe tu mensaje...',
    position: 'bottom-right',
    launcher_animation: 'pulse',
    z_index: 9999,
    sound_enabled: true,
    powered_by_enabled: true,
    powered_by_text: 'WhaHook',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      platform: 'wordpress',
      primary_color: '#10B981',
      header_text: 'Chat Support',
      header_logo_url: '',
      welcome_message: '¡Hola! ¿En qué puedo ayudarte hoy? 😊',
      placeholder_text: 'Escribe tu mensaje...',
      position: 'bottom-right',
      launcher_animation: 'pulse',
      z_index: 9999,
      sound_enabled: true,
      powered_by_enabled: true,
      powered_by_text: 'WhaHook',
    })
    setEditingWidget(null)
  }

  useEffect(() => {
    // Skip fetch if we have initial data
    if (!initialData) {
      fetchWidgets()
    }
  }, [workspaceId, initialData])

  const fetchWidgets = async () => {
    try {
      const url = workspaceId 
        ? `/api/chat-widgets?workspace_id=${workspaceId}`
        : '/api/chat-widgets'
      const response = await ApiClient.request(url)
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
    
    if (!formData.name.trim()) {
      toast.error('Error', 'Widget name is required')
      return
    }
    
    try {
      const payload = workspaceId 
        ? { ...formData, workspace_id: workspaceId }
        : formData
      
      console.log('Creating widget with payload:', payload)
      
      const response = await ApiClient.request('/api/chat-widgets', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      
      console.log('Create widget response:', response)
      
      if (response.success) {
        const newWidget = response.data as ChatWidget
        setWidgets([newWidget, ...widgets])
        setShowForm(false)
        resetForm()
        // Auto-expand to show integration instructions
        setExpandedWidget(newWidget.id)
        setSelectedPlatform(formData.platform)
        // Notify parent to refresh workspace data
        onConnectionChange?.()
        // Fetch embed code for the new widget
        handleGetEmbedCode(newWidget.id)
        toast.success('Widget Created!', 'Now follow the instructions below to add it to your website.')
      } else {
        console.error('Create widget failed:', response)
        toast.error('Error', (response as any).error || 'Failed to create widget')
      }
    } catch (error: any) {
      console.error('Error creating widget:', error)
      toast.error('Error', error?.message || 'Failed to create widget')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWidget) return
    
    try {
      const response = await ApiClient.request(`/api/chat-widgets/${editingWidget}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      
      if (response.success) {
        setWidgets(widgets.map(w => w.id === editingWidget ? response.data as ChatWidget : w))
        setShowForm(false)
        resetForm()
        toast.success('Updated!', 'Widget updated successfully')
      }
    } catch (error) {
      console.error('Error updating widget:', error)
      toast.error('Error', 'Failed to update widget')
    }
  }

  const handleEdit = (widget: ChatWidget) => {
    setFormData({
      name: widget.name,
      domain: widget.domain || '',
      platform: 'wordpress', // Default, we don't store this
      primary_color: widget.primary_color,
      header_text: widget.header_text,
      header_logo_url: widget.header_logo_url || '',
      welcome_message: widget.welcome_message,
      placeholder_text: widget.placeholder_text,
      position: widget.position,
      launcher_animation: widget.launcher_animation || 'pulse',
      z_index: widget.z_index || 9999,
      sound_enabled: widget.sound_enabled !== false,
      powered_by_enabled: widget.powered_by_enabled !== false,
      powered_by_text: widget.powered_by_text || 'WhaHook',
    })
    setEditingWidget(widget.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the widget "${name}"?`)) return

    try {
      const response = await ApiClient.request(`/api/chat-widgets/${id}`, {
        method: 'DELETE',
      })
      
      if (response.success) {
        setWidgets(widgets.filter(w => w.id !== id))
        if (expandedWidget === id) setExpandedWidget(null)
        toast.success('Deleted', 'Widget deleted successfully')
        // Notify parent to refresh workspace data
        onConnectionChange?.()
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
        const code = (response.data as { embedCode: string }).embedCode
        setEmbedCodes(prev => ({ ...prev, [id]: code }))
      }
    } catch (error) {
      console.error('Error getting embed code:', error)
    }
  }

  const toggleExpand = async (id: string) => {
    if (expandedWidget === id) {
      setExpandedWidget(null)
    } else {
      setExpandedWidget(id)
      if (!embedCodes[id]) {
        await handleGetEmbedCode(id)
      }
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied!', 'Embed code copied to clipboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary, #22c55e)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Web Widget</h3>
          <p className="text-sm text-gray-600 mt-1">
            {hasExistingConnection 
              ? 'This workspace has a Web Widget configured'
              : 'Create an AI chatbot for your website'
            }
          </p>
        </div>
        {!hasExistingConnection && (
          <Button
            onClick={() => { setShowForm(!showForm); if (showForm) resetForm() }}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Widget
          </Button>
        )}
      </div>

      {/* Creation/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium mb-4">
            {editingWidget ? 'Edit Chatbot' : 'Create New Chatbot'}
          </h4>
          <form onSubmit={editingWidget ? handleUpdate : handleCreate} className="space-y-6">
            {/* Step 1: Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-md font-medium">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">1</span>
                Basic Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                <div>
                  <Label>Widget Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Chat Widget"
                  />
                </div>
                <div>
                  <Label>Website Platform</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-white"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as WebsitePlatform })}
                  >
                    {Object.entries(platformIntegrations).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">We'll show you how to install the widget</p>
                </div>
                <div>
                  <Label>Website URL</Label>
                  <Input
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="https://mystore.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your website address (optional)</p>
                </div>
              </div>
            </div>

            {/* Step 2: Appearance */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-md font-medium">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">2</span>
                Appearance
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#10B981"
                      className="flex-1"
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
                  <Label>Logo URL (optional)</Label>
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
                    placeholder="Hello! How can I help you today?"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Advanced Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-md font-medium">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">3</span>
                Advanced Settings
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                <div>
                  <Label>Position</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-white"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
                <div>
                  <Label>Launcher Animation</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-white"
                    value={formData.launcher_animation}
                    onChange={(e) => setFormData({ ...formData, launcher_animation: e.target.value })}
                  >
                    <option value="pulse">Pulse (Recommended)</option>
                    <option value="bounce">Bounce</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <Label>Layer Priority (z-index)</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-white"
                    value={formData.z_index}
                    onChange={(e) => setFormData({ ...formData, z_index: parseInt(e.target.value) })}
                  >
                    <option value={9999}>Normal (9999) - Above most elements</option>
                    <option value={99999}>High (99999) - Above cookie banners</option>
                    <option value={999999}>Maximum (999999) - Always on top</option>
                    <option value={999}>Low (999) - Behind some popups</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">If the widget appears behind other elements, try a higher value</p>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sound_enabled}
                      onChange={(e) => setFormData({ ...formData, sound_enabled: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Enable notification sound for new messages</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingWidget ? 'Save Changes' : 'Create Chatbot'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Chatbots Yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Create your first AI chatbot to embed on your website
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Chatbot
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {widgets.map((widget) => {
            const isExpanded = expandedWidget === widget.id
            const embedCode = embedCodes[widget.id] || ''
            const platform = selectedPlatform
            const platformConfig = platformIntegrations[platform]

            return (
              <div key={widget.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Widget Header */}
                <div className="p-4 bg-white">
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
                      <Link href={`/settings/chatbot?widget=${widget.id}`}>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          title="Configure AI Chatbot"
                        >
                          <Bot className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(widget)}
                        title="Edit appearance"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleExpand(widget.id)}
                        title="Integration code"
                      >
                        <Code className="h-4 w-4 mr-1" />
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                </div>

                {/* Expanded Integration Section */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">
                    <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                      <Puzzle className="w-5 h-5 text-green-600" />
                      How to Add This Widget to Your Website
                    </div>

                    {/* Platform Selector */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Your platform:</Label>
                      <select
                        className="p-2 border rounded-md bg-white text-sm"
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value as WebsitePlatform)}
                      >
                        {Object.entries(platformIntegrations).map(([key, config]) => (
                          <option key={key} value={key}>{config.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                      {/* Step 1: Install Plugin (if needed) */}
                      {platform !== 'custom' && platform !== 'shopify' && (
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0">1</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">
                              Install "{platformConfig.pluginName}"
                            </p>
                            <p className="text-sm text-green-800 mt-1">
                              {platformConfig.instructions[0]}
                            </p>
                            {widget.domain && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 bg-white"
                                onClick={() => window.open(getPluginInstallUrl(widget.domain, platform), '_blank')}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Install Plugin
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 2: Copy Code */}
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0">
                          {platform === 'custom' || platform === 'shopify' ? '1' : '2'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">Copy this code:</p>
                          <div className="mt-2 p-3 bg-gray-900 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400">Embed Code</span>
                              <Button
                                size="sm"
                                onClick={() => copyToClipboard(embedCode)}
                                className="bg-green-600 hover:bg-green-700 h-7"
                              >
                                {copied ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                            <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                              {embedCode || 'Loading...'}
                            </pre>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Paste Code */}
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0">
                          {platform === 'custom' || platform === 'shopify' ? '2' : '3'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">Paste the code in your website:</p>
                          <div className="mt-2 bg-white border border-green-200 rounded-lg p-3 space-y-2">
                            {platformConfig.instructions.slice(1).map((instruction, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-green-800">
                                <span className="text-green-600">•</span>
                                <span>{instruction}</span>
                              </div>
                            ))}
                          </div>
                          {widget.domain && platform !== 'custom' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 bg-white"
                              onClick={() => window.open(getPluginSettingsUrl(widget.domain, platform), '_blank')}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Open {platformConfig.name} Settings
                              <ExternalLink className="w-3 h-3 ml-2" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Step 4: Done */}
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0">
                          {platform === 'custom' || platform === 'shopify' ? '3' : '4'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">Save and you're done! 🎉</p>
                          <p className="text-sm text-green-800 mt-1">
                            Visit your website to see the chat widget in the bottom-right corner.
                          </p>
                        </div>
                      </div>

                      {/* Cache Warning & Complete Button */}
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Don't see the widget?
                          </p>
                          <ul className="text-xs text-green-700 mt-2 space-y-1 ml-6">
                            <li>• <strong>Clear your browser cache</strong> (Ctrl+Shift+R or Cmd+Shift+R)</li>
                            <li>• <strong>Clear your website cache</strong> (LiteSpeed, WP Super Cache, etc.)</li>
                            <li>• <strong>Wait 2-5 minutes</strong> for CDN cache to refresh</li>
                            <li>• Check the browser console (F12) for errors</li>
                          </ul>
                        </div>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setExpandedWidget(null)
                            toast.success('Setup Complete!', 'Your chat widget is ready. Remember to clear your website cache if you don\'t see it immediately.')
                          }}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Complete Setup
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

