"use client"

import { Check, CheckCheck } from "lucide-react"

interface Message {
  id: string
  content: string
  timestamp: string
  isOwn: boolean
  status?: 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file'
}

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const getStatusIcon = () => {
    if (!message.isOwn) return null

    if (message.status === 'read') {
      return <CheckCheck className="w-4 h-4 text-blue-500" />
    } else if (message.status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-500" />
    } else {
      return <Check className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] md:max-w-[65%] rounded-lg px-3 py-2 ${
          message.isOwn
            ? 'bg-[#DCF8C6]'
            : 'bg-white'
        } shadow-sm`}
      >
        <p className="text-sm text-gray-900 break-words whitespace-pre-wrap font-[system-ui]">
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  )
}
