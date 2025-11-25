import { Client, LocalAuth } from 'whatsapp-web.js'
import { Server as SocketServer } from 'socket.io'
import { supabaseAdmin } from '../../config/supabase'
import { env } from '../../config/environment'
import { getPuppeteerConfig } from '../../config/puppeteer'
import { 
  WhatsAppSession, 
  SessionStatus, 
  WhatsAppAccount,
  LIMITS 
} from './whatsapp.types'
import { keepaliveService } from '../../services/keepalive.service'

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map()
  private io: SocketServer | null = null

  /**
   * Inicializar con Socket.IO
   */
  initialize(io: SocketServer): void {
    this.io = io
    console.log('✅ WhatsApp Service initialized')
  }

  /**
   * Crear nueva sesión de WhatsApp (crea cuenta en DB + inicia sesión)
   * Usado por Socket.IO
   */
  async createSession(userId: string): Promise<string> {
    // Generar sessionId
    const sessionId = `wa_${userId}_${Date.now()}`
    
    // Crear registro en DB
    const { error: dbError } = await supabaseAdmin
      .from('whatsapp_accounts')
      .insert({
        user_id: userId,
        session_id: sessionId,
        status: 'initializing' as SessionStatus,
      })

    if (dbError) {
      console.error('Error creating WhatsApp account:', dbError)
      throw new Error('Error al crear cuenta de WhatsApp')
    }

    // Iniciar sesión
    return this.startSession(sessionId, userId)
  }

  /**
   * Iniciar sesión de WhatsApp usando un sessionId existente
   */
  async startSession(sessionId: string, userId: string): Promise<string> {
    console.log(`\n========== START SESSION ==========`)
    console.log(`📱 SessionId: ${sessionId}`)
    console.log(`👤 UserId: ${userId}`)
    
    // 1. Verificar si ya tiene sesión activa en memoria
    const existingSession = this.getSessionByUserId(userId)
    if (existingSession && existingSession.status === 'ready') {
      console.log(`❌ User already has active session`)
      throw new Error('Ya tienes una sesión de WhatsApp activa')
    }
    console.log(`✅ No existing active session`)

    // 2. Actualizar estado en DB
    console.log(`📝 Updating DB status to 'initializing'...`)
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({ status: 'initializing' as SessionStatus })
      .eq('session_id', sessionId)
    console.log(`✅ DB updated`)

    // 3. Crear cliente WhatsApp
    console.log(`🔧 Creating WhatsApp client...`)
    console.log(`   - clientId: ${sessionId}`)
    console.log(`   - dataPath: ${env.sessionsPath}`)
    
    const puppeteerConfig = getPuppeteerConfig()
    console.log(`   - puppeteer config:`, JSON.stringify(puppeteerConfig, null, 2))
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: env.sessionsPath,
      }),
      puppeteer: puppeteerConfig,
      restartOnAuthFail: true,
      qrMaxRetries: 5,
      authTimeoutMs: 0,
      // WebVersionCache para versiones recientes de whatsapp-web.js
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/AryoSeto10/wa-version/main/html/2.3000.1020750013-alpha.html',
      },
    })
    console.log(`✅ WhatsApp client created`)

    // 5. Guardar sesión en memoria
    console.log(`💾 Saving session to memory...`)
    const session: WhatsAppSession = {
      client,
      status: 'initializing',
      userId,
      sessionId,
      lastActivity: Date.now(),
      createdAt: Date.now(),
      reconnectAttempts: 0,
    }
    this.sessions.set(sessionId, session)
    console.log(`✅ Session saved. Total sessions: ${this.sessions.size}`)

    // 6. Configurar eventos
    console.log(`🎯 Setting up client events...`)
    this.setupClientEvents(client, sessionId, userId)
    console.log(`✅ Events configured`)

    // 7. Inicializar cliente (ESTO INICIA CHROMIUM)
    console.log(`\n🚀🚀🚀 STARTING CHROMIUM 🚀🚀🚀`)
    console.log(`⏱️  Time: ${new Date().toISOString()}`)
    console.log(`⏳ This may take 30-60 seconds on first run...`)
    
    try {
      await client.initialize()
      console.log(`\n✅✅✅ CHROMIUM INITIALIZED ✅✅✅`)
      console.log(`⏱️  Time: ${new Date().toISOString()}`)
    } catch (error: any) {
      console.error(`\n❌❌❌ CHROMIUM FAILED ❌❌❌`)
      console.error(`⏱️  Time: ${new Date().toISOString()}`)
      console.error(`Error:`, error.message)
      console.error(`Stack:`, error.stack)
      await this.handleSessionError(sessionId, error.message)
      throw error
    }

    console.log(`========== SESSION STARTED ==========\n`)
    return sessionId
  }

  /**
   * Configurar eventos del cliente WhatsApp
   */
  private setupClientEvents(client: Client, sessionId: string, userId: string): void {
    console.log(`   📌 Registering event: qr`)
    // QR Code generado
    client.on('qr', (qr) => {
      console.log(`\n📱📱📱 QR CODE GENERATED 📱📱📱`)
      console.log(`   SessionId: ${sessionId}`)
      console.log(`   QR length: ${qr.length} chars`)
      console.log(`   Emitting to room: user:${userId}`)
      this.updateSessionStatus(sessionId, 'qr_pending')
      
      // Emitir QR al usuario via Socket.IO
      this.io?.to(`user:${userId}`).emit('whatsapp:qr', { 
        qr, 
        sessionId 
      })
    })

    // Autenticando
    client.on('authenticated', () => {
      console.log(`🔐 Authenticated: ${sessionId}`)
      this.updateSessionStatus(sessionId, 'authenticating')
    })

    // Listo para usar
    client.on('ready', async () => {
      console.log(`✅ Ready: ${sessionId}`)
      
      const info = client.info
      const phoneNumber = info?.wid?.user || ''

      // Actualizar sesión en memoria
      const session = this.sessions.get(sessionId)
      if (session) {
        session.status = 'ready'
        session.phoneNumber = phoneNumber
        session.lastActivity = Date.now()
        session.reconnectAttempts = 0
      }

      // Actualizar en Supabase
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          status: 'ready' as SessionStatus,
          phone_number: phoneNumber,
          last_seen: new Date().toISOString(),
          error_message: null,
        })
        .eq('session_id', sessionId)

      // Notificar al usuario
      this.io?.to(`user:${userId}`).emit('whatsapp:ready', {
        sessionId,
        phoneNumber,
      })

      // Iniciar keepalive para esta sesión
      keepaliveService.startAll(sessionId)
    })

    // Desconectado
    client.on('disconnected', async (reason) => {
      console.log(`❌ Disconnected: ${sessionId} - ${reason}`)
      
      await this.handleDisconnection(sessionId, reason)
    })

    // Error de autenticación
    client.on('auth_failure', async (message) => {
      console.error(`🚫 Auth failure: ${sessionId} - ${message}`)
      await this.handleSessionError(sessionId, `Error de autenticación: ${message}`)
    })
  }

  /**
   * Manejar desconexión
   */
  private async handleDisconnection(sessionId: string, reason: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    // Razones que requieren nuevo QR (no reconectar)
    const permanentReasons = ['LOGOUT', 'CONFLICT', 'UNPAIRED', 'TOS_BLOCK']
    const isPermanent = permanentReasons.some(r => reason.includes(r))

    if (isPermanent) {
      // Desconexión permanente
      session.status = 'disconnected'
      
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          status: 'disconnected' as SessionStatus,
          error_message: reason,
        })
        .eq('session_id', sessionId)

      this.io?.to(`user:${session.userId}`).emit('whatsapp:disconnected', {
        sessionId,
        reason,
      })
    } else {
      // Intentar reconectar
      await this.attemptReconnect(sessionId)
    }
  }

  /**
   * Intentar reconexión
   */
  private async attemptReconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (session.reconnectAttempts >= LIMITS.maxReconnectAttempts) {
      console.log(`Max reconnect attempts reached for ${sessionId}`)
      await this.handleSessionError(sessionId, 'Máximo de intentos de reconexión alcanzado')
      return
    }

    session.reconnectAttempts++
    console.log(`Reconnect attempt ${session.reconnectAttempts}/${LIMITS.maxReconnectAttempts} for ${sessionId}`)

    // Esperar antes de reconectar
    await new Promise(resolve => setTimeout(resolve, LIMITS.reconnectDelayMs))

    try {
      await session.client.initialize()
    } catch (error: any) {
      console.error(`Reconnect failed for ${sessionId}:`, error)
      await this.attemptReconnect(sessionId)
    }
  }

  /**
   * Manejar error de sesión
   */
  private async handleSessionError(sessionId: string, errorMessage: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = 'error'
    }

    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({
        status: 'error' as SessionStatus,
        error_message: errorMessage,
      })
      .eq('session_id', sessionId)

    if (session) {
      this.io?.to(`user:${session.userId}`).emit('whatsapp:error', {
        sessionId,
        error: errorMessage,
      })
    }
  }

  /**
   * Actualizar estado de sesión
   */
  private async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = status
      session.lastActivity = Date.now()
    }

    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({ status })
      .eq('session_id', sessionId)

    if (session) {
      this.io?.to(`user:${session.userId}`).emit('whatsapp:status_update', {
        sessionId,
        status,
      })
    }
  }

  /**
   * Destruir sesión
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Sesión no encontrada')
    }

    // Detener keepalive primero
    keepaliveService.stopAll(sessionId)

    try {
      await session.client.logout()
      await session.client.destroy()
    } catch (error) {
      console.error(`Error destroying client ${sessionId}:`, error)
    }

    // Eliminar de memoria
    this.sessions.delete(sessionId)

    // Actualizar en Supabase
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({
        status: 'disconnected' as SessionStatus,
        error_message: 'Desconectado manualmente',
      })
      .eq('session_id', sessionId)

    console.log(`🗑️ Session destroyed: ${sessionId}`)
  }

  /**
   * Obtener sesión por ID
   */
  getSession(sessionId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Obtener sesión por user ID
   */
  getSessionByUserId(userId: string): WhatsAppSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        return session
      }
    }
    return undefined
  }

  /**
   * Obtener todas las sesiones
   */
  getAllSessions(): Map<string, WhatsAppSession> {
    return this.sessions
  }

  /**
   * Restaurar sesiones activas desde Supabase (al iniciar servidor)
   */
  async restoreActiveSessions(): Promise<void> {
    console.log('🔄 Restoring active sessions...')

    const { data: accounts, error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('status', 'ready')

    if (error) {
      console.error('Error fetching active accounts:', error)
      return
    }

    if (!accounts || accounts.length === 0) {
      console.log('No active sessions to restore')
      return
    }

    console.log(`Found ${accounts.length} session(s) to restore`)

    for (const account of accounts as WhatsAppAccount[]) {
      try {
        await this.restoreSession(account)
      } catch (error) {
        console.error(`Failed to restore session ${account.session_id}:`, error)
      }
    }
  }

  /**
   * Restaurar una sesión específica
   */
  private async restoreSession(account: WhatsAppAccount): Promise<void> {
    const { session_id: sessionId, user_id: userId } = account

    console.log(`Restoring session: ${sessionId}`)

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: env.sessionsPath,
      }),
      puppeteer: getPuppeteerConfig(),
    })

    const session: WhatsAppSession = {
      client,
      status: 'initializing',
      userId,
      sessionId,
      phoneNumber: account.phone_number || undefined,
      lastActivity: Date.now(),
      createdAt: new Date(account.created_at).getTime(),
      reconnectAttempts: 0,
    }

    this.sessions.set(sessionId, session)
    this.setupClientEvents(client, sessionId, userId)

    await client.initialize()
  }
}

// Exportar instancia singleton
export const whatsappService = new WhatsAppService()
