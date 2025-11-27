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

interface PlatformConfig {
  name: string
  color: string
  fields: string[]
  apiPath: string
  instructions: string
  webhookPath: string
  webhookInstructions: string
  webhookTopic: string
}

const platformConfig: Record<Platform, PlatformConfig> = {
  woocommerce: { 
    name: 'WooCommerce', 
    color: '#96588a',
    fields: ['consumer_key', 'consumer_secret'],
    apiPath: '/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys',
    instructions: 'Go to WooCommerce → Settings → Advanced → REST API → Add key. Permissions: Read.',
    webhookPath: '/wp-admin/admin.php?page=wc-settings&tab=advanced&section=webhooks',
    webhookInstructions: 'Go to WooCommerce → Settings → Advanced → Webhooks → Add webhook',
    webhookTopic: 'Order created'
  },
  shopify: { 
    name: 'Shopify', 
    color: '#96bf48',
    fields: ['shop_name', 'access_token'],
    apiPath: '/admin/settings/apps/development',
    instructions: 'Go to Settings → Apps → Develop apps → Create app → Configure API permissions.',
    webhookPath: '/admin/settings/notifications',
    webhookInstructions: 'Go to Settings → Notifications → Webhooks → Create webhook',
    webhookTopic: 'Order creation'
  },
  prestashop: { 
    name: 'PrestaShop', 
    color: '#df0067',
    fields: ['api_key'],
    apiPath: '/admin/index.php?controller=AdminWebservice',
    instructions: 'Go to Advanced Parameters → Webservice → Add key. Enable product permissions.',
    webhookPath: '/admin/index.php?controller=AdminModules',
    webhookInstructions: 'Install a webhook module or use the API to poll for new orders',
    webhookTopic: 'actionValidateOrder'
  },
  magento: { 
    name: 'Magento', 
    color: '#f26322',
    fields: ['access_token'],
    apiPath: '/admin/system_config/edit/section/oauth/',
    instructions: 'Go to System → Integrations → Add new integration → Generate token.',
    webhookPath: '/admin/system/webhook',
    webhookInstructions: 'Go to System → Webhooks → Add new webhook',
    webhookTopic: 'sales_order_save_after'
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

export function EcommerceConnectionsSection() {
  const [connections, setConnections] = useState<EcommerceConnection[]>([])
  const [loading, setLoading] = useState(true)
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
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const response = await ApiClient.request('/api/ecommerce/connections')
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
      const response = await ApiClient.request('/api/ecommerce/connections', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          platform: formData.platform,
          store_url: formData.store_url,
          credentials: getCredentials(),
        }),
      })

      if (response.success) {
        setConnections([response.data as EcommerceConnection, ...connections])
        setShowForm(false)
        resetForm()
        toast.success('Connected!', 'Store connected successfully. You can now sync products.')
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
        toast.success('Syncing!', 'Products are being synchronized. This may take a few minutes.')
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
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
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

              {/* Help box with direct link */}
              {formData.store_url && (
                <div className="ml-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900">
                        Where do I find my {platformConfig[formData.platform].name} credentials?
                      </p>
                      <p className="text-sm text-blue-800">
                        {platformConfig[formData.platform].instructions}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => window.open(getApiUrl(formData.store_url, formData.platform), '_blank')}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Get my API keys
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!formData.store_url && (
                <div className="ml-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    👆 First enter your store URL above to see the direct link to your credentials.
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
                      Auto-sync Orders (Webhook)
                    </div>
                    
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-900 mb-3">
                        <strong>What is this?</strong> A webhook automatically notifies us when a new order is placed in your store. 
                        This way, orders sync instantly without manual clicking.
                      </p>
                      
                      <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">1</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900">Copy this Webhook URL:</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Input 
                                value={webhookUrl} 
                                readOnly 
                                className="bg-white text-xs font-mono"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(webhookUrl)}
                                className="flex-shrink-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">2</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900">Go to your store's webhook settings:</p>
                            <p className="text-sm text-purple-800 mt-1">{config.webhookInstructions}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 bg-white"
                              onClick={() => window.open(getWebhookSettingsUrl(connection.store_url, connection.platform), '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Webhook Settings
                            </Button>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">3</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900">Create a new webhook with these settings:</p>
                            <ul className="text-sm text-purple-800 mt-1 space-y-1 ml-4 list-disc">
                              <li><strong>Delivery URL:</strong> Paste the URL from step 1</li>
                              <li><strong>Topic/Event:</strong> {config.webhookTopic}</li>
                              <li><strong>Format:</strong> JSON</li>
                              <li><strong>Status:</strong> Active</li>
                            </ul>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center flex-shrink-0">4</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900">Save and you're done! 🎉</p>
                            <p className="text-sm text-purple-800 mt-1">
                              New orders will now sync automatically. You can test it by placing a test order.
                            </p>
                          </div>
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
