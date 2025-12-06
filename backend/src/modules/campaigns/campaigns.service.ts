/**
 * Campaign Service
 * 
 * Professional marketing campaign system with anti-ban features:
 * - Message randomization to avoid spam detection
 * - Delayed sending with random intervals
 * - Batch processing with pauses
 * - Daily limits and quiet hours
 * - Personalization with variables
 */

import { supabaseAdmin } from '../../config/supabase'
import { whatsappService } from '../whatsapp/whatsapp.service'

// Types
interface SendSettings {
  min_delay_seconds: number
  max_delay_seconds: number
  batch_size: number
  batch_pause_minutes: number
  randomize_message: boolean
  daily_limit: number
  respect_quiet_hours: boolean
  quiet_hours_start: string
  quiet_hours_end: string
}

interface Campaign {
  id: string
  workspace_id: string
  user_id: string
  name: string
  type: 'whatsapp' | 'email'
  status: string
  message_template: string
  message_variations: string[]
  send_settings: SendSettings
  personalization_fields: string[]
  filters: Record<string, any>
  total_recipients: number
  sent_count: number
  daily_sent_count: number
  scheduled_at: string | null
}

interface Client {
  id: string
  phone: string
  email: string | null
  full_name: string | null
  whatsapp_name: string | null
  company: string | null
  tags: string[]
  status: string
  source: string
  purchase_intent: number | null
  satisfaction: string | null
  language: string | null
}

interface QueueItem {
  id: string
  campaign_id: string
  recipient_id: string
  workspace_id: string
  message_content: string
  recipient_phone: string
  recipient_name: string | null
  scheduled_at: string
  status: string
  retry_count: number
}

