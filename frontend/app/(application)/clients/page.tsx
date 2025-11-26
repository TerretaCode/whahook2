"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Loader2, Users, UserCheck, Star, Smartphone, RefreshCw, Sparkles, Settings2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { ClientsTable } from "./components/ClientsTable"
import { ClientModal } from "./components/ClientModal"

export interface Client {
  id: string
  phone: string
  whatsapp_name?: string
  full_name?: string
  email?: string
  company?: string
  interest_type?: string
  interest_details?: string
  tags?: string[]
  notes?: string
  ai_summary?: string
  status: 'lead' | 'prospect' | 'customer' | 'inactive'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  total_conversations?: number
  total_messages?: number
  first_contact_at?: string
  last_contact_at?: string
  ai_extraction_status?: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

export default function ClientsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'customer' | 'prospect' | 'lead' | 'inactive'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [autoCapture, setAutoCapture] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchClients()
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true)
      const response = await ApiClient.request<any>('/api/clients/settings')
      if (response.success && response.data) {
        setAutoCapture(response.data.auto_capture_enabled ?? false)
      }
    } catch {
      // Settings might not exist yet
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleToggleAutoCapture = async (enabled: boolean) => {
    try {
      setAutoCapture(enabled)
      await ApiClient.request('/api/clients/settings', {
        method: 'POST',
        body: JSON.stringify({ auto_capture_enabled: enabled })
      })
    } catch {
      setAutoCapture(!enabled) // Revert on error
    }
  }

  useEffect(() => {
    filterClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, searchQuery, statusFilter])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await ApiClient.request<any>('/api/clients')
      if (response.success && response.data) {
        setClients(response.data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      await ApiClient.request('/api/clients/sync', { method: 'POST' })
      await fetchClients()
    } catch (error) {
      console.error('Error syncing clients:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExtractInfo = async (clientId: string) => {
    try {
      await ApiClient.request(`/api/clients/${clientId}/extract-info`, { method: 'POST' })
      await fetchClients()
    } catch (error) {
      console.error('Error extracting info:', error)
      alert('Error al extraer información. Asegúrate de tener configurado el chatbot con una API key válida.')
    }
  }

  const filterClients = () => {
    let filtered = clients

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(client =>
        (client.full_name || client.whatsapp_name || '').toLowerCase().includes(query) ||
        (client.email || '').toLowerCase().includes(query) ||
        client.phone.includes(query) ||
        (client.company || '').toLowerCase().includes(query)
      )
    }

    setFilteredClients(filtered)
  }

  const handleAddClient = () => {
    setSelectedClient(null)
    setIsModalOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsModalOpen(true)
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) return

    try {
      await ApiClient.request(`/api/clients/${clientId}`, { method: 'DELETE' })
      setClients(prev => prev.filter(c => c.id !== clientId))
    } catch {
      alert('Error al eliminar el cliente')
    }
  }

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (selectedClient) {
        await ApiClient.request(`/api/clients/${selectedClient.id}`, {
          method: 'PUT',
          body: JSON.stringify(clientData)
        })
        await fetchClients()
      }
      setIsModalOpen(false)
      setSelectedClient(null)
    } catch {
      alert('Error al guardar el cliente')
    }
  }

  const handleExport = () => {
    // TODO: Implement CSV export
    alert('Exportar a CSV - Próximamente')
  }

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Clientes
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona tu base de datos de clientes
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Auto Capture Settings Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Auto-Capture</h3>
                <p className="text-sm text-gray-500">
                  Automatically extract email, company & interests from conversations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isLoadingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <>
                  <span className={`text-sm font-medium ${autoCapture ? 'text-green-600' : 'text-gray-500'}`}>
                    {autoCapture ? 'Active' : 'Inactive'}
                  </span>
                  <Switch
                    checked={autoCapture}
                    onCheckedChange={handleToggleAutoCapture}
                  />
                </>
              )}
            </div>
          </div>
          {autoCapture && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Settings2 className="w-3 h-3" />
                Uses the AI model configured in <a href="/settings/ia" className="text-green-600 hover:underline">Settings → AI</a>
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono o empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'customer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('customer')}
                className={statusFilter === 'customer' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Clientes
              </Button>
              <Button
                variant={statusFilter === 'prospect' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('prospect')}
                className={statusFilter === 'prospect' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Prospectos
              </Button>
              <Button
                variant={statusFilter === 'lead' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('lead')}
                className={statusFilter === 'lead' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Leads
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
                className={statusFilter === 'inactive' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Inactivos
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contactos</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'customer').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'lead').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mensajes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((sum, c) => sum + (c.total_messages || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <ClientsTable
          clients={filteredClients}
          isLoading={isLoading}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onExtractInfo={handleExtractInfo}
        />

        {/* Modal */}
        <ClientModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedClient(null)
          }}
          onSave={handleSaveClient}
          client={selectedClient}
        />
      </div>
    </div>
  )
}
