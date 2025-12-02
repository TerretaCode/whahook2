"use client"

import { useState, useEffect } from 'react'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { ApiClient } from '@/lib/api-client'

export interface AgencyBranding {
  logo_url: string | null
  logo_text: string           // Texto opcional al lado del logo
  primary_color: string
  secondary_color: string
  agency_name: string
  powered_by_text: string
  show_powered_by: boolean
  favicon_url?: string | null
  tab_title?: string | null
}

const DEFAULT_BRANDING: AgencyBranding = {
  logo_url: null,
  logo_text: 'WhaHook',
  primary_color: '#22c55e',
  secondary_color: '#16a34a',
  agency_name: 'WhaHook',
  powered_by_text: '',
  show_powered_by: true
}

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

// Get branding from custom domain cookies
function getBrandingFromCookies(): AgencyBranding | null {
  try {
    const brandingStr = getCookie('x-custom-domain-branding')
    if (brandingStr) {
      let parsed
      try {
        parsed = JSON.parse(decodeURIComponent(brandingStr))
      } catch {
        parsed = JSON.parse(brandingStr)
      }
      return {
        ...DEFAULT_BRANDING,
        ...parsed
      }
    }
  } catch (e) {
    console.error('Error parsing branding cookie:', e)
  }
  return null
}

/**
 * Hook to get the branding for the current workspace.
 * If the user is not the owner, it fetches the owner's branding.
 * If no custom branding is set, returns default Whahook branding.
 */
export function useBranding() {
  const { workspace, isOwner, isLoading: isWorkspaceLoading } = useWorkspaceContext()
  const [branding, setBranding] = useState<AgencyBranding>(DEFAULT_BRANDING)
  const [isLoading, setIsLoading] = useState(true)
  const [hasCustomBranding, setHasCustomBranding] = useState(false)

  useEffect(() => {
    // First, check if we're on a custom domain with branding in cookies
    const cookieBranding = getBrandingFromCookies()
    if (cookieBranding) {
      setBranding(cookieBranding)
      setHasCustomBranding(true)
      setIsLoading(false)
      return
    }

    // Wait for workspace to finish loading first
    if (isWorkspaceLoading) {
      return
    }

    // If user is owner, they see Whahook branding (they configure it themselves)
    if (isOwner) {
      setBranding(DEFAULT_BRANDING)
      setHasCustomBranding(false)
      setIsLoading(false)
      return
    }

    // If no workspace selected (and not loading), use default
    if (!workspace?.id) {
      setBranding(DEFAULT_BRANDING)
      setHasCustomBranding(false)
      setIsLoading(false)
      return
    }

    // Fetch the owner's branding for this workspace
    setIsLoading(true)
    async function fetchBranding() {
      try {
        const response = await ApiClient.get(`/api/workspaces/${workspace!.id}/branding`)
        
        if (response.success && response.data) {
          const data = response.data as AgencyBranding
          // Only use custom branding if it has logo_url or logo_text
          if (data.logo_url || data.logo_text) {
            setBranding({
              ...DEFAULT_BRANDING,
              ...data
            })
            setHasCustomBranding(true)
          } else {
            setBranding(DEFAULT_BRANDING)
            setHasCustomBranding(false)
          }
        } else {
          setBranding(DEFAULT_BRANDING)
          setHasCustomBranding(false)
        }
      } catch (error) {
        console.error('Error fetching branding:', error)
        setBranding(DEFAULT_BRANDING)
        setHasCustomBranding(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBranding()
  }, [workspace?.id, isOwner, isWorkspaceLoading])

  return {
    branding,
    isLoading,
    hasCustomBranding,
    isWhitelabel: hasCustomBranding && !isOwner
  }
}

/**
 * Fetch branding for a specific workspace (used in invitation page)
 */
export async function fetchWorkspaceBranding(workspaceId: string): Promise<AgencyBranding> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/workspaces/${workspaceId}/branding`)
    const result = await response.json()
    
    if (result.success && result.data) {
      const data = result.data as AgencyBranding
      if (data.logo_url || data.logo_text) {
        return {
          ...DEFAULT_BRANDING,
          ...data
        }
      }
    }
  } catch (error) {
    console.error('Error fetching workspace branding:', error)
  }
  
  return DEFAULT_BRANDING
}
