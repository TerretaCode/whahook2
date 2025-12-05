"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Search, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ConversationItem } from "./ConversationItem"
import { ApiClient } from "@/lib/api-client"

// Polling adaptativo: más rápido cuando hay actividad, más lento cuando no
const POLL_INTERVAL_ACTIVE = 5000   // 5s cuando hay actividad reciente
const POLL_INTERVAL_IDLE = 30000    // 30s cuando no hay actividad

interface Conversation {
  id: string
  name: string
  phone: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  source: 'whatsapp' | 'web'
  needsAttention: boolean
  isOnline: boolean
  chatbotEnabled: boolean
}

interface ApiConversation {
  id: string
  contact_name: string | null
  contact_phone: string | null
  contact_avatar: string | null
  last_message_preview: string | null
  last_message_at: string | null
  unread_count: number
  is_online: boolean
  needs_attention: boolean
  chatbot_enabled: boolean
}

interface ConversationListProps {
  selectedConversationId?: string | null
  onSelectConversation: (id: string) => void
  initialFilter?: 'all' | 'whatsapp' | 'web' | 'attention'
}

export function ConversationList({ selectedConversationId, onSelectConversation, initialFilter = 'all' }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<'all' | 'whatsapp' | 'web' | 'attention'>(initialFilter)
  const [isLoading, setIsLoading] = useState(true)
  const lastActivityRef = useRef<number>(Date.now())
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Polling adaptativo
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    
    const poll = () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current
      const interval = timeSinceActivity < 60000 ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE
      
      pollIntervalRef.current = setTimeout(async () => {
        await fetchConversations()
        poll()
      }, interval)
    }
    
    poll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Detectar actividad del usuario
  useEffect(() => {
    const handleActivity = () => { lastActivityRef.current = Date.now() }
    window.addEventListener('focus', handleActivity)
    window.addEventListener('click', handleActivity)
    return () => {
      window.removeEventListener('focus', handleActivity)
      window.removeEventListener('click', handleActivity)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    startPolling()
    return () => { if (pollIntervalRef.current) clearTimeout(pollIntervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startPolling])

  useEffect(() => {
    filterConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, activeFilter, searchQuery])

  // Marcar conversación como leída cuando se selecciona
  const handleSelectConversation = useCallback(async (id: string) => {
    // Actualizar el contador a 0 para la conversación seleccionada
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, unreadCount: 0 } : conv
    ))
    onSelectConversation(id)
    
    // Marcar como leída en el backend
    try {
      await ApiClient.request(`/api/whatsapp/conversations/${id}/read`, { method: 'PUT' })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [onSelectConversation])

  // Web conversation interface - moved outside component for clarity
  interface WebConversation {
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
  }

  const fetchConversations = async () => {
    try {
      // Fetch both WhatsApp and Web conversations in parallel for better performance
      const [whatsappResponse, webResponse] = await Promise.allSettled([
        ApiClient.request('/api/whatsapp/conversations'),
        ApiClient.request('/api/chat-widgets/conversations/all')
      ])
      
      let allConversations: Conversation[] = []
      
      // Process WhatsApp conversations
      if (whatsappResponse.status === 'fulfilled' && whatsappResponse.value.success && whatsappResponse.value.data) {
        const whatsappMapped = (whatsappResponse.value.data as ApiConversation[]).map((conv): Conversation => ({
          id: conv.id,
          name: conv.contact_name || conv.contact_phone || 'Unknown',
          phone: conv.contact_phone || '',
          avatar: conv.contact_avatar || undefined,
          lastMessage: conv.last_message_preview || '',
          timestamp: conv.last_message_at || '',
          unreadCount: conv.id === selectedConversationId ? 0 : (conv.unread_count || 0),
          source: 'whatsapp',
          needsAttention: conv.needs_attention || false,
          isOnline: conv.is_online || false,
          chatbotEnabled: conv.chatbot_enabled ?? true,
        }))
        allConversations = [...whatsappMapped]
      }

      // Process Web Widget conversations
      if (webResponse.status === 'fulfilled' && webResponse.value.success && webResponse.value.data) {
        const webMapped = (webResponse.value.data as WebConversation[]).map((conv): Conversation => ({
          id: `web_${conv.id}`,
          name: conv.visitor_name || conv.visitor_email || `Visitor ${conv.visitor_id.slice(-6)}`,
          phone: conv.visitor_email || '',
          avatar: undefined,
          lastMessage: conv.last_message_preview || '',
          timestamp: conv.last_message_at || '',
          unreadCount: conv.id === selectedConversationId?.replace('web_', '') ? 0 : (conv.unread_count || 0),
          source: 'web',
          needsAttention: conv.unread_count > 0,
          isOnline: false,
          chatbotEnabled: true,
        }))
        allConversations = [...allConversations, ...webMapped]
      }

      // Sort all conversations by timestamp
      allConversations.sort((a, b) => {
        if (!a.timestamp) return 1
        if (!b.timestamp) return -1
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })

      setConversations(allConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterConversations = () => {
    let filtered = conversations

    // Filter by type
    if (activeFilter === 'whatsapp') {
      filtered = filtered.filter(c => c.source === 'whatsapp')
    } else if (activeFilter === 'web') {
      filtered = filtered.filter(c => c.source === 'web')
    } else if (activeFilter === 'attention') {
      filtered = filtered.filter(c => c.needsAttention)
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredConversations(filtered)
  }

  const filters = useMemo(() => [
    { id: 'all', label: 'All', count: conversations.length },
    { id: 'whatsapp', label: 'Phone', count: conversations.filter(c => c.source === 'whatsapp').length },
    { id: 'web', label: 'Web', count: conversations.filter(c => c.source === 'web').length },
    { id: 'attention', label: 'Attention', count: conversations.filter(c => c.needsAttention).length },
  ], [conversations])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-200">
        <h1 className="text-gray-900 text-xl font-semibold">Chats</h1>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 border-none text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 rounded-lg"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-3 py-2 bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as 'all' | 'whatsapp' | 'web' | 'attention')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label} {filter.count > 0 && `(${filter.count})`}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium mb-1">No conversations</p>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'No results found' : 'Start a new conversation'}
            </p>
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              onClick={() => handleSelectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
