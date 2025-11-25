"use client"

import { useState, useEffect } from "react"
import { Search, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ConversationItem } from "./ConversationItem"

interface Conversation {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  source: 'whatsapp' | 'web'
  needsAttention: boolean
  isOnline: boolean
}

interface ConversationListProps {
  selectedConversationId?: string | null
  onSelectConversation: (id: string) => void
}

export function ConversationList({ selectedConversationId, onSelectConversation }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<'all' | 'whatsapp' | 'web' | 'attention'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    filterConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, activeFilter, searchQuery])

  // Marcar conversación como leída cuando se selecciona
  const handleSelectConversation = (id: string) => {
    // Actualizar el contador a 0 para la conversación seleccionada
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, unreadCount: 0 } : conv
    ))
    onSelectConversation(id)
  }

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement real API call
      // const response = await ApiClient.request('/api/conversations')
      // setConversations(response.data)
      
      setConversations([])
      setIsLoading(false)
    } catch {
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

  const filters = [
    { id: 'all', label: 'All', count: conversations.length },
    { id: 'whatsapp', label: 'Phone', count: conversations.filter(c => c.source === 'whatsapp').length },
    { id: 'web', label: 'Web', count: conversations.filter(c => c.source === 'web').length },
    { id: 'attention', label: 'Attention', count: conversations.filter(c => c.needsAttention).length },
  ]

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
