/**
 * Prompt2 Configuration API Client
 * Handles all HTTP requests for Prompt2 configurations
 */

import { ApiClient, ApiResponse } from './api-client';
import type {
  WhatsAppPrompt2Config,
  WidgetPrompt2Config,
  SavePrompt2ConfigRequest,
} from '../types/prompt2.types';

export class Prompt2ApiClient {
  // ============================================
  // WHATSAPP PROMPT2 CONFIGURATION
  // ============================================

  /**
   * GET /api/prompt2/whatsapp/:sessionId
   * Get Prompt2 configuration for a WhatsApp session
   */
  static async getWhatsAppConfig(sessionId: string): Promise<ApiResponse<WhatsAppPrompt2Config>> {
    return ApiClient.request<WhatsAppPrompt2Config>(`/api/prompt2/whatsapp/${sessionId}`, {
      method: 'GET',
    });
  }

  /**
   * POST /api/prompt2/whatsapp/:sessionId
   * Save/update Prompt2 configuration for a WhatsApp session
   */
  static async saveWhatsAppConfig(
    sessionId: string,
    config: SavePrompt2ConfigRequest
  ): Promise<ApiResponse> {
    return ApiClient.request(`/api/prompt2/whatsapp/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * DELETE /api/prompt2/whatsapp/:sessionId
   * Delete Prompt2 configuration for a WhatsApp session
   */
  static async deleteWhatsAppConfig(sessionId: string): Promise<ApiResponse> {
    return ApiClient.request(`/api/prompt2/whatsapp/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // WIDGET PROMPT2 CONFIGURATION
  // ============================================

  /**
   * GET /api/prompt2/widget/:widgetId
   * Get Prompt2 configuration for a widget
   */
  static async getWidgetConfig(widgetId: string): Promise<ApiResponse<WidgetPrompt2Config>> {
    return ApiClient.request<WidgetPrompt2Config>(`/api/prompt2/widget/${widgetId}`, {
      method: 'GET',
    });
  }

  /**
   * POST /api/prompt2/widget/:widgetId
   * Save/update Prompt2 configuration for a widget
   */
  static async saveWidgetConfig(
    widgetId: string,
    config: SavePrompt2ConfigRequest
  ): Promise<ApiResponse> {
    return ApiClient.request(`/api/prompt2/widget/${widgetId}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * DELETE /api/prompt2/widget/:widgetId
   * Delete Prompt2 configuration for a widget
   */
  static async deleteWidgetConfig(widgetId: string): Promise<ApiResponse> {
    return ApiClient.request(`/api/prompt2/widget/${widgetId}`, {
      method: 'DELETE',
    });
  }
}
