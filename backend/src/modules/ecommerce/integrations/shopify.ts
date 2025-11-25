import axios, { AxiosInstance, AxiosError } from 'axios'
import { EcommerceIntegration, ShopifyCredentials, ConnectionTestResult } from '../ecommerce.types'

interface ShopifyConfig {
  credentials: ShopifyCredentials
  api_version?: string
}

/**
 * Servicio de integración con Shopify Admin REST API
 */
export class ShopifyService implements EcommerceIntegration {
  private client: AxiosInstance
  private config: ShopifyConfig

  constructor(config: ShopifyConfig) {
    this.config = config
    const apiVersion = config.api_version || '2024-10'
    const shopName = config.credentials.shop_name

    this.client = axios.create({
      baseURL: `https://${shopName}.myshopify.com/admin/api/${apiVersion}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': config.credentials.access_token,
        'User-Agent': 'Whahook-Integration/1.0',
      },
    })
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.client.get('/shop.json')
      return {
        success: true,
        message: 'Connection successful',
        data: {
          store_name: response.data.shop.name,
          currency: response.data.shop.currency,
          domain: response.data.shop.domain,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: this.getErrorMessage(error as AxiosError),
      }
    }
  }

  async getAllProducts(): Promise<unknown[]> {
    const allProducts: unknown[] = []
    let nextPageUrl: string | null = null

    do {
      const response = nextPageUrl 
        ? await this.client.get(nextPageUrl)
        : await this.client.get('/products.json', { params: { limit: 250 } })

      allProducts.push(...(response.data.products || []))
      nextPageUrl = this.getNextPageUrl(response.headers['link'])
    } while (nextPageUrl)

    return allProducts
  }

  async getAllOrders(): Promise<unknown[]> {
    const allOrders: unknown[] = []
    let nextPageUrl: string | null = null

    do {
      const response = nextPageUrl
        ? await this.client.get(nextPageUrl)
        : await this.client.get('/orders.json', { params: { limit: 250, status: 'any' } })

      allOrders.push(...(response.data.orders || []))
      nextPageUrl = this.getNextPageUrl(response.headers['link'])
    } while (nextPageUrl)

    return allOrders
  }

  async searchProducts(query: string, limit = 10): Promise<unknown[]> {
    try {
      const response = await this.client.get('/products.json', {
        params: { limit: 250, status: 'active' },
      })
      
      // Shopify REST API no tiene búsqueda directa, filtramos localmente
      const filtered = (response.data.products || []).filter((p: { title?: string; body_html?: string }) =>
        p.title?.toLowerCase().includes(query.toLowerCase()) ||
        p.body_html?.toLowerCase().includes(query.toLowerCase())
      )
      
      return filtered.slice(0, limit)
    } catch {
      return []
    }
  }

  async getStoreInfo(): Promise<unknown> {
    const response = await this.client.get('/shop.json')
    return {
      shop_name: response.data.shop.name,
      email: response.data.shop.email,
      domain: response.data.shop.domain,
      currency: response.data.shop.currency,
    }
  }

  private getNextPageUrl(linkHeader: string | undefined): string | null {
    if (!linkHeader) return null
    
    const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/)
    return match ? match[1] : null
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response) {
      const data = error.response.data as { errors?: string | object }
      if (data?.errors) {
        return typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors)
      }
      return `HTTP ${error.response.status}`
    }
    return error.message || 'Connection failed'
  }
}
