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
   * Generar código de embed
   */
  generateEmbedCode(widgetId: string, backendUrl: string): string {
    const url = backendUrl.replace(/\/$/, '')
    
    return `<!-- Whahook Chat Widget -->
<script>
  (function() {
    window.WhahookWidget = {
      widgetId: '${widgetId}',
      apiUrl: '${url}'
    };
    var script = document.createElement('script');
    script.src = '${url}/widget/loader.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<!-- End Whahook Chat Widget -->`
  }
}

export const chatWidgetService = new ChatWidgetService()
