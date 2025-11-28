/**
 * Tipos para el módulo de Webhooks
 */

export type WebhookStatus = 'active' | 'paused' | 'failed'
export type WebhookLogStatus = 'pending' | 'success' | 'failed' | 'retrying'

// Eventos disponibles
export const WEBHOOK_EVENTS = [
  'message.received',
  'message.sent',
  'message.delivered',
  'message.read',
  'message.failed',
  'session.ready',
  'session.disconnected',
  'session.qr',
  'contact.created',
  'contact.updated',
  'group.joined',
  'group.left',
] as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]

// Webhook
export interface Webhook {
  id: string
  user_id: string
  name: string
  url: string
  secret: string | null
  events: WebhookEvent[]
  status: WebhookStatus
  headers: Record<string, string>
  retry_count: number
  timeout_seconds: number
  total_sent: number
  total_success: number
  total_failed: number
  last_triggered_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

// Log de webhook
export interface WebhookLog {
  id: string
  webhook_id: string
  event_type: string
  event_data: unknown
  request_url: string
  request_headers: Record<string, string> | null
  request_body: unknown
  response_status: number | null
  response_body: string | null
  response_time_ms: number | null
  status: WebhookLogStatus
  attempt: number
  error_message: string | null
  created_at: string
  completed_at: string | null
}

// Inputs
export interface CreateWebhookInput {
  name: string
  url: string
  secret?: string
  events: WebhookEvent[]
  headers?: Record<string, string>
  retry_count?: number
  timeout_seconds?: number
  workspace_id?: string
}

export interface UpdateWebhookInput {
  name?: string
  url?: string
  secret?: string
  events?: WebhookEvent[]
  status?: WebhookStatus
  headers?: Record<string, string>
  retry_count?: number
  timeout_seconds?: number
}

// Payload del webhook
export interface WebhookPayload {
  id: string
  event: WebhookEvent
  timestamp: string
  data: unknown
}

// Resultado de envío
export interface WebhookDeliveryResult {
  success: boolean
  status_code?: number
  response_time_ms: number
  error?: string
}
