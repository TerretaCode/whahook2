"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AgencyBranding {
  logo_url: string | null
  logo_text: string
  primary_color: string
  agency_name: string
  agency_slug: string
}

export default function AgencyPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = params.slug as string
  
  const [branding, setBranding] = useState<AgencyBranding | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchBranding()
    }
  }, [slug])

  const fetchBranding = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/branding/agency/${slug}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setBranding(data.data)
        
        // Apply branding colors to CSS variables
        const root = document.documentElement
        root.style.setProperty('--brand-primary', data.data.primary_color)
        
        // Calculate RGB for opacity support
        const hex = data.data.primary_color.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        root.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`)
        
        // Calculate text color for contrast
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        root.style.setProperty('--brand-text', luminance > 0.5 ? '#000000' : '#ffffff')
        
        // Add whitelabel class
        root.classList.add('whitelabel')
      } else {
        setError('Agencia no encontrada')
      }
    } catch (err) {
      console.error('Error fetching agency branding:', err)
      setError('Error al cargar la agencia')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !branding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agencia no encontrada</h1>
          <p className="text-gray-600">El enlace que has usado no es válido o ha expirado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Agency Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-center">
          {branding.logo_url ? (
            <img 
              src={branding.logo_url} 
              alt={branding.agency_name || 'Logo'} 
              className="h-10 object-contain"
            />
          ) : branding.logo_text ? (
            <span className="text-xl font-bold" style={{ color: branding.primary_color }}>
              {branding.logo_text}
            </span>
          ) : branding.agency_name ? (
            <span className="text-xl font-bold" style={{ color: branding.primary_color }}>
              {branding.agency_name}
            </span>
          ) : null}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
