import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'

const router = Router()

/**
 * GET /api/invitations/:token
 * Get invitation details by token (public endpoint)
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params

    // Find member by access_token
    const { data: member, error } = await supabaseAdmin
      .from('workspace_members')
      .select(`
        id,
        workspace_id,
        role,
        invited_email,
        invited_by,
        status,
        token_expires_at,
        workspaces (
          id,
          name,
          logo_url
        )
      `)
      .eq('access_token', token)
      .single()

    if (error || !member) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invitation not found' 
      })
    }

    // Check if expired
    if (member.token_expires_at && new Date(member.token_expires_at) < new Date()) {
      return res.json({
        success: true,
        data: {
          status: 'expired'
        }
      })
    }

    // Get inviter name
    let inviterName: string | undefined
    if (member.invited_by) {
      const { data: inviter } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', member.invited_by)
        .single()
      
      inviterName = inviter?.full_name || inviter?.email || undefined
    }

    const workspace = member.workspaces as any

    res.json({
      success: true,
      data: {
        member_id: member.id,
        workspace_id: member.workspace_id,
        workspace_name: workspace?.name || 'Workspace',
        workspace_logo: workspace?.logo_url,
        email: member.invited_email,
        role: member.role,
        inviter_name: inviterName,
        status: member.status
      }
    })
  } catch (error: any) {
    console.error('Error in GET /invitations/:token:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/invitations/:token/accept
 * Accept invitation and link user_id
 */
router.post('/:token/accept', async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const { user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id is required' 
      })
    }

    // Find member by access_token
    const { data: member, error: findError } = await supabaseAdmin
      .from('workspace_members')
      .select('id, status, invited_email, token_expires_at')
      .eq('access_token', token)
      .single()

    if (findError || !member) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invitation not found' 
      })
    }

    // Check if already accepted
    if (member.status === 'active') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invitation already accepted' 
      })
    }

    // Check if expired
    if (member.token_expires_at && new Date(member.token_expires_at) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invitation has expired' 
      })
    }

    // Update member with user_id and set status to active
    const { error: updateError } = await supabaseAdmin
      .from('workspace_members')
      .update({
        user_id,
        status: 'active',
        joined_at: new Date().toISOString()
      })
      .eq('id', member.id)

    if (updateError) {
      console.error('Error updating member:', updateError)
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to accept invitation' 
      })
    }

    // Get workspace_id for the invitation
    const { data: memberWithWorkspace } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id')
      .eq('id', member.id)
      .single()

    // Update or create profile for the invited user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_tier')
      .eq('id', user_id)
      .single()

    if (existingProfile) {
      // Update existing profile to be a member (no own plan)
      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_tier: 'member',
          subscription_status: 'active',
          trial_ends_at: null,
          is_invited_user: true,
          invited_to_workspace_id: memberWithWorkspace?.workspace_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id)
    } else {
      // Create profile for the new invited user
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: user_id,
          email: member.invited_email,
          subscription_tier: 'member',
          subscription_status: 'active',
          trial_ends_at: null,
          is_invited_user: true,
          invited_to_workspace_id: memberWithWorkspace?.workspace_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    res.json({ 
      success: true, 
      message: 'Invitation accepted successfully' 
    })
  } catch (error: any) {
    console.error('Error in POST /invitations/:token/accept:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
