import { Router, Request, Response } from 'express'
import { ecommerceService } from './ecommerce.service'
import { supabaseAdmin } from '../../config/supabase'

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
// RUTAS DE CONEXIONES
// ==============================================

/**
 * GET /api/ecommerce/connections
 * Listar conexiones del usuario (filtrado por workspace si se proporciona)
 */
router.get('/connections', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const workspaceId = req.query.workspace_id as string | undefined
    const connections = await ecommerceService.listConnections(userId, workspaceId)
    res.json({ success: true, data: connections })
  } catch (error) {
    console.error('List connections error:', error)
    res.status(500).json({ success: false, error: 'Failed to list connections' })
  }
})

/**
 * POST /api/ecommerce/connections
 * Crear nueva conexión
 */
router.post('/connections', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { name, platform, store_url, credentials, sync_config } = req.body

    if (!name || !platform || !store_url || !credentials) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, platform, store_url, credentials' 
      })
    }

    if (!['woocommerce', 'shopify', 'prestashop', 'magento'].includes(platform)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid platform. Must be: woocommerce, shopify, prestashop, or magento' 
      })
    }

    const connection = await ecommerceService.createConnection(userId, {
      name, platform, store_url, credentials, sync_config
    })

    console.log(`✅ Ecommerce connection created: ${connection.id} (${platform})`)
    
    res.json({ 
      success: true, 
      data: { ...connection, credentials: undefined } 
    })
  } catch (error) {
    console.error('Create connection error:', error)
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create connection' 
    })
  }
})

/**
 * PUT /api/ecommerce/connections/:id
 * Actualizar conexión
 */
router.put('/connections/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const connection = await ecommerceService.updateConnection(req.params.id, userId, req.body)
    
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' })
    }

    res.json({ success: true, data: { ...connection, credentials: undefined } })
  } catch (error) {
    console.error('Update connection error:', error)
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update connection' 
    })
  }
})

/**
 * DELETE /api/ecommerce/connections/:id
 * Eliminar conexión
 */
router.delete('/connections/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const deleted = await ecommerceService.deleteConnection(req.params.id, userId)
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Connection not found' })
    }

    console.log(`🗑️ Ecommerce connection deleted: ${req.params.id}`)
    res.json({ success: true, message: 'Connection deleted' })
  } catch (error) {
    console.error('Delete connection error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete connection' })
  }
})

/**
 * POST /api/ecommerce/connections/:id/test
 * Probar conexión
 */
router.post('/connections/:id/test', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const connection = await ecommerceService.getConnection(req.params.id, userId)
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' })
    }

    const result = await ecommerceService.testPlatformConnection(
      connection.platform,
      connection.store_url,
      connection.credentials
    )

    res.json(result)
  } catch (error) {
    console.error('Test connection error:', error)
    res.status(500).json({ success: false, error: 'Failed to test connection' })
  }
})

/**
 * POST /api/ecommerce/connections/:id/sync
 * Sincronizar datos
 */
router.post('/connections/:id/sync', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { sync_type = 'full' } = req.body
    const syncLogId = await ecommerceService.syncConnection(req.params.id, userId, sync_type)

    res.json({ success: true, message: 'Sync started', data: { sync_log_id: syncLogId } })
  } catch (error) {
    console.error('Sync connection error:', error)
    res.status(500).json({ success: false, error: 'Failed to start sync' })
  }
})

/**
 * GET /api/ecommerce/connections/:id/products
 * Obtener productos sincronizados
 */
router.get('/connections/:id/products', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { limit = '50', offset = '0', search } = req.query
    const result = await ecommerceService.getProducts(req.params.id, userId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      search: search as string,
    })

    res.json({ success: true, data: result.data, pagination: { total: result.total } })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ success: false, error: 'Failed to get products' })
  }
})

/**
 * GET /api/ecommerce/connections/:id/orders
 * Obtener pedidos sincronizados
 */
