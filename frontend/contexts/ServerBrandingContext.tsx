"use client"

import { createContext, useContext, ReactNode } from 'react'
import { Branding, DEFAULT_BRANDING } from '@/lib/branding'

interface BrandingContextValue {
  branding: Branding
  isCustomDomain: boolean
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: DEFAULT_BRANDING,
  isCustomDomain: false,
})

interface ServerBrandingProviderProps {
  children: ReactNode
  branding: Branding
  isCustomDomain: boolean
}

/**
 * Provider that receives branding from the server (no client-side fetch needed).
 * This eliminates flash because the branding is already in the HTML from the server.
 */
export function ServerBrandingProvider({ 
  children, 
  branding, 
  isCustomDomain 
}: ServerBrandingProviderProps) {
  return (
    <BrandingContext.Provider value={{ branding, isCustomDomain }}>
      {children}
    </BrandingContext.Provider>
  )
}

/**
 * Hook to access branding from the server context.
 * This is the primary way components should access branding.
 */
export function useServerBranding() {
  const context = useContext(BrandingContext)
  return context
}
