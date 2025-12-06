"use client"

import { memo, useCallback } from "react"
import { useTranslations } from 'next-intl'
import { ArrowLeft, Bot, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface ChatHeaderProps {
  name: string
  avatar?: string
  isOnline: boolean
  source: 'whatsapp' | 'web'
  chatbotEnabled: boolean
  onToggleChatbot: (enabled: boolean) => void
  onBack?: () => void
}

function ChatHeaderComponent({ 
  name, 
  avatar, 
  isOnline, 
  source, 
  chatbotEnabled, 
  onToggleChatbot, 
  onBack 
}: ChatHeaderProps) {
  const t = useTranslations('conversations.chatHeader')

  const handleToggle = useCallback(() => {
    onToggleChatbot(!chatbotEnabled)
  }, [chatbotEnabled, onToggleChatbot])

  return (
    <div className="bg-[#F0F2F5] px-4 py-2 border-b border-gray-300 flex items-center gap-3">
      {/* Back button (mobile) */}
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}

      {/* Avatar */}
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-[#25D366] text-white font-semibold">
            {name ? name.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-gray-900 truncate">{name || t('unknown')}</h2>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-600">
            {isOnline ? t('online') : t('offline')}
          </p>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            source === 'whatsapp' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {source === 'whatsapp' ? t('phone') : t('web')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* AI/Manual Toggle */}
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            chatbotEnabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          }`}
          title={chatbotEnabled ? t('clickToDisable') : t('clickToEnable')}
        >
          {chatbotEnabled ? (
            <>
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">{t('aiOn')}</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('manual')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export const ChatHeader = memo(ChatHeaderComponent)

