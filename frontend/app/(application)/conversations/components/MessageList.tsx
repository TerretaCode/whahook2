"use client"

import { memo } from "react"
import { MessageItem } from "./MessageItem"

interface Message {
  id: string
  content: string
  timestamp: string
  isOwn: boolean
  status?: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file'
}

interface MessageListProps {
  messages: Message[]
}

function MessageListComponent({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-center">
          No messages yet<br />
          <span className="text-sm">Start the conversation</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  )
}

// Memoize to prevent re-renders when parent updates
export const MessageList = memo(MessageListComponent)