// Default send settings
const DEFAULT_SEND_SETTINGS: SendSettings = {
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

// Synonyms for message randomization (Spanish and English)
const SYNONYMS: Record<string, string[]> = {
  // Spanish
  'hola': ['hola', 'hey', 'buenas', 'saludos', 'qué tal'],
  'gracias': ['gracias', 'muchas gracias', 'te agradezco', 'agradecido'],
  'por favor': ['por favor', 'te pido', 'si puedes', 'cuando puedas'],
  'información': ['información', 'info', 'detalles', 'datos'],
  'oferta': ['oferta', 'promoción', 'descuento', 'oportunidad'],
  'producto': ['producto', 'artículo', 'item'],
  'servicio': ['servicio', 'solución', 'ayuda'],
  'contactar': ['contactar', 'comunicarte', 'escribirnos', 'llamarnos'],
  'disponible': ['disponible', 'a tu disposición', 'listo para ti'],
  'excelente': ['excelente', 'genial', 'fantástico', 'increíble'],
  // English
  'hello': ['hello', 'hi', 'hey', 'greetings'],
  'thanks': ['thanks', 'thank you', 'appreciate it', 'grateful'],
  'please': ['please', 'kindly', 'if you could'],
  'information': ['information', 'info', 'details'],
  'offer': ['offer', 'deal', 'promotion', 'discount'],
  'product': ['product', 'item', 'article'],
  'service': ['service', 'solution', 'help'],
  'contact': ['contact', 'reach out', 'get in touch'],
  'available': ['available', 'ready', 'at your service'],
  'excellent': ['excellent', 'great', 'amazing', 'fantastic']
}

// Greeting variations
const GREETINGS = {
  es: ['¡Hola', 'Hola', 'Hey', 'Buenas', 'Saludos', 'Qué tal'],
  en: ['Hello', 'Hi', 'Hey', 'Greetings', 'Good day']
}

// Closing variations
const CLOSINGS = {
  es: ['Saludos', 'Un abrazo', 'Hasta pronto', 'Quedamos atentos', 'Estamos para servirte'],
  en: ['Best regards', 'Cheers', 'Talk soon', 'Looking forward', 'At your service']
}

class CampaignService {
  private processingCampaigns: Set<string> = new Set()
  private queueProcessor: NodeJS.Timeout | null = null

  /**
   * Start the queue processor
   */
  startQueueProcessor(): void {
    if (this.queueProcessor) return

    console.log('🚀 [CAMPAIGNS] Starting queue processor')
    
    // Process queue every 10 seconds
    this.queueProcessor = setInterval(() => {
      this.processQueue()
    }, 10000)
  }

  /**
   * Stop the queue processor
   */
  stopQueueProcessor(): void {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor)
      this.queueProcessor = null
      console.log('🛑 [CAMPAIGNS] Queue processor stopped')
    }
  }

  /**
   * Process pending queue items
   */
  private async processQueue(): Promise<void> {
    try {
      // Get pending items that are due
      const { data: items, error } = await supabaseAdmin
        .from('campaign_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_at', { ascending: true })
        .limit(5)

      if (error || !items?.length) return

      for (const item of items) {
        await this.processQueueItem(item as QueueItem)
      }
    } catch (error) {
      console.error('❌ [CAMPAIGNS] Queue processing error:', error)
    }
  }

  /**
   * Process a single queue item
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    try {
      // Mark as processing
      await supabaseAdmin
        .from('campaign_queue')
        .update({ 
          status: 'processing',
          processing_started_at: new Date().toISOString()
        })
        .eq('id', item.id)

      // Check if campaign is still active
      const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('status, send_settings, daily_sent_count')
        .eq('id', item.campaign_id)
        .single()

      if (!campaign || campaign.status !== 'sending') {
        await this.updateQueueStatus(item.id, 'cancelled', 'Campaign not active')
        return
      }

      // Check daily limit
      const settings = campaign.send_settings as SendSettings
      if (campaign.daily_sent_count >= settings.daily_limit) {
        console.log(`⏸️ [CAMPAIGNS] Daily limit reached for campaign ${item.campaign_id}`)
        await this.updateQueueStatus(item.id, 'pending', null) // Re-queue for tomorrow
        return
      }

      // Check quiet hours
      if (settings.respect_quiet_hours && this.isQuietHours(settings)) {
        console.log(`🌙 [CAMPAIGNS] Quiet hours active, skipping`)
        await this.updateQueueStatus(item.id, 'pending', null)
        return
      }

      // Send the message
      const success = await this.sendWhatsAppMessage(
        item.workspace_id,
        item.recipient_phone,
        item.message_content
      )

      if (success) {
        await this.updateQueueStatus(item.id, 'sent')
        await this.updateRecipientStatus(item.recipient_id, 'sent', item.message_content)
        await this.incrementCampaignCount(item.campaign_id)
        console.log(`✅ [CAMPAIGNS] Sent to ${item.recipient_phone}`)
      } else {
        await this.handleSendFailure(item)
      }

    } catch (error: any) {
      console.error(`❌ [CAMPAIGNS] Error processing item ${item.id}:`, error)
      await this.handleSendFailure(item, error.message)
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(settings: SendSettings): boolean {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute

    const [startHour, startMin] = settings.quiet_hours_start.split(':').map(Number)
    const [endHour, endMin] = settings.quiet_hours_end.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime > endTime) {
      // Quiet hours span midnight (e.g., 22:00 - 08:00)
      return currentTime >= startTime || currentTime < endTime
    } else {
      return currentTime >= startTime && currentTime < endTime
    }
  }

  /**
   * Send WhatsApp message via the WhatsApp service
   */
  private async sendWhatsAppMessage(
    workspaceId: string,
    phone: string,
    message: string
  ): Promise<boolean> {
    try {
      // Get the WhatsApp session for this workspace
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('whatsapp_session_id')
        .eq('id', workspaceId)
        .single()

      if (!workspace?.whatsapp_session_id) {
        console.error(`❌ [CAMPAIGNS] No WhatsApp session for workspace ${workspaceId}`)
        return false
      }

      // Send via WhatsApp service
      await whatsappService.sendMessage(
        workspace.whatsapp_session_id,
        phone,
        message
      )

      return true
    } catch (error) {
      console.error(`❌ [CAMPAIGNS] WhatsApp send error:`, error)
      return false
    }
  }

  /**
   * Handle send failure with retry logic
   */
  private async handleSendFailure(item: QueueItem, errorMessage?: string): Promise<void> {
    const maxRetries = 3
    
    if (item.retry_count < maxRetries) {
      // Schedule retry with exponential backoff
      const delayMinutes = Math.pow(2, item.retry_count) * 5 // 5, 10, 20 minutes
      const nextRetry = new Date(Date.now() + delayMinutes * 60 * 1000)

      await supabaseAdmin
        .from('campaign_queue')
        .update({
          status: 'pending',
          retry_count: item.retry_count + 1,
          scheduled_at: nextRetry.toISOString(),
          error_message: errorMessage
        })
        .eq('id', item.id)

      console.log(`🔄 [CAMPAIGNS] Retry scheduled for ${item.recipient_phone} in ${delayMinutes} minutes`)
    } else {
      await this.updateQueueStatus(item.id, 'failed', errorMessage || 'Max retries exceeded')
      await this.updateRecipientStatus(item.recipient_id, 'failed', null, errorMessage)
    }
  }

  /**
   * Update queue item status
   */
  private async updateQueueStatus(
    id: string, 
    status: string, 
    errorMessage?: string | null
  ): Promise<void> {
    const update: Record<string, any> = { status }
    if (status === 'sent' || status === 'failed') {
      update.completed_at = new Date().toISOString()
    }
    if (errorMessage !== undefined) {
      update.error_message = errorMessage
    }

    await supabaseAdmin
      .from('campaign_queue')
      .update(update)
      .eq('id', id)
  }

  /**
   * Update recipient status
   */
  private async updateRecipientStatus(
    id: string,
    status: string,
    actualMessage?: string | null,
    errorMessage?: string | null
  ): Promise<void> {
    const update: Record<string, any> = { status }
    
    if (status === 'sent') {
      update.sent_at = new Date().toISOString()
      if (actualMessage) update.actual_message = actualMessage
    }
    if (errorMessage) {
      update.error_message = errorMessage
    }

    await supabaseAdmin
      .from('campaign_recipients')
      .update(update)
      .eq('id', id)
  }

  /**
   * Increment campaign sent count
   */
  private async incrementCampaignCount(campaignId: string): Promise<void> {
    await supabaseAdmin.rpc('increment_campaign_sent_count', {
      p_campaign_id: campaignId
    })
  }

  /**
   * Randomize message content to avoid spam detection
   */
  randomizeMessage(
    template: string,
    variations: string[],
    client: Client,
    personalizationFields: string[]
  ): string {
    // 1. Pick base message (template or random variation)
    let message = template
    if (variations.length > 0 && Math.random() > 0.5) {
      message = variations[Math.floor(Math.random() * variations.length)]
    }

    // 2. Replace personalization variables
    const name = client.full_name || client.whatsapp_name || ''
    const firstName = name.split(' ')[0] || ''
    
    message = message
      .replace(/\{name\}/gi, name)
      .replace(/\{first_name\}/gi, firstName)
      .replace(/\{company\}/gi, client.company || '')
      .replace(/\{phone\}/gi, client.phone || '')
      .replace(/\{email\}/gi, client.email || '')

    // 3. Randomize synonyms
    for (const [word, synonyms] of Object.entries(SYNONYMS)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      if (regex.test(message)) {
        const randomSynonym = synonyms[Math.floor(Math.random() * synonyms.length)]
        message = message.replace(regex, randomSynonym)
      }
    }

    // 4. Add random variations
    message = this.addRandomVariations(message)

    return message.trim()
  }

  /**
   * Add subtle random variations to message
   */
  private addRandomVariations(message: string): string {
    // Random punctuation variations
    if (Math.random() > 0.7) {
      message = message.replace(/!$/, '.')
    }
    if (Math.random() > 0.8) {
      message = message.replace(/\.$/, '!')
    }

    // Random emoji additions (if message doesn't have emojis)
    const hasEmoji = /[\u{1F600}-\u{1F64F}]/u.test(message)
    if (!hasEmoji && Math.random() > 0.7) {
      const emojis = ['👋', '😊', '🙂', '✨', '👍']
      const emoji = emojis[Math.floor(Math.random() * emojis.length)]
      if (Math.random() > 0.5) {
        message = emoji + ' ' + message
      } else {
        message = message + ' ' + emoji
      }
    }

    // Random line break variations
    if (Math.random() > 0.6) {
      message = message.replace(/\. /g, '.\n')
    }

    return message
  }

  /**
   * Calculate random delay between messages
   */
  calculateDelay(settings: SendSettings): number {
    const min = settings.min_delay_seconds * 1000
    const max = settings.max_delay_seconds * 1000
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Start a campaign - populate queue with recipients
   */
  async startCampaign(campaignId: string): Promise<{ success: boolean; error?: string; queued?: number }> {
    try {
      // Get campaign
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError || !campaign) {
        return { success: false, error: 'Campaign not found' }
      }

      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return { success: false, error: 'Campaign cannot be started' }
      }

      // Get matching clients
      const clients = await this.getMatchingClients(
        campaign.workspace_id,
        campaign.filters
      )

      if (clients.length === 0) {
        return { success: false, error: 'No matching recipients found' }
      }

      // Create recipients and queue items
      const settings = { ...DEFAULT_SEND_SETTINGS, ...campaign.send_settings } as SendSettings
      let scheduledTime = new Date()
      let batchCount = 0

      for (const client of clients) {
        // Create recipient record
        const { data: recipient, error: recipientError } = await supabaseAdmin
          .from('campaign_recipients')
          .insert({
            campaign_id: campaignId,
            client_id: client.id,
            status: 'pending'
          })
          .select('id')
          .single()

        if (recipientError) continue

        // Generate randomized message
        const message = this.randomizeMessage(
          campaign.message_template,
          campaign.message_variations || [],
          client,
          campaign.personalization_fields || []
        )

        // Add to queue with scheduled time
        await supabaseAdmin
          .from('campaign_queue')
          .insert({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            workspace_id: campaign.workspace_id,
            message_content: message,
            recipient_phone: client.phone,
            recipient_name: client.full_name || client.whatsapp_name,
            scheduled_at: scheduledTime.toISOString(),
            priority: campaign.priority || 5
          })

        // Calculate next send time
        batchCount++
        if (batchCount >= settings.batch_size) {
          // Add batch pause
          scheduledTime = new Date(scheduledTime.getTime() + settings.batch_pause_minutes * 60 * 1000)
          batchCount = 0
        } else {
          // Add random delay
          scheduledTime = new Date(scheduledTime.getTime() + this.calculateDelay(settings))
        }
      }

      // Update campaign status
      await supabaseAdmin
        .from('campaigns')
        .update({
          status: 'sending',
          started_at: new Date().toISOString(),
          total_recipients: clients.length
        })
        .eq('id', campaignId)

      console.log(`🚀 [CAMPAIGNS] Started campaign ${campaignId} with ${clients.length} recipients`)
      
      return { success: true, queued: clients.length }

    } catch (error: any) {
      console.error('❌ [CAMPAIGNS] Start campaign error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status: 'paused' })
      .eq('id', campaignId)

    return !error
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId)
      .eq('status', 'paused')

    return !error
  }

  /**
   * Cancel a campaign
   */
  async cancelCampaign(campaignId: string): Promise<boolean> {
    // Update campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'cancelled' })
      .eq('id', campaignId)

    // Cancel pending queue items
    await supabaseAdmin
      .from('campaign_queue')
      .update({ status: 'cancelled' })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    return true
  }

  /**
   * Get clients matching campaign filters
   */
  async getMatchingClients(
    workspaceId: string,
    filters: Record<string, any>
  ): Promise<Client[]> {
    let query = supabaseAdmin
      .from('clients')
      .select('*')
      .eq('workspace_id', workspaceId)
      .not('phone', 'is', null)

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.source?.length) {
      query = query.in('source', filters.source)
    }

    if (filters.tags?.length) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.satisfaction?.length) {
      query = query.in('satisfaction', filters.satisfaction)
    }

    if (filters.language?.length) {
      query = query.in('language', filters.language)
    }

    if (filters.purchase_intent_min) {
      query = query.gte('purchase_intent', filters.purchase_intent_min)
    }

    if (filters.purchase_intent_max) {
      query = query.lte('purchase_intent', filters.purchase_intent_max)
    }

    if (filters.last_contact_days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - filters.last_contact_days)
      query = query.gte('last_contact_at', cutoffDate.toISOString())
    }

    if (filters.has_email) {
      query = query.not('email', 'is', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ [CAMPAIGNS] Error fetching clients:', error)
      return []
    }

    return data || []
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<Record<string, any>> {
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!campaign) return {}

    const { data: queueStats } = await supabaseAdmin
      .from('campaign_queue')
      .select('status')
      .eq('campaign_id', campaignId)

    const stats = {
      total: campaign.total_recipients,
      sent: campaign.sent_count,
      delivered: campaign.delivered_count,
      read: campaign.read_count,
      replied: campaign.replied_count,
      failed: campaign.failed_count,
      pending: queueStats?.filter(q => q.status === 'pending').length || 0,
      processing: queueStats?.filter(q => q.status === 'processing').length || 0,
      deliveryRate: campaign.total_recipients > 0 
        ? ((campaign.delivered_count / campaign.total_recipients) * 100).toFixed(1)
        : 0,
      readRate: campaign.delivered_count > 0
        ? ((campaign.read_count / campaign.delivered_count) * 100).toFixed(1)
        : 0,
      replyRate: campaign.sent_count > 0
        ? ((campaign.replied_count / campaign.sent_count) * 100).toFixed(1)
        : 0
    }

    return stats
  }
}

export const campaignService = new CampaignService()
