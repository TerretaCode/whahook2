import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiClient } from '@/lib/api-client'
import { toast } from '@/lib/toast'
import { useSocket } from './useSocket'

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

export function useWhatsAppSessions(workspaceId?: string) {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isConnected, on, off } = useSocket()

  const pendingCreations = useRef<Set<string>>(new Set())
  const lastQRUpdate = useRef<Map<string, number>>(new Map())

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = workspaceId 
        ? `/api/whatsapp/sessions?workspace_id=${workspaceId}`
        : '/api/whatsapp/sessions'
      const response = await ApiClient.request<{ sessions: WhatsAppSession[] }>(url)
      setSessions(response.data?.sessions || [])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch sessions'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  const createSession = useCallback(async (accountId: string) => {
    if (pendingCreations.current.has(accountId)) return

    pendingCreations.current.add(accountId)
    setIsLoading(true)
    
    try {
      const response = await ApiClient.request<{ session: WhatsAppSession }>(
        '/api/whatsapp/sessions',
        { method: 'POST', body: JSON.stringify({ accountId }) }
      )
      
      if (response.data?.session) {
        setSessions(prev => {
          const existingIndex = prev.findIndex(s => s.session_id === response.data!.session.session_id)
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = { ...updated[existingIndex], ...response.data!.session }
            return updated
          }
          return [...prev, response.data!.session]
        })
        toast.success('Success', 'Session created. Waiting for QR code...')
        return response.data.session
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create session'
      toast.error('Error', errorMsg)
      throw err
    } finally {
      setIsLoading(false)
      setTimeout(() => pendingCreations.current.delete(accountId), 3000)
    }
  }, [])

  const destroySession = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    try {
      await ApiClient.request(`/api/whatsapp/sessions/${sessionId}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.session_id !== sessionId))
      toast.success('Success', 'Session destroyed successfully')
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to destroy session'
      toast.error('Error', errorMsg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Socket.IO event listeners
  useEffect(() => {
    if (!isConnected) return

    const handleQR = (data: { sessionId: string; qr: string }) => {
      console.log('📱 [useWhatsAppSessions] QR received:', data.sessionId)
      
      const now = Date.now()
      const lastUpdate = lastQRUpdate.current.get(data.sessionId) || 0
      if (now - lastUpdate < 3000) {
        console.log('📱 [useWhatsAppSessions] QR throttled (too soon)')
        return
      }
      
      lastQRUpdate.current.set(data.sessionId, now)
      
      setSessions(prev => {
        console.log('📱 [useWhatsAppSessions] Current sessions:', prev.length, prev.map(s => s.session_id))
        const existingIndex = prev.findIndex(s => s.session_id === data.sessionId)
        if (existingIndex >= 0) {
          console.log('📱 [useWhatsAppSessions] Updating existing session at index:', existingIndex)
          const updated = [...prev]
          updated[existingIndex] = { ...updated[existingIndex], qr_code: data.qr, status: 'qr_pending' as WhatsAppSessionStatus }
          return updated
        }
        console.log('📱 [useWhatsAppSessions] Adding new session with QR')
        return [...prev, {
          id: data.sessionId,
          user_id: '',
          account_id: '',
          session_id: data.sessionId,
          status: 'qr_pending' as WhatsAppSessionStatus,
          phone_number: null,
          qr_code: data.qr,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      })
    }

    const handleReady = (data: { sessionId: string; phoneNumber: string }) => {
      toast.success('Connected', `WhatsApp connected: ${data.phoneNumber}`)
      fetchSessions()
    }

    const handleDisconnected = () => {
      toast.warning('Disconnected', 'WhatsApp session disconnected')
      fetchSessions()
    }

    const handleAuthFailure = () => {
      toast.error('Error', 'WhatsApp authentication failed')
      fetchSessions()
    }

    const handleStatusUpdate = (data: { sessionId: string; status: string }) => {
      setSessions(prev => prev.map(s => 
        s.session_id === data.sessionId 
          ? { ...s, status: data.status as WhatsAppSessionStatus }
          : s
      ))
    }

    // Register events
    on('whatsapp:qr', handleQR)
    on('whatsapp:ready', handleReady)
    on('whatsapp:disconnected', handleDisconnected)
    on('whatsapp:error', handleAuthFailure)
    on('whatsapp:status_update', handleStatusUpdate)
    
    // Legacy events
    on('qr', handleQR)
    on('ready', handleReady)
    on('disconnected', handleDisconnected)
    on('auth_failure', handleAuthFailure)

    return () => {
      off('whatsapp:qr', handleQR)
      off('whatsapp:ready', handleReady)
      off('whatsapp:disconnected', handleDisconnected)
      off('whatsapp:error', handleAuthFailure)
      off('whatsapp:status_update', handleStatusUpdate)
      off('qr', handleQR)
      off('ready', handleReady)
      off('disconnected', handleDisconnected)
      off('auth_failure', handleAuthFailure)
    }
  }, [isConnected, on, off, fetchSessions])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions, workspaceId])

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
