import { Card } from "@/components/ui/card"
import Link from "next/link"
import { LogoIcon } from "@/components/icons/LogoIcon"

export interface AuthCardProps {
  children: React.ReactNode
  title: string
  description: string
  customHeader?: React.ReactNode  // For custom domain branding
  hideLogo?: boolean              // Hide default Whahook logo
  brandColor?: string             // Custom brand color for background
}

export function AuthCard({ children, title, description, customHeader, hideLogo, brandColor }: AuthCardProps) {
  // Generate lighter version of brand color for gradient
  const getBrandGradient = () => {
    if (!brandColor) return undefined
    // Convert hex to RGB and create a very light version
    const hex = brandColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Create very light tint (95% white)
    const lightR = Math.round(r + (255 - r) * 0.92)
    const lightG = Math.round(g + (255 - g) * 0.92)
    const lightB = Math.round(b + (255 - b) * 0.92)
    return `linear-gradient(to bottom right, rgb(${lightR}, ${lightG}, ${lightB}), white, rgb(249, 250, 251))`
  }

  return (
    <div 
      className="whahook-default-bg min-h-screen flex items-center justify-center px-4 py-12"
      style={{ 
        background: getBrandGradient() || 'linear-gradient(to bottom right, rgb(240, 253, 244), white, rgb(249, 250, 251))'
      }}
    >
      <Card className="w-full max-w-md p-8 shadow-xl">
        {/* Custom Header (for branded domains) */}
        {customHeader}
        
        {/* Loading placeholder - shown on custom domains via CSS until branding loads */}
        {!customHeader && !hideLogo && (
          <div className="whahook-logo-loading hidden mb-8 justify-center">
            <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        )}
        
        {/* Default Logo (hidden on custom domains via CSS) */}
        {!customHeader && !hideLogo && (
          <Link href="/" className="whahook-default-logo flex items-center gap-2 mb-8 justify-center hover:opacity-80 transition-opacity">
            <LogoIcon className="w-8 h-8 text-green-600" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-bold text-gray-900 leading-tight">
                WhaHook
              </span>
              <span className="text-[10px] leading-tight ml-0.5">
                <span className="text-gray-900">by </span>
                <span className="text-green-600">TerretaCode</span>
              </span>
            </div>
          </Link>
        )}

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
