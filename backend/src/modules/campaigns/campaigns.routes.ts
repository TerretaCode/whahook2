import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import { campaignService } from './campaigns.service'

const router = Router()

// Default send settings for anti-ban
const DEFAULT_SEND_SETTINGS = {
  min_delay_seconds: 30,
  max_delay_seconds: 120,
  batch_size: 10,
  batch_pause_minutes: 5,
  randomize_message: true,
  daily_limit: 100,
  respect_quiet_hours: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00'
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

// Get all campaigns for a workspace
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const workspaceId = req.query.workspace_id as string

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspace_id is required' })
    }

    // Verify user has access to workspace
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single()

    if (!member) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.json(campaigns || [])
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return res.status(500).json({ error: 'Failed to fetch campaigns' })
  }
})

// Create a new campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { 
      workspace_id, 
      name, 
      description, 
      type, 
      message_template, 
      subject,
      scheduled_at,
      filters,
      total_recipients 
    } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!workspace_id || !name || !message_template || !type) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Verify user has access to workspace
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', userId)
      .single()

    if (!member) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Determine status based on scheduled_at
    const status = scheduled_at ? 'scheduled' : 'draft'

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        workspace_id,
        user_id: userId,
        name,
        description,
        type,
        message_template,
        subject,
        scheduled_at: scheduled_at || null,
        status,
        filters: filters || {},
        total_recipients: total_recipients || 0
      })
      .select()
      .single()

    if (error) throw error

    return res.status(201).json(campaign)
  } catch (error) {
    console.error('Error creating campaign:', error)
    return res.status(500).json({ error: 'Failed to create campaign' })
  }
})

// Get a single campaign
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify user has access to workspace
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', campaign.workspace_id)
      .eq('user_id', userId)
      .single()

    if (!member) {
      return res.status(403).json({ error: 'Access denied' })
    }

    return res.json(campaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return res.status(500).json({ error: 'Failed to fetch campaign' })
  }
})

// Update a campaign
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id
    const updates = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get campaign first
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('workspace_id, status')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Only allow updates to draft campaigns
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Can only update draft campaigns' })
    }

    // Verify user has access to workspace
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', campaign.workspace_id)
      .eq('user_id', userId)
      .single()

    if (!member) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error

    return res.json(updated)
  } catch (error) {
    console.error('Error updating campaign:', error)
    return res.status(500).json({ error: 'Failed to update campaign' })
  }
})

// Delete a campaign
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get campaign first
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('workspace_id, status')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Only allow deletion of draft or cancelled campaigns
    if (!['draft', 'cancelled'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Can only delete draft or cancelled campaigns' })
    }

    // Verify user has access to workspace
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', campaign.workspace_id)
      .eq('user_id', userId)
      .single()

    if (!member) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { error } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('id', campaignId)

    if (error) throw error

    return res.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return res.status(500).json({ error: 'Failed to delete campaign' })
  }
})

// Send/Start a campaign (uses queue system with anti-ban features)
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('workspace_id, status')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify user has access to workspace
    const { data: member } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', campaign.workspace_id)
      .eq('user_id', userId)
      .single()

    if (!member) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Start campaign using the service (handles queue, delays, randomization)
    const result = await campaignService.startCampaign(campaignId)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    return res.json({ 
      success: true, 
      message: 'Campaign queued for sending with anti-ban protection',
      total_recipients: result.queued
    })
  } catch (error) {
    console.error('Error sending campaign:', error)
    return res.status(500).json({ error: 'Failed to send campaign' })
  }
})

// Pause a campaign
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const success = await campaignService.pauseCampaign(campaignId)
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to pause campaign' })
    }

    return res.json({ success: true, message: 'Campaign paused' })
  } catch (error) {
    console.error('Error pausing campaign:', error)
    return res.status(500).json({ error: 'Failed to pause campaign' })
  }
})

// Resume a paused campaign
router.post('/:id/resume', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const success = await campaignService.resumeCampaign(campaignId)
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to resume campaign' })
    }

    return res.json({ success: true, message: 'Campaign resumed' })
  } catch (error) {
    console.error('Error resuming campaign:', error)
    return res.status(500).json({ error: 'Failed to resume campaign' })
  }
})

// Cancel a campaign
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const success = await campaignService.cancelCampaign(campaignId)
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to cancel campaign' })
    }

    return res.json({ success: true, message: 'Campaign cancelled' })
  } catch (error) {
    console.error('Error cancelling campaign:', error)
    return res.status(500).json({ error: 'Failed to cancel campaign' })
  }
})

// Get campaign statistics
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const stats = await campaignService.getCampaignStats(campaignId)
    
    return res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Error fetching campaign stats:', error)
    return res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Preview recipients for a campaign (before sending)
router.post('/:id/preview', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const campaignId = req.params.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get campaign
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('workspace_id, filters')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Get matching clients
    const clients = await campaignService.getMatchingClients(
      campaign.workspace_id,
      campaign.filters || {}
    )

    return res.json({ 
      success: true, 
      data: {
        count: clients.length,
        preview: clients.slice(0, 10).map(c => ({
          id: c.id,
          name: c.full_name || c.whatsapp_name,
          phone: c.phone,
          status: c.status,
          source: c.source
        }))
      }
    })
  } catch (error) {
    console.error('Error previewing campaign:', error)
    return res.status(500).json({ error: 'Failed to preview campaign' })
  }
})

export default router
