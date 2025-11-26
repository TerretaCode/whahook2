"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { ChatInput } from "./ChatInput"
import { ConversationStarters } from "./ConversationStarters"
import { QuickReplies } from "./QuickReplies"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { useSocket } from "@/hooks/whatsapp/useSocket"

interface Message {
  id: string
  content: string
  timestamp: string
  isOwn: boolean
  status?: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file'
}

interface ApiMessage {
  id: string
  content: string | null
  body: string | null
  created_at: string
  timestamp: string
  direction: string
  from_me: boolean
  status: string
  type: string
}

interface ApiConversation {
  id: string
  contact_name: string | null
  contact_phone: string | null
  contact_avatar: string | null
  contact_avatar_url: string | null
  is_online: boolean
  chatbot_enabled: boolean
}

interface ChatWindowProps {
  conversationId: string
  onBack?: () => void
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [chatbotEnabled, setChatbotEnabled] = useState(true)
  const [conversationInfo, setConversationInfo] = useState({
    name: '',
    phone: '',
    avatar: '',
    isOnline: false,
    source: 'whatsapp' as 'whatsapp' | 'web'
  })
  const [chatbotConfig, setChatbotConfig] = useState<{
    conversation_starters?: string[]
    quick_replies?: string[]
  }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const isFirstLoadRef = useRef(true)
  const showStarters = messages.length === 0 && !isLoading
  const { on, off } = useSocket()

