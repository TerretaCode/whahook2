"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle } from "lucide-react"

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

interface ConversationItemProps {
  conversation: Conversation
  isSelected?: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
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
          <AvatarImage src={conversation.avatar} />
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
