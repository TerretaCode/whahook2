"use client"

import { memo, useCallback } from "react"
import { useTranslations } from 'next-intl'
import { MessageSquare } from "lucide-react"

interface ConversationStartersProps {
  starters: string[]
  onSelect: (starter: string) => void
}

function ConversationStartersComponent({ starters, onSelect }: ConversationStartersProps) {
  const t = useTranslations('conversations.starters')
  const handleClick = useCallback((starter: string) => {
    onSelect(starter)
  }, [onSelect])

  if (!starters || starters.length === 0) {
    return null
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium">{t('title')}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {starters.map((starter, index) => (
          <button
            key={index}
            onClick={() => handleClick(starter)}
            className="text-left p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
          >
            <p className="text-sm text-gray-700 group-hover:text-green-700">
              {starter}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

export const ConversationStarters = memo(ConversationStartersComponent)

