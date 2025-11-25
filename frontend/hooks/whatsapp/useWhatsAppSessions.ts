import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'
import { useSocket } from './useSocket'

/**
 * WhatsApp Session Status
 * - ready: Session is active and working
 * - error: Session failed (check error_message)
 * - initializing: First-time setup (scanning QR)
 * - qr_pending: QR code generated, waiting for scan
 */
export type WhatsAppSessionStatus = 'ready' | 'error' | 'initializing' | 'qr_pending'

export interface WhatsAppSession {
  id: string
  user_id: string
  account_id: string
  session_id: string
  status: WhatsAppSessionStatus
  phone_number: string | null
  qr_code: string | null
  error_message?: string | null
  created_at: string
  updated_at: string
}

export function useWhatsAppSessions() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { socket, isConnected, on, off } = useSocket()

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await ApiClient.request<{ sessions: WhatsAppSession[] }>(
        '/api/whatsapp/sessions'
      )
      setSessions(response.data?.sessions || [])
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch sessions'
      setError(errorMsg)
      console.error('Error fetching sessions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Track pending session creations to prevent duplicates
  const pendingCreations = useRef<Set<string>>(new Set())
  
  // Track last QR update time to prevent rapid updates
  const lastQRUpdate = useRef<Map<string, number>>(new Map())

  const createSession = useCallback(async (accountId: string) => {
    console.log('🔵 HOOK - createSession called with accountId:', accountId)
    
    // Prevent duplicate calls for the same account
    if (pendingCreations.current.has(accountId)) {
      console.log('⏭️ HOOK - Skipping duplicate createSession call for:', accountId)
      return
    }

    console.log('🔵 HOOK - Adding to pending creations')
    pendingCreations.current.add(accountId)
    setIsLoading(true)
    
    try {
      console.log('🔵 HOOK - Making API request to /api/whatsapp/sessions')
      const response = await ApiClient.request<{ session: WhatsAppSession }>(
        '/api/whatsapp/sessions',
        {
          method: 'POST',
          body: JSON.stringify({ accountId })
        }
      )
      
      console.log('🔵 HOOK - API response received:', {
        success: response.success,
        hasSession: !!response.data?.session,
        sessionId: response.data?.session?.session_id,
        status: response.data?.session?.status,
        hasQR: !!response.data?.session?.qr_code,
        qrLength: response.data?.session?.qr_code?.length
      })
      
      if (response.data?.session) {
        console.log('🔵 HOOK - Adding session to state')
        setSessions(prev => {
          console.log('🔵 HOOK - Previous sessions count:', prev.length)
          
          // Verificar si ya existe (puede haber sido creada por el evento QR)
          const existingIndex = prev.findIndex(s => s.session_id === response.data!.session.session_id)
          
          if (existingIndex >= 0) {
            console.log('🔵 HOOK - Session already exists at index:', existingIndex, '- updating')
            const updated = [...prev]
            updated[existingIndex] = { ...updated[existingIndex], ...response.data!.session }
            console.log('🔵 HOOK - Updated session:', updated[existingIndex])
            return updated
          } else {
            console.log('🔵 HOOK - Adding new session to array')
            const updated = [...prev, response.data!.session]
            console.log('🔵 HOOK - New sessions count:', updated.length)
            return updated
          }
        })
        toast.success('Success', 'Session created. Waiting for QR code...')
        console.log('🔵 HOOK - Returning session from createSession')
        return response.data.session
      }
    } catch (err: any) {
      console.error('❌ HOOK - Error in createSession:', err)
      const errorMsg = err.message || 'Failed to create session'
      toast.error('Error', errorMsg)
      throw err
    } finally {
      setIsLoading(false)
      console.log('🔵 HOOK - setIsLoading(false)')
      // Remove from pending after a delay to prevent rapid re-calls
      setTimeout(() => {
        console.log('🔵 HOOK - Removing from pending creations after delay')
        pendingCreations.current.delete(accountId)
      }, 3000)
    }
  }, [])

  const destroySession = useCallback(async (sessionId: string) => {
    console.log('🗑️ HOOK - destroySession called with sessionId:', sessionId)
    setIsLoading(true)
    try {
      await ApiClient.request(`/api/whatsapp/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      console.log('🗑️ HOOK - DELETE request successful, removing from state')
      
      setSessions(prev => prev.filter(s => s.session_id !== sessionId))
      toast.success('Success', 'Session destroyed successfully')
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to destroy session'
      toast.error('Error', errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Socket.IO event listeners
  useEffect(() => {
    console.log('🔌 SOCKET EFFECT - isConnected:', isConnected)
    
    if (!isConnected) {
      console.warn('⚠️ SOCKET NOT CONNECTED - Cannot listen for events')
      return
    }

    console.log('✅ SOCKET CONNECTED - Setting up event listeners')

    // QR Code Event
    // IMPORTANT: Do NOT modify local state - only show QR in UI
    // The session status in backend remains 'initializing'
    const handleQR = (data: { sessionId: string; qr: string }) => {
      console.log('📱 QR EVENT RECEIVED:', {
        sessionId: data.sessionId,
        hasQR: !!data.qr,
        qrLength: data.qr?.length
      })
      
      // Debounce: Ignore QR updates if one was received less than 3 seconds ago
      const now = Date.now()
      const lastUpdate = lastQRUpdate.current.get(data.sessionId) || 0
      
      if (now - lastUpdate < 3000) {
        console.log('⏭️ Ignoring rapid QR update (debounce) - last update was', now - lastUpdate, 'ms ago')
        return
      }
      
      lastQRUpdate.current.set(data.sessionId, now)
      
      // Update ONLY the qr_code field, do NOT change status
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.session_id === data.sessionId)
        
        if (existingIndex >= 0) {
          console.log('✅ Updating QR code for existing session')
          const updated = [...prev]
          // ONLY update qr_code, keep status as 'initializing'
          updated[existingIndex] = { 
            ...updated[existingIndex], 
            qr_code: data.qr 
            // status remains 'initializing' - backend will update to 'ready' when authenticated
          }
          return updated
        } else {
          console.log('⚠️ Session not found in local state, creating temporary session with QR')
          // Create a temporary session object with the QR
          // The full session data will come from the API response
          const tempSession: WhatsAppSession = {
            id: data.sessionId,
            user_id: '', // Will be filled by API response
            account_id: '', // Will be filled by API response
            session_id: data.sessionId,
            status: 'initializing',
            phone_number: null,
            qr_code: data.qr,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          console.log('✅ Temporary session created with QR')
          return [...prev, tempSession]
        }
      })
    }

    // Ready Event
    // Backend has updated Supabase to 'ready' - fetch to get latest data
    const handleReady = (data: { sessionId: string; phoneNumber: string }) => {
      console.log('✅ Session ready:', data.sessionId)
      toast.success('Connected', `WhatsApp connected: ${data.phoneNumber}`)
      // Fetch from backend to get the updated status
      fetchSessions()
    }

    // Disconnected Event
    // Backend determines if permanent or temporary
    // Fetch to get the updated status from backend
    const handleDisconnected = (data: { sessionId: string; reason?: string }) => {
      console.log('⚠️ Session disconnected:', data.sessionId, data.reason)
      toast.warning('Disconnected', 'WhatsApp session disconnected')
      // Fetch from backend to see if status changed to 'error' (permanent) or remains 'ready' (temporary)
      fetchSessions()
    }

    // Auth Failure Event
    // Backend has updated Supabase to 'error' - fetch to get latest data
    const handleAuthFailure = (data: { sessionId: string; error?: string }) => {
      console.log('❌ Auth failure:', data.sessionId)
      toast.error('Error', 'WhatsApp authentication failed')
      // Fetch from backend to get the updated status
      fetchSessions()
    }

    // Authenticated Event (intermediate step)
    // Just show progress, don't change status (still 'initializing')
    const handleAuthenticated = (data: { sessionId: string }) => {
      console.log('🔐 Session authenticated:', data.sessionId)
      toast.info('Authenticated', 'Authenticating WhatsApp session...')
      // Don't fetch yet - wait for 'ready' event
    }

    // Reconnecting Event (auto-reconnect in progress)
    // Backend is attempting auto-reconnect with exponential backoff
    const handleReconnecting = (data: { sessionId: string; attempt: number; maxAttempts: number }) => {
      console.log(`🔄 Session reconnecting (attempt ${data.attempt}/${data.maxAttempts}):`, data.sessionId)
      toast.info('Reconnecting', `Attempting to reconnect... (${data.attempt}/${data.maxAttempts})`)
      // Don't fetch yet - wait for success or failure
    }

    // Restoring Event
    // Backend is attempting to restore session from MongoDB
    const handleRestoring = (data: { sessionId: string; accountId: string }) => {
      console.log('📱 Session restoring:', data.sessionId)
      toast.info('Restoring', 'Restoring WhatsApp session from previous connection...')
      // Fetch to show current status
      setTimeout(() => fetchSessions(), 500)
    }

    // Reconnect Failed Event
    // Backend failed to restore session - status updated to 'error'
    const handleReconnectFailed = (data: { sessionId: string; accountId: string; error: string }) => {
      console.log('❌ Session reconnect failed:', data.sessionId, data.error)
      toast.error('Reconnection Failed', 'Failed to restore WhatsApp session. Please reconnect manually.')
      // Fetch to get the updated 'error' status
      fetchSessions()
    }

    // Register all event listeners
    // Nuevos eventos del backend (whatsapp:*)
    on('whatsapp:qr', handleQR)
    on('whatsapp:ready', handleReady)
    on('whatsapp:disconnected', handleDisconnected)
    on('whatsapp:error', handleAuthFailure)
    on('whatsapp:status_update', (data: { sessionId: string; status: string }) => {
      console.log('📊 Status update:', data)
      // Update status locally without fetching from server
      setSessions(prev => prev.map(s => 
        s.session_id === data.sessionId 
          ? { ...s, status: data.status as WhatsAppSessionStatus }
          : s
      ))
    })
    
    // Eventos legacy (por compatibilidad)
    on('qr', handleQR)
    on('authenticated', handleAuthenticated)
    on('ready', handleReady)
    on('disconnected', handleDisconnected)
    on('auth_failure', handleAuthFailure)
    on('session:reconnecting', handleReconnecting)
    on('session:restoring', handleRestoring)
    on('session:reconnect-failed', handleReconnectFailed)

    // Cleanup
    return () => {
      // Nuevos eventos
      off('whatsapp:qr', handleQR)
      off('whatsapp:ready', handleReady)
      off('whatsapp:disconnected', handleDisconnected)
      off('whatsapp:error', handleAuthFailure)
      off('whatsapp:status_update')
      
      // Legacy
      off('qr', handleQR)
      off('authenticated', handleAuthenticated)
      off('ready', handleReady)
      off('disconnected', handleDisconnected)
      off('auth_failure', handleAuthFailure)
      off('session:reconnecting', handleReconnecting)
      off('session:restoring', handleRestoring)
      off('session:reconnect-failed', handleReconnectFailed)
    }
  }, [isConnected, on, off, fetchSessions])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    createSession,
    destroySession,
    isSocketConnected: isConnected
  }
}
