"use client"

import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Trash2, RefreshCw, Check, AlertCircle, Loader2, ExternalLink, HelpCircle, Key, ChevronDown, ChevronUp, Copy, Webhook, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/lib/toast"

type Platform = 'woocommerce' | 'shopify' | 'prestashop' | 'magento'

interface EcommerceConnection {
  id: string
  name: string
  platform: Platform
  store_url: string
  status: 'pending' | 'active' | 'error' | 'disabled'
  last_sync_at: string | null
  last_error: string | null
  created_at: string
}

interface WebhookTopic {
  name: string
  topic: string
  description: string
}

interface PlatformConfig {
  name: string
  color: string
  fields: string[]
  apiPath: string
  instructions: string
  webhookPath: string
  webhookInstructions: string
  webhookTopics: WebhookTopic[]
  webhookNote?: string
  // Platform-specific field labels
  urlLabel: string
  extraFields?: { label: string; value: string }[]
}

const platformConfig: Record<Platform, PlatformConfig> = {
  woocommerce: { 
    name: 'WooCommerce', 
    color: '#96588a',
    fields: ['consumer_key', 'consumer_secret'],
    apiPath: '/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys',
    instructions: 'Go to WooCommerce → Settings → Advanced → REST API → Add key',
    webhookPath: '/wp-admin/admin.php?page=wc-settings&tab=advanced&section=webhooks',
    webhookInstructions: 'Go to WooCommerce → Settings → Advanced → Webhooks → Add webhook',
    webhookTopics: [
      { name: 'Orders', topic: 'Order created', description: 'New orders' },
      { name: 'Orders', topic: 'Order updated', description: 'Order status changes' },
      { name: 'Products', topic: 'Product created', description: 'New products' },
      { name: 'Products', topic: 'Product updated', description: 'Product changes' },
    ],
    urlLabel: 'Delivery URL',
    extraFields: [
      { label: 'Secret', value: 'Leave empty' },
      { label: 'API Version', value: 'WP REST API v3' },
    ],
  },
  shopify: { 
    name: 'Shopify', 
    color: '#96bf48',
    fields: ['shop_name', 'access_token'],
    apiPath: '/admin/settings/apps/development',
    instructions: 'Go to Settings → Apps and sales channels → Develop apps',
    webhookPath: '/admin/settings/notifications',
    webhookInstructions: 'Go to Settings → Notifications → scroll to Webhooks → Create webhook',
    webhookTopics: [
      { name: 'Orders', topic: 'Order creation', description: 'New orders' },
      { name: 'Orders', topic: 'Order update', description: 'Order changes' },
      { name: 'Products', topic: 'Product creation', description: 'New products' },
      { name: 'Products', topic: 'Product update', description: 'Product changes' },
    ],
    urlLabel: 'URL',
    extraFields: [
      { label: 'Format', value: 'JSON' },
      { label: 'API version', value: '2024-10 (latest)' },
    ],
  },
  prestashop: { 
    name: 'PrestaShop', 
    color: '#df0067',
    fields: ['api_key'],
    apiPath: '/adminXXX/index.php?controller=AdminWebservice',
    instructions: 'Go to Advanced Parameters → Webservice → Add new webservice key',
    webhookPath: '/adminXXX/index.php?controller=AdminModules&configure=webhooks',
    webhookInstructions: 'Install "Webhooks Integration" module, then configure each event:',
    webhookTopics: [
      { name: 'Orders', topic: 'actionValidateOrder', description: 'New orders' },
      { name: 'Orders', topic: 'actionOrderStatusUpdate', description: 'Status changes' },
      { name: 'Products', topic: 'actionProductAdd', description: 'New products' },
      { name: 'Products', topic: 'actionProductUpdate', description: 'Product changes' },
    ],
    urlLabel: 'Callback URL',
    extraFields: [
      { label: 'Method', value: 'POST' },
      { label: 'Headers', value: 'Content-Type: application/json' },
      { label: 'Active', value: 'Yes' },
    ],
    webhookNote: 'PrestaShop needs a webhook module. Install "Webhooks Integration" from PrestaShop Addons or search in Module Manager.',
  },
  magento: { 
    name: 'Magento 2', 
    color: '#f26322',
    fields: ['access_token'],
    apiPath: '/admin/admin/integration/',
    instructions: 'Go to System → Extensions → Integrations → Add New Integration',
    webhookPath: '/admin/mageplaza_webhook/manage_hooks/',
    webhookInstructions: 'Install Mageplaza Webhook, then go to System → Webhook → Manage Hooks → Add new',
    webhookTopics: [
      { name: 'Orders', topic: 'New Order', description: 'New orders' },
      { name: 'Orders', topic: 'Update Order', description: 'Order changes' },
      { name: 'Products', topic: 'New Product', description: 'New products' },
      { name: 'Products', topic: 'Update Product', description: 'Product changes' },
    ],
    urlLabel: 'Payload URL',
    extraFields: [
      { label: 'Method', value: 'POST' },
      { label: 'Content Type', value: 'application/json' },
      { label: 'Status', value: 'Enable' },
    ],
    webhookNote: 'Magento needs Mageplaza Webhook extension. Install: composer require mageplaza/module-webhook',
  },
}

