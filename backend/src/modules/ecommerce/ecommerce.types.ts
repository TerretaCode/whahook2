/**
 * Tipos para el módulo E-commerce
 */

export type EcommercePlatform = 'woocommerce' | 'shopify' | 'prestashop' | 'magento'
export type ConnectionStatus = 'pending' | 'active' | 'error' | 'disabled'
export type SyncStatus = 'running' | 'completed' | 'failed' | 'partial'

// Credenciales por plataforma
export interface WooCommerceCredentials {
  consumer_key: string
  consumer_secret: string
}

export interface ShopifyCredentials {
  access_token: string
  shop_name: string // sin .myshopify.com
}

export interface PrestaShopCredentials {
  api_key: string
}

export interface MagentoCredentials {
  access_token: string
  // Para OAuth 2.0
  consumer_key?: string
  consumer_secret?: string
  access_token_secret?: string
}

export type EcommerceCredentials = 
  | WooCommerceCredentials 
  | ShopifyCredentials 
  | PrestaShopCredentials 
  | MagentoCredentials

// Conexión
export interface EcommerceConnection {
  id: string
  user_id: string
  name: string
  platform: EcommercePlatform
  store_url: string
  credentials: EcommerceCredentials
  status: ConnectionStatus
  last_sync_at: string | null
  last_error: string | null
  sync_config: SyncConfig
  webhook_secret: string | null
  webhook_enabled: boolean
  store_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SyncConfig {
  auto_sync: boolean
  sync_interval_minutes: number
  sync_products: boolean
  sync_orders: boolean
}

// Log de sincronización
export interface EcommerceSyncLog {
  id: string
  connection_id: string
  sync_type: 'products' | 'orders' | 'full'
  status: SyncStatus
  items_processed: number
  items_created: number
  items_updated: number
  items_failed: number
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  details: Record<string, unknown>
  error_message: string | null
  created_at: string
}

// Producto normalizado
export interface EcommerceProduct {
  id: string
  connection_id: string
  external_id: string
  name: string
  description: string | null
  short_description: string | null
  sku: string | null
  price: number | null
  regular_price: number | null
  sale_price: number | null
  currency: string
  stock_quantity: number | null
  stock_status: string | null
  manage_stock: boolean
  categories: unknown[]
  tags: unknown[]
  images: unknown[]
  featured_image: string | null
  status: string
  raw_data: Record<string, unknown>
  last_synced_at: string
  created_at: string
  updated_at: string
}

// Pedido normalizado
export interface EcommerceOrder {
  id: string
  connection_id: string
  external_id: string
  order_number: string | null
  status: string
  customer_email: string | null
  customer_name: string | null
  customer_phone: string | null
  total: number
  subtotal: number | null
  tax_total: number | null
  shipping_total: number | null
  discount_total: number | null
  currency: string
  order_date: string
  paid_date: string | null
  completed_date: string | null
  shipping_address: Record<string, unknown>
  billing_address: Record<string, unknown>
  line_items: unknown[]
  raw_data: Record<string, unknown>
  last_synced_at: string
  created_at: string
  updated_at: string
}

// Inputs
export interface CreateConnectionInput {
  name: string
  platform: EcommercePlatform
  store_url: string
  credentials: EcommerceCredentials
  sync_config?: Partial<SyncConfig>
}

export interface UpdateConnectionInput {
  name?: string
  store_url?: string
  credentials?: EcommerceCredentials
  sync_config?: Partial<SyncConfig>
  status?: ConnectionStatus
}

// Interfaz común para servicios de integración
export interface EcommerceIntegration {
  testConnection(): Promise<{ success: boolean; message: string; data?: unknown }>
  getAllProducts(): Promise<unknown[]>
  getAllOrders(): Promise<unknown[]>
  searchProducts(query: string, limit?: number): Promise<unknown[]>
  getStoreInfo(): Promise<unknown>
}

// Resultado de test de conexión
export interface ConnectionTestResult {
  success: boolean
  message: string
  data?: {
    store_name?: string
    version?: string
    currency?: string
    [key: string]: unknown
  }
}
