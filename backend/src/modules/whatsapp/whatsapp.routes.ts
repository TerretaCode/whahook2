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

export { router as whatsappRoutes }
