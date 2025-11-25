"use client"

import { useState, useEffect, useRef } from "react"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { ChatInput } from "./ChatInput"
import { ConversationStarters } from "./ConversationStarters"
import { QuickReplies } from "./QuickReplies"

interface Message {
  id: string
  content: string
  timestamp: string
  isOwn: boolean
  status?: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file'
}

interface ChatWindowProps {
  conversationId: string
  onBack?: () => void
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [conversationInfo, setConversationInfo] = useState({
    name: '',
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

  useEffect(() => {
    fetchConversation()
    fetchMessages()
    fetchChatbotConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const fetchConversation = async () => {
    try {
      // TODO: Implement real API call
      // const response = await ApiClient.request(`/api/conversations/${conversationId}`)
      // setConversationInfo(response.data)
      
      setConversationInfo({
        name: '',
        avatar: '',
        isOnline: false,
        source: 'whatsapp'
      })
    } catch {
      // Silently fail
    }
  }

  const fetchChatbotConfig = async () => {
    try {
      const response = await fetch(`/api/chatbot/conversation/${conversationId}/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setChatbotConfig(result.data)
        }
      }
    } catch {
      // Silently fail - config is optional
    }
  }

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement real API call
      // const response = await ApiClient.request(`/api/conversations/${conversationId}/messages`)
      // setMessages(response.data)
      
      setMessages([])
      setIsLoading(false)
    } catch {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (content: string) => {
    try {
      // TODO: Implement real API call
      // await ApiClient.request(`/api/conversations/${conversationId}/messages`, {
      //   method: 'POST',
      //   body: JSON.stringify({ content })
      // })

      // Optimistic update
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        timestamp: new Date().toISOString(),
        isOwn: true,
        status: 'sent',
        type: 'text'
      }
      setMessages(prev => [...prev, newMessage])
    } catch {
      // Silently fail
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
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  )
}
