"use client"

import { Zap } from "lucide-react"

interface QuickRepliesProps {
  replies: string[]
  onSelect: (reply: string) => void
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
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
            onClick={() => onSelect(reply)}
            className="flex-shrink-0 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all duration-200"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  )
}
