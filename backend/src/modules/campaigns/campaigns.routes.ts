import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'

const router = Router()

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

// Send a campaign
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
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({ error: 'Campaign cannot be sent' })
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

    // Get clients based on filters
    let clientsQuery = supabaseAdmin
      .from('clients')
      .select('id, phone, email, full_name, whatsapp_name, company, tags, status, last_contact_at')
      .eq('workspace_id', campaign.workspace_id)

    // Apply filters
    const filters = campaign.filters || {}
    
    if (filters.status && filters.status.length > 0) {
      clientsQuery = clientsQuery.in('status', filters.status)
    }

    if (filters.tags && filters.tags.length > 0) {
      clientsQuery = clientsQuery.overlaps('tags', filters.tags)
    }

    if (filters.last_interaction_days && filters.last_interaction_days > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - filters.last_interaction_days)
      clientsQuery = clientsQuery.gte('last_contact_at', cutoffDate.toISOString())
    }

    const { data: clients, error: clientsError } = await clientsQuery

    if (clientsError) throw clientsError

    // Filter for email campaigns - only clients with email
    let recipients = clients || []
    if (campaign.type === 'email') {
      recipients = recipients.filter(c => c.email)
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients match the campaign filters' })
    }

    // Update campaign status to sending
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
        total_recipients: recipients.length
      })
      .eq('id', campaignId)

    // Create campaign recipients
    const recipientRecords = recipients.map(client => ({
      campaign_id: campaignId,
      client_id: client.id,
      status: 'pending'
    }))

    await supabaseAdmin
      .from('campaign_recipients')
      .insert(recipientRecords)

    // Start sending in background (simplified - in production use a queue)
    sendCampaignMessages(campaign, recipients).catch(console.error)

    return res.json({ 
      success: true, 
      message: 'Campaign sending started',
      total_recipients: recipients.length
    })
  } catch (error) {
    console.error('Error sending campaign:', error)
    return res.status(500).json({ error: 'Failed to send campaign' })
  }
})

// Helper function to send campaign messages
async function sendCampaignMessages(
  campaign: {
    id: string
    type: string
    message_template: string
    subject?: string
    workspace_id: string
  },
  recipients: Array<{
    id: string
    phone: string
    email?: string
    full_name?: string
    whatsapp_name?: string
    company?: string
  }>
) {
  // Get WhatsApp session for the workspace if it's a WhatsApp campaign
  let whatsappSession = null
  if (campaign.type === 'whatsapp') {
    const { data: session } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('session_id')
      .eq('workspace_id', campaign.workspace_id)
      .eq('status', 'connected')
      .single()
    
    whatsappSession = session?.session_id
  }

  let sentCount = 0
  let failedCount = 0

  for (const recipient of recipients) {
    try {
      // Replace template variables
      const name = recipient.full_name || recipient.whatsapp_name || 'Cliente'
      const message = campaign.message_template
        .replace(/\{\{nombre\}\}/gi, name)
        .replace(/\{\{empresa\}\}/gi, recipient.company || '')
        .replace(/\{\{telefono\}\}/gi, recipient.phone || '')

      if (campaign.type === 'whatsapp' && whatsappSession) {
        // Send WhatsApp message via the WhatsApp service
        // This would integrate with your existing WhatsApp sending logic
        // For now, we'll just mark as sent
        
        // TODO: Integrate with actual WhatsApp sending
        // await sendWhatsAppMessage(whatsappSession, recipient.phone, message)
        
        await supabaseAdmin
          .from('campaign_recipients')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign.id)
          .eq('client_id', recipient.id)

        sentCount++
      } else if (campaign.type === 'email' && recipient.email) {
        // Send email
        // TODO: Integrate with email sending service
        
        await supabaseAdmin
          .from('campaign_recipients')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign.id)
          .eq('client_id', recipient.id)

        sentCount++
      } else {
        throw new Error('No valid channel for recipient')
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Failed to send to ${recipient.id}:`, error)
      
      await supabaseAdmin
        .from('campaign_recipients')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('campaign_id', campaign.id)
        .eq('client_id', recipient.id)

      failedCount++
    }
  }

  // Update campaign as completed
  await supabaseAdmin
    .from('campaigns')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount
    })
    .eq('id', campaign.id)
}

export default router
