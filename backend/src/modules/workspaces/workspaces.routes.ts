import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'
import workspaceMembersRoutes from './workspace-members.routes'
import connectionLinksRoutes from './connection-links.routes'

const router = Router()

// Mount sub-routes
router.use('/', workspaceMembersRoutes)
router.use('/', connectionLinksRoutes)

// Plan limits for workspaces
const PLAN_LIMITS: Record<string, number> = {
  trial: 1,
  starter: 1,
  professional: 3,
  enterprise: 10
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

// Get user's plan from profile
async function getUserPlan(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single()
  
  return data?.subscription_tier || 'trial'
}

/**
 * GET /api/workspaces
 * List all workspaces for user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Get user's plan
    const plan = await getUserPlan(userId)
    const maxWorkspaces = PLAN_LIMITS[plan] || 1

    // Get owned workspaces
    const { data: ownedWorkspaces, error: ownedError } = await supabaseAdmin
      .from('workspaces')
      .select(`
        id,
        name,
        description,
        slug,
        logo_url,
        whatsapp_session_id,
        web_widget_id,
        white_label,
        access_token,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (ownedError) {
      console.error('Error fetching owned workspaces:', ownedError)
      return res.status(500).json({ success: false, error: 'Failed to fetch workspaces' })
    }

    // Get workspaces where user is a member
    const { data: memberWorkspaces } = await supabaseAdmin
      .from('workspace_members')
      .select(`
        role,
        permissions,
        workspaces (
          id,
          name,
          description,
          slug,
          logo_url,
          whatsapp_session_id,
          web_widget_id,
          white_label,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')

    // Format member workspaces
    const formattedMemberWorkspaces = (memberWorkspaces || [])
      .filter(m => m.workspaces)
      .map(m => ({
        ...(m.workspaces as any),
        member_role: m.role,
        member_permissions: m.permissions,
        is_member: true
      }))

    // Combine and dedupe (owned workspaces first)
    const ownedIds = new Set((ownedWorkspaces || []).map(w => w.id))
    const allWorkspaces = [
      ...(ownedWorkspaces || []).map(w => ({ ...w, is_owner: true })),
      ...formattedMemberWorkspaces.filter(w => !ownedIds.has(w.id))
    ]

    res.json({
      success: true,
      data: {
        workspaces: allWorkspaces,
        limits: {
          max: maxWorkspaces,
          used: ownedWorkspaces?.length || 0,
          canCreate: (ownedWorkspaces?.length || 0) < maxWorkspaces
        },
        plan
      }
    })
  } catch (error: any) {
    console.error('Error in GET /workspaces:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/workspaces/:id
 * Get single workspace
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id } = req.params

    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' })
    }

    res.json({ success: true, data: workspace })
  } catch (error: any) {
    console.error('Error in GET /workspaces/:id:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/workspaces
 * Create new workspace
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { name, description } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Workspace name is required' })
    }

    // Check plan limits
    const plan = await getUserPlan(userId)
    const maxWorkspaces = PLAN_LIMITS[plan] || 1

    const { count } = await supabaseAdmin
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if ((count || 0) >= maxWorkspaces) {
      return res.status(403).json({ 
        success: false,
        error: 'Workspace limit reached',
        message: `Your ${plan} plan allows ${maxWorkspaces} workspace${maxWorkspaces > 1 ? 's' : ''}. Upgrade to create more.`
      })
    }

    // Create workspace
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating workspace:', error)
      return res.status(500).json({ success: false, error: 'Failed to create workspace' })
    }

    res.status(201).json({ success: true, data: workspace })
  } catch (error: any) {
    console.error('Error in POST /workspaces:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/workspaces/:id
 * Update workspace
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id } = req.params
    const { name, description, whatsapp_session_id, web_widget_id, white_label, logo_url } = req.body

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (whatsapp_session_id !== undefined) updateData.whatsapp_session_id = whatsapp_session_id
    if (web_widget_id !== undefined) updateData.web_widget_id = web_widget_id
    if (white_label !== undefined) updateData.white_label = white_label
    if (logo_url !== undefined) updateData.logo_url = logo_url

    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating workspace:', error)
      return res.status(500).json({ success: false, error: 'Failed to update workspace' })
    }

    if (!workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' })
    }

    res.json({ success: true, data: workspace })
  } catch (error: any) {
    console.error('Error in PUT /workspaces/:id:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/workspaces/:id/connections
 * Get all connections data for a workspace in a single request
 * This optimizes loading by fetching everything at once
 */
router.get('/:id/connections', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id } = req.params

    // Verify workspace belongs to user
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (wsError || !workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' })
    }

    // Fetch all connections in parallel
    const [
      whatsappResult,
      widgetsResult,
      ecommerceResult,
      webhooksResult
    ] = await Promise.all([
      // WhatsApp accounts/sessions for this workspace
      supabaseAdmin
        .from('whatsapp_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', id)
        .order('created_at', { ascending: false }),
      
      // Chat widgets for this workspace
      supabaseAdmin
        .from('chat_widgets')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', id)
        .order('created_at', { ascending: false }),
      
      // E-commerce connections for this workspace
      supabaseAdmin
        .from('ecommerce_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', id)
        .order('created_at', { ascending: false }),
      
      // Webhooks for this workspace
      supabaseAdmin
        .from('webhooks')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', id)
        .order('created_at', { ascending: false })
    ])

    res.json({
      success: true,
      data: {
        workspace,
        whatsapp: {
          accounts: whatsappResult.data || [],
          sessions: whatsappResult.data || [] // Same table, accounts ARE sessions
        },
        widgets: widgetsResult.data || [],
        ecommerce: ecommerceResult.data || [],
        webhooks: webhooksResult.data || []
      }
    })
  } catch (error: any) {
    console.error('Error in GET /workspaces/:id/connections:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/workspaces/:id/chatbot
 * Get all chatbot configuration data for a workspace in a single request
 * This optimizes loading by fetching everything at once
 */
router.get('/:id/chatbot', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id } = req.params

    // Verify workspace belongs to user
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (wsError || !workspace) {
      return res.status(404).json({ success: false, error: 'Workspace not found' })
    }

    // Fetch all data in parallel
    const [
      sessionsResult,
      ecommerceResult,
      aiConfigResult,
      widgetsResult
    ] = await Promise.all([
      // WhatsApp sessions for this workspace
      supabaseAdmin
        .from('whatsapp_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', id)
        .order('created_at', { ascending: false }),
      
      // E-commerce connections for this workspace
      supabaseAdmin
        .from('ecommerce_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', id)
        .order('created_at', { ascending: false }),
      
      // AI config for this user (global, not per workspace)
      supabaseAdmin
        .from('ai_configs')
        .select('id, provider, model, has_api_key, created_at, updated_at')
        .eq('user_id', userId)
        .single(),
      
      // Chat widgets for this workspace
      supabaseAdmin
        .from('chat_widgets')
        .select('*')
        .eq('user_id', userId)
        .eq('workspace_id', id)
        .order('created_at', { ascending: false })
    ])

    const sessions = sessionsResult.data || []
    const ecommerceConnections = ecommerceResult.data || []
    const aiConfig = aiConfigResult.data || null
    const widgets = widgetsResult.data || []

    // Fetch chatbot configs for all sessions
    const sessionIds = sessions.map(s => s.session_id)
    let chatbotConfigs: any[] = []
    
    if (sessionIds.length > 0) {
      const { data: configs } = await supabaseAdmin
        .from('chatbot_configs')
        .select('*')
        .in('whatsapp_session_id', sessionIds)
      
      chatbotConfigs = configs || []
    }

    // Fetch web chatbot configs for all widgets
    const widgetIds = widgets.map(w => w.id)
    let webChatbotConfigs: any[] = []
    
    if (widgetIds.length > 0) {
      const { data: webConfigs } = await supabaseAdmin
        .from('web_chatbot_configs')
        .select('*')
        .in('widget_id', widgetIds)
      
      webChatbotConfigs = webConfigs || []
    }

    // Map configs by session_id for easy lookup
    const configsBySession: Record<string, any> = {}
    for (const config of chatbotConfigs) {
      configsBySession[config.whatsapp_session_id] = config
    }

    // Map web configs by widget_id for easy lookup
    const configsByWidget: Record<string, any> = {}
    for (const config of webChatbotConfigs) {
      configsByWidget[config.widget_id] = config
    }

    res.json({
      success: true,
      data: {
        workspace,
        sessions,
        ecommerceConnections,
        chatbotConfigs: configsBySession,
        aiConfig,
        widgets,
        webChatbotConfigs: configsByWidget
      }
    })
  } catch (error: any) {
    console.error('Error in GET /workspaces/:id/chatbot:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/workspaces/:id
 * Delete workspace
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id } = req.params

    // Check if this is the user's only workspace
    const { count } = await supabaseAdmin
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if ((count || 0) <= 1) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete last workspace',
        message: 'You must have at least one workspace'
      })
    }

    const { error } = await supabaseAdmin
      .from('workspaces')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting workspace:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete workspace' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /workspaces/:id:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
