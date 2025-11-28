import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'

const router = Router()

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

    // Get workspaces with connection info
    const { data: workspacesList, error } = await supabaseAdmin
      .from('workspaces')
      .select(`
        id,
        name,
        description,
        whatsapp_session_id,
        web_widget_id,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching workspaces:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch workspaces' })
    }

    res.json({
      success: true,
      data: {
        workspaces: workspacesList || [],
        limits: {
          max: maxWorkspaces,
          used: workspacesList?.length || 0,
          canCreate: (workspacesList?.length || 0) < maxWorkspaces
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
    const { name, description, whatsapp_session_id, web_widget_id } = req.body

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (whatsapp_session_id !== undefined) updateData.whatsapp_session_id = whatsapp_session_id
    if (web_widget_id !== undefined) updateData.web_widget_id = web_widget_id

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
