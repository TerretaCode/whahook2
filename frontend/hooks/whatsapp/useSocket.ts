import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/AuthContext'
import { AuthStorage } from '@/lib/auth-storage'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    console.log('🔌 SOCKET HOOK - Initializing', { isAuthenticated, hasUser: !!user })
    
    if (!isAuthenticated || !user) {
      console.warn('⚠️ SOCKET HOOK - Not authenticated, cannot connect')
      return
    }

    let socketInstance: Socket | null = null

    const initSocket = () => {
      // Get token from AuthStorage (same place ApiClient gets it)
      const token = AuthStorage.getAccessToken()
      
      if (!token) {
        console.warn('⚠️ SOCKET HOOK - No token available in AuthStorage')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
      console.log('🔌 SOCKET HOOK - Connecting to:', backendUrl)
      console.log('🔌 SOCKET HOOK - Token preview:', token.substring(0, 20) + '...')

      // Disconnect existing socket if any
      if (socketInstance) {
        console.log('🔌 SOCKET HOOK - Disconnecting old socket')
        socketInstance.disconnect()
      }

      socketInstance = io(backendUrl, {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      })

      socketInstance.on('connect', () => {
        console.log('✅ SOCKET CONNECTED - ID:', socketInstance!.id)
        console.log('✅ SOCKET CONNECTED - URL:', backendUrl)
        
        // Join user-specific room
        if (user?.id) {
          console.log('🔌 SOCKET - Joining user room:', user.id)
          socketInstance!.emit('join', user.id)
        }
        
        setIsConnected(true)
      })

      socketInstance.on('disconnect', () => {
        console.log('❌ SOCKET DISCONNECTED')
        setIsConnected(false)
      })

      socketInstance.on('connect_error', (error: Error) => {
        console.error('❌ SOCKET CONNECTION ERROR:', error.message)
      })

      // Log all incoming events for debugging
      socketInstance.onAny((eventName: string, ...args: any[]) => {
        console.log('📨 SOCKET EVENT RECEIVED:', eventName, args)
      })

      setSocket(socketInstance)
    }

    // Try to connect immediately
    initSocket()

    return () => {
      console.log('🔌 SOCKET HOOK - Cleanup')
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [isAuthenticated, user])

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }, [socket])

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback)
    }
  }, [socket])

  const emit = useCallback((event: string, ...args: any[]) => {
    if (socket) {
      socket.emit(event, ...args)
    }
  }, [socket])

  return { socket, isConnected, on, off, emit }
}
