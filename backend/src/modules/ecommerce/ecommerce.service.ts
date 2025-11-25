import { supabaseAdmin } from '../../config/supabase'
import { 
  EcommerceConnection,
  EcommercePlatform,
  EcommerceCredentials,
  EcommerceIntegration,
  ConnectionTestResult,
  CreateConnectionInput,
  UpdateConnectionInput,
  EcommerceProduct,
  EcommerceOrder,
  EcommerceSyncLog,
} from './ecommerce.types'
import { WooCommerceService, ShopifyService, PrestaShopService, MagentoService } from './integrations'

class EcommerceService {
  /**
   * Crear instancia del servicio de integración según plataforma
   */
  private createIntegration(platform: EcommercePlatform, storeUrl: string, credentials: EcommerceCredentials): EcommerceIntegration {
    switch (platform) {
      case 'woocommerce':
        return new WooCommerceService({ store_url: storeUrl, credentials: credentials as any })
      case 'shopify':
        return new ShopifyService({ credentials: credentials as any })
      case 'prestashop':
        return new PrestaShopService({ store_url: storeUrl, credentials: credentials as any })
      case 'magento':
        return new MagentoService({ store_url: storeUrl, credentials: credentials as any })
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }
  }

  /**
   * Listar conexiones del usuario
   */
  async listConnections(userId: string): Promise<Omit<EcommerceConnection, 'credentials'>[]> {
    const { data, error } = await supabaseAdmin
      .from('ecommerce_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Ocultar credenciales
    return (data || []).map(conn => ({
      ...conn,
      credentials: undefined,
    })) as Omit<EcommerceConnection, 'credentials'>[]
  }

  /**
   * Obtener conexión por ID
   */
  async getConnection(connectionId: string, userId: string): Promise<EcommerceConnection | null> {
    const { data, error } = await supabaseAdmin
      .from('ecommerce_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  }

  /**
   * Crear nueva conexión
   */
  async createConnection(userId: string, input: CreateConnectionInput): Promise<EcommerceConnection> {
    // Probar conexión antes de guardar
    const testResult = await this.testPlatformConnection(input.platform, input.store_url, input.credentials)
    
    if (!testResult.success) {
      throw new Error(`Connection test failed: ${testResult.message}`)
    }

    const { data, error } = await supabaseAdmin
      .from('ecommerce_connections')
      .insert({
        user_id: userId,
        name: input.name,
        platform: input.platform,
        store_url: input.store_url,
        credentials: input.credentials,
        status: 'active',
        sync_config: input.sync_config || undefined,
        store_metadata: testResult.data || {},
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar conexión
   */
  async updateConnection(connectionId: string, userId: string, input: UpdateConnectionInput): Promise<EcommerceConnection | null> {
    const existing = await this.getConnection(connectionId, userId)
    if (!existing) return null

    // Si se actualizan credenciales, probar conexión
    if (input.credentials) {
      const testResult = await this.testPlatformConnection(
        existing.platform,
        input.store_url || existing.store_url,
        input.credentials
      )
      
      if (!testResult.success) {
        throw new Error(`Connection test failed: ${testResult.message}`)
      }
    }

    const { data, error } = await supabaseAdmin
      .from('ecommerce_connections')
      .update(input)
      .eq('id', connectionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar conexión
   */
  async deleteConnection(connectionId: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('ecommerce_connections')
      .delete()
      .eq('id', connectionId)
      .eq('user_id', userId)

    return !error
  }

  /**
   * Probar conexión
   */
  async testPlatformConnection(
    platform: EcommercePlatform,
    storeUrl: string,
    credentials: EcommerceCredentials
  ): Promise<ConnectionTestResult> {
    try {
      const integration = this.createIntegration(platform, storeUrl, credentials)
      const result = await integration.testConnection()
      return {
        success: result.success,
        message: result.message,
        data: result.data as ConnectionTestResult['data'],
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Sincronizar conexión
   */
  async syncConnection(connectionId: string, userId: string, syncType: 'products' | 'orders' | 'full' = 'full'): Promise<string> {
    const connection = await this.getConnection(connectionId, userId)
    if (!connection) throw new Error('Connection not found')

    // Crear log de sincronización
    const { data: syncLog, error: logError } = await supabaseAdmin
      .from('ecommerce_sync_logs')
      .insert({
        connection_id: connectionId,
        sync_type: syncType,
        status: 'running',
      })
      .select()
      .single()

    if (logError) throw logError

    // Ejecutar sincronización en background
    this.performSync(connection, syncLog.id, syncType).catch(error => {
      console.error('Background sync error:', error)
    })

    return syncLog.id
  }

  /**
   * Realizar sincronización (background)
   */
  private async performSync(connection: EcommerceConnection, syncLogId: string, syncType: string): Promise<void> {
    const startTime = Date.now()
    let itemsProcessed = 0
    let itemsCreated = 0
    let itemsFailed = 0

    try {
      console.log(`🔄 Starting ${syncType} sync for connection ${connection.id}`)

      const integration = this.createIntegration(connection.platform, connection.store_url, connection.credentials)

      // Sincronizar productos
      if (syncType === 'products' || syncType === 'full') {
        const products = await integration.getAllProducts()
        console.log(`📦 Fetched ${products.length} products`)

        for (const product of products) {
          try {
            await this.upsertProduct(connection.id, product, connection.platform)
            itemsCreated++
          } catch {
            itemsFailed++
          }
          itemsProcessed++
        }
      }

      // Sincronizar pedidos
      if (syncType === 'orders' || syncType === 'full') {
        const orders = await integration.getAllOrders()
        console.log(`📋 Fetched ${orders.length} orders`)

        for (const order of orders) {
          try {
            await this.upsertOrder(connection.id, order, connection.platform)
            itemsCreated++
          } catch {
            itemsFailed++
          }
          itemsProcessed++
        }
      }

      const duration = Math.floor((Date.now() - startTime) / 1000)

      // Actualizar log
      await supabaseAdmin
        .from('ecommerce_sync_logs')
        .update({
          status: itemsFailed > 0 ? 'partial' : 'completed',
          items_processed: itemsProcessed,
          items_created: itemsCreated,
          items_failed: itemsFailed,
          completed_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq('id', syncLogId)

      // Actualizar conexión
      await supabaseAdmin
        .from('ecommerce_connections')
        .update({
          last_sync_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', connection.id)

      console.log(`✅ Sync completed: ${itemsProcessed} items, ${itemsFailed} failed, ${duration}s`)

    } catch (error) {
      console.error('Sync failed:', error)

      await supabaseAdmin
        .from('ecommerce_sync_logs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLogId)

      await supabaseAdmin
        .from('ecommerce_connections')
        .update({
          status: 'error',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', connection.id)
    }
  }

  /**
   * Insertar/actualizar producto
   */
  private async upsertProduct(connectionId: string, product: unknown, platform: EcommercePlatform): Promise<void> {
    const normalized = this.normalizeProduct(product, platform)
    const p = product as Record<string, unknown>

    await supabaseAdmin
      .from('ecommerce_products')
      .upsert({
        connection_id: connectionId,
        external_id: String(p.id),
        ...normalized,
        raw_data: product,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'connection_id,external_id',
      })
  }

  /**
   * Insertar/actualizar pedido
   */
  private async upsertOrder(connectionId: string, order: unknown, platform: EcommercePlatform): Promise<void> {
    const normalized = this.normalizeOrder(order, platform)
    const o = order as Record<string, unknown>

    await supabaseAdmin
      .from('ecommerce_orders')
      .upsert({
        connection_id: connectionId,
        external_id: String(o.id),
        ...normalized,
        raw_data: order,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'connection_id,external_id',
      })
  }

  /**
   * Normalizar producto según plataforma
   */
  private normalizeProduct(product: unknown, platform: EcommercePlatform): Partial<EcommerceProduct> {
    const p = product as Record<string, unknown>

    switch (platform) {
      case 'woocommerce':
        return {
          name: p.name as string,
          description: p.description as string,
          short_description: p.short_description as string,
          sku: p.sku as string,
          price: parseFloat(p.price as string) || 0,
          regular_price: parseFloat(p.regular_price as string) || 0,
          sale_price: p.sale_price ? parseFloat(p.sale_price as string) : null,
          stock_quantity: p.stock_quantity as number,
          stock_status: p.stock_status as string,
          manage_stock: p.manage_stock as boolean,
          categories: (p.categories || []) as unknown[],
          images: (p.images || []) as unknown[],
          featured_image: ((p.images as Array<{ src?: string }>)?.[0]?.src) || null,
          status: p.status as string,
        }

      case 'shopify':
        const variant = ((p.variants as unknown[]) || [])[0] as Record<string, unknown> || {}
        return {
          name: p.title as string,
          description: p.body_html as string,
          sku: variant.sku as string,
          price: parseFloat(variant.price as string) || 0,
          regular_price: parseFloat((variant.compare_at_price || variant.price) as string) || 0,
          sale_price: variant.compare_at_price ? parseFloat(variant.price as string) : null,
          stock_quantity: variant.inventory_quantity as number,
          stock_status: (variant.inventory_quantity as number) > 0 ? 'instock' : 'outofstock',
          manage_stock: variant.inventory_management !== null,
          images: (p.images || []) as unknown[],
          featured_image: (p.image as Record<string, unknown>)?.src as string || null,
          status: p.status as string,
        }

      case 'prestashop':
        return {
          name: p.name as string,
          description: p.description as string,
          short_description: p.description_short as string,
          sku: p.reference as string,
          price: parseFloat(p.price as string) || 0,
          regular_price: parseFloat(p.price as string) || 0,
          stock_quantity: p.quantity as number,
          stock_status: p.active === '1' ? 'instock' : 'outofstock',
          manage_stock: true,
          status: p.active === '1' ? 'publish' : 'draft',
        }

      case 'magento':
        return {
          name: p.name as string,
          description: (p.custom_attributes as Array<{ attribute_code: string; value: string }>)?.find(a => a.attribute_code === 'description')?.value || '',
          short_description: (p.custom_attributes as Array<{ attribute_code: string; value: string }>)?.find(a => a.attribute_code === 'short_description')?.value || '',
          sku: p.sku as string,
          price: p.price as number || 0,
          stock_quantity: (p.extension_attributes as Record<string, unknown>)?.stock_item ? ((p.extension_attributes as Record<string, { qty?: number }>).stock_item?.qty) : null,
          status: p.status === 1 ? 'publish' : 'draft',
        }

      default:
        return { name: 'Unknown' }
    }
  }

  /**
   * Normalizar pedido según plataforma
   */
  private normalizeOrder(order: unknown, platform: EcommercePlatform): Partial<EcommerceOrder> {
    const o = order as Record<string, unknown>

    switch (platform) {
      case 'woocommerce':
        const billing = o.billing as Record<string, unknown> || {}
        return {
          order_number: o.number as string,
          status: o.status as string,
          customer_email: billing.email as string,
          customer_name: `${billing.first_name || ''} ${billing.last_name || ''}`.trim(),
          customer_phone: billing.phone as string,
          total: parseFloat(o.total as string) || 0,
          subtotal: parseFloat(o.subtotal as string) || 0,
          tax_total: parseFloat(o.total_tax as string) || 0,
          shipping_total: parseFloat(o.shipping_total as string) || 0,
          discount_total: parseFloat(o.discount_total as string) || 0,
          currency: o.currency as string,
          order_date: o.date_created as string,
          shipping_address: (o.shipping || {}) as Record<string, unknown>,
          billing_address: (o.billing || {}) as Record<string, unknown>,
          line_items: (o.line_items || []) as unknown[],
        }

      case 'shopify':
        const customer = o.customer as Record<string, unknown> || {}
        return {
          order_number: o.name as string,
          status: o.financial_status as string,
          customer_email: o.email as string,
          customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          customer_phone: o.phone as string,
          total: parseFloat(o.total_price as string) || 0,
          subtotal: parseFloat(o.subtotal_price as string) || 0,
          tax_total: parseFloat(o.total_tax as string) || 0,
          discount_total: parseFloat(o.total_discounts as string) || 0,
          currency: o.currency as string,
          order_date: o.created_at as string,
          paid_date: o.processed_at as string,
          shipping_address: (o.shipping_address || {}) as Record<string, unknown>,
          billing_address: (o.billing_address || {}) as Record<string, unknown>,
          line_items: (o.line_items || []) as unknown[],
        }

      case 'prestashop':
        return {
          order_number: o.reference as string,
          status: this.mapPrestaShopOrderStatus(o.current_state as number),
          total: parseFloat(o.total_paid as string) || 0,
          subtotal: parseFloat(o.total_products as string) || 0,
          shipping_total: parseFloat(o.total_shipping as string) || 0,
          discount_total: parseFloat(o.total_discounts as string) || 0,
          order_date: o.date_add as string,
        }

      case 'magento':
        const billingAddr = o.billing_address as Record<string, unknown> || {}
        return {
          order_number: o.increment_id as string,
          status: o.status as string,
          customer_email: o.customer_email as string,
          customer_name: `${o.customer_firstname || ''} ${o.customer_lastname || ''}`.trim(),
          total: o.grand_total as number || 0,
          subtotal: o.subtotal as number || 0,
          tax_total: o.tax_amount as number || 0,
          shipping_total: o.shipping_amount as number || 0,
          discount_total: Math.abs(o.discount_amount as number || 0),
          currency: o.order_currency_code as string,
          order_date: o.created_at as string,
          billing_address: billingAddr,
          line_items: (o.items || []) as unknown[],
        }

      default:
        return { order_number: 'Unknown', status: 'unknown', total: 0, order_date: new Date().toISOString() }
    }
  }

  private mapPrestaShopOrderStatus(stateId: number): string {
    const statusMap: Record<number, string> = {
      1: 'pending', 2: 'processing', 3: 'processing', 4: 'completed',
      5: 'completed', 6: 'cancelled', 7: 'refunded', 8: 'failed',
    }
    return statusMap[stateId] || 'pending'
  }

  /**
   * Obtener productos sincronizados
   */
  async getProducts(connectionId: string, userId: string, options: { limit?: number; offset?: number; search?: string } = {}): Promise<{ data: EcommerceProduct[]; total: number }> {
    const connection = await this.getConnection(connectionId, userId)
    if (!connection) throw new Error('Connection not found')

    let query = supabaseAdmin
      .from('ecommerce_products')
      .select('*', { count: 'exact' })
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })

    if (options.search) {
      query = query.ilike('name', `%${options.search}%`)
    }

    if (options.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)
    }

    const { data, error, count } = await query
    if (error) throw error

    return { data: data || [], total: count || 0 }
  }

  /**
   * Obtener pedidos sincronizados
   */
  async getOrders(connectionId: string, userId: string, options: { limit?: number; offset?: number; status?: string } = {}): Promise<{ data: EcommerceOrder[]; total: number }> {
    const connection = await this.getConnection(connectionId, userId)
    if (!connection) throw new Error('Connection not found')

    let query = supabaseAdmin
      .from('ecommerce_orders')
      .select('*', { count: 'exact' })
      .eq('connection_id', connectionId)
      .order('order_date', { ascending: false })

    if (options.status) {
      query = query.eq('status', options.status)
    }

    if (options.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1)
    }

    const { data, error, count } = await query
    if (error) throw error

    return { data: data || [], total: count || 0 }
  }

  /**
   * Obtener logs de sincronización
   */
  async getSyncLogs(connectionId: string, userId: string, limit = 10): Promise<EcommerceSyncLog[]> {
    const connection = await this.getConnection(connectionId, userId)
    if (!connection) throw new Error('Connection not found')

    const { data, error } = await supabaseAdmin
      .from('ecommerce_sync_logs')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Obtener estadísticas de conexión
   */
  async getConnectionStats(connectionId: string, userId: string): Promise<{
    totalProducts: number
    totalOrders: number
    lastSync: string | null
  }> {
    const connection = await this.getConnection(connectionId, userId)
    if (!connection) throw new Error('Connection not found')

    const [productsResult, ordersResult] = await Promise.all([
      supabaseAdmin.from('ecommerce_products').select('*', { count: 'exact', head: true }).eq('connection_id', connectionId),
      supabaseAdmin.from('ecommerce_orders').select('*', { count: 'exact', head: true }).eq('connection_id', connectionId),
    ])

    return {
      totalProducts: productsResult.count || 0,
      totalOrders: ordersResult.count || 0,
      lastSync: connection.last_sync_at,
    }
  }

  /**
   * Generar webhook secret
   */
  async setupWebhook(connectionId: string, userId: string): Promise<{ webhookSecret: string; webhookUrls: Record<string, string> }> {
    const connection = await this.getConnection(connectionId, userId)
    if (!connection) throw new Error('Connection not found')

    // Generar secret si no existe
    let webhookSecret = connection.webhook_secret
    if (!webhookSecret) {
      webhookSecret = require('crypto').randomBytes(32).toString('hex')
      
      await supabaseAdmin
        .from('ecommerce_connections')
        .update({ webhook_secret: webhookSecret, webhook_enabled: true })
        .eq('id', connectionId)
    }

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000'
    
    return {
      webhookSecret: webhookSecret!,
      webhookUrls: {
        woocommerce: `${baseUrl}/api/ecommerce/webhook/${connectionId}/woocommerce`,
        shopify: `${baseUrl}/api/ecommerce/webhook/${connectionId}/shopify`,
        prestashop: `${baseUrl}/api/ecommerce/webhook/${connectionId}/prestashop`,
        magento: `${baseUrl}/api/ecommerce/webhook/${connectionId}/magento`,
      },
    }
  }
}

export const ecommerceService = new EcommerceService()
