import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'

const router = Router()

// Encryption key for API keys (should be in env)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32'
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  try {
    const [ivHex, encrypted] = text.split(':')
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return ''
  }
}

// Helper to get user ID from token
async function getUserIdFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) return null
  return user.id
}

/**
 * GET /api/chatbot/whatsapp/:sessionId
 * Get chatbot config for a WhatsApp session
 */
router.get('/whatsapp/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { sessionId } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: config, error } = await supabaseAdmin
      .from('chatbot_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching chatbot config:', error)
      return res.status(500).json({ success: false, error: 'Error fetching config' })
    }

    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' })
    }

    // Don't send encrypted API key, just indicate if it exists
    const responseConfig = {
      ...config,
      api_key: undefined,
      api_key_encrypted: undefined,
      has_api_key: !!config.api_key_encrypted
    }

    res.json({ success: true, data: responseConfig })
  } catch (error: any) {
    console.error('Error in GET /chatbot/whatsapp/:sessionId:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/chatbot/whatsapp/:sessionId
 * Create or update chatbot config for a WhatsApp session
 */
router.post('/whatsapp/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { sessionId } = req.params
    const body = req.body
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Get workspace_id from the WhatsApp account
    const { data: waAccount } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('workspace_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single()

    // Prepare data for upsert
    const configData: any = {
      user_id: userId,
      session_id: sessionId,
      workspace_id: waAccount?.workspace_id || null,
      provider: body.provider || 'google',
      model: body.model || 'gemini-2.5-flash',
      bot_name: body.bot_name || 'Asistente',
      language: body.language || 'es',
      tone: body.tone || 'professional',
      auto_reply: body.auto_reply !== undefined ? body.auto_reply : true,
      use_ecommerce_api: body.use_ecommerce_api || false,
      ecommerce_connection_ids: body.ecommerce_connection_ids || [],
      ecommerce_search_message: body.ecommerce_search_message || 'Estoy buscando la mejor solución para ti...',
      system_prompt: body.system_prompt,
      custom_instructions: body.custom_instructions,
      fallback_message: body.fallback_message,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      context_window: body.context_window,
      max_conversation_length: body.max_conversation_length,
      enable_memory: body.enable_memory,
      enable_typing_indicator: body.enable_typing_indicator,
      business_hours_enabled: body.business_hours_enabled,
      business_hours_timezone: body.business_hours_timezone,
      active_hours_start: body.active_hours_start,
      active_hours_end: body.active_hours_end,
      out_of_hours_message: body.out_of_hours_message,
      handoff_enabled: body.handoff_enabled,
      handoff_keywords: body.handoff_keywords,
      handoff_message: body.handoff_message,
      debounce_delay_ms: body.debounce_delay_ms,
      max_wait_ms: body.max_wait_ms,
      max_batch_size: body.max_batch_size,
      log_conversations: body.log_conversations,
      data_retention_days: body.data_retention_days,
      updated_at: new Date().toISOString()
    }

    // Handle API key - only update if provided and not placeholder
    if (body.api_key && body.api_key !== '••••••••') {
      configData.api_key_encrypted = encrypt(body.api_key)
      configData.has_api_key = true
    }

    // Upsert config
    const { data: config, error } = await supabaseAdmin
      .from('chatbot_configs')
      .upsert(configData, { 
        onConflict: 'user_id,session_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving chatbot config:', error)
      return res.status(500).json({ success: false, error: 'Error saving config' })
    }

    res.json({ success: true, data: config })
  } catch (error: any) {
    console.error('Error in POST /chatbot/whatsapp/:sessionId:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/chatbot/whatsapp/:sessionId
 * Delete chatbot config for a WhatsApp session
 */
router.delete('/whatsapp/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { sessionId } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { error } = await supabaseAdmin
      .from('chatbot_configs')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error deleting chatbot config:', error)
      return res.status(500).json({ success: false, error: 'Error deleting config' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /chatbot/whatsapp/:sessionId:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/chatbot/whatsapp/:sessionId/api-key
 * Get decrypted API key (for internal use only)
 */
router.get('/whatsapp/:sessionId/api-key', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { sessionId } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: config, error } = await supabaseAdmin
      .from('chatbot_configs')
      .select('api_key_encrypted')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single()

    if (error || !config?.api_key_encrypted) {
      return res.status(404).json({ success: false, error: 'API key not found' })
    }

    const apiKey = decrypt(config.api_key_encrypted)
    
    res.json({ success: true, data: { api_key: apiKey } })
  } catch (error: any) {
    console.error('Error in GET /chatbot/whatsapp/:sessionId/api-key:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ==============================================
// WEB CHATBOT ROUTES
// ==============================================

/**
 * GET /api/chatbot/web/:widgetId
 * Get chatbot config for a web widget
 */
router.get('/web/:widgetId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { widgetId } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Verify widget belongs to user
    const { data: widget } = await supabaseAdmin
      .from('chat_widgets')
      .select('id')
      .eq('id', widgetId)
      .eq('user_id', userId)
      .single()

    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' })
    }

    const { data: config, error } = await supabaseAdmin
      .from('chatbot_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('widget_id', widgetId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching web chatbot config:', error)
      return res.status(500).json({ success: false, error: 'Error fetching config' })
    }

    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' })
    }

    const responseConfig = {
      ...config,
      api_key: undefined,
      api_key_encrypted: undefined,
      has_api_key: !!config.api_key_encrypted
    }

    res.json({ success: true, data: responseConfig })
  } catch (error: any) {
    console.error('Error in GET /chatbot/web/:widgetId:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/chatbot/web/:widgetId
 * Create or update chatbot config for a web widget
 */
router.post('/web/:widgetId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { widgetId } = req.params
    const body = req.body
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Verify widget belongs to user
    const { data: widget } = await supabaseAdmin
      .from('chat_widgets')
      .select('id')
      .eq('id', widgetId)
      .eq('user_id', userId)
      .single()

    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' })
    }

    const configData: any = {
      user_id: userId,
      widget_id: widgetId,
      provider: body.provider || 'google',
      model: body.model || 'gemini-2.5-flash',
      bot_name: body.bot_name || 'Asistente',
      language: body.language || 'es',
      tone: body.tone || 'professional',
      auto_reply: body.auto_reply !== undefined ? body.auto_reply : true,
      use_ecommerce_api: body.use_ecommerce_api || false,
      ecommerce_connection_ids: body.ecommerce_connection_ids || [],
      ecommerce_search_message: body.ecommerce_search_message || 'Estoy buscando la mejor solución para ti...',
      system_prompt: body.system_prompt,
      custom_instructions: body.custom_instructions,
      fallback_message: body.fallback_message,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      context_window: body.context_window,
      max_conversation_length: body.max_conversation_length,
      enable_memory: body.enable_memory,
      enable_typing_indicator: body.enable_typing_indicator,
      handoff_enabled: body.handoff_enabled,
      handoff_keywords: body.handoff_keywords,
      handoff_message: body.handoff_message,
      // Web-specific fields
      collect_visitor_data: body.collect_visitor_data,
      collect_name: body.collect_name,
      collect_email: body.collect_email,
      collect_phone: body.collect_phone,
      collect_data_timing: body.collect_data_timing,
      human_handoff_email: body.human_handoff_email,
      updated_at: new Date().toISOString()
    }

    if (body.api_key && body.api_key !== '••••••••') {
      configData.api_key_encrypted = encrypt(body.api_key)
      configData.has_api_key = true
    }

    const { data: config, error } = await supabaseAdmin
      .from('chatbot_configs')
      .upsert(configData, { 
        onConflict: 'user_id,widget_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving web chatbot config:', error)
      return res.status(500).json({ success: false, error: 'Error saving config' })
    }

    res.json({ success: true, data: config })
  } catch (error: any) {
    console.error('Error in POST /chatbot/web/:widgetId:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/chatbot/web/:widgetId/toggle
 * Toggle auto_reply for a web widget
 */
router.post('/web/:widgetId/toggle', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { widgetId } = req.params
    const { auto_reply } = req.body
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { error } = await supabaseAdmin
      .from('chatbot_configs')
      .update({ auto_reply, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('widget_id', widgetId)

    if (error) {
      console.error('Error toggling web chatbot:', error)
      return res.status(500).json({ success: false, error: 'Error toggling config' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error in POST /chatbot/web/:widgetId/toggle:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/chatbot/web/:widgetId
 * Delete chatbot config for a web widget
 */
router.delete('/web/:widgetId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { widgetId } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { error } = await supabaseAdmin
      .from('chatbot_configs')
      .delete()
      .eq('user_id', userId)
      .eq('widget_id', widgetId)

    if (error) {
      console.error('Error deleting web chatbot config:', error)
      return res.status(500).json({ success: false, error: 'Error deleting config' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /chatbot/web/:widgetId:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export { router as chatbotRoutes }
