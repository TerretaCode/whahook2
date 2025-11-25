import { Router, Request, Response } from 'express'
import { webhookService } from './webhook.service'
import { supabaseAdmin } from '../../config/supabase'
import { WEBHOOK_EVENTS } from './webhook.types'

const router = Router()

/**
 * Middleware para obtener userId del token
 */
async function getUserIdFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null
    return user.id
  } catch {
    return null
  }
}

// ==============================================
// RUTAS DE WEBHOOKS
// ==============================================

/**
 * GET /api/webhooks
 * Listar webhooks del usuario
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const webhooks = await webhookService.listWebhooks(userId)
    res.json({ success: true, data: webhooks })
  } catch (error) {
    console.error('List webhooks error:', error)
    res.status(500).json({ success: false, error: 'Failed to list webhooks' })
  }
})

/**
 * GET /api/webhooks/events
 * Obtener lista de eventos disponibles
 */
router.get('/events', (_req: Request, res: Response) => {
  const events = WEBHOOK_EVENTS.map(event => ({
    name: event,
    description: getEventDescription(event),
  }))
  res.json({ success: true, data: events })
})

/**
 * GET /api/webhooks/stats
 * Obtener estadísticas de webhooks
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const stats = await webhookService.getStats(userId)
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to get stats' })
  }
})

/**
 * GET /api/webhooks/:id
 * Obtener webhook por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const webhook = await webhookService.getWebhook(req.params.id, userId)
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' })
    }

    res.json({ success: true, data: webhook })
  } catch (error) {
    console.error('Get webhook error:', error)
    res.status(500).json({ success: false, error: 'Failed to get webhook' })
  }
})

/**
 * POST /api/webhooks
 * Crear webhook
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { name, url, secret, events, headers, retry_count, timeout_seconds } = req.body

    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, url, events (array)' 
      })
    }

    const webhook = await webhookService.createWebhook(userId, {
      name, url, secret, events, headers, retry_count, timeout_seconds
    })

    console.log(`✅ Webhook created: ${webhook.id} (${name})`)
    res.json({ success: true, data: webhook })
  } catch (error) {
    console.error('Create webhook error:', error)
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create webhook' 
    })
  }
})

/**
 * PUT /api/webhooks/:id
 * Actualizar webhook
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const webhook = await webhookService.updateWebhook(req.params.id, userId, req.body)
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' })
    }

    res.json({ success: true, data: webhook })
  } catch (error) {
    console.error('Update webhook error:', error)
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update webhook' 
    })
  }
})

/**
 * DELETE /api/webhooks/:id
 * Eliminar webhook
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const deleted = await webhookService.deleteWebhook(req.params.id, userId)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Webhook not found' })
    }

    console.log(`🗑️ Webhook deleted: ${req.params.id}`)
    res.json({ success: true, message: 'Webhook deleted' })
  } catch (error) {
    console.error('Delete webhook error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete webhook' })
  }
})

/**
 * POST /api/webhooks/:id/test
 * Probar webhook
 */
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const result = await webhookService.testWebhook(req.params.id, userId)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Test webhook error:', error)
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test webhook' 
    })
  }
})

/**
 * POST /api/webhooks/:id/regenerate-secret
 * Regenerar secret del webhook
 */
router.post('/:id/regenerate-secret', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const newSecret = await webhookService.regenerateSecret(req.params.id, userId)
    res.json({ success: true, data: { secret: newSecret } })
  } catch (error) {
    console.error('Regenerate secret error:', error)
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to regenerate secret' 
    })
  }
})

/**
 * GET /api/webhooks/:id/logs
 * Obtener logs del webhook
 */
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { limit = '50' } = req.query
    const logs = await webhookService.getWebhookLogs(req.params.id, userId, parseInt(limit as string))
    res.json({ success: true, data: logs })
  } catch (error) {
    console.error('Get logs error:', error)
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get logs' 
    })
  }
})

// Helper para descripciones de eventos
function getEventDescription(event: string): string {
  const descriptions: Record<string, string> = {
    'message.received': 'Triggered when a new message is received',
    'message.sent': 'Triggered when a message is sent',
    'message.delivered': 'Triggered when a message is delivered',
    'message.read': 'Triggered when a message is read',
    'message.failed': 'Triggered when a message fails to send',
    'session.ready': 'Triggered when WhatsApp session is connected',
    'session.disconnected': 'Triggered when WhatsApp session disconnects',
    'session.qr': 'Triggered when a new QR code is generated',
    'contact.created': 'Triggered when a new contact is created',
    'contact.updated': 'Triggered when a contact is updated',
    'group.joined': 'Triggered when joining a group',
    'group.left': 'Triggered when leaving a group',
  }
  return descriptions[event] || event
}

export { router as webhookRoutes }
