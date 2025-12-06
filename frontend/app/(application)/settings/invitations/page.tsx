"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
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

const ROLE_COLORS: Record<string, string> = {
  agent: 'bg-green-100 text-green-800',
  messages: 'bg-green-100 text-green-800',
  marketing: 'bg-green-100 text-green-800'
}

export default function InvitationsPage() {
  const t = useTranslations('settings.invitations')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { workspace, isOwner } = useWorkspaceContext()
  
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const initialLoadDone = useRef(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'agent' | 'messages' | 'marketing'>('agent')
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const fetchMembers = useCallback(async () => {
    if (!workspace?.id) return
    
    try {
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
      setIsInitialLoad(false)
    }
  }, [workspace?.id])

  useEffect(() => {
    if (workspace?.id && !initialLoadDone.current) {
      initialLoadDone.current = true
      fetchMembers()
    }
  }, [workspace?.id, fetchMembers])

  const handleInvite = useCallback(async (e: React.FormEvent) => {
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
        toast.success(t('invitationSent'), t('invitationSentDesc', { email: inviteEmail }))
        setInviteEmail('')
        setShowInviteForm(false)
        fetchMembers()
      } else {
        throw new Error(response.error || t('inviteError'))
      }
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('inviteError'))
    } finally {
      setIsInviting(false)
    }
  }, [workspace?.id, inviteEmail, inviteRole, fetchMembers])

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!workspace?.id) return
    if (!confirm(t('confirmRemove'))) return

    try {
      const response = await ApiClient.request(
        `/api/workspaces/${workspace.id}/members/${memberId}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        toast.success(t('memberRemoved'))
        fetchMembers()
      } else {
        throw new Error(response.error || t('removeError'))
      }
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('removeError'))
    }
  }, [workspace?.id, fetchMembers])

  // Only clients can access this page - owners should use Workspaces section
  const isClient = workspace?.member_role === 'client'
  
  if (!authLoading && workspace && isOwner) {
    // Redirect owners to workspaces page
    router.push('/settings/workspaces')
    return null
  }
  
  if (!authLoading && workspace && !isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('accessDenied')}</h2>
          <p className="text-gray-600">{t('clientsOnly')}</p>
        </div>
      </div>
    )
  }

  if (isInitialLoad) {
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
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('subtitle')}
          </p>
        </div>
        {!showInviteForm && (
          <Button 
            onClick={() => setShowInviteForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {t('invite')}
          </Button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('inviteMember')}</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tCommon('email')}
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('role')}
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'agent' | 'messages' | 'marketing')}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  <option value="agent">{t('roles.agent.label')}</option>
                  <option value="messages">{t('roles.messages.label')}</option>
                  <option value="marketing">{t('roles.marketing.label')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {t(`roles.${inviteRole}.description`)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isInviting} className="bg-green-600 hover:bg-green-700 text-white">
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {t('sendInvitation')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
              >
                {tCommon('cancel')}
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
            {t('teamMembers')}
          </h2>
        </div>
        
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noMembers')}</h3>
            <p className="text-gray-500 mb-4">
              {t('noMembersDesc')}
            </p>
            <Button 
              onClick={() => setShowInviteForm(true)}
              variant="outline"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {t('inviteFirst')}
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
                        {t(`roles.${member.role}.name`)}
                      </span>
                      {member.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {t('pending')}
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">ℹ️ {t('aboutRoles')}</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li><strong>{t('roles.agent.name')}:</strong> {t('roles.agent.fullDescription')}</li>
          <li><strong>{t('roles.messages.name')}:</strong> {t('roles.messages.fullDescription')}</li>
          <li><strong>{t('roles.marketing.name')}:</strong> {t('roles.marketing.fullDescription')}</li>
        </ul>
      </div>
    </div>
  )
}

