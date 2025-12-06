"use client"

import { useState, useCallback, memo } from "react"
import { useTranslations } from 'next-intl'
import { Send, Paperclip, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
}

function ChatInputComponent({ onSendMessage, disabled = false }: ChatInputProps) {
  const t = useTranslations('conversations.chatInput')
  const [message, setMessage] = useState("")

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }, [message, disabled, onSendMessage])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (message.trim() && !disabled) {
        onSendMessage(message.trim())
        setMessage("")
      }
    }
  }, [message, disabled, onSendMessage])

  return (
    <div className="bg-[#F0F2F5] px-4 py-3 border-t border-gray-300">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Emoji Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-gray-900"
        >
          <Smile className="w-6 h-6" />
        </Button>

        {/* Attachment Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-gray-900"
        >
          <Paperclip className="w-6 h-6" />
        </Button>

        {/* Input */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('placeholder')}
            rows={1}
            className="w-full px-4 py-2 bg-white rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-[#25D366] resize-none max-h-32"
            style={{
              minHeight: '40px',
              maxHeight: '128px',
            }}
          />
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          size="icon"
          className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
          disabled={!message.trim() || disabled}
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  )
}

export const ChatInput = memo(ChatInputComponent)

