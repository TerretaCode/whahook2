"use client"

import { useState, useCallback, useMemo, memo } from 'react'
import { useTranslations } from 'next-intl'
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

function WhatsAppSessionCardComponent({ 
  session, 
  accountName,
  onDestroy 
}: WhatsAppSessionCardProps) {
  const t = useTranslations('settings.connections.whatsappSession')
  const [isDestroying, setIsDestroying] = useState(false)

  const handleDestroy = useCallback(async () => {
    if (!confirm(t('confirmDisconnect'))) {
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
  }, [onDestroy, session.session_id])

  const statusIcon = useMemo(() => {
    switch (session.status) {
      case 'ready':
        return <CheckCircle2 className="w-5 h-5 text-green-600 status-indicator" />
      case 'initializing':
      case 'qr_pending':
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 status-indicator" />
      default:
        return <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
    }
  }, [session.status])

  const statusText = useMemo(() => {
    switch (session.status) {
      case 'ready':
        return t('connected')
      case 'initializing':
      case 'qr_pending':
        return session.qr_code ? t('scanQr') : t('initializing')
      case 'error':
        return session.error_message || t('authFailed')
      default:
        return t('unknown')
    }
  }, [session.status, session.qr_code, session.error_message])

  const statusColor = useMemo(() => {
    switch (session.status) {
      case 'ready':
        return 'status-indicator bg-green-100 text-green-800 border-green-200'
      case 'initializing':
      case 'qr_pending':
        return session.qr_code ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
      case 'error':
        return 'status-indicator bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [session.status, session.qr_code])

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
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusColor}`}>
          {statusIcon}
          <span className="text-xs font-medium">{statusText}</span>
        </div>
      </div>

      {/* QR Code Display - shown when initializing/qr_pending with QR */}
      {(session.status === 'initializing' || session.status === 'qr_pending') && session.qr_code && (
        <div className="mb-4">
          <div className="flex justify-center">
            <QRCodeDisplay qrCode={session.qr_code} size={200} accountName={accountName} />
          </div>
        </div>
      )}

      {/* Initializing State - without QR */}
      {(session.status === 'initializing' || session.status === 'qr_pending') && !session.qr_code && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">{t('initializingSession')}</p>
        </div>
      )}

      {/* Connected State - status-indicator class prevents branding override */}
      {session.status === 'ready' && (
        <div className="status-indicator mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5 text-green-600 status-indicator" />
            <p className="text-sm font-medium text-green-800">{t('connectedReady')}</p>
          </div>
          {session.phone_number && (
            <p className="text-xs text-green-700 mt-1">
              {t('connectedAs')}: {session.phone_number}
            </p>
          )}
        </div>
      )}

      {/* Error State - status-indicator class prevents branding override */}
      {session.status === 'error' && (
        <div className="status-indicator mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 status-indicator" />
            <p className="text-sm font-medium text-red-800">
              {session.error_message || t('authFailedRetry')}
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
              {t('disconnecting')}
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('disconnect')}
            </>
          )}
        </Button>
      </div>

      {/* Session Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">{t('sessionId')}:</span>
            <p className="truncate">{session.session_id}</p>
          </div>
          <div>
            <span className="font-medium">{t('created')}:</span>
            <p>{new Date(session.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const WhatsAppSessionCard = memo(WhatsAppSessionCardComponent)

