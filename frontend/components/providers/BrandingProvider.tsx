"use client"

import { useEffect } from 'react'
import { useBranding } from '@/hooks/useBranding'

/**
 * BrandingProvider injects branding colors as CSS variables
 * This allows the entire app to use the agency's colors when whitelabel is active
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { branding, isWhitelabel, isLoading } = useBranding()

  useEffect(() => {
    if (isLoading) return

    const root = document.documentElement

    if (isWhitelabel && branding.primary_color) {
      // Set CSS variables for branding colors
      root.style.setProperty('--brand-primary', branding.primary_color)
      root.style.setProperty('--brand-secondary', branding.secondary_color || branding.primary_color)
      
      // Also set RGB values for opacity support
      const primaryRgb = hexToRgb(branding.primary_color)
      const secondaryRgb = hexToRgb(branding.secondary_color || branding.primary_color)
      
      if (primaryRgb) {
        root.style.setProperty('--brand-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
      }
      if (secondaryRgb) {
        root.style.setProperty('--brand-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`)
      }

      // Add a class to indicate whitelabel mode
      root.classList.add('whitelabel')
    } else {
      // Reset to default green
      root.style.setProperty('--brand-primary', '#22c55e')
      root.style.setProperty('--brand-secondary', '#16a34a')
      root.style.setProperty('--brand-primary-rgb', '34, 197, 94')
      root.style.setProperty('--brand-secondary-rgb', '22, 163, 74')
      root.classList.remove('whitelabel')
    }
  }, [branding, isWhitelabel, isLoading])

  return <>{children}</>
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}
