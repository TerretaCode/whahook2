"use client"

import { memo, useMemo } from "react"
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

function MessageItemComponent({ message }: MessageItemProps) {
  const formattedTime = useMemo(() => {
    const date = new Date(message.timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }, [message.timestamp])

  const statusIcon = useMemo(() => {
    if (!message.isOwn) return null

    if (message.status === 'read') {
      return <CheckCheck className="w-4 h-4 text-green-500" />
    } else if (message.status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-500" />
    } else {
      return <Check className="w-4 h-4 text-gray-500" />
    }
  }, [message.isOwn, message.status])

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`max-w-[75%] md:max-w-[65%] rounded-lg px-3 py-2 overflow-hidden ${
          message.isOwn
            ? 'bg-[#DCF8C6]'
            : 'bg-white'
        } shadow-sm`}
      >
        <p className="text-sm text-gray-900 break-all whitespace-pre-wrap font-[system-ui]" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-gray-500">
            {formattedTime}
          </span>
          {statusIcon}
        </div>
      </div>
    </div>
  )
}

// Memoize to prevent re-renders when parent updates
export const MessageItem = memo(MessageItemComponent, (prevProps, nextProps) => {
  // Only re-render if message content or status changed
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status
  )
})

