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
import { autoReconnectService } from '../../services/autoReconnect.service'
import { sendWhatsAppConnectedEmail } from '../../utils/email'

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

      // Sincronizar chats existentes de WhatsApp
      this.syncExistingChats(client, sessionId, userId).catch(err => {
        console.error(`Failed to sync existing chats:`, err)
      })

      // Iniciar keepalive
      keepaliveService.startAll(sessionId)

      // Backup automático
      backupService.backupSession(sessionId).catch(err => {
        console.error(`Backup failed for ${sessionId}:`, err)
      })

      // Enviar email de conexión exitosa
      this.sendConnectionEmail(userId, phoneNumber, sessionId).catch(err => {
        console.error(`Failed to send connection email:`, err)
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

          const targetNumber = env.keepaliveTargetNumber.replace('+', '')
          const chatId = `${targetNumber}@c.us`
          
          // Mensajes aleatorios para evitar detección de bot
          const welcomeMessages = [
            `Hey! Ya estoy conectado 👍\nNúmero: ${phoneNumber}`,
            `Listo! Conexión establecida ✅\n${phoneNumber} online`,
            `Todo ok por aquí 🙌\nConectado: ${phoneNumber}`,
            `Perfecto, ya está! ${phoneNumber} funcionando`,
            `Conexión lista ✨ ${phoneNumber}`,
            `Ok! ${phoneNumber} conectado y listo`,
            `Ya estamos! 🚀 ${phoneNumber}`,
            `Hecho! ${phoneNumber} operativo`,
            `Genial, conectado ${phoneNumber} 👌`,
            `${phoneNumber} - Todo correcto!`,
          ]
          
          const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
          await client.sendMessage(chatId, randomMessage)
          console.log(`📨 Welcome message sent to +${targetNumber}`)
        } catch (err) {
          console.error(`Failed to send welcome message:`, err)
        }
      }, 2 * 60 * 1000) // 2 minutos
    })

    // Mensaje entrante - GUARDAR EN BASE DE DATOS
    client.on('message', async (message) => {
      console.log(`🔔 MESSAGE EVENT RECEIVED from ${message.from}`)
      try {
        await this.handleIncomingMessage(sessionId, userId, message)
      } catch (err) {
        console.error(`Error handling incoming message:`, err)
      }
    })

    // Mensaje saliente (enviado desde el teléfono)
    client.on('message_create', async (message) => {
      if (message.fromMe) {
        try {
          await this.handleOutgoingMessage(sessionId, userId, message)
        } catch (err) {
          console.error(`Error handling outgoing message:`, err)
        }
      }
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

    // Stop keepalive on disconnection
    keepaliveService.stopAll(sessionId)

    // Check if this is a permanent disconnection
    const isPermanent = autoReconnectService.isPermanentDisconnection(reason)

    if (isPermanent) {
      console.log(`🔴 Permanent disconnection for ${sessionId}: ${reason}`)
      session.status = 'disconnected'
      
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({ status: 'disconnected' as SessionStatus, error_message: reason })
        .eq('session_id', sessionId)

      this.io?.to(`user:${session.userId}`).emit('whatsapp:disconnected', { sessionId, reason })
    } else {
      console.log(`🟡 Temporary disconnection for ${sessionId}: ${reason} - attempting reconnect`)
      await this.attemptReconnect(sessionId, reason)
    }
  }

  private async attemptReconnect(sessionId: string, reason?: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    // Check if already reconnecting
    if (autoReconnectService.isReconnecting(sessionId)) {
      console.log(`⚠️ Already reconnecting ${sessionId}`)
      return
    }

    // Execute reconnection with exponential backoff
    const result = await autoReconnectService.executeReconnection(
      sessionId,
      async () => {
        try {
          // Try to reinitialize the client
          await session.client.initialize()
          
          // Check if connected
          const state = await session.client.getState()
          return state === 'CONNECTED'
        } catch (error) {
          console.error(`Reconnection attempt failed for ${sessionId}:`, error)
          return false
        }
      },
      reason
    )

    if (!result.success) {
      console.error(`❌ All reconnection attempts failed for ${sessionId}`)
      await this.handleSessionError(sessionId, 'Reconexión fallida después de múltiples intentos')
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

  /**
   * Manejar mensaje entrante - guardar en DB
   */
  private async handleIncomingMessage(sessionId: string, userId: string, message: any): Promise<void> {
    // Ignorar mensajes de grupos y broadcasts por ahora
    if (message.from.includes('@g.us') || message.from.includes('@broadcast')) {
      return
    }

    const contactPhone = message.from.replace('@c.us', '').replace('@s.whatsapp.net', '')
    const contact = await message.getContact()
    const contactName = contact?.pushname || contact?.name || null

    console.log(`📩 Incoming message from ${contactPhone}: ${message.body?.substring(0, 50)}...`)

    // Obtener whatsapp_account_id
    const { data: waAccount } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (!waAccount) {
      console.error(`WhatsApp account not found for session: ${sessionId}`)
      return
    }

    // Buscar o crear conversación
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('whatsapp_account_id', waAccount.id)
      .eq('contact_phone', contactPhone)
      .single()

    if (!conversation) {
      // Crear nueva conversación
      const { data: newConv, error: convError } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: userId,
          whatsapp_account_id: waAccount.id,
          contact_phone: contactPhone,
          contact_name: contactName,
          status: 'open',
          last_message_preview: message.body?.substring(0, 100) || '',
          last_message_at: new Date().toISOString(),
          unread_count: 1,
          chatbot_enabled: true,
        })
        .select('id')
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        return
      }
      conversation = newConv
      console.log(`📝 New conversation created: ${conversation.id}`)
    } else {
      // Actualizar conversación existente - incrementar unread_count con SQL raw
      const { data: currentConv } = await supabaseAdmin
        .from('conversations')
        .select('unread_count')
        .eq('id', conversation.id)
        .single()

      await supabaseAdmin
        .from('conversations')
        .update({
          contact_name: contactName || undefined,
          last_message_preview: message.body?.substring(0, 100) || '',
          last_message_at: new Date().toISOString(),
          unread_count: (currentConv?.unread_count || 0) + 1,
        })
        .eq('id', conversation.id)
    }

    // Guardar mensaje
    const { error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        user_id: userId,
        whatsapp_account_id: waAccount.id,
        message_id: message.id._serialized || `msg_${Date.now()}`,
        content: message.body || '',
        type: message.type || 'chat',
        direction: 'incoming',
        status: 'received',
        created_at: new Date(message.timestamp * 1000).toISOString(),
      })

    if (msgError) {
      console.error('Error saving message:', msgError)
    }

    // Emitir evento por socket para actualizar UI en tiempo real
    this.io?.to(`user:${userId}`).emit('whatsapp:message', {
      conversationId: conversation.id,
      message: {
        id: message.id._serialized,
        content: message.body,
        direction: 'incoming',
        timestamp: new Date(message.timestamp * 1000).toISOString(),
      }
    })
  }

  /**
   * Manejar mensaje saliente (enviado desde el teléfono)
   */
  private async handleOutgoingMessage(sessionId: string, userId: string, message: any): Promise<void> {
    // Ignorar mensajes de grupos y broadcasts
    if (message.to.includes('@g.us') || message.to.includes('@broadcast')) {
      return
    }

    const contactPhone = message.to.replace('@c.us', '').replace('@s.whatsapp.net', '')

    console.log(`📤 Outgoing message to ${contactPhone}: ${message.body?.substring(0, 50)}...`)

    // Obtener whatsapp_account_id
    const { data: waAccount } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (!waAccount) return

    // Buscar conversación existente
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('whatsapp_account_id', waAccount.id)
      .eq('contact_phone', contactPhone)
      .single()

    if (!conversation) {
      // No crear conversación para mensajes salientes sin conversación previa
      return
    }

    // Actualizar conversación
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_preview: message.body?.substring(0, 100) || '',
        last_message_at: new Date().toISOString(),
        unread_count: 0, // Resetear al enviar mensaje
      })
      .eq('id', conversation.id)

    // Guardar mensaje
    await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        user_id: userId,
        whatsapp_account_id: waAccount.id,
        message_id: message.id._serialized || `msg_${Date.now()}`,
        content: message.body || '',
        type: message.type || 'chat',
        direction: 'outgoing',
        status: 'sent',
        created_at: new Date(message.timestamp * 1000).toISOString(),
      })

    // Emitir evento por socket
    this.io?.to(`user:${userId}`).emit('whatsapp:message', {
      conversationId: conversation.id,
      message: {
        id: message.id._serialized,
        content: message.body,
        direction: 'outgoing',
        timestamp: new Date(message.timestamp * 1000).toISOString(),
      }
    })
  }

  /**
   * Sincronizar chats existentes de WhatsApp al conectar
   */
  private async syncExistingChats(client: Client, sessionId: string, userId: string): Promise<void> {
    try {
      console.log(`🔄 Syncing existing chats for session: ${sessionId}`)

      // Obtener whatsapp_account_id
      const { data: waAccount } = await supabaseAdmin
        .from('whatsapp_accounts')
        .select('id')
        .eq('session_id', sessionId)
        .single()

      if (!waAccount) {
        console.error(`WhatsApp account not found for session: ${sessionId}`)
        return
      }

      // Obtener todos los chats de WhatsApp
      const chats = await client.getChats()
      console.log(`📱 Found ${chats.length} chats in WhatsApp`)

      let syncedCount = 0
      const maxChatsToSync = 50 // Limitar para no sobrecargar

      for (const chat of chats.slice(0, maxChatsToSync)) {
        try {
          // Ignorar grupos y broadcasts
          if (chat.isGroup || chat.id._serialized.includes('@g.us') || chat.id._serialized.includes('@broadcast')) {
            continue
          }

          const contactPhone = chat.id.user
          const contact = await chat.getContact()
          const contactName = contact?.pushname || contact?.name || chat.name || null

          // Verificar si ya existe la conversación
          const { data: existingConv } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('user_id', userId)
            .eq('whatsapp_account_id', waAccount.id)
            .eq('contact_phone', contactPhone)
            .single()

          if (existingConv) {
            // Ya existe, actualizar nombre si es necesario
            if (contactName) {
              await supabaseAdmin
                .from('conversations')
                .update({ contact_name: contactName })
                .eq('id', existingConv.id)
            }
            continue
          }

          // Obtener últimos mensajes del chat
          const messages = await chat.fetchMessages({ limit: 10 })
          const lastMessage = messages[messages.length - 1]

          // Crear nueva conversación
          const { data: newConv, error: convError } = await supabaseAdmin
            .from('conversations')
            .insert({
              user_id: userId,
              whatsapp_account_id: waAccount.id,
              contact_phone: contactPhone,
              contact_name: contactName,
              status: 'open',
              last_message_preview: lastMessage?.body?.substring(0, 100) || '',
              last_message_at: lastMessage ? new Date(lastMessage.timestamp * 1000).toISOString() : new Date().toISOString(),
              unread_count: chat.unreadCount || 0,
              chatbot_enabled: true,
            })
            .select('id')
            .single()

          if (convError) {
            console.error(`Error creating conversation for ${contactPhone}:`, convError)
            continue
          }

          // Guardar los últimos mensajes
          for (const msg of messages) {
            const direction = msg.fromMe ? 'outgoing' : 'incoming'
            
            await supabaseAdmin
              .from('messages')
              .upsert({
                conversation_id: newConv.id,
                user_id: userId,
                whatsapp_account_id: waAccount.id,
                message_id: msg.id._serialized,
                content: msg.body || '',
                type: msg.type || 'chat',
                direction,
                status: msg.fromMe ? 'sent' : 'received',
                created_at: new Date(msg.timestamp * 1000).toISOString(),
              }, {
                onConflict: 'message_id'
              })
          }

          syncedCount++
          console.log(`✅ Synced chat: ${contactName || contactPhone}`)

        } catch (chatError) {
          console.error(`Error syncing chat:`, chatError)
        }
      }

      console.log(`🔄 Sync completed: ${syncedCount} new conversations`)

    } catch (error) {
      console.error(`Error syncing existing chats:`, error)
    }
  }

  /**
   * Enviar mensaje de WhatsApp
   */
  async sendMessage(sessionId: string, jid: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.status !== 'ready') {
      return { success: false, error: 'Session not ready' }
    }

    try {
      const result = await session.client.sendMessage(jid, message)
      session.lastActivity = Date.now()
      
      return { 
        success: true, 
        messageId: result.id._serialized 
      }
    } catch (error) {
      console.error(`Error sending message on ${sessionId}:`, error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      }
    }
  }

  /**
   * Enviar email de conexión exitosa
   */
  private async sendConnectionEmail(userId: string, phoneNumber: string, sessionId: string): Promise<void> {
    try {
      // Obtener datos del usuario
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (authError || !authUser?.user?.email) {
        console.log(`⚠️ No email found for user ${userId}`)
        return
      }

      const userEmail = authUser.user.email
      const userName = authUser.user.user_metadata?.full_name || 'Usuario'
      const frontendUrl = env.frontendUrl || 'http://localhost:3000'

      await sendWhatsAppConnectedEmail(userEmail, {
        user_name: userName,
        phone_number: phoneNumber || 'N/A',
        session_label: 'WhatsApp',
        connection_time: new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
        dashboard_url: `${frontendUrl}/settings/connections`,
      })

      console.log(`📧 Connection email sent to ${userEmail}`)
    } catch (error) {
      console.error('Error sending connection email:', error)
    }
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

    // Limpiar locks de Chrome antes de restaurar
    await this.cleanChromeLocks(sessionId)

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: env.sessionsPath,
      }),
      puppeteer: getPuppeteerConfig(),
      restartOnAuthFail: true,
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

  /**
   * Limpiar locks de Chrome que pueden quedar después de un crash
   */
  private async cleanChromeLocks(sessionId: string): Promise<void> {
    try {
      const sessionPath = path.join(env.sessionsPath, `session-${sessionId}`)
      
      // Listar contenido del directorio para debug
      if (fs.existsSync(env.sessionsPath)) {
        const contents = fs.readdirSync(env.sessionsPath)
        console.log(`📁 Sessions directory contents: ${contents.join(', ')}`)
      }

      if (!fs.existsSync(sessionPath)) {
        console.log(`⚠️ Session path does not exist: ${sessionPath}`)
        return
      }

      // Eliminar SingletonLock directamente en la raíz de la sesión
      const singletonLockPath = path.join(sessionPath, 'SingletonLock')
      if (fs.existsSync(singletonLockPath)) {
        fs.unlinkSync(singletonLockPath)
        console.log(`🧹 Removed SingletonLock: ${singletonLockPath}`)
      }

      // Eliminar SingletonSocket
      const singletonSocketPath = path.join(sessionPath, 'SingletonSocket')
      if (fs.existsSync(singletonSocketPath)) {
        fs.unlinkSync(singletonSocketPath)
        console.log(`🧹 Removed SingletonSocket: ${singletonSocketPath}`)
      }

      // Eliminar SingletonCookie
      const singletonCookiePath = path.join(sessionPath, 'SingletonCookie')
      if (fs.existsSync(singletonCookiePath)) {
        fs.unlinkSync(singletonCookiePath)
        console.log(`🧹 Removed SingletonCookie: ${singletonCookiePath}`)
      }

      // Limpiar locks recursivamente en subcarpetas
      console.log(`🔍 Checking locks in: ${sessionPath}`)
      await this.cleanLocksRecursively(sessionPath)

      console.log(`✅ Chrome locks cleaned for ${sessionId}`)
    } catch (error) {
      console.error(`Error cleaning Chrome locks:`, error)
    }
  }

  /**
   * Limpiar locks recursivamente en un directorio
   */
  private async cleanLocksRecursively(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) return

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        // Recursivamente limpiar subdirectorios
        await this.cleanLocksRecursively(fullPath)
      } else if (entry.isFile()) {
        // Eliminar archivos de lock - lista ampliada
        const lockFiles = [
          'SingletonLock',
          'SingletonSocket', 
          'SingletonCookie',
          'lockfile',
          'LOCK',
          '.lock',
          'parent.lock',
        ]
        
        const isLockFile = lockFiles.includes(entry.name) ||
          entry.name.includes('Lock') ||
          entry.name.includes('Singleton') ||
          entry.name.includes('lock')
        
        if (isLockFile) {
          try {
            fs.unlinkSync(fullPath)
            console.log(`🧹 Removed lock: ${fullPath}`)
          } catch (err) {
            console.error(`Failed to remove ${fullPath}:`, err)
          }
        }
      }
    }
  }

  /**
   * Forzar limpieza completa de sesión corrupta
   */
  async forceCleanSession(sessionId: string): Promise<void> {
    console.log(`🔥 Force cleaning session: ${sessionId}`)
    
    const sessionPath = path.join(env.sessionsPath, `session-${sessionId}`)
    
    if (fs.existsSync(sessionPath)) {
      // Eliminar toda la carpeta de sesión
      fs.rmSync(sessionPath, { recursive: true, force: true })
      console.log(`🗑️ Removed session folder: ${sessionPath}`)
    }
    
    // También limpiar en la base de datos
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({ status: 'disconnected' as SessionStatus })
      .eq('session_id', sessionId)
  }
}

export const whatsappService = new WhatsAppService()
