/**
 * API Client for Backend Communication
 * Handles all HTTP requests to the Express backend
 */

import { AuthStorage } from './auth-storage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const DEFAULT_TIMEOUT = 30000 // 30 seconds

// Helper to create fetch with timeout
function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ])
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
  company_name?: string
  redirect_url?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    email_confirmed?: boolean
    profile: {
      user_id: string
      email: string
      full_name: string | null
      company_name?: string | null
      account_type: 'saas' | 'direct'
      subscription_tier: string
      has_gemini_api_key: boolean
      created_at: string
      metadata?: {
        requires_password_change?: boolean
        [key: string]: unknown
      }
    }
  }
  session?: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
  requires_email_verification?: boolean
}

export class ApiClient {
  /**
   * Make authenticated request (public for admin endpoints)
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = AuthStorage.getAccessToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Merge with options.headers if provided
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    try {
      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        { ...options, headers },
        DEFAULT_TIMEOUT
      )

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        }
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      }
    } catch (error) {
      console.error('API request error:', error)
      const errorMessage = error instanceof Error && error.message === 'Request timeout'
        ? 'Request timed out. Please try again.'
        : 'Network error. Please check your connection.'
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Generic GET request
   */
  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Generic POST request
   */
  static async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Generic PUT request
   */
  static async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Generic DELETE request
   */
  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  /**
   * Upload file (FormData)
   */
  static async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = AuthStorage.getAccessToken()
    
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Don't set Content-Type - browser will set it with boundary for FormData

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Upload failed',
        }
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
      }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: 'Upload failed. Please try again.',
      }
    }
  }

  /**
   * POST /api/auth/register
   * Register new user (SaaS only)
   */
  static async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * POST /api/auth/login
   * Login user (SaaS + B2B)
   */
  static async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * POST /api/auth/logout
   * Logout current user
   */
  static async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    })
  }

  /**
   * GET /api/auth/me
   * Get current user info
   */
  static async getCurrentUser(): Promise<ApiResponse<{ user: AuthResponse['user'] }>> {
    return this.request('/api/auth/me', {
      method: 'GET',
    })
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<ApiResponse<{ session: AuthResponse['session'] }>> {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  }

  /**
   * GET /api/users/profile
   * Get user profile
   */
  static async getProfile(): Promise<ApiResponse> {
    return this.request('/api/users/profile', {
      method: 'GET',
    })
  }

  /**
   * PUT /api/users/profile
   * Update user profile
   */
  static async updateProfile(data: Record<string, unknown>): Promise<ApiResponse> {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * POST /api/users/gemini-key
   * Save Gemini API key (encrypted)
   */
  static async saveGeminiKey(apiKey: string): Promise<ApiResponse> {
    return this.request('/api/users/gemini-key', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey }),
    })
  }

  /**
   * GET /api/users/gemini-key/status
   * Check if user has Gemini API key
   */
  static async getGeminiKeyStatus(): Promise<ApiResponse<{ has_key: boolean }>> {
    return this.request('/api/users/gemini-key/status', {
      method: 'GET',
    })
  }

  /**
   * DELETE /api/users/gemini-key
   * Delete Gemini API key
   */
  static async deleteGeminiKey(): Promise<ApiResponse> {
    return this.request('/api/users/gemini-key', {
      method: 'DELETE',
    })
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  /**
   * GET /api/admin/users
   * List all users with filters
   */
  static async adminListUsers(params: {
    page?: number;
    limit?: number;
    account_type?: string;
    subscription_tier?: string;
    subscription_status?: string;
    search?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.account_type) queryParams.append('account_type', params.account_type);
    if (params.subscription_tier) queryParams.append('subscription_tier', params.subscription_tier);
    if (params.subscription_status) queryParams.append('subscription_status', params.subscription_status);
    if (params.search) queryParams.append('search', params.search);

    return this.request(`/api/admin/users?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  /**
   * GET /api/admin/stats
   * Get admin statistics
   */
  static async adminGetStats(): Promise<ApiResponse> {
    return this.request('/api/admin/stats', {
      method: 'GET',
    });
  }

  /**
   * GET /api/admin/renewals/upcoming
   * Get upcoming renewals
   */
  static async adminGetUpcomingRenewals(days: number = 30): Promise<ApiResponse> {
    return this.request(`/api/admin/renewals/upcoming?days=${days}`, {
      method: 'GET',
    });
  }
}
