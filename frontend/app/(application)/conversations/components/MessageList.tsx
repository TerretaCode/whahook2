"use client"

import { memo } from "react"
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('conversations.messageList')
  
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-center">
          {t('noMessages')}<br />
          <span className="text-sm">{t('startConversation')}</span>
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