  // Scroll instantáneo al bottom (sin animación) - para carga inicial
  const scrollToBottomInstant = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  // Scroll suave al bottom - para mensajes nuevos
  const scrollToBottomSmooth = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Verificar si el usuario está cerca del bottom
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true
    const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current
    return scrollHeight - scrollTop - clientHeight < 150
  }, [])

  const fetchConversation = useCallback(async () => {
    try {
      const response = await ApiClient.request(`/api/whatsapp/conversations/${conversationId}`)
      
      if (response.success && response.data) {
        const conv = response.data as ApiConversation
        setConversationInfo({
          name: conv.contact_name || conv.contact_phone || 'Unknown',
          phone: conv.contact_phone || '',
          avatar: conv.contact_avatar || '',
          isOnline: conv.is_online || false,
          source: 'whatsapp'
        })
        setChatbotEnabled(conv.chatbot_enabled ?? true)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }, [conversationId])

  const mapApiMessage = (msg: ApiMessage): Message => ({
    id: msg.id,
    content: msg.content || msg.body || '',
    timestamp: msg.created_at || msg.timestamp,
    isOwn: msg.direction === 'outgoing' || msg.from_me,
    status: (msg.status as 'sent' | 'delivered' | 'read') || 'sent',
    type: (msg.type as 'text' | 'image' | 'file') || 'text'
  })

  const fetchMessages = useCallback(async (isInitial = true) => {
    try {
      if (isInitial) {
        setIsLoading(true)
        setHasMoreMessages(true)
      }
      
      const response = await ApiClient.request(`/api/whatsapp/conversations/${conversationId}/messages?limit=50`)
      
      if (response.success && response.data) {
        const data = response.data as ApiMessage[]
        const newMessages = data.map(mapApiMessage)
        
        if (isInitial) {
          setMessages(newMessages)
          setHasMoreMessages(data.length >= 50)
        } else {
          // Polling: solo añadir mensajes nuevos al final, sin borrar los antiguos
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const trulyNew = newMessages.filter(m => !existingIds.has(m.id))
            if (trulyNew.length > 0) {
              // Añadir solo los mensajes que son más recientes
              const lastExisting = prev[prev.length - 1]?.timestamp
              const newerMessages = trulyNew.filter(m => !lastExisting || m.timestamp > lastExisting)
              return newerMessages.length > 0 ? [...prev, ...newerMessages] : prev
            }
            return prev
          })
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (isInitial) setIsLoading(false)
    }
  }, [conversationId])

  // Ref para el timestamp más antiguo (evita dependencia de messages en useCallback)
  const oldestTimestampRef = useRef<string | null>(null)
  
  // Actualizar ref cuando cambian los mensajes
  useEffect(() => {
    if (messages.length > 0) {
      oldestTimestampRef.current = messages[0].timestamp
    }
  }, [messages])

  // Cargar mensajes más antiguos (solo con botón)
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || !oldestTimestampRef.current) return
    
    setIsLoadingMore(true)
    const scrollHeightBefore = messagesContainerRef.current?.scrollHeight || 0
    
    try {
      const response = await ApiClient.request(
        `/api/whatsapp/conversations/${conversationId}/messages?limit=50&before=${encodeURIComponent(oldestTimestampRef.current)}`
      )
      
      if (response.success && response.data) {
        const data = response.data as ApiMessage[]
        
        if (data.length > 0) {
          const newMessages = data.map(mapApiMessage)
          setMessages(prev => [...newMessages, ...prev])
          setHasMoreMessages(data.length >= 50)
          
          // Mantener posición de scroll después de añadir mensajes arriba
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              const newScrollHeight = messagesContainerRef.current.scrollHeight
              messagesContainerRef.current.scrollTop = newScrollHeight - scrollHeightBefore
            }
          })
        } else {
          setHasMoreMessages(false)
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [conversationId, isLoadingMore, hasMoreMessages])

  useEffect(() => {
    // Reset cuando cambia la conversación
    isFirstLoadRef.current = true
    setMessages([])
    setHasMoreMessages(true)
    
    fetchConversation()
    fetchMessages(true) // Carga inicial
    
    // Polling cada 5 segundos para nuevos mensajes (fallback si socket falla)
    const interval = setInterval(() => fetchMessages(false), 5000)
    return () => clearInterval(interval)
  }, [conversationId, fetchConversation, fetchMessages])

  // Scroll instantáneo al bottom después de la carga inicial (como WhatsApp)
  useEffect(() => {
    if (isFirstLoadRef.current && messages.length > 0 && !isLoading) {
      // Usar setTimeout para asegurar que el DOM está actualizado
      setTimeout(() => {
        scrollToBottomInstant()
        isFirstLoadRef.current = false
      }, 0)
    }
  }, [messages, isLoading, scrollToBottomInstant])

  // Escuchar eventos de socket para actualizaciones en tiempo real
  useEffect(() => {
    // Nuevo mensaje - hacer scroll suave si estamos cerca del bottom
    const handleNewMessage = (data: { conversationId: string; message: { id: string; content: string; direction: string; timestamp: string } }) => {
      if (data.conversationId === conversationId) {
        const wasNearBottom = isNearBottom()
        const newMsg: Message = {
          id: data.message.id,
          content: data.message.content,
          timestamp: data.message.timestamp,
          isOwn: data.message.direction === 'outgoing',
          status: 'sent',
          type: 'text'
        }
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        // Scroll suave solo si estábamos cerca del bottom
        if (wasNearBottom) {
          setTimeout(() => scrollToBottomSmooth(), 100)
        }
      }
    }

    // Cambio de estado de mensaje (ack)
    const handleMessageAck = (data: { messageId: string; status: string }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, status: data.status as 'sent' | 'delivered' | 'read' }
          : msg
      ))
    }

    on('whatsapp:message', handleNewMessage)
    on('whatsapp:message_ack', handleMessageAck)

    return () => {
      off('whatsapp:message', handleNewMessage)
      off('whatsapp:message_ack', handleMessageAck)
    }
  }, [conversationId, on, off, isNearBottom, scrollToBottomSmooth])

  const handleSendMessage = async (content: string) => {
    if (isSending) return
    
    setIsSending(true)
    
    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const newMessage: Message = {
      id: tempId,
      content,
      timestamp: new Date().toISOString(),
      isOwn: true,
      status: 'sent',
      type: 'text'
    }
    setMessages(prev => [...prev, newMessage])
    
    // Scroll al enviar mensaje
    setTimeout(() => scrollToBottomSmooth(), 100)

    try {
      const response = await ApiClient.request(`/api/whatsapp/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      })

      if (response.success) {
        // Actualizar mensaje con ID real
        if (response.data) {
          setMessages(prev => prev.map(msg => 
            msg.id === tempId ? { ...msg, id: (response.data as { id: string }).id } : msg
          ))
        }
        
        // Desactivar chatbot (siempre se desactiva al enviar mensaje manual)
        const responseData = response as { chatbot_disabled?: boolean }
        if (responseData.chatbot_disabled) {
          setChatbotEnabled(false)
          toast.info('Chatbot Disabled', 'Manual mode activated for this conversation')
        }
      } else {
        // Revertir optimistic update
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        toast.error('Error', 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      toast.error('Error', 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleToggleChatbot = async (enabled: boolean) => {
    try {
      const response = await ApiClient.request(`/api/whatsapp/conversations/${conversationId}/chatbot`, {
        method: 'PUT',
        body: JSON.stringify({ enabled })
      })

      if (response.success) {
        setChatbotEnabled(enabled)
        toast.success(
          enabled ? 'Chatbot Enabled' : 'Chatbot Disabled',
          enabled ? 'AI will respond to messages' : 'Manual mode activated'
        )
      }
    } catch (error) {
      console.error('Error toggling chatbot:', error)
      toast.error('Error', 'Failed to update chatbot status')
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#E5DDD5]">
      {/* Header */}
      <ChatHeader
        name={conversationInfo.name}
        avatar={conversationInfo.avatar}
        isOnline={conversationInfo.isOnline}
        source={conversationInfo.source}
        chatbotEnabled={chatbotEnabled}
        onToggleChatbot={handleToggleChatbot}
        onBack={onBack}
      />

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
          </div>
        ) : (
          <>
            {/* Botón para cargar más mensajes antiguos */}
            {hasMoreMessages && messages.length > 0 && (
              <button
                onClick={loadMoreMessages}
                disabled={isLoadingMore}
                className="w-full py-3 mb-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 font-medium rounded-lg border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    Cargando...
                  </>
                ) : (
                  '↑ Cargar mensajes anteriores'
                )}
              </button>
            )}
            {showStarters && (
              <ConversationStarters
                starters={chatbotConfig.conversation_starters || []}
                onSelect={handleSendMessage}
              />
            )}
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Replies */}
      {!isLoading && messages.length > 0 && (
        <QuickReplies
          replies={chatbotConfig.quick_replies || []}
          onSelect={handleSendMessage}
        />
      )}

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
    </div>
  )
}
