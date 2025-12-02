"use client"

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConnectionData {
  status: 'pending' | 'connecting' | 'connected' | 'expired' | 'failed'
  qr_code?: string
  qr_generated_at?: string
  expires_at?: string
  phone?: string
  workspace?: {
    id: string
    name: string
    logo_url?: string
    white_label?: {
      enabled: boolean
      brand_name?: string
      brand_logo_url?: string
      brand_color?: string
      hide_whahook_branding?: boolean
    }
  }
}

export default function ConnectPage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<ConnectionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  // Fetch connection data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/connect/${token}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Connection link not found')
        return
      }

      setData(result.data)
      setError(null)
    } catch {
      setError('Failed to load connection data')
    } finally {
      setIsLoading(false)
    }
  }, [token, apiUrl])

  // Start connection (generate QR)
  const startConnection = async () => {
    setIsStarting(true)
    try {
      const response = await fetch(`${apiUrl}/api/connect/${token}/start`, {
        method: 'POST'
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to start connection')
        return
      }

      // Start polling for QR
      fetchData()
    } catch {
      setError('Failed to start connection')
    } finally {
      setIsStarting(false)
    }
  }

  // Calculate time left
  useEffect(() => {
    if (!data?.expires_at) return

    const updateTimeLeft = () => {
      const now = new Date()
      const expires = new Date(data.expires_at!)
      const diff = expires.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else {
        setTimeLeft(`${minutes}m`)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000)
    return () => clearInterval(interval)
  }, [data?.expires_at])

  // Initial fetch and polling
  useEffect(() => {
    fetchData()

    // Poll for updates when connecting
    const interval = setInterval(() => {
      if (data?.status === 'connecting') {
        fetchData()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchData, data?.status])

  // Get branding
  const whiteLabel = data?.workspace?.white_label
  const brandName = whiteLabel?.brand_name || data?.workspace?.name || 'Whahook'
  const brandLogo = whiteLabel?.brand_logo_url || data?.workspace?.logo_url
  const brandColor = whiteLabel?.brand_color || '#10b981'
  const hideWhahook = whiteLabel?.hide_whahook_branding

  // Generate gradient background
  const getBrandGradient = (color: string) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const lightR = Math.round(r + (255 - r) * 0.92)
    const lightG = Math.round(g + (255 - g) * 0.92)
    const lightB = Math.round(b + (255 - b) * 0.92)
    return `linear-gradient(to bottom right, rgb(${lightR}, ${lightG}, ${lightB}), white, rgb(249, 250, 251))`
  }
  const backgroundGradient = getBrandGradient(brandColor)

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: backgroundGradient }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: brandColor }} />
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: backgroundGradient }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Connected state
  if (data?.status === 'connected') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: backgroundGradient }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {brandLogo && (
            <Image 
              src={brandLogo} 
              alt={brandName} 
              width={120} 
              height={40} 
              className="mx-auto mb-6 object-contain"
            />
          )}
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: brandColor }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Connected!</h1>
          <p className="text-gray-600 mb-2">
            Your WhatsApp has been successfully connected.
          </p>
          {data.phone && (
            <p className="text-lg font-medium mb-6" style={{ color: brandColor }}>
              {data.phone}
            </p>
          )}
          <p className="text-sm text-gray-500">
            You can close this page now.
          </p>
          {!hideWhahook && (
            <p className="text-xs text-gray-400 mt-8">
              Powered by Whahook
            </p>
          )}
        </div>
      </div>
    )
  }

  // Pending state - show start button
  if (data?.status === 'pending') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: backgroundGradient }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          {brandLogo && (
            <Image 
              src={brandLogo} 
              alt={brandName} 
              width={120} 
              height={40} 
              className="mx-auto mb-6 object-contain"
            />
          )}
          
          <div className="text-center mb-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              <Smartphone className="w-8 h-8" style={{ color: brandColor }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Connect WhatsApp
            </h1>
            <p className="text-gray-600">
              Connect your WhatsApp to {brandName}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Clock className="w-4 h-4" />
            <span>Link expires in {timeLeft}</span>
          </div>

          <Button 
            onClick={startConnection}
            disabled={isStarting}
            className="w-full h-12 text-lg"
            style={{ backgroundColor: brandColor }}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Smartphone className="w-5 h-5 mr-2" />
                Start Connection
              </>
            )}
          </Button>

          {!hideWhahook && (
            <p className="text-xs text-gray-400 text-center mt-8">
              Powered by Whahook
            </p>
          )}
        </div>
      </div>
    )
  }

  // Connecting state - show QR
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: backgroundGradient }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {brandLogo && (
          <Image 
            src={brandLogo} 
            alt={brandName} 
            width={120} 
            height={40} 
            className="mx-auto mb-6 object-contain"
          />
        )}
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Scan QR Code
          </h1>
          <p className="text-gray-600">
            Open WhatsApp on your phone and scan this code
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          {data?.qr_code ? (
            <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
              <QRCodeSVG 
                value={data.qr_code} 
                size={220}
                level="M"
                includeMargin={false}
              />
            </div>
          ) : (
            <div className="w-[252px] h-[252px] bg-gray-100 rounded-xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">How to connect:</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span 
                className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium"
                style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
              >1</span>
              <span>Open WhatsApp on your phone</span>
            </li>
            <li className="flex items-start gap-2">
              <span 
                className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium"
                style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
              >2</span>
              <span>Go to Settings → Linked Devices</span>
            </li>
            <li className="flex items-start gap-2">
              <span 
                className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium"
                style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
              >3</span>
              <span>Tap "Link a Device"</span>
            </li>
            <li className="flex items-start gap-2">
              <span 
                className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium"
                style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
              >4</span>
              <span>Point your phone at this QR code</span>
            </li>
          </ol>
        </div>

        {/* Time left */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Link expires in {timeLeft}</span>
        </div>

        {/* Refresh button */}
        <Button 
          onClick={fetchData}
          variant="ghost"
          className="w-full mt-4"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh QR Code
        </Button>

        {!hideWhahook && (
          <p className="text-xs text-gray-400 text-center mt-6">
            Powered by Whahook
          </p>
        )}
      </div>
    </div>
  )
}
