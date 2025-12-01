import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'
import { sendWorkspaceInvitationEmail } from '../../utils/email'

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

// Helper to check member permissions
async function getMemberPermissions(userId: string, workspaceId: string): Promise<{
  role: string | null
  permissions: Record<string, boolean>
}> {
  // First check if owner
  const isOwner = await isWorkspaceOwner(userId, workspaceId)
  if (isOwner) {
    return {
      role: 'owner',
      permissions: {
        dashboard: true,
        messages: true,
        clients: true,
        campaigns: true,
        settings: true,
        ai_costs: true
      }
    }
  }

  // Check member record
  const { data: member } = await supabaseAdmin
    .from('workspace_members')
    .select('role, permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!member) {
    return { role: null, permissions: {} }
  }

  return {
    role: member.role,
    permissions: member.permissions || {}
  }
}

// ==============================================
// WORKSPACE MEMBERS ROUTES
// ==============================================

/**
 * GET /api/workspaces/:workspaceId/members
 * List all members of a workspace
 */
router.get('/:workspaceId/members', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspaceId } = req.params

    // Check if user has access to this workspace
    const { role } = await getMemberPermissions(userId, workspaceId)
    if (!role) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // Get all members
    const { data: members, error } = await supabaseAdmin
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        permissions,
        access_token,
        invited_email,
        invited_at,
        joined_at,
        status,
        created_at
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch members' })
    }

    // Get user details for members with user_id
    const userIds = members?.filter(m => m.user_id).map(m => m.user_id) || []
    let userDetails: Record<string, { email: string; full_name?: string }> = {}

    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)

      if (users) {
        userDetails = users.reduce((acc, u: any) => {
          acc[u.id] = { email: u.email, full_name: u.full_name }
          return acc
        }, {} as Record<string, { email: string; full_name?: string }>)
      }
    }

    // Enrich members with user details
    const enrichedMembers = members?.map(m => ({
      ...m,
      user_email: m.user_id ? userDetails[m.user_id]?.email : m.invited_email,
      user_name: m.user_id ? userDetails[m.user_id]?.full_name : null,
      // Hide access token for non-owners
      access_token: role === 'owner' || role === 'admin' ? m.access_token : undefined
    }))

    res.json({ success: true, data: enrichedMembers })
  } catch (error: any) {
    console.error('Error in GET /members:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/workspaces/:workspaceId/members
 * Invite a new member to workspace
 */
router.post('/:workspaceId/members', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspaceId } = req.params
    const { email, role = 'agent', permissions, expires_in_days } = req.body

    // Only owners and admins can invite
    const { role: userRole } = await getMemberPermissions(userId, workspaceId)
    if (userRole !== 'owner' && userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only owners and admins can invite members' })
    }

    // Validate role
    const validRoles = ['admin', 'client', 'agent', 'viewer', 'custom']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' })
    }

    // Check if already invited
    const { data: existing } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('invited_email', email)
      .single()

    if (existing) {
      return res.status(400).json({ success: false, error: 'User already invited' })
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    // Calculate expiration
    const expiresAt = expires_in_days 
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      : null

    // Default permissions based on role
    // Note: settings: true means they can access Settings menu (profile + connections only for non-owners)
    const defaultPermissions: Record<string, Record<string, boolean>> = {
      admin: { dashboard: true, messages: true, clients: true, campaigns: true, settings: true, ai_costs: true },
      client: { dashboard: true, messages: true, clients: true, campaigns: true, settings: true, ai_costs: false },
      agent: { dashboard: true, messages: true, clients: false, campaigns: false, settings: true, ai_costs: false },
      viewer: { dashboard: true, messages: false, clients: true, campaigns: true, settings: true, ai_costs: false },
      custom: permissions || { dashboard: true, messages: true, clients: false, campaigns: false, settings: true, ai_costs: false }
    }

    // Create member record
    const { data: member, error } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: existingUser?.id || null,
        role,
        permissions: defaultPermissions[role],
        invited_email: email,
        invited_by: userId,
        token_expires_at: expiresAt,
        status: existingUser ? 'active' : 'pending',
        joined_at: existingUser ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating member:', error)
      return res.status(500).json({ success: false, error: 'Failed to invite member' })
    }

    // Get workspace name for email
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single()

    // Get inviter name
    const { data: inviterProfile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    // Send invitation email
    const accessLink = `${process.env.FRONTEND_URL}/invite/${member.access_token}`
    sendWorkspaceInvitationEmail(email, {
      workspace_name: workspace?.name || 'Workspace',
      inviter_name: inviterProfile?.full_name || inviterProfile?.email || undefined,
      role,
      access_link: accessLink
    }).catch(err => console.error('Failed to send invitation email:', err))

    res.json({ 
      success: true, 
      data: member,
      access_link: `${process.env.FRONTEND_URL}/w/${member.access_token}`
    })
  } catch (error: any) {
    console.error('Error in POST /members:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PATCH /api/workspaces/:workspaceId/members/:memberId
 * Update member role/permissions
 */
router.patch('/:workspaceId/members/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspaceId, memberId } = req.params
    const { role, permissions, status } = req.body

    // Only owners can update members
    const isOwner = await isWorkspaceOwner(userId, workspaceId)
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Only owners can update members' })
    }

    // Can't change owner role
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('id', memberId)
      .single()

    if (member?.role === 'owner') {
      return res.status(400).json({ success: false, error: 'Cannot modify owner' })
    }

    // Update member
    const updateData: Record<string, any> = {}
    if (role) updateData.role = role
    if (permissions) updateData.permissions = permissions
    if (status) updateData.status = status

    const { data: updated, error } = await supabaseAdmin
      .from('workspace_members')
      .update(updateData)
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      console.error('Error updating member:', error)
      return res.status(500).json({ success: false, error: 'Failed to update member' })
    }

    res.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error in PATCH /members:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/workspaces/:workspaceId/members/:memberId
 * Remove member from workspace
 */
router.delete('/:workspaceId/members/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspaceId, memberId } = req.params

    // Only owners can remove members
    const isOwner = await isWorkspaceOwner(userId, workspaceId)
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Only owners can remove members' })
    }

    // Can't remove owner
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('id', memberId)
      .single()

    if (member?.role === 'owner') {
      return res.status(400).json({ success: false, error: 'Cannot remove owner' })
    }

    // Delete member
    const { error } = await supabaseAdmin
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.error('Error deleting member:', error)
      return res.status(500).json({ success: false, error: 'Failed to remove member' })
    }

    res.json({ success: true, message: 'Member removed' })
  } catch (error: any) {
    console.error('Error in DELETE /members:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/workspaces/:workspaceId/members/:memberId/regenerate-token
 * Regenerate access token for a member
 */
router.post('/:workspaceId/members/:memberId/regenerate-token', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspaceId, memberId } = req.params

    // Only owners can regenerate tokens
    const isOwner = await isWorkspaceOwner(userId, workspaceId)
    if (!isOwner) {
      return res.status(403).json({ success: false, error: 'Only owners can regenerate tokens' })
    }

    // Generate new token
    const newToken = crypto.randomBytes(24).toString('hex')

    const { data: updated, error } = await supabaseAdmin
      .from('workspace_members')
      .update({ access_token: newToken })
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) {
      console.error('Error regenerating token:', error)
      return res.status(500).json({ success: false, error: 'Failed to regenerate token' })
    }

    res.json({ 
      success: true, 
      data: updated,
      access_link: `${process.env.FRONTEND_URL}/w/${newToken}`
    })
  } catch (error: any) {
    console.error('Error in POST /regenerate-token:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/workspaces/access/:token
 * Access workspace via token (for clients)
 */
router.get('/access/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    // Find member by access token
    const { data: member, error } = await supabaseAdmin
      .from('workspace_members')
      .select(`
        id,
        workspace_id,
        role,
        permissions,
        status,
        token_expires_at,
        workspaces (
          id,
          name,
          logo_url,
          white_label
        )
      `)
      .eq('access_token', token)
      .single()

    if (error || !member) {
      return res.status(404).json({ success: false, error: 'Invalid access link' })
    }

    // Check if expired
    if (member.token_expires_at && new Date(member.token_expires_at) < new Date()) {
      return res.status(403).json({ success: false, error: 'Access link has expired' })
    }

    // Check status
    if (member.status !== 'active' && member.status !== 'pending') {
      return res.status(403).json({ success: false, error: 'Access has been revoked' })
    }

    // Update status to active if pending
    if (member.status === 'pending') {
      await supabaseAdmin
        .from('workspace_members')
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq('id', member.id)
    }

    res.json({ 
      success: true, 
      data: {
        member_id: member.id,
        workspace_id: member.workspace_id,
        workspace: member.workspaces,
        role: member.role,
        permissions: member.permissions
      }
    })
  } catch (error: any) {
    console.error('Error in GET /access/:token:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
