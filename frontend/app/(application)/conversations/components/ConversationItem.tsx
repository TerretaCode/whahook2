"use client"

import { useState, useEffect, memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle } from "lucide-react"
import { ApiClient } from "@/lib/api-client"

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
}

interface ConversationItemProps {
  conversation: Conversation
  isSelected?: boolean
  onClick: () => void
}

// Cache de fotos de perfil para evitar requests repetidos
const profilePicCache = new Map<string, string | null>()

function ConversationItemComponent({ conversation, isSelected, onClick }: ConversationItemProps) {
  const [profilePic, setProfilePic] = useState<string | null>(conversation.avatar || null)

  // Cargar foto de perfil desde WhatsApp si no hay avatar guardado
  useEffect(() => {
    if (conversation.avatar || !conversation.phone) return
    
    // Verificar cache primero
    const cached = profilePicCache.get(conversation.phone)
    if (cached !== undefined) {
      setProfilePic(cached)
      return
    }

    // Cargar desde API (lazy loading)
    const loadProfilePic = async () => {
      try {
        const response = await ApiClient.request(`/api/whatsapp/profile-pic/${conversation.phone}`)
        const data = response.data as { url?: string } | undefined
        const url = response.success && data?.url ? data.url : null
        profilePicCache.set(conversation.phone, url)
        setProfilePic(url)
      } catch {
        profilePicCache.set(conversation.phone, null)
      }
    }

    // Delay para evitar muchas requests simultáneas
    const timer = setTimeout(loadProfilePic, Math.random() * 500)
    return () => clearTimeout(timer)
  }, [conversation.phone, conversation.avatar])

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors ${
        isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={profilePic || undefined} />
          <AvatarFallback className="bg-green-600 text-white font-semibold">
            {conversation.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {conversation.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {conversation.name}
            </h3>
            {conversation.needsAttention && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
            {conversation.timestamp}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 truncate flex-1">
            {conversation.lastMessage}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="ml-2 bg-green-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Memoize to prevent re-renders when parent list updates
export const ConversationItem = memo(ConversationItemComponent, (prev, next) => {
  return (
    prev.conversation.id === next.conversation.id &&
    prev.conversation.lastMessage === next.conversation.lastMessage &&
    prev.conversation.unreadCount === next.conversation.unreadCount &&
    prev.conversation.needsAttention === next.conversation.needsAttention &&
    prev.isSelected === next.isSelected
  )
})

