import { Router, Request, Response } from 'express'
import { chatWidgetService } from './chatWidget.service'

const router = Router()

// ==============================================
// RUTAS PÚBLICAS (sin autenticación)
// Para uso desde el widget embebido
// ==============================================

/**
 * GET /api/public/chat-widgets/:id/config
 * Obtener configuración pública del widget
 */
router.get('/:id/config', async (req: Request, res: Response) => {
  try {
    const config = await chatWidgetService.getPublicConfig(req.params.id)
    
    if (!config) {
      return res.status(404).json({ success: false, error: 'Widget not found' })
    }

    res.json({ success: true, data: config })
  } catch (error) {
    console.error('Get widget config error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch config' })
  }
})

/**
 * POST /api/public/chat-widgets/:id/messages
 * Enviar mensaje desde el widget
 */
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { conversationId, visitorId, message, visitorName, visitorEmail, pageUrl, referrer } = req.body

    if (!visitorId || !message) {
      return res.status(400).json({ success: false, error: 'visitorId and message are required' })
    }

    const result = await chatWidgetService.sendMessage(
      req.params.id,
      { conversationId, visitorId, message, visitorName, visitorEmail, pageUrl, referrer },
      { userAgent: req.headers['user-agent'], ip: req.ip }
    )

    console.log(`💬 Widget message received: ${req.params.id}`)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ success: false, error: 'Failed to send message' })
  }
})

/**
 * GET /api/public/chat-widgets/:id/conversations/:conversationId/messages
 * Obtener mensajes de una conversación
 */
router.get('/:id/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const messages = await chatWidgetService.getMessages(req.params.id, req.params.conversationId)
    res.json({ success: true, data: messages })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch messages' })
  }
})

export { router as chatWidgetPublicRoutes }
