import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import { whatsappService } from './whatsapp.service'

const router = Router()

/**
 * Extraer userId del token de autorización
 */
async function getUserIdFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) {
      console.error('Token verification failed:', error?.message)
      return null
    }
    return user.id
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

/**
 * GET /api/whatsapp/accounts
 * Obtener todas las cuentas del usuario
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: accounts, error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accounts:', error)
      return res.status(500).json({ success: false, error: 'Error fetching accounts' })
    }

    res.json({ success: true, data: { accounts: accounts || [] } })
  } catch (error: any) {
    console.error('Error in GET /accounts:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/whatsapp/accounts
 * Crear nueva cuenta (solo metadata, sin sesión aún)
 */
router.post('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { label } = req.body

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Crear cuenta en Supabase
    const { data: account, error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .insert({
        user_id: userId,
        session_id: `wa_${userId}_${Date.now()}`,
        status: 'disconnected',
        label: label || 'WhatsApp Account',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating account:', error)
      return res.status(500).json({ success: false, error: 'Error creating account' })
    }

    console.log('✅ Account created:', account.id)
    res.json({ success: true, data: { account } })
  } catch (error: any) {
    console.error('Error in POST /accounts:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/whatsapp/sessions
 * Obtener sesiones activas del usuario
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: sessions, error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return res.status(500).json({ success: false, error: 'Error fetching sessions' })
    }

    res.json({ success: true, data: { sessions: sessions || [] } })
  } catch (error: any) {
    console.error('Error in GET /sessions:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/whatsapp/sessions
 * Iniciar sesión de WhatsApp (usar cuenta existente)
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { accountId } = req.body

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Buscar la cuenta existente
    const { data: account, error: findError } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (findError || !account) {
      return res.status(404).json({ success: false, error: 'No account found. Create one first.' })
    }

    console.log('📱 Starting session for user:', userId, 'sessionId:', account.session_id)

    // Iniciar sesión (NO crea registro nuevo, usa el existente)
    // Esto es async - el QR se enviará por Socket.IO
    whatsappService.startSession(account.session_id, userId).catch(err => {
      console.error('Error starting session:', err)
    })

    // Responder inmediatamente con la cuenta
    res.json({ success: true, data: { session: account } })
  } catch (error: any) {
    console.error('Error in POST /sessions:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/whatsapp/sessions/:sessionId
 * Destruir sesión
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { sessionId } = req.params

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Verificar que la sesión pertenece al usuario
    const { data: account } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!account) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }

    await whatsappService.destroySession(sessionId)

    res.json({ success: true, message: 'Session destroyed' })
  } catch (error: any) {
    console.error('Error in DELETE /sessions:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/whatsapp/sessions/:sessionId/force-clean
 * Forzar limpieza completa de una sesión corrupta
 */
router.post('/sessions/:sessionId/force-clean', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const userId = await getUserIdFromToken(req)

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Verificar que la sesión pertenece al usuario
    const { data: account } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!account) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }

    // Destruir sesión si existe en memoria
    await whatsappService.destroySession(sessionId)
    
    // Forzar limpieza de archivos
    await whatsappService.forceCleanSession(sessionId)

    res.json({ success: true, message: 'Session force cleaned' })
  } catch (error: any) {
    console.error('Error in POST /sessions/force-clean:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==============================================
// RUTAS DE CONVERSACIONES
// ==============================================

/**
 * GET /api/whatsapp/conversations
 * Obtener todas las conversaciones del usuario
 * OPTIMIZADO: Campos específicos, caché, límite
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { limit = '100' } = req.query
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Seleccionar solo campos necesarios para la lista
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('id, contact_phone, contact_name, contact_avatar, status, last_message_preview, last_message_at, unread_count, chatbot_enabled, is_online, needs_attention')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(Math.min(parseInt(limit as string) || 100, 200))

    if (error) {
      console.error('Error fetching conversations:', error)
      return res.status(500).json({ success: false, error: 'Error fetching conversations' })
    }

    // Headers de caché
    res.set('Cache-Control', 'private, max-age=3')
    
    res.json({ success: true, data: conversations || [] })
  } catch (error: any) {
    console.error('Error in GET /conversations:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/whatsapp/conversations/:id
 * Obtener una conversación específica
 */
router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }

    res.json({ success: true, data: conversation })
  } catch (error: any) {
    console.error('Error in GET /conversations/:id:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/whatsapp/conversations/:id/chatbot
 * Activar/desactivar chatbot para una conversación
 */
router.put('/conversations/:id/chatbot', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    const { enabled } = req.body
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({ 
        chatbot_enabled: enabled,
        needs_attention: !enabled // Si se desactiva el chatbot, necesita atención
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating chatbot status:', error)
      return res.status(500).json({ success: false, error: 'Error updating chatbot status' })
    }

    console.log(`🤖 Chatbot ${enabled ? 'enabled' : 'disabled'} for conversation ${id}`)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in PUT /conversations/:id/chatbot:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/whatsapp/conversations/:id/read
 * Marcar conversación como leída
 */
router.put('/conversations/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error marking as read:', error)
      return res.status(500).json({ success: false, error: 'Error marking as read' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error in PUT /conversations/:id/read:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==============================================
// RUTAS DE MENSAJES
// ==============================================

/**
 * GET /api/whatsapp/conversations/:id/messages
 * Obtener mensajes de una conversación
 * OPTIMIZADO: Selección de campos específicos, caché headers
 */
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    const { limit = '50', before } = req.query
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Verificar que la conversación pertenece al usuario
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }

    // Seleccionar solo campos necesarios para el frontend
    let query = supabaseAdmin
      .from('messages')
      .select('id, message_id, content, type, direction, status, timestamp')
      .eq('conversation_id', id)
      .order('timestamp', { ascending: false })
      .limit(Math.min(parseInt(limit as string) || 50, 100))

    if (before) {
      // Decodificar el timestamp (el + se convierte en espacio en URLs)
      const beforeTimestamp = decodeURIComponent(before as string).replace(' ', '+')
      query = query.lt('timestamp', beforeTimestamp)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return res.status(500).json({ success: false, error: 'Error fetching messages' })
    }

    // Headers de caché para reducir requests
    res.set('Cache-Control', 'private, max-age=5')
    
    // Devolver en orden cronológico
    res.json({ success: true, data: (messages || []).reverse() })
  } catch (error: any) {
    console.error('Error in GET /conversations/:id/messages:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/whatsapp/conversations/:id/load-all
 * Cargar TODOS los mensajes desde WhatsApp (historial completo)
 */
router.get('/conversations/:id/load-all', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Obtener conversación
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('contact_phone, whatsapp_account_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }

    // Obtener session_id
    const { data: waAccount } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('session_id')
      .eq('id', conversation.whatsapp_account_id)
      .eq('status', 'ready')
      .single()

    if (!waAccount) {
      return res.status(404).json({ success: false, error: 'No active WhatsApp session' })
    }

    console.log(`📜 [load-all] Cargando mensajes para conversación ${id}, teléfono: ${conversation.contact_phone}`)
    
    // Cargar TODOS los mensajes desde WhatsApp
    const result = await whatsappService.fetchAllMessages(
      waAccount.session_id,
      conversation.contact_phone,
      id
    )

    if (!result) {
      console.log(`📜 [load-all] No se pudieron cargar mensajes (session no ready o error)`)
      return res.json({ success: true, newMessages: 0, totalInWhatsApp: 0 })
    }

    // Guardar nuevos mensajes en DB
    if (result.messages.length > 0) {
      const messageRecords = result.messages.map((msg: any) => ({
        conversation_id: id,
        user_id: userId,
        whatsapp_account_id: conversation.whatsapp_account_id,
        message_id: msg.id,
        content: msg.content || '',
        type: msg.type || 'chat',
        direction: msg.direction,
        status: msg.status,
        timestamp: msg.timestamp,
      }))

      await supabaseAdmin
        .from('messages')
        .upsert(messageRecords, { onConflict: 'message_id', ignoreDuplicates: true })
    }

    res.json({ 
      success: true, 
      newMessages: result.messages.length,
      totalInWhatsApp: result.totalInWhatsApp
    })
  } catch (error: any) {
    console.error('Error loading all messages:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/whatsapp/conversations/:id/messages
 * Enviar mensaje a una conversación
 */
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    const { content, type = 'text' } = req.body
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' })
    }

    // Obtener conversación
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }

    // Desactivar chatbot al enviar mensaje manual
    await supabaseAdmin
      .from('conversations')
      .update({ 
        chatbot_enabled: false,
        needs_attention: false // Ya no necesita atención porque estamos respondiendo
      })
      .eq('id', id)

    // Obtener session_id de la cuenta de WhatsApp
    const { data: waAccount } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('session_id')
      .eq('id', conversation.whatsapp_account_id)
      .single()

    if (!waAccount) {
      return res.status(404).json({ success: false, error: 'WhatsApp account not found' })
    }

    // Formatear JID
    const remoteJid = `${conversation.contact_phone.replace(/\D/g, '')}@s.whatsapp.net`

    // Enviar mensaje por WhatsApp
    const result = await whatsappService.sendMessage(
      waAccount.session_id,
      remoteJid,
      content
    )

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Failed to send message' })
    }

    // Guardar mensaje en la base de datos
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: id,
        user_id: userId,
        whatsapp_account_id: conversation.whatsapp_account_id,
        message_id: result.messageId || `msg_${Date.now()}`,
        content,
        type,
        direction: 'outgoing',
        status: 'sent',
        timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (msgError) {
      console.error('Error saving message:', msgError)
    }

    console.log(`📤 Message sent to ${conversation.contact_phone}`)
    res.json({ 
      success: true, 
      data: message,
      chatbot_disabled: true 
    })
  } catch (error: any) {
    console.error('Error in POST /conversations/:id/messages:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/whatsapp/send
 * Enviar mensaje directo (sin conversación previa)
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { sessionId, phone, message } = req.body
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    if (!sessionId || !phone || !message) {
      return res.status(400).json({ success: false, error: 'sessionId, phone, and message are required' })
    }

    // Verificar que la sesión pertenece al usuario
    const { data: account } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    if (!account) {
      return res.status(404).json({ success: false, error: 'Session not found' })
    }

    // Formatear número
    const formattedPhone = phone.replace(/\D/g, '')
    const jid = `${formattedPhone}@s.whatsapp.net`

    // Enviar mensaje
    const result = await whatsappService.sendMessage(sessionId, jid, message)

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Failed to send message' })
    }

    res.json({ success: true, data: { messageId: result.messageId } })
  } catch (error: any) {
    console.error('Error in POST /send:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/whatsapp/profile-pic/:phone
 * Obtener foto de perfil de un contacto de WhatsApp
 * La URL es temporal y se obtiene directamente de WhatsApp
 */
router.get('/profile-pic/:phone', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { phone } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Obtener sesión activa del usuario
    const { data: account } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('session_id')
      .eq('user_id', userId)
      .eq('status', 'ready')
      .single()

    if (!account) {
      return res.status(404).json({ success: false, error: 'No active session' })
    }

    const profilePicUrl = await whatsappService.getProfilePicUrl(account.session_id, phone)
    
    // Cache por 1 hora (las fotos de perfil no cambian frecuentemente)
    res.set('Cache-Control', 'private, max-age=3600')
    res.json({ success: true, data: { url: profilePicUrl } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export { router as whatsappRoutes }
