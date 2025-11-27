import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'

const router = Router()

/**
 * Middleware para obtener userId del token
 */
async function getUserIdFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null
    return user.id
  } catch {
    return null
  }
}

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Get WhatsApp conversations count
    const { count: whatsappConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get Web widget conversations count
    const { data: widgets } = await supabaseAdmin
      .from('chat_widgets')
      .select('id')
      .eq('user_id', userId)

    const widgetIds = widgets?.map(w => w.id) || []
    
    let webConversations = 0
    if (widgetIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('chat_widget_conversations')
        .select('*', { count: 'exact', head: true })
        .in('widget_id', widgetIds)
      webConversations = count || 0
    }

    // Get clients count
    const { count: totalClients } = await supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get WhatsApp sessions count
    const { count: whatsappSessions } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get active chatbot configs
    const { data: chatbotConfigs } = await supabaseAdmin
      .from('chatbot_configs')
      .select('id, session_id, widget_id, auto_reply')
      .eq('user_id', userId)

    const whatsappAiActive = chatbotConfigs?.filter(c => c.session_id && c.auto_reply).length || 0
    const webAiActive = chatbotConfigs?.filter(c => c.widget_id && c.auto_reply).length || 0

    // Get clients AI auto-capture setting
    const { data: clientSettings } = await supabaseAdmin
      .from('user_settings')
      .select('auto_capture_enabled')
      .eq('user_id', userId)
      .single()
    
    const clientsAiActive = clientSettings?.auto_capture_enabled ?? false

    // Get today's conversations (WhatsApp)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayWhatsapp } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('updated_at', today.toISOString())

    let todayWeb = 0
    if (widgetIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('chat_widget_conversations')
        .select('*', { count: 'exact', head: true })
        .in('widget_id', widgetIds)
        .gte('updated_at', today.toISOString())
      todayWeb = count || 0
    }

    res.json({
      success: true,
      data: {
        // Conversations
        totalConversations: (whatsappConversations || 0) + webConversations,
        whatsappConversations: whatsappConversations || 0,
        webConversations: webConversations,
        todayConversations: (todayWhatsapp || 0) + todayWeb,
        
        // Clients
        totalClients: totalClients || 0,
        
        // Connections
        whatsappSessions: whatsappSessions || 0,
        webWidgets: widgetIds.length,
        
        // AI Status
        whatsappAiActive,
        webAiActive,
        clientsAiActive,
        totalAiActive: whatsappAiActive + webAiActive + (clientsAiActive ? 1 : 0)
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

/**
 * POST /api/dashboard/toggle-ai
 * Toggle AI for all chatbots or specific type
 */
router.post('/toggle-ai', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { type, enabled } = req.body // type: 'all' | 'whatsapp' | 'web' | 'clients'

    if (type === 'all' || type === 'whatsapp') {
      // Toggle WhatsApp chatbots
      await supabaseAdmin
        .from('chatbot_configs')
        .update({ auto_reply: enabled })
        .eq('user_id', userId)
        .not('session_id', 'is', null)
    }

    if (type === 'all' || type === 'web') {
      // Toggle Web chatbots
      await supabaseAdmin
        .from('chatbot_configs')
        .update({ auto_reply: enabled })
        .eq('user_id', userId)
        .not('widget_id', 'is', null)
    }

    if (type === 'all' || type === 'clients') {
      // Toggle Clients AI auto-capture
      await supabaseAdmin
        .from('user_settings')
        .upsert({ 
          user_id: userId, 
          auto_capture_enabled: enabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
    }

    res.json({ success: true, message: `AI ${enabled ? 'activated' : 'deactivated'} for ${type}` })
  } catch (error) {
    console.error('Toggle AI error:', error)
    res.status(500).json({ success: false, error: 'Failed to toggle AI' })
  }
})

export default router
