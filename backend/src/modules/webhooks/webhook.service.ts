import crypto from 'crypto'
import axios from 'axios'
import { supabaseAdmin } from '../../config/supabase'
import {
  Webhook,
  WebhookLog,
  WebhookEvent,
  WebhookPayload,
  WebhookDeliveryResult,
  CreateWebhookInput,
  UpdateWebhookInput,
  WEBHOOK_EVENTS,
} from './webhook.types'

class WebhookService {
  /**
   * Listar webhooks del usuario
   */
  async listWebhooks(userId: string): Promise<Webhook[]> {
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Obtener webhook por ID
   */
  async getWebhook(webhookId: string, userId: string): Promise<Webhook | null> {
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  }

  /**
   * Crear webhook
   */
  async createWebhook(userId: string, input: CreateWebhookInput): Promise<Webhook> {
    // Verify workspace belongs to user if provided
    if (input.workspace_id) {
      const { data: workspace, error: wsError } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('id', input.workspace_id)
        .eq('user_id', userId)
        .single()

      if (wsError || !workspace) {
        throw new Error('Invalid workspace')
      }
    }

    // Validar eventos
    const invalidEvents = input.events.filter(e => !WEBHOOK_EVENTS.includes(e))
    if (invalidEvents.length > 0) {
      throw new Error(`Invalid events: ${invalidEvents.join(', ')}`)
    }

    // Validar URL
    try {
      new URL(input.url)
    } catch {
      throw new Error('Invalid webhook URL')
    }

    // Generar secret si no se proporciona
    const secret = input.secret || crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .insert({
        user_id: userId,
        name: input.name,
        url: input.url,
        secret,
        events: input.events,
        headers: input.headers || {},
        retry_count: input.retry_count || 3,
        timeout_seconds: input.timeout_seconds || 30,
        workspace_id: input.workspace_id || null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar webhook
   */
  async updateWebhook(webhookId: string, userId: string, input: UpdateWebhookInput): Promise<Webhook | null> {
    const existing = await this.getWebhook(webhookId, userId)
    if (!existing) return null

    // Validar eventos si se proporcionan
    if (input.events) {
      const invalidEvents = input.events.filter(e => !WEBHOOK_EVENTS.includes(e))
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid events: ${invalidEvents.join(', ')}`)
      }
    }

    // Validar URL si se proporciona
    if (input.url) {
      try {
        new URL(input.url)
      } catch {
        throw new Error('Invalid webhook URL')
      }
    }

    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .update(input)
      .eq('id', webhookId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar webhook
   */
  async deleteWebhook(webhookId: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', userId)

    return !error
  }

  /**
   * Probar webhook (enviar evento de prueba)
   */
  async testWebhook(webhookId: string, userId: string): Promise<WebhookDeliveryResult> {
    const webhook = await this.getWebhook(webhookId, userId)
    if (!webhook) throw new Error('Webhook not found')

    const testPayload: WebhookPayload = {
      id: crypto.randomUUID(),
      event: 'message.received' as WebhookEvent,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook delivery',
        from: '+34600000000',
        body: 'Hello! This is a test message.',
      },
    }

    return this.deliverWebhook(webhook, testPayload)
  }

  /**
   * Disparar evento para todos los webhooks suscritos
   */
  async triggerEvent(userId: string, event: WebhookEvent, data: unknown): Promise<void> {
    // Obtener webhooks activos suscritos a este evento
    const { data: webhooks, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .contains('events', [event])

    if (error || !webhooks || webhooks.length === 0) return

    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    // Enviar a todos los webhooks en paralelo
    const deliveries = webhooks.map(webhook => 
      this.deliverWithRetry(webhook as Webhook, payload)
    )

    await Promise.allSettled(deliveries)
  }

  /**
   * Entregar webhook con reintentos
   */
  private async deliverWithRetry(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    let lastError: string | undefined
    
    for (let attempt = 1; attempt <= webhook.retry_count; attempt++) {
      const result = await this.deliverWebhook(webhook, payload, attempt)
      
      if (result.success) {
        return
      }
      
      lastError = result.error
      
      // Esperar antes del siguiente intento (backoff exponencial)
      if (attempt < webhook.retry_count) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }

    // Todos los intentos fallaron
    await supabaseAdmin
      .from('webhooks')
      .update({
        last_error: lastError,
        status: webhook.total_failed > 10 ? 'failed' : webhook.status,
      })
      .eq('id', webhook.id)
  }

  /**
   * Entregar webhook individual
   */
  private async deliverWebhook(
    webhook: Webhook,
    payload: WebhookPayload,
    attempt = 1
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now()
    
    // Crear log
    const { data: log } = await supabaseAdmin
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        event_type: payload.event,
        event_data: payload.data,
        request_url: webhook.url,
        request_headers: webhook.headers,
        request_body: payload,
        status: 'pending',
        attempt,
      })
      .select()
      .single()

    try {
      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Whahook-Webhook/1.0',
        'X-Webhook-ID': webhook.id,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        ...webhook.headers,
      }

      // Firmar payload si hay secret
      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex')
        headers['X-Webhook-Signature'] = `sha256=${signature}`
      }

      // Enviar request
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: webhook.timeout_seconds * 1000,
        validateStatus: () => true, // No lanzar error por status codes
      })

      const responseTime = Date.now() - startTime
      const success = response.status >= 200 && response.status < 300

      // Actualizar log
      if (log) {
        await supabaseAdmin
          .from('webhook_logs')
          .update({
            response_status: response.status,
            response_body: typeof response.data === 'string' 
              ? response.data.substring(0, 1000) 
              : JSON.stringify(response.data).substring(0, 1000),
            response_time_ms: responseTime,
            status: success ? 'success' : 'failed',
            error_message: success ? null : `HTTP ${response.status}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', log.id)
      }

      // Actualizar estadísticas
      await supabaseAdmin.rpc('increment_webhook_stats', {
        p_webhook_id: webhook.id,
        p_success: success,
      })

      return {
        success,
        status_code: response.status,
        response_time_ms: responseTime,
        error: success ? undefined : `HTTP ${response.status}`,
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Actualizar log
      if (log) {
        await supabaseAdmin
          .from('webhook_logs')
          .update({
            response_time_ms: responseTime,
            status: 'failed',
            error_message: errorMessage,
            completed_at: new Date().toISOString(),
          })
          .eq('id', log.id)
      }

      // Actualizar estadísticas
      await supabaseAdmin.rpc('increment_webhook_stats', {
        p_webhook_id: webhook.id,
        p_success: false,
      })

      return {
        success: false,
        response_time_ms: responseTime,
        error: errorMessage,
      }
    }
  }

  /**
   * Obtener logs de un webhook
   */
  async getWebhookLogs(webhookId: string, userId: string, limit = 50): Promise<WebhookLog[]> {
    // Verificar que el webhook pertenece al usuario
    const webhook = await this.getWebhook(webhookId, userId)
    if (!webhook) throw new Error('Webhook not found')

    const { data, error } = await supabaseAdmin
      .from('webhook_logs')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Obtener estadísticas de webhooks del usuario
   */
  async getStats(userId: string): Promise<{
    total_webhooks: number
    active_webhooks: number
    total_sent: number
    total_success: number
    total_failed: number
  }> {
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .select('status, total_sent, total_success, total_failed')
      .eq('user_id', userId)

    if (error) throw error

    const webhooks = data || []
    return {
      total_webhooks: webhooks.length,
      active_webhooks: webhooks.filter(w => w.status === 'active').length,
      total_sent: webhooks.reduce((sum, w) => sum + (w.total_sent || 0), 0),
      total_success: webhooks.reduce((sum, w) => sum + (w.total_success || 0), 0),
      total_failed: webhooks.reduce((sum, w) => sum + (w.total_failed || 0), 0),
    }
  }

  /**
   * Regenerar secret de webhook
   */
  async regenerateSecret(webhookId: string, userId: string): Promise<string> {
    const webhook = await this.getWebhook(webhookId, userId)
    if (!webhook) throw new Error('Webhook not found')

    const newSecret = crypto.randomBytes(32).toString('hex')

    await supabaseAdmin
      .from('webhooks')
      .update({ secret: newSecret })
      .eq('id', webhookId)

    return newSecret
  }
}

export const webhookService = new WebhookService()
