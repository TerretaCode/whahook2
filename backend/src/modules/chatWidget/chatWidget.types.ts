/**
 * Tipos para el módulo Chat Widget
 */

export interface ChatWidget {
  id: string
  user_id: string
  name: string
  domain: string | null
  is_active: boolean
  primary_color: string
  header_text: string
  header_logo_url: string | null
  welcome_message: string
  placeholder_text: string
  position: 'bottom-right' | 'bottom-left'
  bubble_icon_url: string | null
  powered_by_text: string
  powered_by_url: string
  total_conversations: number
  total_messages: number
  created_at: string
  updated_at: string
}

export interface ChatWidgetConversation {
  id: string
  widget_id: string
  visitor_id: string
  visitor_name: string | null
  visitor_email: string | null
  user_agent: string | null
  ip_address: string | null
  page_url: string | null
  referrer: string | null
  status: 'active' | 'closed' | 'archived'
  started_at: string
  last_message_at: string
  closed_at: string | null
}

export interface ChatWidgetMessage {
  id: string
  conversation_id: string
  message: string
  sender_type: 'visitor' | 'assistant' | 'system'
  is_read: boolean
  created_at: string
}

export interface CreateWidgetInput {
  name: string
  domain?: string
  primary_color?: string
  header_text?: string
  header_logo_url?: string
  welcome_message?: string
  placeholder_text?: string
  position?: 'bottom-right' | 'bottom-left'
}

export interface UpdateWidgetInput extends Partial<CreateWidgetInput> {
  is_active?: boolean
}

export interface SendMessageInput {
  conversationId?: string
  visitorId: string
  message: string
  visitorName?: string
  visitorEmail?: string
  pageUrl?: string
  referrer?: string
}
