"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"
import { LogoIcon } from "@/components/icons/LogoIcon"
import { useServerBranding } from "@/contexts/ServerBrandingContext"
import { DEFAULT_BRANDING } from "@/lib/branding"

export interface AuthCardProps {
  children: React.ReactNode
  title: string
  description: string
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  const { branding, isCustomDomain } = useServerBranding()
  
  // Generate lighter version of brand color for gradient background
  const getBrandGradient = () => {
    const hex = branding.primary_color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Create very light tint (92% white)
    const lightR = Math.round(r + (255 - r) * 0.92)
    const lightG = Math.round(g + (255 - g) * 0.92)
    const lightB = Math.round(b + (255 - b) * 0.92)
    return `linear-gradient(to bottom right, rgb(${lightR}, ${lightG}, ${lightB}), white, rgb(249, 250, 251))`
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: getBrandGradient() }}
    >
      <Card className="w-full max-w-md p-8 shadow-xl">
        {/* Logo - rendered from server branding (no flash) */}
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center hover:opacity-80 transition-opacity">
          {branding.logo_url && branding.logo_url !== DEFAULT_BRANDING.logo_url ? (
            <img 
              src={branding.logo_url} 
              alt={branding.agency_name} 
              className="h-8 object-contain"
            />
          ) : (
            <LogoIcon 
              className="w-8 h-8" 
              style={{ color: branding.primary_color }}
            />
          )}
          <div className="flex flex-col gap-0.5">
            <span 
              className="text-xl font-bold leading-tight"
              style={{ color: isCustomDomain ? branding.primary_color : undefined }}
            >
              {branding.logo_text || branding.agency_name}
            </span>
            {branding.show_powered_by && branding.powered_by_text && (
              <span className="text-[10px] leading-tight ml-0.5">
                <span className="text-gray-900">by </span>
                <span style={{ color: branding.primary_color }}>
                  {branding.powered_by_text}
                </span>
              </span>
            )}
          </div>
        </Link>

        {/* Title & Description */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {/* Form Content */}
        {children}
      </Card>
    </div>
  )
}
