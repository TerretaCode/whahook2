"use client"

import { memo, useCallback } from "react"
import { Zap } from "lucide-react"

interface QuickRepliesProps {
  replies: string[]
  onSelect: (reply: string) => void
}

function QuickRepliesComponent({ replies, onSelect }: QuickRepliesProps) {
  const handleClick = useCallback((reply: string) => {
    onSelect(reply)
  }, [onSelect])

  if (!replies || replies.length === 0) {
    return null
  }

  return (
    <div className="px-4 pb-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Zap className="w-4 h-4 text-gray-500 flex-shrink-0" />
        {replies.map((reply, index) => (
          <button
            key={index}
            onClick={() => handleClick(reply)}
            className="flex-shrink-0 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-all duration-200"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  )
}

export const QuickReplies = memo(QuickRepliesComponent)

