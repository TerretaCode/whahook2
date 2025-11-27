"use client"

import { useState, useEffect } from "react"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { 
  Loader2,
  Globe,
  ChevronDown,
  ChevronUp,
  Bot,
  AlertCircle,
  Pause,
  Play,
  TestTube,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/lib/toast"

interface ChatWidget {
  id: string
  name: string
  domain: string
  primary_color: string
  is_active: boolean
}

interface WebChatbotConfigProps {
  selectedWidgetId?: string | null
}

export function WebChatbotConfig({ selectedWidgetId }: WebChatbotConfigProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<ChatWidget[]>([])
  const [expandedWidget, setExpandedWidget] = useState<string | null>(selectedWidgetId || null)

  useEffect(() => {
    fetchWidgets()
  }, [])

  useEffect(() => {
    if (selectedWidgetId) {
      setExpandedWidget(selectedWidgetId)
    }
  }, [selectedWidgetId])

  const fetchWidgets = async () => {
    try {
      const response = await ApiClient.request('/api/chat-widgets')
      if (response.success) {
        setWidgets(response.data as ChatWidget[])
      }
    } catch (error) {
      console.error('Error fetching widgets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleWidgetActive = async (widgetId: string, currentlyActive: boolean) => {
    setIsToggling(widgetId)
    try {
      const response = await ApiClient.request(`/api/chat-widgets/${widgetId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentlyActive })
      })
      
      if (response.success) {
        setWidgets(prev => prev.map(w => 
          w.id === widgetId ? { ...w, is_active: !currentlyActive } : w
        ))
        toast.success(
          !currentlyActive ? 'IA Activada' : 'IA Pausada',
          !currentlyActive 
            ? 'El chatbot responderá automáticamente' 
            : 'El chatbot no responderá hasta que lo reactives'
        )
      }
    } catch (error) {
      console.error('Error toggling widget:', error)
      toast.error('Error', 'No se pudo cambiar el estado del chatbot')
    } finally {
      setIsToggling(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (widgets.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Chatbots Web</h3>
        <p className="text-sm text-gray-600 mb-4">
          First, create a Chatbot Web in the Connections section
        </p>
        <Link href="/settings/connections">
          <Button className="bg-green-600 hover:bg-green-700">
            Go to Connections
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Chatbot Web Configuration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure the AI behavior for your web chatbots
          </p>
        </div>
      </div>

      {/* Widget List */}
      <div className="space-y-3">
        {widgets.map((widget) => {
          const isExpanded = expandedWidget === widget.id

          return (
            <div 
              key={widget.id} 
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              {/* Widget Header */}
              <button
                onClick={() => setExpandedWidget(isExpanded ? null : widget.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: widget.primary_color + '20' }}
                  >
                    <Bot className="w-5 h-5" style={{ color: widget.primary_color }} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">{widget.name}</h4>
                    {widget.domain && (
                      <p className="text-sm text-gray-500">{widget.domain}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Pause/Resume Button */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleWidgetActive(widget.id, widget.is_active)
                    }}
                    variant={!widget.is_active ? "default" : "outline"}
                    size="sm"
                    disabled={isToggling === widget.id}
                    className={!widget.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {isToggling === widget.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : !widget.is_active ? (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Reanudar IA
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Pausar IA
                      </>
                    )}
                  </Button>
                  
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    !widget.is_active 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {!widget.is_active ? '⏸ Pausado' : '✓ Activo'}
                  </span>
                  
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Configuration */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-6">
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Configuration Coming Soon
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        The AI configuration for Chatbot Web is under development. 
                        For now, the chatbot uses the same AI settings as your WhatsApp chatbot.
                      </p>
                    </div>
                  </div>

                  {/* Placeholder for future configuration */}
                  <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-500 text-center">
                      AI prompt configuration will appear here
                    </p>
                  </div>

                  {/* Test Bot Button */}
                  <div className="mt-4 flex gap-2">
                    <Link href={`/config/chatbot/test-web?widgetId=${widget.id}`}>
                      <Button 
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Probar Bot
                      </Button>
                    </Link>
                    {widget.domain && (
                      <a 
                        href={widget.domain.startsWith('http') ? widget.domain : `https://${widget.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button 
                          variant="outline"
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver en sitio
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
