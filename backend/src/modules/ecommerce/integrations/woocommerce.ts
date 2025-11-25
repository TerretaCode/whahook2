import axios, { AxiosInstance, AxiosError } from 'axios'
import { EcommerceIntegration, WooCommerceCredentials, ConnectionTestResult } from '../ecommerce.types'

interface WooCommerceConfig {
  store_url: string
  credentials: WooCommerceCredentials
}

/**
 * Servicio de integración con WooCommerce REST API v3
 */
export class WooCommerceService implements EcommerceIntegration {
  private client: AxiosInstance
  private config: WooCommerceConfig

  constructor(config: WooCommerceConfig) {
    this.config = config
    const baseURL = config.store_url.replace(/\/$/, '')

    this.client = axios.create({
      baseURL: `${baseURL}/wp-json/wc/v3`,
      auth: {
        username: config.credentials.consumer_key,
        password: config.credentials.consumer_secret,
      },
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Whahook-Integration/1.0',
      },
    })
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.client.get('/system_status')
      return {
        success: true,
        message: 'Connection successful',
        data: {
          store_name: response.data.environment?.site_url,
          version: response.data.environment?.version,
          currency: response.data.settings?.currency,
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
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await this.client.get('/products', {
        params: { page, per_page: 100 },
      })

      allProducts.push(...response.data)
      
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1')
      hasMore = page < totalPages
      page++
    }

    return allProducts
  }

  async getAllOrders(): Promise<unknown[]> {
    const allOrders: unknown[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await this.client.get('/orders', {
        params: { page, per_page: 100 },
      })

      allOrders.push(...response.data)
      
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1')
      hasMore = page < totalPages
      page++
    }

    return allOrders
  }

  async searchProducts(query: string, limit = 10): Promise<unknown[]> {
    try {
      const response = await this.client.get('/products', {
        params: { search: query, per_page: limit, status: 'publish' },
      })
      return response.data
    } catch {
      return []
    }
  }

  async getStoreInfo(): Promise<unknown> {
    const response = await this.client.get('/system_status')
    return {
      url: this.config.store_url,
      version: response.data.environment?.version,
      currency: response.data.settings?.currency,
    }
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response) {
      const data = error.response.data as { message?: string }
      return data?.message || `HTTP ${error.response.status}`
    }
    return error.message || 'Connection failed'
  }
}
