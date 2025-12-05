"use client"

import { Edit, Trash2, Mail, Phone, Building2, Users, Sparkles, Loader2, MessageSquare, Smile, Meh, Frown, Globe, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import type { Client } from "../page"

interface ClientsTableProps {
  clients: Client[]
  isLoading: boolean
  onEdit: (client: Client) => void
  onDelete: (clientId: string) => void
  onExtractInfo: (clientId: string) => Promise<void>
}

// Status badge styles - defined outside component to avoid recreation
const STATUS_STYLES: Record<string, string> = {
  customer: 'bg-green-100 text-green-800 border-green-200',
  prospect: 'bg-blue-100 text-blue-800 border-blue-200',
  lead: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200'
}

const STATUS_LABELS: Record<string, string> = {
  customer: 'Customer',
  prospect: 'Prospect',
  lead: 'Lead',
  inactive: 'Inactive'
}

const INTEREST_STYLES: Record<string, string> = {
  product: 'bg-purple-100 text-purple-800',
  service: 'bg-indigo-100 text-indigo-800',
  support: 'bg-orange-100 text-orange-800',
  information: 'bg-cyan-100 text-cyan-800',
  complaint: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
}

const INTEREST_LABELS: Record<string, string> = {
  product: 'Product',
  service: 'Service',
  support: 'Support',
  information: 'Info',
  complaint: 'Complaint',
  other: 'Other'
}

function ClientsTableComponent({ clients, isLoading, onEdit, onDelete, onExtractInfo }: ClientsTableProps) {
  const router = useRouter()
  const [extractingId, setExtractingId] = useState<string | null>(null)

  const handleExtract = useCallback(async (clientId: string) => {
    setExtractingId(clientId)
    try {
      await onExtractInfo(clientId)
    } finally {
      setExtractingId(null)
    }
  }, [onExtractInfo])

  const getStatusBadge = useCallback((status: Client['status']) => (
    <Badge variant="outline" className={STATUS_STYLES[status] || STATUS_STYLES.lead}>
      {STATUS_LABELS[status] || 'Lead'}
    </Badge>
  ), [])

  const getInterestBadge = useCallback((interest?: string) => {
    if (!interest) return null
    return (
      <Badge variant="secondary" className={INTEREST_STYLES[interest] || INTEREST_STYLES.other}>
        {INTEREST_LABELS[interest] || interest}
      </Badge>
    )
  }, [])

  const getSatisfactionBadge = useCallback((satisfaction?: string) => {
    if (!satisfaction || satisfaction === 'unknown') {
      return <span className="text-xs text-gray-400">-</span>
    }
    
    const config: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
      happy: { icon: <Smile className="w-3 h-3" />, bg: 'bg-green-100', text: 'text-green-700', label: 'Happy' },
      neutral: { icon: <Meh className="w-3 h-3" />, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Neutral' },
      unhappy: { icon: <Frown className="w-3 h-3" />, bg: 'bg-red-100', text: 'text-red-700', label: 'Unhappy' }
    }

    const info = config[satisfaction]
    if (!info) return <span className="text-xs text-gray-400">-</span>

    return (
      <span className={`${info.bg} ${info.text} px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit`}>
        {info.icon}
        {info.label}
      </span>
    )
  }, [])

  const goToConversation = useCallback((phone: string) => {
    // Navigate to conversations with the phone number as filter
    router.push(`/conversations?phone=${phone}`)
  }, [router])

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
            No clients yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start by adding your first client
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
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satisfaction
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Messages
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                {/* NAME */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {/* Source indicator */}
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      client.source === 'web' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`} title={client.source === 'web' ? 'Web Visitor' : 'WhatsApp'}>
                      {client.source === 'web' ? <Globe className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {client.full_name || client.whatsapp_name || '-'}
                      </div>
                      {client.company && (
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {client.company}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                {/* PHONE - show email for web visitors without phone */}
                <td className="px-3 py-3">
                  {client.phone ? (
                    <button
                      onClick={() => goToConversation(client.phone)}
                      className="flex items-center gap-1 text-gray-700 hover:text-green-600 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      {client.phone}
                    </button>
                  ) : client.source === 'web' && client.visitor_id ? (
                    <span className="text-xs text-gray-400">Web visitor</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                {/* EMAIL */}
                <td className="px-3 py-3">
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-gray-700 hover:text-green-600 transition-colors">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{client.email}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                {/* SUMMARY - keep existing code after this */}
                <td className="px-3 py-3 max-w-[200px]">
                  {client.ai_summary ? (
                    <p className="text-sm text-gray-600 truncate" title={client.ai_summary}>
                      {client.ai_summary}
                    </p>
                  ) : client.interest_details ? (
                    <p className="text-sm text-gray-600 truncate" title={client.interest_details}>
                      {client.interest_details}
                    </p>
                  ) : (
                    <span className="text-gray-400 text-sm">No summary</span>
                  )}
                  {client.interest_type && getInterestBadge(client.interest_type)}
                </td>
                {/* STATUS */}
                <td className="px-3 py-3">
                  {getStatusBadge(client.status)}
                </td>
                {/* SATISFACTION */}
                <td className="px-3 py-3">
                  {getSatisfactionBadge(client.satisfaction)}
                </td>
                {/* MESSAGES */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-sm">{client.total_messages || 0}</span>
                  </div>
                </td>
                {/* ACTIONS */}
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExtract(client.id)}
                      disabled={extractingId === client.id}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      title="Extract info with AI"
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
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(client.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Mobile Cards - simplified view */}
      <div className="md:hidden divide-y divide-gray-200">
        {clients.map((client) => (
          <div key={client.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  client.source === 'web' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                  {client.source === 'web' ? <Globe className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    {client.full_name || client.whatsapp_name || 'Unknown'}
                  </div>
                  {client.phone && (
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  )}
                  {client.email && (
                    <div className="text-sm text-gray-500">{client.email}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getStatusBadge(client.status)}
              </div>
            </div>
            {client.ai_summary && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{client.ai_summary}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MessageSquare className="w-3 h-3" />
                {client.total_messages || 0} messages
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleExtract(client.id)} disabled={extractingId === client.id}>
                  {extractingId === client.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(client.id)} className="text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const ClientsTable = memo(ClientsTableComponent)
