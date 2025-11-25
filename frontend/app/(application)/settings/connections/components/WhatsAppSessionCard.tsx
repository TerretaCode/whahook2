"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QRCodeDisplay } from './QRCodeDisplay'
import { 
  Smartphone, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Trash2
} from 'lucide-react'
import type { WhatsAppSession } from '@/hooks/whatsapp/useWhatsAppSessions'

interface WhatsAppSessionCardProps {
  session: WhatsAppSession
  accountName: string
  onDestroy: (sessionId: string) => Promise<void>
}

export function WhatsAppSessionCard({ 
  session, 
  accountName,
  onDestroy 
}: WhatsAppSessionCardProps) {
  const [isDestroying, setIsDestroying] = useState(false)

  const handleDestroy = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp session?')) {
      return
    }

    setIsDestroying(true)
    try {
      await onDestroy(session.session_id)
    } catch (error) {
      console.error('Error destroying session:', error)
    } finally {
      setIsDestroying(false)
    }
  }

  const getStatusIcon = () => {
    switch (session.status) {
      case 'ready':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'initializing':
      case 'qr_pending':
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
    }
  }

  const getStatusText = () => {
    switch (session.status) {
      case 'ready':
        return 'Connected'
      case 'initializing':
      case 'qr_pending':
        return session.qr_code ? 'Scan QR Code' : 'Initializing...'
      case 'error':
        return session.error_message || 'Authentication failed'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = () => {
    switch (session.status) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'initializing':
      case 'qr_pending':
        return session.qr_code ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{accountName}</h3>
            {session.phone_number && (
              <p className="text-sm text-gray-600">{session.phone_number}</p>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* QR Code Display - shown when initializing/qr_pending with QR */}
      {(session.status === 'initializing' || session.status === 'qr_pending') && session.qr_code && (
        <div className="mb-4">
          <div className="flex justify-center mb-2">
            <QRCodeDisplay qrCode={session.qr_code} size={200} />
          </div>
          <p className="text-sm text-center text-gray-600">Scan this QR code with WhatsApp</p>
        </div>
      )}

      {/* Initializing State - without QR */}
      {(session.status === 'initializing' || session.status === 'qr_pending') && !session.qr_code && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Initializing WhatsApp session...</p>
        </div>
      )}

      {/* Connected State */}
      {session.status === 'ready' && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm font-medium">WhatsApp is connected and ready</p>
          </div>
          {session.phone_number && (
            <p className="text-xs text-green-700 mt-1">
              Connected as: {session.phone_number}
            </p>
          )}
        </div>
      )}

      {/* Error State */}
      {session.status === 'error' && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">
              {session.error_message || 'Authentication failed. Please try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDestroy}
          disabled={isDestroying}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isDestroying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Disconnecting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Disconnect
            </>
          )}
        </Button>
      </div>

      {/* Session Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Session ID:</span>
            <p className="truncate">{session.session_id}</p>
          </div>
          <div>
            <span className="font-medium">Created:</span>
            <p>{new Date(session.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
