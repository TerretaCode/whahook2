"use client"

import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Trash2, RefreshCw, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react"
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

const platformConfig: Record<Platform, { name: string; color: string; fields: string[] }> = {
  woocommerce: { 
    name: 'WooCommerce', 
    color: '#96588a',
    fields: ['consumer_key', 'consumer_secret']
  },
  shopify: { 
    name: 'Shopify', 
    color: '#96bf48',
    fields: ['shop_name', 'access_token']
  },
  prestashop: { 
    name: 'PrestaShop', 
    color: '#df0067',
    fields: ['api_key']
  },
  magento: { 
    name: 'Magento', 
    color: '#f26322',
    fields: ['access_token']
  },
}

export function EcommerceConnectionsSection() {
  const [connections, setConnections] = useState<EcommerceConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
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
        toast.success('Success!', 'Store connected successfully')
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
        toast.success('Success', 'Store disconnected')
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
        toast.success('Sync Started', 'Products and orders are being synchronized')
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Connection Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Store"
                  required
                />
              </div>
              <div>
                <Label>Platform</Label>
                <select
                  className="w-full p-2 border rounded-md"
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
              </div>

              {/* WooCommerce fields */}
              {formData.platform === 'woocommerce' && (
                <>
                  <div>
                    <Label>Consumer Key</Label>
                    <Input
                      value={formData.consumer_key}
                      onChange={(e) => setFormData({ ...formData, consumer_key: e.target.value })}
                      placeholder="ck_..."
                      required
                    />
                  </div>
                  <div>
                    <Label>Consumer Secret</Label>
                    <Input
                      type="password"
                      value={formData.consumer_secret}
                      onChange={(e) => setFormData({ ...formData, consumer_secret: e.target.value })}
                      placeholder="cs_..."
                      required
                    />
                  </div>
                </>
              )}

              {/* Shopify fields */}
              {formData.platform === 'shopify' && (
                <>
                  <div>
                    <Label>Shop Name (without .myshopify.com)</Label>
                    <Input
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      placeholder="my-store"
                      required
                    />
                  </div>
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="shpat_..."
                      required
                    />
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
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
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
          {connections.map((connection) => (
            <div key={connection.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: platformConfig[connection.platform].color }}
                  >
                    {platformConfig[connection.platform].name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{connection.name}</h3>
                      {getStatusBadge(connection.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {platformConfig[connection.platform].name} • {connection.store_url}
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
                    variant="outline"
                    onClick={() => handleSync(connection.id)}
                    disabled={syncing === connection.id}
                    title="Sync products and orders"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing === connection.id ? 'animate-spin' : ''}`} />
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
          ))}
        </div>
      )}
    </div>
  )
}
