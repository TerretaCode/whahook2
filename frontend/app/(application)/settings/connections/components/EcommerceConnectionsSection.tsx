"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('settings.connections.ecommerce')
  const tCommon = useTranslations('common')
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
        toast.success(t('connected'), t('connectedDesc'))
      }
    } catch (error) {
      console.error('Error creating connection:', error)
      toast.error(tCommon('error'), error instanceof Error ? error.message : t('connectError'))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('confirmDisconnect', { name }))) return

    try {
      const response = await ApiClient.request(`/api/ecommerce/connections/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        setConnections(connections.filter(c => c.id !== id))
        toast.success(t('disconnected'), t('disconnectedDesc'))
      }
    } catch (error) {
      console.error('Error deleting connection:', error)
      toast.error(tCommon('error'), t('disconnectError'))
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
        toast.success(t('syncComplete'), t('syncCompleteDesc'))
        // Close the expanded section
        setExpandedConnection(null)
        // Refetch after a delay
        setTimeout(fetchConnections, 3000)
      }
    } catch (error) {
      console.error('Error syncing:', error)
      toast.error(tCommon('error'), t('syncError'))
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
    toast.success(tCommon('copied'), t('webhookCopied'))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1 text-green-600 text-xs"><Check className="w-3 h-3" /> {t('statusActive')}</span>
      case 'error':
        return <span className="flex items-center gap-1 text-red-600 text-xs"><AlertCircle className="w-3 h-3" /> {t('statusError')}</span>
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-600 text-xs"><Loader2 className="w-3 h-3 animate-spin" /> {t('statusPending')}</span>
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
          <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('connectStore')}
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
                {t('basicInfo')}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                <div>
                  <Label>{t('connectionName')}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('connectionNamePlaceholder')}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('connectionNameHint')}</p>
                </div>
                <div>
                  <Label>{t('platform')}</Label>
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
                  <Label>{t('storeUrl')}</Label>
                  <Input
                    value={formData.store_url}
                    onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                    placeholder={t('storeUrlPlaceholder')}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('storeUrlHint')}</p>
                </div>
              </div>
            </div>

            {/* Step 2: API Credentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">2</span>
                {t('apiCredentials')}
              </div>

              {/* Help box with detailed instructions */}
              {formData.store_url && (
                <div className="ml-8 p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium text-green-900">
                        {t('instructions.howToGet', { platform: platformConfig[formData.platform].name })}
                      </p>
                      
                      {/* Step 1: Open settings */}
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0">1</span>
                        <div>
                          <p className="text-sm text-green-800">{t('instructions.openSettings')}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-1 bg-white border-green-300 text-green-700 hover:bg-green-100"
                            onClick={() => window.open(getApiUrl(formData.store_url, formData.platform), '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-2" />
                            {t('instructions.openSettingsBtn', { platform: platformConfig[formData.platform].name })}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Step 2: Fill form - Platform specific */}
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0">2</span>
                        <div className="flex-1">
                          <p className="text-sm text-green-800 mb-2">{t('instructions.clickAddKey')}</p>
                          
                          {formData.platform === 'woocommerce' && (
                            <div className="bg-white border border-green-200 rounded-lg p-3 space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-24 text-green-700 font-medium">{t('instructions.woocommerce.description')}:</span>
                                <span className="text-gray-700">{t('instructions.woocommerce.descriptionValue')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-24 text-green-700 font-medium">{t('instructions.woocommerce.user')}:</span>
                                <span className="text-gray-700">{t('instructions.woocommerce.userValue')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-24 text-green-700 font-medium">{t('instructions.woocommerce.permissions')}:</span>
                                <code className="bg-green-100 px-2 py-0.5 rounded text-xs">Read</code>
                              </div>
                            </div>
                          )}
                          
                          {formData.platform === 'shopify' && (
                            <div className="bg-white border border-green-200 rounded-lg p-3 space-y-2 text-sm">
                              <p className="text-xs text-green-600 mb-2">{t('instructions.shopify.createApp')}</p>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-green-700 font-medium">{t('instructions.shopify.appName')}:</span>
                                <span className="text-gray-700">{t('instructions.shopify.appNameValue')}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-28 text-green-700 font-medium flex-shrink-0">{t('instructions.shopify.apiScopes')}:</span>
                                <div className="text-gray-700 text-xs space-y-1">
                                  <div>✓ <code className="bg-green-100 px-1 rounded">read_orders</code></div>
                                  <div>✓ <code className="bg-green-100 px-1 rounded">read_products</code></div>
                                </div>
                              </div>
                              <p className="text-xs text-green-600 mt-2">{t('instructions.shopify.afterSaving')}</p>
                            </div>
                          )}
                          
                          {formData.platform === 'prestashop' && (
                            <div className="bg-white border border-green-200 rounded-lg p-3 space-y-2 text-sm">
                              <p className="text-xs text-green-600 mb-2">{t('instructions.prestashop.enableFirst')}</p>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-green-700 font-medium">{t('instructions.prestashop.key')}:</span>
                                <span className="text-gray-700">{t('instructions.prestashop.keyValue')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-green-700 font-medium">{t('instructions.prestashop.description')}:</span>
                                <span className="text-gray-700">{t('instructions.prestashop.descriptionValue')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-green-700 font-medium">{t('instructions.prestashop.status')}:</span>
                                <code className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Yes</code>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-28 text-green-700 font-medium flex-shrink-0">{t('instructions.prestashop.permissions')}:</span>
                                <div className="text-gray-700 text-xs space-y-1">
                                  <div>✓ <code className="bg-green-100 px-1 rounded">orders</code> → {t('instructions.prestashop.viewGet')}</div>
                                  <div>✓ <code className="bg-green-100 px-1 rounded">products</code> → {t('instructions.prestashop.viewGet')}</div>
                                  <div>✓ <code className="bg-green-100 px-1 rounded">customers</code> → {t('instructions.prestashop.viewGet')}</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {formData.platform === 'magento' && (
                            <div className="bg-white border border-green-200 rounded-lg p-3 space-y-2 text-sm">
                              <p className="text-xs text-green-600 mb-2">{t('instructions.magento.goTo')}</p>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-green-700 font-medium">{t('instructions.magento.name')}:</span>
                                <span className="text-gray-700">{t('instructions.magento.nameValue')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-28 text-green-700 font-medium">{t('instructions.magento.email')}:</span>
                                <span className="text-gray-700">{t('instructions.magento.emailValue')}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-28 text-green-700 font-medium flex-shrink-0">{t('instructions.magento.apiTab')}:</span>
                                <div className="text-gray-700 text-xs space-y-1">
                                  <div>{t('instructions.magento.resourceAccess')}: <code className="bg-green-100 px-1 rounded">Custom</code></div>
                                  <div>✓ <code className="bg-green-100 px-1 rounded">Sales</code> → {t('instructions.magento.salesOrders')}</div>
                                  <div>✓ <code className="bg-green-100 px-1 rounded">Catalog</code> → {t('instructions.magento.catalogProducts')}</div>
                                </div>
                              </div>
                              <p className="text-xs text-green-600 mt-2">{t('instructions.magento.afterSaving')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Step 3: Generate and copy */}
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0">3</span>
                        <p className="text-sm text-green-800">
                          {t('instructions.generateCopy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!formData.store_url && (
                <div className="ml-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    {t('instructions.enterUrlFirst')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                {/* WooCommerce fields */}
                {formData.platform === 'woocommerce' && (
                  <>
                    <div>
                      <Label>{t('fields.consumerKey')}</Label>
                      <Input
                        value={formData.consumer_key}
                        onChange={(e) => setFormData({ ...formData, consumer_key: e.target.value })}
                        placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('fields.consumerKeyHint')}</p>
                    </div>
                    <div>
                      <Label>{t('fields.consumerSecret')}</Label>
                      <Input
                        type="password"
                        value={formData.consumer_secret}
                        onChange={(e) => setFormData({ ...formData, consumer_secret: e.target.value })}
                        placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('fields.consumerSecretHint')}</p>
                    </div>
                  </>
                )}

                {/* Shopify fields */}
                {formData.platform === 'shopify' && (
                  <>
                    <div>
                      <Label>{t('fields.shopName')}</Label>
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
                      <p className="text-xs text-gray-500 mt-1">{t('fields.shopNameHint')}</p>
                    </div>
                    <div>
                      <Label>{t('fields.accessToken')}</Label>
                      <Input
                        type="password"
                        value={formData.access_token}
                        onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                        placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('fields.accessTokenHint')}</p>
                    </div>
                  </>
                )}

                {/* PrestaShop fields */}
                {formData.platform === 'prestashop' && (
                  <div className="md:col-span-2">
                    <Label>{t('fields.apiKey')}</Label>
                    <Input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="Your PrestaShop API key"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('fields.apiKeyHint')}</p>
                  </div>
                )}

                {/* Magento fields */}
                {formData.platform === 'magento' && (
                  <div className="md:col-span-2">
                    <Label>{t('fields.accessToken')}</Label>
                    <Input
                      type="password"
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="Your Magento access token"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('fields.magentoTokenHint')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info about auto-sync */}
            <div className="ml-0 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Webhook className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {t('autoSync.title')}
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    {t('autoSync.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t('connect')}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                {t('cancel')}
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
            {t('noConnections')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('subtitle')}
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {t('connectFirst')}
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
                            {t('lastSync')}: {new Date(connection.last_sync_at).toLocaleString()}
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
                        className="bg-green-600 hover:bg-green-700 text-white"
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
                      <Webhook className="w-5 h-5 text-green-600" />
                      Auto-sync (Webhook Setup) - {config.name}
                    </div>
                    
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
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
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0">1</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">{config.webhookInstructions}</p>
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
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0">2</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900 mb-3">Create these webhooks (one per event):</p>
                          
                          <div className="space-y-3">
                            {config.webhookTopics.map((topic, idx) => (
                              <div key={idx} className="bg-white border border-green-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-100">
                                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                    Webhook {idx + 1}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">{topic.description}</span>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                  {/* Name */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-28 text-green-700 font-medium">Name:</span>
                                    <span className="text-gray-700">{topic.topic}</span>
                                  </div>
                                  
                                  {/* Status */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-28 text-green-700 font-medium">Status:</span>
                                    <code className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Active</code>
                                  </div>
                                  
                                  {/* Topic */}
                                  <div className="flex items-center gap-2">
                                    <span className="w-28 text-green-700 font-medium">Topic:</span>
                                    <code className="bg-green-100 px-2 py-0.5 rounded text-xs">{topic.topic}</code>
                                  </div>
                                  
                                  {/* URL */}
                                  <div className="flex items-start gap-2">
                                    <span className="w-28 text-green-700 font-medium flex-shrink-0">{config.urlLabel}:</span>
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
                                      <span className="w-28 text-green-700 font-medium">{field.label}:</span>
                                      <code className="bg-green-100 px-2 py-0.5 rounded text-xs">{field.value}</code>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <p className="text-xs text-green-600 mt-2 italic">
                            Tip: Start with just "Order created" if you want to test first.
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Complete setup */}
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0">3</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">Save webhooks in your store, then click below:</p>
                          <Button
                            size="sm"
                            className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleSync(connection.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Complete Setup & Sync Now
                          </Button>
                          <p className="text-xs text-green-600 mt-2">
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

