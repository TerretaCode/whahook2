/**
 * Branding configuration for multi-tenant white-label support.
 * 
 * This file contains:
 * - Type definitions for branding
 * - Default Whahook branding constants
 * - Helper functions for branding
 */

export interface Branding {
  logo_url: string | null
  logo_text: string
  primary_color: string
  secondary_color: string
  agency_name: string
  powered_by_text: string
  show_powered_by: boolean
  favicon_url: string | null
  tab_title: string | null
}

/**
 * Default Whahook branding - used when no custom branding is set
 */
export const DEFAULT_BRANDING: Branding = {
  logo_url: '/icon.svg',
  logo_text: 'WhaHook',
  primary_color: '#22c55e',
  secondary_color: '#16a34a',
  agency_name: 'WhaHook',
  powered_by_text: 'TerretaCode',
  show_powered_by: true,
  favicon_url: '/icon.svg',
  tab_title: 'WhaHook - WhatsApp Multi-Tenant Platform',
}

/**
 * Merge custom branding with defaults
 */
export function mergeBranding(custom: Partial<Branding> | null): Branding {
  if (!custom) return DEFAULT_BRANDING
  
  return {
    ...DEFAULT_BRANDING,
    ...custom,
    // Ensure we have fallbacks for critical fields
    logo_text: custom.logo_text || custom.agency_name || DEFAULT_BRANDING.logo_text,
    primary_color: custom.primary_color || DEFAULT_BRANDING.primary_color,
  }
}

/**
 * Calculate contrasting text color for a background
 */
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Convert hex color to RGB string
 */
export function hexToRgb(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

/**
 * Check if branding is custom (not default Whahook)
 */
export function isCustomBranding(branding: Branding): boolean {
  return branding.agency_name !== DEFAULT_BRANDING.agency_name ||
         branding.logo_url !== DEFAULT_BRANDING.logo_url ||
         branding.primary_color !== DEFAULT_BRANDING.primary_color
}
