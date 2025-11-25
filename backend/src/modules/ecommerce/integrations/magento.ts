import axios, { AxiosInstance, AxiosError } from 'axios'
import { EcommerceIntegration, MagentoCredentials, ConnectionTestResult } from '../ecommerce.types'

interface MagentoConfig {
  store_url: string
  credentials: MagentoCredentials
}

/**
 * Servicio de integración con Magento 2 REST API
 */
export class MagentoService implements EcommerceIntegration {
  private client: AxiosInstance
  private config: MagentoConfig

  constructor(config: MagentoConfig) {
    this.config = config
    const baseURL = config.store_url.replace(/\/$/, '')

    this.client = axios.create({
      baseURL: `${baseURL}/rest/V1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.credentials.access_token}`,
        'User-Agent': 'Whahook-Integration/1.0',
      },
    })
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.client.get('/store/storeConfigs')
      const config = response.data?.[0] || {}
      return {
        success: true,
        message: 'Connection successful',
        data: {
          store_name: config.base_url || this.config.store_url,
          currency: config.base_currency_code,
          locale: config.locale,
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
    const pageSize = 100
    let hasMore = true

    while (hasMore) {
      const response = await this.client.get('/products', {
        params: {
          'searchCriteria[pageSize]': pageSize,
          'searchCriteria[currentPage]': page,
        },
      })

      const items = response.data.items || []
      allProducts.push(...items)
      
      const totalCount = response.data.total_count || 0
      hasMore = allProducts.length < totalCount
      page++
    }

    return allProducts
  }

  async getAllOrders(): Promise<unknown[]> {
    const allOrders: unknown[] = []
    let page = 1
    const pageSize = 100
    let hasMore = true

    while (hasMore) {
      const response = await this.client.get('/orders', {
        params: {
          'searchCriteria[pageSize]': pageSize,
          'searchCriteria[currentPage]': page,
        },
      })

      const items = response.data.items || []
      allOrders.push(...items)
      
      const totalCount = response.data.total_count || 0
      hasMore = allOrders.length < totalCount
      page++
    }

    return allOrders
  }

  async searchProducts(query: string, limit = 10): Promise<unknown[]> {
    try {
      const response = await this.client.get('/products', {
        params: {
          'searchCriteria[pageSize]': limit,
          'searchCriteria[filterGroups][0][filters][0][field]': 'name',
          'searchCriteria[filterGroups][0][filters][0][value]': `%${query}%`,
          'searchCriteria[filterGroups][0][filters][0][conditionType]': 'like',
        },
      })
      return response.data.items || []
    } catch {
      return []
    }
  }

  async getStoreInfo(): Promise<unknown> {
    const response = await this.client.get('/store/storeConfigs')
    const config = response.data?.[0] || {}
    return {
      url: this.config.store_url,
      store_name: config.base_url,
      currency: config.base_currency_code,
      locale: config.locale,
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
