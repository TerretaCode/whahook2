"use client"

import { useEffect } from 'react'
import { useBranding } from '@/hooks/useBranding'

/**
 * BrandingProvider injects branding colors as CSS variables
 * 
 * Best practices for whitelabel:
 * - Only ONE brand color (primary_color) is used
 * - This color applies to: buttons, icons, accents, borders
 * - Text colors remain neutral (black/gray) for guaranteed readability
 * - The owner's secondary_color is ignored to prevent legibility issues
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { branding, isWhitelabel, isLoading } = useBranding()

  useEffect(() => {
    if (isLoading) return

    const root = document.documentElement

    if (isWhitelabel && branding.primary_color) {
      // Set CSS variable for brand color (only primary, no secondary)
      root.style.setProperty('--brand-primary', branding.primary_color)
      
      // Set RGB values for opacity support (backgrounds with transparency)
      const primaryRgb = hexToRgb(branding.primary_color)
      if (primaryRgb) {
        root.style.setProperty('--brand-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
      }

      // Add class to activate whitelabel CSS overrides
      root.classList.add('whitelabel')
    } else {
      // Reset to default WhaHook green
      root.style.setProperty('--brand-primary', '#22c55e')
      root.style.setProperty('--brand-primary-rgb', '34, 197, 94')
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
