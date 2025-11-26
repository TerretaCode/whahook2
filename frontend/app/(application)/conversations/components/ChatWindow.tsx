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
  const showStarters = messages.length === 0 && !isLoading
  const { on, off } = useSocket()

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

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await ApiClient.request(`/api/whatsapp/conversations/${conversationId}/messages`)
      
      if (response.success && response.data) {
        const mapped = (response.data as ApiMessage[]).map((msg): Message => ({
          id: msg.id,
          content: msg.content || msg.body || '',
          timestamp: msg.created_at || msg.timestamp,
          isOwn: msg.direction === 'outgoing' || msg.from_me,
          status: (msg.status as 'sent' | 'delivered' | 'read') || 'sent',
          type: (msg.type as 'text' | 'image' | 'file') || 'text'
        }))
        setMessages(mapped)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchConversation()
    fetchMessages()
    
    // Polling cada 5 segundos para nuevos mensajes (fallback si socket falla)
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [conversationId, fetchConversation, fetchMessages])

  // Escuchar eventos de socket para actualizaciones en tiempo real
  useEffect(() => {
    // Nuevo mensaje
    const handleNewMessage = (data: { conversationId: string; message: { id: string; content: string; direction: string; timestamp: string } }) => {
      if (data.conversationId === conversationId) {
        const newMsg: Message = {
          id: data.message.id,
          content: data.message.content,
          timestamp: data.message.timestamp,
          isOwn: data.message.direction === 'outgoing',
          status: 'sent',
          type: 'text'
        }
        setMessages(prev => {
          // Evitar duplicados
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
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
  }, [conversationId, on, off])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]"></div>
          </div>
        ) : (
          <>
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
