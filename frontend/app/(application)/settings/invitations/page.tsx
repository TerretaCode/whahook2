"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspaceContext } from "@/contexts/WorkspaceContext"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/lib/toast"
import { 
  Users,
  UserPlus,
  Mail,
  Loader2,
  UserCircle,
  Trash2,
  AlertCircle
} from "lucide-react"

interface TeamMember {
  id: string
  user_id: string | null
  user_email?: string
  user_name?: string
  invited_email: string
  role: 'agent' | 'messages' | 'marketing'
  status: 'pending' | 'active' | 'inactive'
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  agent: 'Agente',
  messages: 'Mensajes',
  marketing: 'Marketing'
}

const ROLE_COLORS: Record<string, string> = {
  agent: 'bg-green-100 text-green-800',
  messages: 'bg-blue-100 text-blue-800',
  marketing: 'bg-purple-100 text-purple-800'
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  agent: 'Acceso a Dashboard, Mensajes, Clientes y Campañas',
  messages: 'Acceso a Dashboard y Mensajes',
  marketing: 'Acceso a Dashboard, Clientes y Campañas'
}

export default function InvitationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { workspace, isOwner } = useWorkspaceContext()
  
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'agent' | 'messages' | 'marketing'>('agent')
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (workspace?.id) {
      fetchMembers()
    }
  }, [workspace?.id])

  const fetchMembers = async () => {
    if (!workspace?.id) return
    
    try {
      setIsLoading(true)
      const response = await ApiClient.request<{ members: TeamMember[] }>(
        `/api/workspaces/${workspace.id}/members`
      )
      if (response.success && response.data?.members) {
        // Filter only agent and viewer roles (team members invited by client)
        const teamMembers = response.data.members.filter(
          m => m.role === 'agent' || m.role === 'messages' || m.role === 'marketing'
        )
        setMembers(teamMembers)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !workspace?.id) return

    setIsInviting(true)
    try {
      const response = await ApiClient.request(
        `/api/workspaces/${workspace.id}/members`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole
          })
        }
      )

      if (response.success) {
        toast.success('¡Invitación enviada!', `Se ha enviado una invitación a ${inviteEmail}`)
        setInviteEmail('')
        setShowInviteForm(false)
        fetchMembers()
      } else {
        throw new Error(response.error || 'Error al enviar invitación')
      }
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudo enviar la invitación')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!workspace?.id) return
    if (!confirm('¿Estás seguro de que quieres eliminar a este miembro del equipo?')) return

    try {
      const response = await ApiClient.request(
        `/api/workspaces/${workspace.id}/members/${memberId}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        toast.success('Miembro eliminado')
        fetchMembers()
      } else {
        throw new Error(response.error || 'Error al eliminar miembro')
      }
    } catch (error: any) {
      toast.error('Error', error.message || 'No se pudo eliminar el miembro')
    }
  }

  // Only clients can access this page
  if (!authLoading && workspace && !workspace.member_role?.includes('client') && !isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso denegado</h2>
          <p className="text-gray-600">No tienes permisos para gestionar el equipo.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary, #22c55e)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitaciones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Invita a miembros de tu equipo para gestionar mensajes o marketing
          </p>
        </div>
        {!showInviteForm && (
          <Button 
            onClick={() => setShowInviteForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invitar
          </Button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invitar miembro</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="miembro@empresa.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'agent' | 'messages' | 'marketing')}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  <option value="agent">Agente - Mensajes, Clientes y Campañas</option>
                  <option value="messages">Mensajes - Solo mensajes</option>
                  <option value="marketing">Marketing - Clientes y campañas</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {ROLE_DESCRIPTIONS[inviteRole]}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isInviting} className="bg-green-600 hover:bg-green-700">
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar invitación
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Miembros del equipo
          </h2>
        </div>
        
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin miembros</h3>
            <p className="text-gray-500 mb-4">
              Aún no has invitado a ningún miembro de tu equipo.
            </p>
            <Button 
              onClick={() => setShowInviteForm(true)}
              variant="outline"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invitar primer miembro
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {member.user_name || member.user_email || member.invited_email}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                      {member.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {member.user_email || member.invited_email}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Sobre los roles</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Agente:</strong> Puede ver el dashboard, gestionar mensajes, clientes y campañas.</li>
          <li><strong>Mensajes:</strong> Puede ver el dashboard y gestionar mensajes de WhatsApp y Web.</li>
          <li><strong>Marketing:</strong> Puede ver el dashboard, clientes y campañas de marketing.</li>
        </ul>
      </div>
    </div>
  )
}