// Helper to build API URL from store URL
const getApiUrl = (storeUrl: string, platform: Platform): string => {
  if (!storeUrl) return ''
  let url = storeUrl.trim()
  if (url.endsWith('/')) url = url.slice(0, -1)
  if (!url.startsWith('http')) url = 'https://' + url
  return url + platformConfig[platform].apiPath
}

// Helper to build webhook settings URL
const getWebhookSettingsUrl = (storeUrl: string, platform: Platform): string => {
  if (!storeUrl) return ''
  let url = storeUrl.trim()
  if (url.endsWith('/')) url = url.slice(0, -1)
  if (!url.startsWith('http')) url = 'https://' + url
  return url + platformConfig[platform].webhookPath
}

// Get the webhook URL for this connection
const getWebhookUrl = (connectionId: string): string => {
  // Use backend URL for webhooks (not frontend)
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  return `${backendUrl}/api/ecommerce/webhook/${connectionId}`
}

interface EcommerceConnectionsSectionProps {
  workspaceId?: string
  initialData?: EcommerceConnection[]
}

export function EcommerceConnectionsSection({ workspaceId, initialData }: EcommerceConnectionsSectionProps) {
  const [connections, setConnections] = useState<EcommerceConnection[]>(initialData || [])
  const [loading, setLoading] = useState(!initialData)
  const [showForm, setShowForm] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [expandedConnection, setExpandedConnection] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    platform: 'woocommerce' as Platform,
    store_url: '',
    consumer_key: '',
    consumer_secret: '',
    shop_name: '',
    access_token: '',
    api_key: '',
  })

  useEffect(() => {
    if (!initialData) {
      fetchConnections()
    }
  }, [workspaceId, initialData])

  const fetchConnections = async () => {
    try {
      const url = workspaceId 
        ? `/api/ecommerce/connections?workspace_id=${workspaceId}`
        : '/api/ecommerce/connections'
      const response = await ApiClient.request(url)
      if (response.success) {
        setConnections(response.data as EcommerceConnection[])
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCredentials = () => {
    switch (formData.platform) {
      case 'woocommerce':
        return { consumer_key: formData.consumer_key, consumer_secret: formData.consumer_secret }
      case 'shopify':
        return { shop_name: formData.shop_name, access_token: formData.access_token }
      case 'prestashop':
        return { api_key: formData.api_key }
      case 'magento':
        return { access_token: formData.access_token }
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        platform: formData.platform,
        store_url: formData.store_url,
        credentials: getCredentials(),
      }
      if (workspaceId) {
        payload.workspace_id = workspaceId
      }

      const response = await ApiClient.request('/api/ecommerce/connections', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response.success) {
        const newConnection = response.data as EcommerceConnection
        setConnections([newConnection, ...connections])
        setShowForm(false)
        resetForm()
        // Auto-expand webhook section for the new connection
        setExpandedConnection(newConnection.id)
        toast.success('Connected!', 'Store connected! Now set up the webhook below for auto-sync.')
      }
    } catch (error) {
      console.error('Error creating connection:', error)
      toast.error('Error', error instanceof Error ? error.message : 'Failed to connect store')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect "${name}"?`)) return

    try {
      const response = await ApiClient.request(`/api/ecommerce/connections/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        setConnections(connections.filter(c => c.id !== id))
        toast.success('Disconnected', 'Store disconnected successfully')
      }
    } catch (error) {
      console.error('Error deleting connection:', error)
      toast.error('Error', 'Failed to disconnect store')
    }
  }

  const handleSync = async (id: string) => {
    setSyncing(id)
    try {
      const response = await ApiClient.request(`/api/ecommerce/connections/${id}/sync`, {
        method: 'POST',
        body: JSON.stringify({ sync_type: 'full' }),
      })

      if (response.success) {
        toast.success('Setup Complete!', 'Syncing products and orders. Webhooks will handle future updates automatically.')
        // Close the expanded section
        setExpandedConnection(null)
        // Refetch after a delay
        setTimeout(fetchConnections, 3000)
      }
    } catch (error) {
      console.error('Error syncing:', error)
      toast.error('Error', 'Failed to start sync')
    } finally {
      setSyncing(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      platform: 'woocommerce',
      store_url: '',
      consumer_key: '',
      consumer_secret: '',
      shop_name: '',
      access_token: '',
      api_key: '',
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!', 'Webhook URL copied to clipboard')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1 text-green-600 text-xs"><Check className="w-3 h-3" /> Active</span>
      case 'error':
        return <span className="flex items-center gap-1 text-red-600 text-xs"><AlertCircle className="w-3 h-3" /> Error</span>
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-600 text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Pending</span>
      default:
        return <span className="text-gray-500 text-xs">{status}</span>
    }
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
          <h3 className="text-lg font-semibold text-gray-900">E-commerce Connections</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect your online store to sync products and orders
          </p>
        </div>
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Connect Store
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Step 1: Basic info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">1</span>
                Basic Information
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                <div>
                  <Label>Connection Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. My Online Store"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">A name to identify this store</p>
                </div>
                <div>
                  <Label>Platform</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-white"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as Platform })}
                  >
                    {Object.entries(platformConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label>Store URL</Label>
                  <Input
                    value={formData.store_url}
                    onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                    placeholder="https://mystore.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Your store's web address (without /admin or anything else)</p>
                </div>
              </div>
            </div>

            {/* Step 2: API Credentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">2</span>
                API Credentials
              </div>

              {/* Help box with detailed instructions */}
              {formData.store_url && (
                <div className="ml-8 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium text-blue-900">
                        How to get your {platformConfig[formData.platform].name} API credentials:
                      </p>
                      
                      {/* Step 1: Open settings */}
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">1</span>
                        <div>
                          <p className="text-sm text-blue-800">Open your API settings:</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-1 bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => window.open(getApiUrl(formData.store_url, formData.platform), '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-2" />
                            Open {platformConfig[formData.platform].name} API Settings
                          </Button>
                        </div>
                      </div>
                      
                      {/* Step 2: Fill form - Platform specific */}
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">2</span>
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 mb-2">Click "Add key" and fill in:</p>
                          
                          {formData.platform === 'woocommerce' && (
                            <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-24 text-blue-700 font-medium">Description:</span>
                                <span className="text-gray-700">Whahook Sync</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-24 text-blue-700 font-medium">User:</span>
                                <span className="text-gray-700">Select an admin user</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-24 text-blue-700 font-medium">Permissions:</span>
                                <code className="bg-blue-100 px-2 py-0.5 rounded text-xs">Read</code>
                              </div>
                            </div>
                          )}
                          
                          {formData.platform === 'shopify' && (
                            <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2 text-sm">
                              <p className="text-xs text-blue-600 mb-2">Click "Create an app" → then "Configure Admin API scopes"</p>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-blue-700 font-medium">App name:</span>
                                <span className="text-gray-700">Whahook Sync</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-28 text-blue-700 font-medium flex-shrink-0">API scopes:</span>
                                <div className="text-gray-700 text-xs space-y-1">
                                  <div>✓ <code className="bg-blue-100 px-1 rounded">read_orders</code></div>
                                  <div>✓ <code className="bg-blue-100 px-1 rounded">read_products</code></div>
                                </div>
                              </div>
                              <p className="text-xs text-blue-600 mt-2">After saving, click "Install app" → then "Reveal token once"</p>
                            </div>
                          )}
                          
                          {formData.platform === 'prestashop' && (
                            <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2 text-sm">
                              <p className="text-xs text-blue-600 mb-2">First enable Webservice: Configuration → General → Enable</p>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-blue-700 font-medium">Key:</span>
                                <span className="text-gray-700">(click Generate to create)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-blue-700 font-medium">Description:</span>
                                <span className="text-gray-700">Whahook Sync</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-blue-700 font-medium">Status:</span>
                                <code className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Yes</code>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-28 text-blue-700 font-medium flex-shrink-0">Permissions:</span>
                                <div className="text-gray-700 text-xs space-y-1">
                                  <div>✓ <code className="bg-blue-100 px-1 rounded">orders</code> → View (GET)</div>
                                  <div>✓ <code className="bg-blue-100 px-1 rounded">products</code> → View (GET)</div>
                                  <div>✓ <code className="bg-blue-100 px-1 rounded">customers</code> → View (GET)</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {formData.platform === 'magento' && (
                            <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2 text-sm">
                              <p className="text-xs text-blue-600 mb-2">Go to System → Extensions → Integrations → Add New</p>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-blue-700 font-medium">Name:</span>
                                <span className="text-gray-700">Whahook Sync</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-blue-700 font-medium">Email:</span>
                                <span className="text-gray-700">your@email.com</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-28 text-blue-700 font-medium flex-shrink-0">API tab:</span>
                                <div className="text-gray-700 text-xs space-y-1">
                                  <div>Resource Access: <code className="bg-blue-100 px-1 rounded">Custom</code></div>
                                  <div>✓ <code className="bg-blue-100 px-1 rounded">Sales</code> → Orders (Read)</div>
                                  <div>✓ <code className="bg-blue-100 px-1 rounded">Catalog</code> → Products (Read)</div>
                                </div>
                              </div>
                              <p className="text-xs text-blue-600 mt-2">After saving, click "Activate" → copy the Access Token</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Step 3: Generate and copy */}
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">3</span>
                        <p className="text-sm text-blue-800">
                          Click "Generate API key" and copy the keys below 👇
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!formData.store_url && (
                <div className="ml-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    👆 First enter your store URL above to see the instructions.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                {/* WooCommerce fields */}
                {formData.platform === 'woocommerce' && (
                  <>
                    <div>
                      <Label>Consumer Key</Label>
                      <Input
                        value={formData.consumer_key}
                        onChange={(e) => setFormData({ ...formData, consumer_key: e.target.value })}
                        placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Starts with "ck_"</p>
                    </div>
                    <div>
                      <Label>Consumer Secret</Label>
                      <Input
                        type="password"
                        value={formData.consumer_secret}
                        onChange={(e) => setFormData({ ...formData, consumer_secret: e.target.value })}
                        placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Starts with "cs_"</p>
                    </div>
                  </>
                )}

                {/* Shopify fields */}
                {formData.platform === 'shopify' && (
                  <>
                    <div>
                      <Label>Shop Name</Label>
                      <div className="flex">
                        <Input
                          value={formData.shop_name}
                          onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                          placeholder="my-store"
                          className="rounded-r-none"
                          required
                        />
                        <span className="inline-flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                          .myshopify.com
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Just the name, without .myshopify.com</p>
                    </div>
                    <div>
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        value={formData.access_token}
                        onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                        placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Starts with "shpat_"</p>
                    </div>
                  </>
                )}

                {/* PrestaShop fields */}
                {formData.platform === 'prestashop' && (
                  <div className="md:col-span-2">
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="Your PrestaShop API key"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The key you generated in Webservice</p>
                  </div>
                )}

                {/* Magento fields */}
                {formData.platform === 'magento' && (
                  <div className="md:col-span-2">
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="Your Magento access token"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The integration token you generated</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info about auto-sync */}
            <div className="ml-0 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Webhook className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    🚀 Auto-sync available after connecting
                  </p>
                  <p className="text-sm text-purple-800 mt-1">
                    Once connected, you'll get a unique webhook URL to set up automatic sync for orders and products.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Connect Store
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Connections List */}
      {connections.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No E-commerce Connections
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect your online store to sync products and orders
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Connect Your First Store
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {connections.map((connection) => {
            const isExpanded = expandedConnection === connection.id
            const webhookUrl = getWebhookUrl(connection.id)
            const config = platformConfig[connection.platform]
            
            return (
              <div key={connection.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Main row */}
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: config.color }}
                      >
                        {config.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{connection.name}</h3>
                          {getStatusBadge(connection.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {config.name} • {connection.store_url}
                        </p>
                        {connection.last_sync_at && (
                          <p className="text-xs text-gray-500">
                            Last sync: {new Date(connection.last_sync_at).toLocaleString()}
                          </p>
                        )}
                        {connection.last_error && (
                          <p className="text-xs text-red-500">{connection.last_error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleSync(connection.id)}
                        disabled={syncing === connection.id}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${syncing === connection.id ? 'animate-spin' : ''}`} />
                        {syncing === connection.id ? 'Syncing...' : 'Sync'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedConnection(isExpanded ? null : connection.id)}
                        title="Configure webhooks"
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(connection.store_url, '_blank')}
                        title="Open store"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(connection.id, connection.name)}
                        title="Disconnect"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded webhook section */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">
                    <div className="flex items-center gap-2 text-lg font-medium text-gray-900">
                      <Webhook className="w-5 h-5 text-purple-600" />
                      Auto-sync (Webhook Setup) - {config.name}
                    </div>
                    
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                      {/* Note for platforms requiring extensions */}
                      {config.webhookNote && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>⚠️ Note:</strong> {config.webhookNote}
                          </p>
                        </div>
                      )}
                      
                      {/* Step 1: Open settings */}
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">1</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900">{config.webhookInstructions}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 bg-white"
                            onClick={() => window.open(getWebhookSettingsUrl(connection.store_url, connection.platform), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open {config.name} Webhook Settings
                          </Button>
                        </div>
                      </div>

                      {/* Step 2: Create webhooks - one card per topic */}
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">2</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900 mb-3">Create these webhooks (one per event):</p>
                          
                          <div className="space-y-3">
                            {config.webhookTopics.map((topic, idx) => (
                              <div key={idx} className="bg-white border border-purple-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-100">
                                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                                    Webhook {idx + 1}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">{topic.description}</span>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                  {/* Name */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-28 text-purple-700 font-medium">Name:</span>
                                    <span className="text-gray-700">{topic.topic}</span>
                                  </div>
                                  
                                  {/* Status */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-28 text-purple-700 font-medium">Status:</span>
                                    <code className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Active</code>
                                  </div>
                                  
                                  {/* Topic */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-28 text-purple-700 font-medium">Topic:</span>
                                    <code className="bg-purple-100 px-2 py-0.5 rounded text-xs">{topic.topic}</code>
                                  </div>
                                  
                                  {/* URL */}
                                  <div className="flex items-start gap-2">
                                    <span className="w-28 text-purple-700 font-medium flex-shrink-0">{config.urlLabel}:</span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <Input 
                                          value={webhookUrl} 
                                          readOnly 
                                          className="bg-gray-50 text-xs font-mono flex-1 h-8"
                                        />
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => copyToClipboard(webhookUrl)}
                                          className="flex-shrink-0 h-8"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Extra fields */}
                                  {config.extraFields?.map((field, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className="w-28 text-purple-700 font-medium">{field.label}:</span>
                                      <code className="bg-purple-100 px-2 py-0.5 rounded text-xs">{field.value}</code>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <p className="text-xs text-purple-600 mt-2 italic">
                            Tip: Start with just "Order created" if you want to test first.
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Complete setup */}
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">3</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900">Save webhooks in your store, then click below:</p>
                          <Button
                            size="sm"
                            className="mt-2 bg-green-600 hover:bg-green-700"
                            onClick={() => handleSync(connection.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Complete Setup & Sync Now
                          </Button>
                          <p className="text-xs text-purple-600 mt-2">
                            This will do an initial sync. After that, new orders and products will sync automatically.
                          </p>
                        </div>
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