router.get('/connections/:id/orders', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { limit = '50', offset = '0', status } = req.query
    const result = await ecommerceService.getOrders(req.params.id, userId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      status: status as string,
    })

    res.json({ success: true, data: result.data, pagination: { total: result.total } })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ success: false, error: 'Failed to get orders' })
  }
})

/**
 * GET /api/ecommerce/connections/:id/stats
 * Obtener estadísticas
 */
router.get('/connections/:id/stats', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const stats = await ecommerceService.getConnectionStats(req.params.id, userId)
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ success: false, error: 'Failed to get stats' })
  }
})

/**
 * GET /api/ecommerce/connections/:id/sync-logs
 * Obtener logs de sincronización
 */
router.get('/connections/:id/sync-logs', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { limit = '10' } = req.query
    const logs = await ecommerceService.getSyncLogs(req.params.id, userId, parseInt(limit as string))
    res.json({ success: true, data: logs })
  } catch (error) {
    console.error('Get sync logs error:', error)
    res.status(500).json({ success: false, error: 'Failed to get sync logs' })
  }
})

/**
 * POST /api/ecommerce/connections/:id/webhook/setup
 * Configurar webhooks
 */
router.post('/connections/:id/webhook/setup', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const result = await ecommerceService.setupWebhook(req.params.id, userId)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Setup webhook error:', error)
    res.status(500).json({ success: false, error: 'Failed to setup webhook' })
  }
})

// ==============================================
// WEBHOOK ENDPOINTS (Public - no auth required)
// ==============================================

/**
 * POST /api/webhooks/ecommerce/:connectionId
 * Receive webhook from ecommerce platforms
 * This endpoint is PUBLIC - platforms send data here
 */
router.post('/webhook/:connectionId', async (req: Request, res: Response) => {
  const { connectionId } = req.params
  
  try {
    console.log(`📦 Webhook received for connection: ${connectionId}`)
    console.log(`📦 Headers:`, JSON.stringify(req.headers, null, 2))
    
    // Get connection (without user check - this is a public webhook)
    const { data: connection, error } = await supabaseAdmin
      .from('ecommerce_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      console.error(`❌ Webhook: Connection not found: ${connectionId}`)
      return res.status(404).json({ success: false, error: 'Connection not found' })
    }

    // Validate webhook signature if secret is set
    const webhookSecret = connection.webhook_secret
    if (webhookSecret) {
      const isValid = ecommerceService.validateWebhookSignature(
        connection.platform,
        req.headers,
        req.body,
        webhookSecret
      )
      
      if (!isValid) {
        console.error(`❌ Webhook: Invalid signature for connection: ${connectionId}`)
        return res.status(401).json({ success: false, error: 'Invalid webhook signature' })
      }
    }

    // Process the webhook based on platform
    const result = await ecommerceService.processWebhook(
      connectionId,
      connection.platform,
      req.body,
      req.headers
    )

    console.log(`✅ Webhook processed successfully for connection: ${connectionId}`)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error(`❌ Webhook processing error for ${connectionId}:`, error)
    // Always return 200 to prevent retries for processing errors
    res.status(200).json({ 
      success: false, 
      error: 'Webhook received but processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/webhooks/ecommerce/:connectionId
 * Verify webhook endpoint (some platforms require GET verification)
 */
router.get('/webhook/:connectionId', async (req: Request, res: Response) => {
  const { connectionId } = req.params
  
  // Shopify verification
  if (req.query['hub.mode'] === 'subscribe') {
    return res.send(req.query['hub.challenge'])
  }
  
  // WooCommerce and others - just confirm endpoint exists
  const { data: connection } = await supabaseAdmin
    .from('ecommerce_connections')
    .select('id, platform')
    .eq('id', connectionId)
    .single()

  if (!connection) {
    return res.status(404).json({ success: false, error: 'Connection not found' })
  }

  res.json({ 
    success: true, 
    message: 'Webhook endpoint is active',
    connection_id: connectionId,
    platform: connection.platform
  })
})

export { router as ecommerceRoutes }
