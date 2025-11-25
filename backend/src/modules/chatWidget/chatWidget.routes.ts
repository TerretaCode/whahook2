import { Router, Request, Response } from 'express'
import { chatWidgetService } from './chatWidget.service'
import { supabaseAdmin } from '../../config/supabase'
import { env } from '../../config/environment'

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
// RUTAS AUTENTICADAS (requieren token)
// ==============================================

/**
 * GET /api/chat-widgets
 * Listar widgets del usuario
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const widgets = await chatWidgetService.listWidgets(userId)
    res.json({ success: true, data: widgets })
  } catch (error) {
    console.error('List widgets error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch widgets' })
  }
})

/**
 * GET /api/chat-widgets/:id
 * Obtener widget específico
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const widget = await chatWidgetService.getWidget(req.params.id, userId)
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' })
    }

    res.json({ success: true, data: widget })
  } catch (error) {
    console.error('Get widget error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch widget' })
  }
})

/**
 * POST /api/chat-widgets
 * Crear nuevo widget
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const widget = await chatWidgetService.createWidget(userId, req.body)
    console.log(`✅ Widget created: ${widget.id}`)
    res.json({ success: true, data: widget })
  } catch (error) {
    console.error('Create widget error:', error)
    res.status(500).json({ success: false, error: 'Failed to create widget' })
  }
})

/**
 * PUT /api/chat-widgets/:id
 * Actualizar widget
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const widget = await chatWidgetService.updateWidget(req.params.id, userId, req.body)
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' })
    }

    res.json({ success: true, data: widget })
  } catch (error) {
    console.error('Update widget error:', error)
    res.status(500).json({ success: false, error: 'Failed to update widget' })
  }
})

/**
 * DELETE /api/chat-widgets/:id
 * Eliminar widget
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const deleted = await chatWidgetService.deleteWidget(req.params.id, userId)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Widget not found' })
    }

    console.log(`🗑️ Widget deleted: ${req.params.id}`)
    res.json({ success: true, message: 'Widget deleted' })
  } catch (error) {
    console.error('Delete widget error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete widget' })
  }
})

/**
 * GET /api/chat-widgets/:id/embed-code
 * Obtener código de embed
 */
router.get('/:id/embed-code', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const widget = await chatWidgetService.getWidget(req.params.id, userId)
    if (!widget) {
      return res.status(404).json({ success: false, error: 'Widget not found' })
    }

    const backendUrl = env.corsOrigin || 'http://localhost:4000'
    const embedCode = chatWidgetService.generateEmbedCode(req.params.id, backendUrl)

    res.json({
      success: true,
      data: {
        embedCode,
        widgetId: req.params.id,
        previewUrl: `${backendUrl}/widget/preview/${req.params.id}`,
      },
    })
  } catch (error) {
    console.error('Get embed code error:', error)
    res.status(500).json({ success: false, error: 'Failed to generate embed code' })
  }
})

/**
 * GET /api/chat-widgets/:id/stats
 * Obtener estadísticas del widget
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const stats = await chatWidgetService.getStats(req.params.id, userId)
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch stats' })
  }
})

export { router as chatWidgetRoutes }
