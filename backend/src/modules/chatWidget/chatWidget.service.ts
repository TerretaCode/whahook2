import { supabaseAdmin } from '../../config/supabase'
import { 
  ChatWidget, 
  ChatWidgetConversation, 
  ChatWidgetMessage,
  CreateWidgetInput, 
  UpdateWidgetInput,
  SendMessageInput 
} from './chatWidget.types'

class ChatWidgetService {
  /**
   * Listar widgets del usuario
   */
  async listWidgets(userId: string): Promise<ChatWidget[]> {
    const { data, error } = await supabaseAdmin
      .from('chat_widgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Obtener widget por ID
   */
  async getWidget(widgetId: string, userId: string): Promise<ChatWidget | null> {
    const { data, error } = await supabaseAdmin
      .from('chat_widgets')
      .select('*')
      .eq('id', widgetId)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  }

  /**
   * Crear nuevo widget
   */
  async createWidget(userId: string, input: CreateWidgetInput): Promise<ChatWidget> {
    const { data, error } = await supabaseAdmin
      .from('chat_widgets')
      .insert({
        user_id: userId,
        name: input.name,
        domain: input.domain || null,
        primary_color: input.primary_color || '#10B981',
        header_text: input.header_text || 'Chat Support',
        header_logo_url: input.header_logo_url || null,
        welcome_message: input.welcome_message || '¡Hola! 👋 ¿En qué puedo ayudarte?',
        placeholder_text: input.placeholder_text || 'Escribe tu mensaje...',
        position: input.position || 'bottom-right',
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar widget
   */
  async updateWidget(widgetId: string, userId: string, input: UpdateWidgetInput): Promise<ChatWidget | null> {
    // Verificar propiedad
    const existing = await this.getWidget(widgetId, userId)
    if (!existing) return null

    const { data, error } = await supabaseAdmin
      .from('chat_widgets')
      .update(input)
      .eq('id', widgetId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar widget
   */
  async deleteWidget(widgetId: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('chat_widgets')
      .delete()
      .eq('id', widgetId)
      .eq('user_id', userId)

    return !error
  }

  /**
   * Obtener configuración pública del widget (sin autenticación)
   */
  async getPublicConfig(widgetId: string): Promise<Partial<ChatWidget> | null> {
    const { data, error } = await supabaseAdmin
      .from('chat_widgets')
      .select('id, primary_color, header_text, header_logo_url, welcome_message, placeholder_text, position, bubble_icon_url, powered_by_text, powered_by_url')
      .eq('id', widgetId)
      .eq('is_active', true)
      .single()

    if (error) return null
    return data
  }

  /**
   * Enviar mensaje desde el widget
   */
  async sendMessage(widgetId: string, input: SendMessageInput, metadata: { userAgent?: string; ip?: string }): Promise<{ conversationId: string; message: ChatWidgetMessage }> {
    // Verificar widget activo
    const { data: widget } = await supabaseAdmin
      .from('chat_widgets')
      .select('id')
      .eq('id', widgetId)
      .eq('is_active', true)
      .single()

    if (!widget) throw new Error('Widget not found or inactive')

    let conversationId = input.conversationId

    // Crear conversación si no existe
    if (!conversationId) {
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('chat_widget_conversations')
        .insert({
          widget_id: widgetId,
          visitor_id: input.visitorId,
          visitor_name: input.visitorName || null,
          visitor_email: input.visitorEmail || null,
          user_agent: metadata.userAgent || null,
          ip_address: metadata.ip || null,
          page_url: input.pageUrl || null,
          referrer: input.referrer || null,
        })
        .select()
        .single()

      if (convError) throw convError
      conversationId = conversation.id
    }

    // Guardar mensaje
    const { data: message, error: msgError } = await supabaseAdmin
      .from('chat_widget_messages')
      .insert({
        conversation_id: conversationId,
        message: input.message,
        sender_type: 'visitor',
      })
      .select()
      .single()

    if (msgError) throw msgError

    // Actualizar estadísticas
    await supabaseAdmin.rpc('increment_widget_stats', {
      p_widget_id: widgetId,
      p_new_conversation: !input.conversationId,
    })

    // Actualizar última actividad
    await supabaseAdmin
      .from('chat_widget_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId!)

    return { conversationId: conversationId!, message }
  }

  /**
   * Obtener mensajes de una conversación
   */
  async getMessages(widgetId: string, conversationId: string): Promise<ChatWidgetMessage[]> {
    // Verificar que la conversación pertenece al widget
    const { data: conversation } = await supabaseAdmin
      .from('chat_widget_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('widget_id', widgetId)
      .single()

    if (!conversation) throw new Error('Conversation not found')

    const { data, error } = await supabaseAdmin
      .from('chat_widget_messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Obtener estadísticas del widget
   */
  async getStats(widgetId: string, userId: string): Promise<{
    totalConversations: number
    totalMessages: number
    activeConversations: number
  }> {
    const widget = await this.getWidget(widgetId, userId)
    if (!widget) throw new Error('Widget not found')

    const { count: activeConversations } = await supabaseAdmin
      .from('chat_widget_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('widget_id', widgetId)
      .eq('status', 'active')

    return {
      totalConversations: widget.total_conversations || 0,
      totalMessages: widget.total_messages || 0,
      activeConversations: activeConversations || 0,
    }
  }

  /**
   * Listar todas las conversaciones de todos los widgets del usuario
   */
  async listAllConversations(userId: string): Promise<{
    id: string
    widget_id: string
    widget_name: string
    visitor_id: string
    visitor_name: string | null
    visitor_email: string | null
    last_message_preview: string | null
    last_message_at: string | null
    unread_count: number
    status: string
  }[]> {
    // First get all widgets for this user
    const widgets = await this.listWidgets(userId)
    if (widgets.length === 0) return []

    const widgetIds = widgets.map(w => w.id)
    const widgetMap = new Map(widgets.map(w => [w.id, w.name]))

    // Get all conversations for these widgets
    const { data, error } = await supabaseAdmin
      .from('chat_widget_conversations')
      .select(`
        id,
        widget_id,
        visitor_id,
        visitor_name,
        visitor_email,
        status,
        last_message_at,
        created_at
      `)
      .in('widget_id', widgetIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) throw error

    // Get last message for each conversation
    const conversations = await Promise.all((data || []).map(async (conv) => {
      const { data: messages } = await supabaseAdmin
        .from('chat_widget_messages')
        .select('message')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const { count: unreadCount } = await supabaseAdmin
        .from('chat_widget_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('sender_type', 'visitor')
        .eq('is_read', false)

      return {
        id: conv.id,
        widget_id: conv.widget_id,
        widget_name: widgetMap.get(conv.widget_id) || 'Unknown Widget',
        visitor_id: conv.visitor_id,
        visitor_name: conv.visitor_name,
        visitor_email: conv.visitor_email,
        last_message_preview: messages?.[0]?.message || null,
        last_message_at: conv.last_message_at,
        unread_count: unreadCount || 0,
        status: conv.status || 'active'
      }
    }))

    return conversations
  }

  /**
   * Listar conversaciones de un widget específico
   */
  async listConversations(widgetId: string, userId: string): Promise<{
    id: string
    visitor_id: string
    visitor_name: string | null
    visitor_email: string | null
    last_message_preview: string | null
    last_message_at: string | null
    unread_count: number
    status: string
  }[]> {
    // Verify widget belongs to user
    const widget = await this.getWidget(widgetId, userId)
    if (!widget) throw new Error('Widget not found')

    const { data, error } = await supabaseAdmin
      .from('chat_widget_conversations')
      .select(`
        id,
        visitor_id,
        visitor_name,
        visitor_email,
        status,
        last_message_at
      `)
      .eq('widget_id', widgetId)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) throw error

    // Get last message and unread count for each conversation
    const conversations = await Promise.all((data || []).map(async (conv) => {
      const { data: messages } = await supabaseAdmin
        .from('chat_widget_messages')
        .select('message')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const { count: unreadCount } = await supabaseAdmin
        .from('chat_widget_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('sender_type', 'visitor')
        .eq('is_read', false)

      return {
        id: conv.id,
        visitor_id: conv.visitor_id,
        visitor_name: conv.visitor_name,
        visitor_email: conv.visitor_email,
        last_message_preview: messages?.[0]?.message || null,
        last_message_at: conv.last_message_at,
        unread_count: unreadCount || 0,
        status: conv.status || 'active'
      }
    }))

    return conversations
  }

  /**
   * Generar código de embed
   */
  generateEmbedCode(widgetId: string, backendUrl: string, frontendUrl: string): string {
    const apiUrl = backendUrl.replace(/\/$/, '')
    const loaderUrl = frontendUrl.replace(/\/$/, '')
    
    return `<!-- Whahook Chat Widget -->
<script>
  (function() {
    window.WhahookWidget = {
      widgetId: '${widgetId}',
      apiUrl: '${apiUrl}'
    };
    var script = document.createElement('script');
    script.src = '${loaderUrl}/widget/loader.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<!-- End Whahook Chat Widget -->`
  }
}

export const chatWidgetService = new ChatWidgetService()
