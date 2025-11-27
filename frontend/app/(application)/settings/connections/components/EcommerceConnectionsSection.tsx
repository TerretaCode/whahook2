"use client"

import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Trash2, RefreshCw, Check, AlertCircle, Loader2, ExternalLink, HelpCircle, Key } from "lucide-react"
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
}

const platformConfig: Record<Platform, PlatformConfig> = {
  woocommerce: { 
    name: 'WooCommerce', 
    color: '#96588a',
    fields: ['consumer_key', 'consumer_secret'],
    apiPath: '/wp-admin/admin.php?page=wc-settings&tab=advanced&section=keys',
    instructions: 'Ve a WooCommerce → Ajustes → Avanzado → API REST → Añadir clave. Permisos: Lectura.'
  },
  shopify: { 
    name: 'Shopify', 
    color: '#96bf48',
    fields: ['shop_name', 'access_token'],
    apiPath: '/admin/settings/apps/development',
    instructions: 'Ve a Configuración → Apps → Desarrollar apps → Crear app → Configurar permisos de API.'
  },
  prestashop: { 
    name: 'PrestaShop', 
    color: '#df0067',
    fields: ['api_key'],
    apiPath: '/admin/index.php?controller=AdminWebservice',
    instructions: 'Ve a Parámetros avanzados → Webservice → Añadir clave. Activa permisos de productos.'
  },
  magento: { 
    name: 'Magento', 
    color: '#f26322',
    fields: ['access_token'],
    apiPath: '/admin/system_config/edit/section/oauth/',
    instructions: 'Ve a Sistema → Integraciones → Añadir nueva integración → Generar token.'
  },
}

// Helper to build API URL from store URL
const getApiUrl = (storeUrl: string, platform: Platform): string => {
  if (!storeUrl) return ''
  let url = storeUrl.trim()
  // Remove trailing slash
  if (url.endsWith('/')) url = url.slice(0, -1)
  // Add https if missing
  if (!url.startsWith('http')) url = 'https://' + url
  return url + platformConfig[platform].apiPath
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
        toast.success('¡Conectada!', 'Tienda conectada correctamente. Ahora puedes sincronizar los productos.')
      }
    } catch (error) {
      console.error('Error creating connection:', error)
      toast.error('Error', error instanceof Error ? error.message : 'No se pudo conectar la tienda')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Seguro que quieres desconectar "${name}"? Los productos sincronizados se mantendrán.`)) return

    try {
      const response = await ApiClient.request(`/api/ecommerce/connections/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        setConnections(connections.filter(c => c.id !== id))
        toast.success('Desconectada', 'Tienda desconectada correctamente')
      }
    } catch (error) {
      console.error('Error deleting connection:', error)
      toast.error('Error', 'No se pudo desconectar la tienda')
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
        toast.success('¡Sincronizando!', 'Los productos se están sincronizando. Esto puede tardar unos minutos.')
        // Refetch after a delay
        setTimeout(fetchConnections, 3000)
      }
    } catch (error) {
      console.error('Error syncing:', error)
      toast.error('Error', 'No se pudo iniciar la sincronización')
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
        return <span className="flex items-center gap-1 text-green-600 text-xs"><Check className="w-3 h-3" /> Activa</span>
      case 'error':
        return <span className="flex items-center gap-1 text-red-600 text-xs"><AlertCircle className="w-3 h-3" /> Error</span>
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-600 text-xs"><Loader2 className="w-3 h-3 animate-spin" /> Pendiente</span>
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
          <h3 className="text-lg font-semibold text-gray-900">Conexiones E-commerce</h3>
          <p className="text-sm text-gray-600 mt-1">
            Conecta tu tienda online para sincronizar productos y que el bot pueda recomendarlos
          </p>
        </div>
        <Button 
          size="sm" 
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Conectar tienda
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
                Información básica
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                <div>
                  <Label>Nombre de la conexión</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Mi Tienda Online"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Un nombre para identificar esta tienda</p>
                </div>
                <div>
                  <Label>Plataforma</Label>
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
                  <Label>URL de tu tienda</Label>
                  <Input
                    value={formData.store_url}
                    onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                    placeholder="https://mitienda.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">La dirección web de tu tienda (sin /admin ni nada más)</p>
                </div>
              </div>
            </div>

            {/* Step 2: API Credentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-sm flex items-center justify-center">2</span>
                Credenciales de API
              </div>

              {/* Help box with direct link */}
              {formData.store_url && (
                <div className="ml-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900">
                        ¿Dónde encuentro las credenciales de {platformConfig[formData.platform].name}?
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
                        Ir a obtener mis claves API
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!formData.store_url && (
                <div className="ml-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    👆 Primero introduce la URL de tu tienda arriba para ver el enlace directo a las credenciales.
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
                      <p className="text-xs text-gray-500 mt-1">Empieza por "ck_"</p>
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
                      <p className="text-xs text-gray-500 mt-1">Empieza por "cs_"</p>
                    </div>
                  </>
                )}

                {/* Shopify fields */}
                {formData.platform === 'shopify' && (
                  <>
                    <div>
                      <Label>Nombre de la tienda</Label>
                      <div className="flex">
                        <Input
                          value={formData.shop_name}
                          onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                          placeholder="mi-tienda"
                          className="rounded-r-none"
                          required
                        />
                        <span className="inline-flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                          .myshopify.com
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Solo el nombre, sin .myshopify.com</p>
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
                      <p className="text-xs text-gray-500 mt-1">Empieza por "shpat_"</p>
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
                      placeholder="Tu clave de API de PrestaShop"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">La clave que generaste en el Webservice</p>
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
                      placeholder="Tu token de acceso de Magento"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">El token de integración que generaste</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Conectar tienda
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                Cancelar
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
            No tienes tiendas conectadas
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Conecta tu tienda online para que el bot pueda recomendar tus productos
          </p>
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Conectar mi primera tienda
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
                        Última sincronización: {new Date(connection.last_sync_at).toLocaleString('es-ES')}
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
                    {syncing === connection.id ? 'Sincronizando...' : 'Sincronizar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(connection.store_url, '_blank')}
                    title="Abrir tienda"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(connection.id, connection.name)}
                    title="Desconectar"
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
