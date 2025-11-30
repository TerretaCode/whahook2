import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'

const router = Router()

// Helper to get user ID from token
async function getUserIdFromToken(req: Request): Promise<string | null> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null
    return user.id
  } catch {
    return null
  }
}

// Helper to check if user is workspace owner
async function isWorkspaceOwner(userId: string, workspaceId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', userId)
    .single()
  
  return !!data
}

// ==============================================
// CONNECTION LINKS ROUTES (Remote QR)
// ==============================================

/**
 * GET /api/workspaces/:workspaceId/connection-links
 * List all connection links for a workspace
 */
router.get('/:workspaceId/connection-links', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspaceId } = req.params

    // Only owners can view connection links
    const isOwner = await isWorkspaceOwner(userId, workspaceId)
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const { data: links, error } = await supabaseAdmin
      .from('workspace_connection_links')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching connection links:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch connection links' })
    }

    res.json({ success: true, data: links })
  } catch (error: any) {
    console.error('Error in GET /connection-links:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/workspaces/:workspaceId/connection-links
 * Create a new connection link for remote QR
 */
router.post('/:workspaceId/connection-links', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspaceId } = req.params
    const { expires_in_hours = 24, label } = req.body

    // Only owners can create connection links
    const isOwner = await isWorkspaceOwner(userId, workspaceId)
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Only owners can create connection links' })
    }

    // Check if workspace already has a WhatsApp connection
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('whatsapp_session_id')
      .eq('id', workspaceId)
      .single()

    if (workspace?.whatsapp_session_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Workspace already has a WhatsApp connection. Delete it first to create a new one.' 
      })
    }

    // Check for existing pending links
    const { data: existingLinks } = await supabaseAdmin
      .from('workspace_connection_links')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')

    if (existingLinks && existingLinks.length > 0) {
      // Expire old pending links
      await supabaseAdmin
        .from('workspace_connection_links')
        .update({ status: 'expired' })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
    }

    // Create WhatsApp account placeholder
    const { data: account, error: accountError } = await supabaseAdmin
      .from('whatsapp_accounts')
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        label: label || 'Remote Connection',
        status: 'pending'
      })
      .select()
      .single()

    if (accountError) {
      console.error('Error creating WhatsApp account:', accountError)
      return res.status(500).json({ success: false, error: 'Failed to create WhatsApp account' })
    }

    // Generate unique token
    const token = crypto.randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)

    // Create connection link
    const { data: link, error } = await supabaseAdmin
      .from('workspace_connection_links')
      .insert({
        workspace_id: workspaceId,
        token,
        whatsapp_account_id: account.id,
        expires_at: expiresAt.toISOString(),
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating connection link:', error)
      // Cleanup account
      await supabaseAdmin.from('whatsapp_accounts').delete().eq('id', account.id)
      return res.status(500).json({ success: false, error: 'Failed to create connection link' })
    }

    const connectionUrl = `${process.env.FRONTEND_URL}/connect/${token}`

    res.json({ 
      success: true, 
      data: {
        ...link,
        connection_url: connectionUrl
      }
    })
  } catch (error: any) {
    console.error('Error in POST /connection-links:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/connect/:token
 * Public endpoint - Get connection link details for QR page
 */
router.get('/connect/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    const { data: link, error } = await supabaseAdmin
      .from('workspace_connection_links')
      .select(`
        id,
        status,
        qr_code,
        qr_generated_at,
        expires_at,
        connected_phone,
        workspaces (
          id,
          name,
          logo_url,
          white_label
        )
      `)
      .eq('token', token)
      .single()

    if (error || !link) {
      return res.status(404).json({ success: false, error: 'Connection link not found' })
    }

    // Check if expired
    if (new Date(link.expires_at) < new Date()) {
      await supabaseAdmin
        .from('workspace_connection_links')
        .update({ status: 'expired' })
        .eq('id', link.id)
      
      return res.status(410).json({ success: false, error: 'Connection link has expired' })
    }

    // Check status
    if (link.status === 'connected') {
      return res.json({ 
        success: true, 
        data: {
          status: 'connected',
          phone: link.connected_phone,
          workspace: link.workspaces
        }
      })
    }

    if (link.status === 'expired' || link.status === 'failed') {
      return res.status(410).json({ success: false, error: 'Connection link is no longer valid' })
    }

    res.json({ 
      success: true, 
      data: {
        status: link.status,
        qr_code: link.qr_code,
        qr_generated_at: link.qr_generated_at,
        expires_at: link.expires_at,
        workspace: link.workspaces
      }
    })
  } catch (error: any) {
    console.error('Error in GET /connect/:token:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/connect/:token/start
 * Start WhatsApp session for connection link
 */
router.post('/connect/:token/start', async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    const { data: link, error } = await supabaseAdmin
      .from('workspace_connection_links')
      .select(`
        id,
        workspace_id,
        whatsapp_account_id,
        status,
        expires_at,
        workspaces (
          user_id
        )
      `)
      .eq('token', token)
      .single()

    if (error || !link) {
      return res.status(404).json({ success: false, error: 'Connection link not found' })
    }

    // Check if expired
    if (new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ success: false, error: 'Connection link has expired' })
    }

    // Check status
    if (link.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Connection is already ${link.status}` })
    }

    // Update status to connecting
    await supabaseAdmin
      .from('workspace_connection_links')
      .update({ status: 'connecting' })
      .eq('id', link.id)

    // The actual session creation will be handled by the WhatsApp service
    // This endpoint just marks the link as ready to connect
    // The frontend will then call the WhatsApp session creation endpoint

    res.json({ 
      success: true, 
      data: {
        link_id: link.id,
        account_id: link.whatsapp_account_id,
        workspace_id: link.workspace_id,
        user_id: (link.workspaces as any)?.user_id
      }
    })
  } catch (error: any) {
    console.error('Error in POST /connect/:token/start:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/workspaces/:workspaceId/connection-links/:linkId
 * Delete/expire a connection link
 */
router.delete('/:workspaceId/connection-links/:linkId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspaceId, linkId } = req.params

    // Only owners can delete connection links
    const isOwner = await isWorkspaceOwner(userId, workspaceId)
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // Get link to check if we need to cleanup WhatsApp account
    const { data: link } = await supabaseAdmin
      .from('workspace_connection_links')
      .select('whatsapp_account_id, status')
      .eq('id', linkId)
      .eq('workspace_id', workspaceId)
      .single()

    if (!link) {
      return res.status(404).json({ success: false, error: 'Connection link not found' })
    }

    // If not connected, delete the placeholder WhatsApp account
    if (link.status !== 'connected' && link.whatsapp_account_id) {
      await supabaseAdmin
        .from('whatsapp_accounts')
        .delete()
        .eq('id', link.whatsapp_account_id)
    }

    // Delete the link
    const { error } = await supabaseAdmin
      .from('workspace_connection_links')
      .delete()
      .eq('id', linkId)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Error deleting connection link:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete connection link' })
    }

    res.json({ success: true, message: 'Connection link deleted' })
  } catch (error: any) {
    console.error('Error in DELETE /connection-links:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
