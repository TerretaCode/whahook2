"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { useWorkspaceContext } from "@/contexts/WorkspaceContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Megaphone,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquare,
  Mail,
  Users,
  Eye,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Filter,
  Calendar,
  AlertCircle
} from "lucide-react"
import { Client } from "../page"

interface Campaign {
  id: string
  name: string
  description?: string
  type: 'whatsapp' | 'email'
  status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled'
  message_template: string
  subject?: string
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  filters: {
    tags?: string[]
    status?: string[]
    last_interaction_days?: number
  }
  total_recipients: number
  sent_count: number
  delivered_count: number
  read_count: number
  failed_count: number
  replied_count: number
  created_at: string
}

interface CampaignsSectionProps {
  clients: Client[]
  onRefreshClients: () => void
}

export function CampaignsSection({ clients, onRefreshClients }: CampaignsSectionProps) {
  const { workspace } = useWorkspaceContext()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'whatsapp' as 'whatsapp' | 'email',
    message_template: '',
    subject: '',
    scheduled_at: '',
    filters: {
      tags: [] as string[],
      status: [] as string[],
      last_interaction_days: 0
    }
  })

  // Get unique tags from clients
  const allTags = Array.from(new Set(clients.flatMap(c => c.tags || [])))

  // Calculate recipients based on filters
  const getFilteredRecipients = () => {
    let filtered = clients

    // Filter by tags
    if (formData.filters.tags.length > 0) {
      filtered = filtered.filter(c => 
        c.tags?.some(tag => formData.filters.tags.includes(tag))
      )
    }

    // Filter by status
    if (formData.filters.status.length > 0) {
      filtered = filtered.filter(c => 
        formData.filters.status.includes(c.status)
      )
    }

    // Filter by last interaction
    if (formData.filters.last_interaction_days > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - formData.filters.last_interaction_days)
      filtered = filtered.filter(c => {
        if (!c.last_contact_at) return false
        return new Date(c.last_contact_at) >= cutoffDate
      })
    }

    // For email campaigns, only include clients with email
    if (formData.type === 'email') {
      filtered = filtered.filter(c => c.email)
    }

    return filtered
  }

  const filteredRecipients = getFilteredRecipients()

  useEffect(() => {
    if (workspace?.id) {
      fetchCampaigns()
    }
  }, [workspace?.id])

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true)
      const response = await ApiClient.request<Campaign[]>(
        `/api/campaigns?workspace_id=${workspace?.id}`
      )
      if (response.success && response.data) {
        setCampaigns(response.data)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.message_template) {
      alert('Por favor completa el nombre y el mensaje de la campaña')
      return
    }

    if (filteredRecipients.length === 0) {
      alert('No hay destinatarios que coincidan con los filtros seleccionados')
      return
    }

    try {
      setIsSaving(true)
      const response = await ApiClient.request<Campaign>('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          workspace_id: workspace?.id,
          total_recipients: filteredRecipients.length
        })
      })

      if (response.success && response.data) {
        setCampaigns(prev => [response.data!, ...prev])
        setIsCreateModalOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Error al crear la campaña')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('¿Estás seguro de que quieres enviar esta campaña ahora?')) return

    try {
      setIsSending(true)
      await ApiClient.request(`/api/campaigns/${campaignId}/send`, {
        method: 'POST'
      })
      await fetchCampaigns()
    } catch (error) {
      console.error('Error sending campaign:', error)
      alert('Error al enviar la campaña')
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta campaña?')) return

    try {
      await ApiClient.request(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      })
      setCampaigns(prev => prev.filter(c => c.id !== campaignId))
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Error al eliminar la campaña')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'whatsapp',
      message_template: '',
      subject: '',
      scheduled_at: '',
      filters: {
        tags: [],
        status: [],
        last_interaction_days: 0
      }
    })
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sending: 'bg-yellow-100 text-yellow-700',
      paused: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    const labels = {
      draft: 'Borrador',
      scheduled: 'Programada',
      sending: 'Enviando',
      paused: 'Pausada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }
    return <Badge className={styles[status]}>{labels[status]}</Badge>
  }

  const getTypeIcon = (type: 'whatsapp' | 'email') => {
    return type === 'whatsapp' 
      ? <MessageSquare className="w-4 h-4 text-green-600" />
      : <Mail className="w-4 h-4 text-blue-600" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Campañas</h3>
            <p className="text-sm text-gray-500">
              Envía mensajes masivos a tus clientes
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </Button>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No hay campañas
          </h4>
          <p className="text-gray-500 mb-4">
            Crea tu primera campaña para enviar mensajes masivos a tus clientes
          </p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Crear Campaña
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => (
            <div 
              key={campaign.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    campaign.type === 'whatsapp' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      {getStatusBadge(campaign.status)}
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.total_recipients} destinatarios
                      </span>
                      {campaign.status !== 'draft' && (
                        <>
                          <span className="flex items-center gap-1">
                            <Send className="w-4 h-4" />
                            {campaign.sent_count} enviados
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {campaign.delivered_count} entregados
                          </span>
                          {campaign.failed_count > 0 && (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              {campaign.failed_count} fallidos
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status === 'draft' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCampaign(campaign)
                          setIsPreviewModalOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleSendCampaign(campaign.id)}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {campaign.status === 'sending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600"
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  {campaign.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(campaign)
                        setIsPreviewModalOpen(true)
                      }}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-600" />
              Nueva Campaña
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Campaign Type */}
            <div className="space-y-2">
              <Label>Tipo de campaña</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'whatsapp' }))}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    formData.type === 'whatsapp'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${
                    formData.type === 'whatsapp' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {clients.length} contactos disponibles
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'email' }))}
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                    formData.type === 'email'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Mail className={`w-8 h-8 mx-auto mb-2 ${
                    formData.type === 'email' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium">Email</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {clients.filter(c => c.email).length} con email
                  </p>
                </button>
              </div>
            </div>

            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la campaña *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Promoción Black Friday"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción interna de la campaña"
              />
            </div>

            {/* Subject (only for email) */}
            {formData.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto del email *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Ej: ¡Oferta especial solo para ti!"
                />
              </div>
            )}

            {/* Message Template */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                value={formData.message_template}
                onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                placeholder={formData.type === 'whatsapp' 
                  ? "Hola {{nombre}}, tenemos una oferta especial para ti..."
                  : "Escribe el contenido del email..."
                }
                rows={5}
              />
              <p className="text-xs text-gray-500">
                Variables disponibles: {"{{nombre}}"}, {"{{empresa}}"}, {"{{telefono}}"}
              </p>
            </div>

            {/* Filters Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <Label className="text-base font-medium">Segmentación</Label>
              </div>

              {/* Filter by Status */}
              <div className="space-y-2">
                <Label className="text-sm">Filtrar por estado</Label>
                <div className="flex flex-wrap gap-2">
                  {['customer', 'prospect', 'lead', 'inactive'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            status: prev.filters.status.includes(status)
                              ? prev.filters.status.filter(s => s !== status)
                              : [...prev.filters.status, status]
                          }
                        }))
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.filters.status.includes(status)
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      {status === 'customer' ? 'Clientes' :
                       status === 'prospect' ? 'Prospectos' :
                       status === 'lead' ? 'Leads' : 'Inactivos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter by Tags */}
              {allTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Filtrar por etiquetas</Label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            filters: {
                              ...prev.filters,
                              tags: prev.filters.tags.includes(tag)
                                ? prev.filters.tags.filter(t => t !== tag)
                                : [...prev.filters.tags, tag]
                            }
                          }))
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.filters.tags.includes(tag)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter by Last Interaction */}
              <div className="space-y-2">
                <Label className="text-sm">Última interacción</Label>
                <Select
                  value={formData.filters.last_interaction_days.toString()}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      last_interaction_days: parseInt(value)
                    }
                  }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Cualquier momento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Cualquier momento</SelectItem>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipients Preview */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Destinatarios:</span>
                  <span className="font-semibold text-purple-600">
                    {filteredRecipients.length} contactos
                  </span>
                </div>
                {filteredRecipients.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No hay contactos que coincidan con los filtros
                  </p>
                )}
              </div>
            </div>

            {/* Schedule (optional) */}
            <div className="space-y-2">
              <Label htmlFor="scheduled_at" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Programar envío (opcional)
              </Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Deja vacío para guardar como borrador
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCampaign}
              disabled={isSaving || !formData.name || !formData.message_template || filteredRecipients.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Campaña
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview/Stats Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCampaign?.status === 'completed' ? (
                <>
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Estadísticas de Campaña
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 text-purple-600" />
                  Vista Previa
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedCampaign.name}</h4>
                {selectedCampaign.description && (
                  <p className="text-sm text-gray-500">{selectedCampaign.description}</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedCampaign.message_template}
                </p>
              </div>

              {selectedCampaign.status !== 'draft' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCampaign.sent_count}</p>
                    <p className="text-xs text-blue-600">Enviados</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedCampaign.delivered_count}</p>
                    <p className="text-xs text-green-600">Entregados</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedCampaign.read_count}</p>
                    <p className="text-xs text-purple-600">Leídos</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{selectedCampaign.failed_count}</p>
                    <p className="text-xs text-red-600">Fallidos</p>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>Destinatarios: {selectedCampaign.total_recipients}</p>
                <p>Creada: {new Date(selectedCampaign.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
