"use client"

import { Edit, Trash2, Mail, Phone, Building2, Users, Sparkles, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import type { Client } from "../page"

interface ClientsTableProps {
  clients: Client[]
  isLoading: boolean
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
  onExtractInfo: (clientId: string) => Promise<void>
}

export function ClientsTable({ clients, isLoading, onEdit, onDelete, onExtractInfo }: ClientsTableProps) {
  const [extractingId, setExtractingId] = useState<string | null>(null)

  const handleExtract = async (clientId: string) => {
    setExtractingId(clientId)
    try {
      await onExtractInfo(clientId)
    } finally {
      setExtractingId(null)
    }
  }

  const getStatusBadge = (status: Client['status']) => {
    const styles: Record<string, string> = {
      customer: 'bg-green-100 text-green-800 border-green-200',
      prospect: 'bg-blue-100 text-blue-800 border-blue-200',
      lead: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const labels: Record<string, string> = {
      customer: 'Cliente',
      prospect: 'Prospecto',
      lead: 'Lead',
      inactive: 'Inactivo'
    }

    return (
      <Badge variant="outline" className={styles[status] || styles.lead}>
        {labels[status] || 'Lead'}
      </Badge>
    )
  }

  const getInterestBadge = (interest?: string) => {
    if (!interest) return null
    
    const styles: Record<string, string> = {
      product: 'bg-purple-100 text-purple-800',
      service: 'bg-indigo-100 text-indigo-800',
      support: 'bg-orange-100 text-orange-800',
      information: 'bg-cyan-100 text-cyan-800',
      complaint: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    }

    const labels: Record<string, string> = {
      product: 'Producto',
      service: 'Servicio',
      support: 'Soporte',
      information: 'Información',
      complaint: 'Queja',
      other: 'Otro'
    }

    return (
      <Badge variant="secondary" className={styles[interest] || styles.other}>
        {labels[interest] || interest}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay clientes
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza añadiendo tu primer cliente
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado / Interés
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mensajes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último contacto
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {client.full_name || client.whatsapp_name || 'Sin nombre'}
                    </div>
                    {client.company && (
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" />
                        {client.company}
                      </div>
                    )}
                    {client.ai_summary && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {client.ai_summary}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {client.phone}
                    </div>
                    {client.email && (
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {client.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(client.status)}
                    {getInterestBadge(client.interest_type)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {client.total_messages || 0}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {client.last_contact_at 
                    ? new Date(client.last_contact_at).toLocaleDateString('es-ES')
                    : '-'}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExtract(client.id)}
                      disabled={extractingId === client.id}
                      className="text-purple-600 hover:text-purple-700"
                      title="Extraer info con IA"
                    >
                      {extractingId === client.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(client)}
                      className="text-gray-600 hover:text-green-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(client.id)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {clients.map((client) => (
          <div key={client.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {client.full_name || client.whatsapp_name || 'Sin nombre'}
                </h3>
                {client.company && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" />
                    {client.company}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExtract(client.id)}
                  disabled={extractingId === client.id}
                  className="text-purple-600"
                >
                  {extractingId === client.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(client)}
                  className="text-gray-600 hover:text-green-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(client.id)}
                  className="text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="text-sm text-gray-900 flex items-center gap-2">
                <Phone className="w-3 h-3 text-gray-400" />
                {client.phone}
              </div>
              {client.email && (
                <div className="text-sm text-gray-900 flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gray-400" />
                  {client.email}
                </div>
              )}
            </div>

            {client.ai_summary && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{client.ai_summary}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {getStatusBadge(client.status)}
                {getInterestBadge(client.interest_type)}
              </div>
              <span className="text-xs text-gray-500">
                {client.total_messages || 0} msgs
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
