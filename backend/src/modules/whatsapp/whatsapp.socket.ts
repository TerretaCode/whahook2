import { Server as SocketServer, Socket } from 'socket.io'
import { supabaseAdmin } from '../../config/supabase'
import { whatsappService } from './whatsapp.service'

/**
 * Configurar eventos Socket.IO para WhatsApp
 */
export function setupWhatsAppSocket(io: SocketServer): void {
  // Inicializar servicio con Socket.IO
  whatsappService.initialize(io)

  io.on('connection', async (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // Obtener userId del token (enviado en handshake)
    const userId = await authenticateSocket(socket)
    
    if (!userId) {
      console.log(`❌ Socket auth failed: ${socket.id}`)
      socket.disconnect()
      return
    }

    // Unir al room del usuario
    socket.join(`user:${userId}`)
    console.log(`✅ User ${userId} joined room`)

    // Check for pending QRs and resend them
    const pendingQRs = whatsappService.getSessionsWithPendingQR(userId)
    if (pendingQRs.length > 0) {
      console.log(`📤 Resending ${pendingQRs.length} pending QR(s) to user ${userId}`)
      for (const { sessionId, qr } of pendingQRs) {
        socket.emit('whatsapp:qr', { qr, sessionId })
      }
    }

    // === EVENTOS ===

    /**
     * Conectar WhatsApp
     */
    socket.on('whatsapp:connect', async () => {
      try {
        console.log(`📱 Connect request from user ${userId}`)
        const sessionId = await whatsappService.createSession(userId)
        socket.emit('whatsapp:connecting', { sessionId })
      } catch (error: any) {
        console.error('Error connecting WhatsApp:', error)
        socket.emit('whatsapp:error', { 
          error: error.message || 'Error al conectar WhatsApp' 
        })
      }
    })

    /**
     * Desconectar WhatsApp
     */
    socket.on('whatsapp:disconnect', async (data: { sessionId: string }) => {
      try {
        const { sessionId } = data
        
        // Verificar que la sesión pertenece al usuario
        const session = whatsappService.getSession(sessionId)
        if (!session || session.userId !== userId) {
          socket.emit('whatsapp:error', { error: 'Sesión no encontrada' })
          return
        }

        await whatsappService.destroySession(sessionId)
        socket.emit('whatsapp:disconnected', { sessionId, reason: 'Manual' })
      } catch (error: any) {
        console.error('Error disconnecting WhatsApp:', error)
        socket.emit('whatsapp:error', { 
          error: error.message || 'Error al desconectar' 
        })
      }
    })

    /**
     * Obtener estado de sesión
     */
    socket.on('whatsapp:status', async () => {
      try {
        const session = whatsappService.getSessionByUserId(userId)
        
        if (session) {
          socket.emit('whatsapp:status_update', {
            sessionId: session.sessionId,
            status: session.status,
            phoneNumber: session.phoneNumber,
          })
        } else {
          // Buscar en Supabase por si hay sesión guardada
          const { data } = await supabaseAdmin
            .from('whatsapp_accounts')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (data) {
            socket.emit('whatsapp:status_update', {
              sessionId: data.session_id,
              status: data.status,
              phoneNumber: data.phone_number,
            })
          } else {
            socket.emit('whatsapp:status_update', {
              sessionId: null,
              status: 'disconnected',
              phoneNumber: null,
            })
          }
        }
      } catch (error: any) {
        console.error('Error getting status:', error)
        socket.emit('whatsapp:error', { error: 'Error al obtener estado' })
      }
    })

    /**
     * Desconexión del socket
     */
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`)
    })
  })
}

/**
 * Autenticar socket con token de Supabase
 */
async function authenticateSocket(socket: Socket): Promise<string | null> {
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      console.log('No token provided')
      return null
    }

    // Verificar token con Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      console.log('Invalid token:', error?.message)
      return null
    }

    return user.id
  } catch (error) {
    console.error('Socket auth error:', error)
    return null
  }
}
