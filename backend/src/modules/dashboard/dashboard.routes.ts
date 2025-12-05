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
 * Supports workspace_id filter
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const workspaceId = req.query.workspace_id as string | undefined

    // If workspace_id provided, get stats for that workspace
    // Otherwise, get stats for all user's data (owner view)
    
    let whatsappAccountId: string | null = null
    let widgetIds: string[] = []

    if (workspaceId) {
      // Verify user has access to this workspace
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('id, user_id')
        .eq('id', workspaceId)
        .single()

      if (!workspace) {
        return res.status(404).json({ success: false, error: 'Workspace not found' })
      }

      const isOwner = workspace.user_id === userId
      if (!isOwner) {
        const { data: membership } = await supabaseAdmin
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .single()

        if (!membership) {
          return res.status(403).json({ success: false, error: 'Access denied' })
        }
      }

      // Get WhatsApp account for this workspace
      const { data: waAccount } = await supabaseAdmin
        .from('whatsapp_accounts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .single()
      
      whatsappAccountId = waAccount?.id || null

      // Get widgets for this workspace
      const { data: widgets } = await supabaseAdmin
        .from('chat_widgets')
        .select('id')
        .eq('workspace_id', workspaceId)
      
      widgetIds = widgets?.map(w => w.id) || []
    } else {
      // No workspace filter - get all user's widgets
      const { data: widgets } = await supabaseAdmin
        .from('chat_widgets')
        .select('id')
        .eq('user_id', userId)
      
      widgetIds = widgets?.map(w => w.id) || []
    }

    // Get WhatsApp conversations count
    let whatsappConversations = 0
    if (workspaceId && whatsappAccountId) {
      const { count } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_account_id', whatsappAccountId)
      whatsappConversations = count || 0
    } else if (!workspaceId) {
      const { count } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      whatsappConversations = count || 0
    }

    // Get Web widget conversations count
    let webConversations = 0
    if (widgetIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('chat_widget_conversations')
        .select('*', { count: 'exact', head: true })
        .in('widget_id', widgetIds)
      webConversations = count || 0
    }

    // Get clients count
    let totalClients = 0
    if (workspaceId) {
      const { count } = await supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
      totalClients = count || 0
    } else {
      const { count } = await supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      totalClients = count || 0
    }

    // Get conversations needing attention (WhatsApp)
    let whatsappNeedsAttention = 0
    if (workspaceId && whatsappAccountId) {
      const { count } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_account_id', whatsappAccountId)
        .eq('needs_attention', true)
      whatsappNeedsAttention = count || 0
    } else if (!workspaceId) {
      const { count } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('needs_attention', true)
      whatsappNeedsAttention = count || 0
    }

    // Get web conversations with unread messages (needs attention)
    let webNeedsAttention = 0
    if (widgetIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('chat_widget_conversations')
        .select('*', { count: 'exact', head: true })
        .in('widget_id', widgetIds)
        .gt('unread_count', 0)
      webNeedsAttention = count || 0
    }

    // Get WhatsApp sessions count
    let whatsappSessions = 0
    if (workspaceId) {
      const { count } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
      whatsappSessions = count || 0
    } else {
      const { count } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      whatsappSessions = count || 0
    }

    // Get active chatbot configs
    let chatbotConfigs: { id: string; session_id: string | null; widget_id: string | null; auto_reply: boolean }[] = []
    if (workspaceId) {
      const { data } = await supabaseAdmin
        .from('chatbot_configs')
        .select('id, session_id, widget_id, auto_reply')
        .eq('workspace_id', workspaceId)
      chatbotConfigs = data || []
    } else {
      const { data } = await supabaseAdmin
        .from('chatbot_configs')
        .select('id, session_id, widget_id, auto_reply')
        .eq('user_id', userId)
      chatbotConfigs = data || []
    }

    const whatsappAiActive = chatbotConfigs.filter(c => c.session_id && c.auto_reply).length
    const webAiActive = chatbotConfigs.filter(c => c.widget_id && c.auto_reply).length

    // Get clients AI auto-capture setting
    const { data: clientSettings } = await supabaseAdmin
      .from('user_settings')
      .select('auto_capture_enabled')
      .eq('user_id', userId)
      .single()
    
    const clientsAiActive = clientSettings?.auto_capture_enabled ?? false

    // Get today's conversations
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let todayWhatsapp = 0
    if (workspaceId && whatsappAccountId) {
      const { count } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('whatsapp_account_id', whatsappAccountId)
        .gte('updated_at', today.toISOString())
      todayWhatsapp = count || 0
    } else if (!workspaceId) {
      const { count } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('updated_at', today.toISOString())
      todayWhatsapp = count || 0
    }

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
        totalConversations: whatsappConversations + webConversations,
        whatsappConversations,
        webConversations,
        todayConversations: todayWhatsapp + todayWeb,
        
        // Clients
        totalClients,
        
        // Connections
        whatsappSessions,
        webWidgets: widgetIds.length,
        
        // Needs Attention
        needsAttention: whatsappNeedsAttention + webNeedsAttention,
        whatsappNeedsAttention,
        webNeedsAttention,
        
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
