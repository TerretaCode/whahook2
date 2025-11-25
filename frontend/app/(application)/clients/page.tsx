"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download, Loader2, Users, UserCheck, Star, Smartphone } from "lucide-react"
import { ClientsTable } from "./components/ClientsTable"
import { ClientModal } from "./components/ClientModal"

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  tags?: string[]
  status: 'active' | 'inactive' | 'lead'
  source: 'whatsapp' | 'web' | 'manual'
  created_at: string
  last_contact?: string
  notes?: string
}

export default function ClientsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'lead'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  useEffect(() => {
    filterClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, searchQuery, statusFilter])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement real API call
      // const response = await ApiClient.request('/api/clients')
      // setClients(response.data)
      
      setClients([])
      setIsLoading(false)
    } catch {
      setIsLoading(false)
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
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.includes(query) ||
        client.company?.toLowerCase().includes(query)
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
      // TODO: Implement real API call
      // await ApiClient.request(`/api/clients/${clientId}`, { method: 'DELETE' })
      
      setClients(prev => prev.filter(c => c.id !== clientId))
    } catch {
      alert('Error al eliminar el cliente')
    }
  }

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (selectedClient) {
        // Update existing client
        // TODO: Implement real API call
        // await ApiClient.request(`/api/clients/${selectedClient.id}`, {
        //   method: 'PUT',
        //   body: JSON.stringify(clientData)
        // })
        
        setClients(prev => prev.map(c => 
          c.id === selectedClient.id ? { ...c, ...clientData } : c
        ))
      } else {
        // Create new client
        // TODO: Implement real API call
        // const response = await ApiClient.request('/api/clients', {
        //   method: 'POST',
        //   body: JSON.stringify(clientData)
        // })
        
        const newClient: Client = {
          ...clientData as Client,
          id: Date.now().toString(),
          created_at: new Date().toISOString()
        }
        setClients(prev => [newClient, ...prev])
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
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              size="sm"
              onClick={handleAddClient}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Nuevo Cliente
            </Button>
          </div>
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
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Activos
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
                <p className="text-sm text-gray-600">Total Clientes</p>
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
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'active').length}
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
                <p className="text-sm text-gray-600">Desde WhatsApp</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.source === 'whatsapp').length}
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
