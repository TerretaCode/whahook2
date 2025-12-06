'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiClient } from '@/lib/api-client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface HumanAttentionBannerProps {
  conversationId: string
  fallbackType: 'uncertainty' | 'human_request' | null
  onResume?: () => void
}

export function HumanAttentionBanner({ 
  conversationId, 
  fallbackType,
  onResume 
}: HumanAttentionBannerProps) {
  const t = useTranslations('conversations.humanAttention')
  const [isResuming, setIsResuming] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!fallbackType || dismissed) return null

  const resumeAI = async () => {
    setIsResuming(true)
    try {
      // Resume AI via backend API
      const response = await ApiClient.post(`/api/conversations/${conversationId}/resume-ai`)

      if (!response.success) {
        throw new Error(response.error || 'Failed to resume AI')
      }

      // Success
      setDismissed(true)
      if (onResume) onResume()
    } catch {
      alert(t('resumeError'))
    } finally {
      setIsResuming(false)
    }
  }

  const getMessage = () => {
    if (fallbackType === 'uncertainty') {
      return {
        title: t('uncertaintyTitle'),
        description: t('uncertaintyDesc'),
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      }
    } else {
      return {
        title: t('humanRequestTitle'),
        description: t('humanRequestDesc'),
        icon: <AlertCircle className="w-5 h-5 text-orange-600" />,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800'
      }
    }
  }

  const message = getMessage()

  return (
    <div className={cn(
      "border rounded-lg p-4 mb-4",
      message.bgColor,
      message.borderColor
    )}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {message.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold mb-1", message.textColor)}>
            {message.title}
          </h3>
          <p className={cn("text-sm mb-3", message.textColor)}>
            {message.description}
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={resumeAI}
              disabled={isResuming}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isResuming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('resuming')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('resumeAI')}
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setDismissed(true)}
              variant="ghost"
              size="sm"
              className={message.textColor}
            >
              <X className="w-4 h-4 mr-1" />
              {t('close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

