"use client"

import { useEffect } from 'react'
import { useBranding } from '@/hooks/useBranding'

/**
 * BrandingProvider injects branding colors as CSS variables
 * 
 * Best practices for whitelabel:
 * - Only ONE brand color (primary_color) is used
 * - This color applies to: buttons, icons, accents, borders
 * - Status indicators (connected/error) keep original green/red colors
 * - Text on brand color backgrounds auto-adjusts to white/black for contrast
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { branding, isWhitelabel, isLoading } = useBranding()

  useEffect(() => {
    if (isLoading) return

    const root = document.documentElement

    if (isWhitelabel && branding.primary_color) {
      // Set CSS variable for brand color
      root.style.setProperty('--brand-primary', branding.primary_color)
      
      // Set RGB values for opacity support (backgrounds with transparency)
      const primaryRgb = hexToRgb(branding.primary_color)
      if (primaryRgb) {
        root.style.setProperty('--brand-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
      }

      // Calculate optimal text color (white or black) based on background luminance
      const textColor = getContrastTextColor(branding.primary_color)
      root.style.setProperty('--brand-text', textColor)

      // Add class to activate whitelabel CSS overrides
      root.classList.add('whitelabel')
    } else {
      // Reset to default WhaHook green
      root.style.setProperty('--brand-primary', '#22c55e')
      root.style.setProperty('--brand-primary-rgb', '34, 197, 94')
      root.style.setProperty('--brand-text', '#ffffff')
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

/**
 * Calculate the optimal text color (white or black) for a given background color
 * Uses the WCAG relative luminance formula for accessibility
 * 
 * @param hexColor - Background color in hex format
 * @returns '#ffffff' for dark backgrounds, '#000000' for light backgrounds
 */
function getContrastTextColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor)
  if (!rgb) return '#ffffff'

  // Calculate relative luminance using WCAG formula
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const { r, g, b } = rgb
  
  // Convert to sRGB
  const sR = r / 255
  const sG = g / 255
  const sB = b / 255
  
  // Apply gamma correction
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4)
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4)
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4)
  
  // Calculate luminance
  const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
  
  // Return white for dark backgrounds (luminance < 0.5), black for light
  // Using 0.5 as threshold provides good contrast in most cases
  return luminance < 0.5 ? '#ffffff' : '#000000'
}
