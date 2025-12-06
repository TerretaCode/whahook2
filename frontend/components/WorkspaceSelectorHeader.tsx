"use client"

import { useTranslations } from 'next-intl'
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspaceContext } from "@/contexts/WorkspaceContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2 } from "lucide-react"

interface WorkspaceSelectorHeaderProps {
  namespace?: string // Translation namespace for selectWorkspace key
}

/**
 * Workspace selector component for page headers.
 * Only shows for owners with Pro/Enterprise plans who have multiple workspaces.
 * Members see a badge with their workspace name.
 */
export function WorkspaceSelectorHeader({ namespace = 'common' }: WorkspaceSelectorHeaderProps) {
  const t = useTranslations(namespace)
  const { user } = useAuth()
  const { workspace, workspaces, setWorkspace, isOwner } = useWorkspaceContext()

  const subscriptionTier = user?.profile?.subscription_tier || 'basic'
  const isPaidPlan = subscriptionTier === 'pro' || subscriptionTier === 'enterprise'
  const ownerWorkspaces = workspaces.filter(w => w.is_owner)
  const showSelector = isOwner && isPaidPlan && ownerWorkspaces.length > 1

  // Debug log - remove after testing
  console.log('[WorkspaceSelector]', {
    currentWorkspace: workspace?.name,
    workspaceId: workspace?.id,
    isOwner,
    subscriptionTier,
    isPaidPlan,
    ownerWorkspacesCount: ownerWorkspaces.length,
    showSelector
  })

  // Owner with Pro/Enterprise and multiple workspaces - show selector
  if (showSelector) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-500" />
        <Select 
          value={workspace?.id} 
          onValueChange={(id) => {
            const ws = workspaces.find(w => w.id === id)
            if (ws) setWorkspace(ws)
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('selectWorkspace')} />
          </SelectTrigger>
          <SelectContent>
            {ownerWorkspaces.map((ws) => (
              <SelectItem key={ws.id} value={ws.id}>
                {ws.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Member (not owner) - show workspace badge
  if (!isOwner && workspace) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
        <Building2 className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-gray-700">{workspace.name}</span>
      </div>
    )
  }

  // Owner with single workspace or basic plan - don't show anything
  return null
}
