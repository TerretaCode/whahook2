"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Plus, 
  Loader2, 
  RefreshCw,
  UserCircle,
  Link2,
  Trash2,
  Check,
  Mail
} from 'lucide-react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'

interface WorkspaceMember {
  id: string
  user_id: string | null
  role: 'owner' | 'admin' | 'client' | 'agent' | 'messages' | 'marketing' | 'custom'
  permissions: {
    dashboard: boolean
    messages: boolean
    clients: boolean
    campaigns: boolean
    settings: boolean
    ai_costs: boolean
  }
  access_token?: string
  invited_email: string | null
  user_email?: string
  user_name?: string
  status: 'pending' | 'active' | 'suspended' | 'expired'
  joined_at: string | null
  created_at: string
}

interface WorkspaceMembersSectionProps {
  workspaceId: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  client: 'Client',
  agent: 'Agente',
  messages: 'Mensajes',
  marketing: 'Marketing',
  custom: 'Custom'
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  client: 'bg-green-100 text-green-800',
  agent: 'bg-teal-100 text-teal-800',
  messages: 'bg-gray-100 text-gray-800',
  marketing: 'bg-cyan-100 text-cyan-800',
  custom: 'bg-orange-100 text-orange-800'
}

export function WorkspaceMembersSection({ workspaceId }: WorkspaceMembersSectionProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'client' | 'agent' | 'messages' | 'marketing'>('client')
  const [isInviting, setIsInviting] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const response = await ApiClient.request<WorkspaceMember[]>(
        `/api/workspaces/${workspaceId}/members`
      )
      console.log('Members response:', response)
      setMembers(response.data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Error', 'Error al cargar invitaciones')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (workspaceId) {
      fetchMembers()
    }
  }, [workspaceId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)
    try {
      const response = await ApiClient.request<{ data: WorkspaceMember; access_link: string }>(
        `/api/workspaces/${workspaceId}/members`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole
          })
        }
      )

      toast.success('Invited!', `Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setShowInviteForm(false)
      fetchMembers()
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to invite member')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      await ApiClient.request(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        { method: 'DELETE' }
      )
      toast.success('Removed', 'Member has been removed')
      fetchMembers()
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to remove member')
    }
  }

  const handleRegenerateToken = async (memberId: string) => {
    try {
      await ApiClient.request(
        `/api/workspaces/${workspaceId}/members/${memberId}/regenerate-token`,
        { method: 'POST' }
      )
      toast.success('Regenerated', 'Access link has been regenerated')
      fetchMembers()
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to regenerate token')
    }
  }

  const copyAccessLink = (token: string) => {
    const link = `${window.location.origin}/w/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    toast.success('Copied!', 'Access link copied to clipboard')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invitaciones</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestiona quién tiene acceso a este workspace
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invitar
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="admin">Admin - Full access</option>
                  <option value="client">Client - Dashboard, Messages, Clients, Campaigns + Connections</option>
                  <option value="agent">Agente - Dashboard, Messages, Clients, Campaigns</option>
                  <option value="messages">Mensajes - Dashboard, Messages only</option>
                  <option value="marketing">Marketing - Dashboard, Clients & Campaigns</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isInviting} className="bg-green-600 hover:bg-green-700">
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {member.user_name || member.user_email || member.invited_email || 'Unknown'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                    {member.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {member.user_email || member.invited_email}
                  </p>
                </div>
              </div>

              {member.role !== 'owner' && (
                <div className="flex items-center gap-2">
                  {member.access_token && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAccessLink(member.access_token!)}
                        title="Copy access link"
                      >
                        {copiedToken === member.access_token ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Link2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateToken(member.id)}
                        title="Regenerate access link"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay invitaciones aún</p>
              <p className="text-sm">Invita a tu primer miembro para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
        <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
          💡 Sobre los enlaces de acceso
        </h4>
        <p className="text-sm text-green-700 dark:text-green-300">
          Cada miembro recibe un enlace único para acceder a este workspace.
          Los invitados pueden ver y gestionar sus datos sin necesitar una cuenta de Whahook.
          Puedes regenerar los enlaces en cualquier momento para revocar el acceso.
        </p>
      </div>
    </div>
  )
}
