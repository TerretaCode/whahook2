import axios, { AxiosInstance, AxiosError } from 'axios'
import { EcommerceIntegration, PrestaShopCredentials, ConnectionTestResult } from '../ecommerce.types'

interface PrestaShopConfig {
  store_url: string
  credentials: PrestaShopCredentials
}

/**
 * Servicio de integración con PrestaShop Webservice API
 */
export class PrestaShopService implements EcommerceIntegration {
  private client: AxiosInstance
  private config: PrestaShopConfig

  constructor(config: PrestaShopConfig) {
    this.config = config
    const baseURL = config.store_url.replace(/\/$/, '')

    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      auth: {
        username: config.credentials.api_key,
        password: '',
      },
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Whahook-Integration/1.0',
      },
      params: {
        output_format: 'JSON',
      },
    })
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.client.get('/', { params: { display: 'full' } })
      return {
        success: true,
        message: 'Connection successful',
        data: {
          store_name: response.data.prestashop?.shop_name || 'PrestaShop',
          version: response.data.prestashop?.version || 'Unknown',
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
    let offset = 0
    const limit = 50
    let hasMore = true

    while (hasMore) {
      const response = await this.client.get('/products', {
        params: { limit: `${offset},${limit}`, display: 'full' },
      })

      const products = response.data.products || []
      const productList = Array.isArray(products) ? products : [products]
      
      allProducts.push(...productList.map((p: unknown) => this.normalizeProduct(p)))
      
      hasMore = productList.length === limit
      offset += limit
    }

    return allProducts
  }

  async getAllOrders(): Promise<unknown[]> {
    const allOrders: unknown[] = []
    let offset = 0
    const limit = 50
    let hasMore = true

    while (hasMore) {
      const response = await this.client.get('/orders', {
        params: { limit: `${offset},${limit}`, display: 'full' },
      })

      const orders = response.data.orders || []
      const orderList = Array.isArray(orders) ? orders : [orders]
      
      allOrders.push(...orderList)
      
      hasMore = orderList.length === limit
      offset += limit
    }

    return allOrders
  }

  async searchProducts(query: string, limit = 10): Promise<unknown[]> {
    try {
      const response = await this.client.get('/products', {
        params: { 
          limit: `0,${limit}`, 
          display: 'full',
          'filter[name]': `[${query}]%`,
        },
      })
      
      const products = response.data.products || []
      return Array.isArray(products) 
        ? products.map((p: unknown) => this.normalizeProduct(p))
        : [this.normalizeProduct(products)]
    } catch {
      return []
    }
  }

  async getStoreInfo(): Promise<unknown> {
    const response = await this.client.get('/', { params: { display: 'full' } })
    return {
      url: this.config.store_url,
      shop_name: response.data.prestashop?.shop_name || 'PrestaShop',
      version: response.data.prestashop?.version || 'Unknown',
    }
  }

  private normalizeProduct(product: unknown): unknown {
    const p = product as Record<string, unknown>
    return {
      ...p,
      name: this.extractMultilangText(p.name),
      description: this.extractMultilangText(p.description),
      description_short: this.extractMultilangText(p.description_short),
    }
  }

  private extractMultilangText(field: unknown): string {
    if (typeof field === 'string') return field
    if (Array.isArray(field) && field.length > 0) {
      const item = field[0] as { _?: string }
      return item?._ || ''
    }
    return ''
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response) {
      const data = error.response.data as { errors?: Array<{ message?: string }> }
      if (data?.errors?.[0]?.message) {
        return data.errors[0].message
      }
      return `HTTP ${error.response.status}`
    }
    return error.message || 'Connection failed'
  }
}
