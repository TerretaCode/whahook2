"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Globe, MessageSquare } from "lucide-react"
import Link from "next/link"

interface ChatWidget {
  id: string
  name: string
  domain: string
  primary_color: string
  header_text: string
  welcome_message: string
}

function TestWebChatbotContent() {
  const searchParams = useSearchParams()
  const widgetId = searchParams.get('widgetId')
  
  const [widget, setWidget] = useState<ChatWidget | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [widgetLoaded, setWidgetLoaded] = useState(false)

  useEffect(() => {
    if (widgetId) {
      fetchWidget()
    }
  }, [widgetId])

  const fetchWidget = async () => {
    try {
      const response = await ApiClient.request('/api/chat-widgets')
      if (response.success) {
        const widgets = response.data as ChatWidget[]
        const found = widgets.find(w => w.id === widgetId)
        if (found) {
          setWidget(found)
        }
      }
    } catch (error) {
      console.error('Error fetching widget:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (widget && !widgetLoaded) {
      // Load the widget script dynamically
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://whahook2-production.up.railway.app'
      
      // Set widget config
      ;(window as any).WhahookWidget = {
        widgetId: widget.id,
        apiUrl: backendUrl
      }

      // Load the loader script
      const script = document.createElement('script')
      script.src = '/widget/loader.js'
      script.async = true
      script.onload = () => setWidgetLoaded(true)
      document.head.appendChild(script)

      return () => {
        // Cleanup on unmount
        const container = document.getElementById('whahook-widget-container')
        if (container) {
          container.remove()
        }
        delete (window as any).WhahookWidget
      }
    }
  }, [widget, widgetLoaded])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary, #22c55e)' }} />
      </div>
    )
  }

  if (!widget) {
    return (
      <div className="text-center py-12">
        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Widget not found</h3>
        <p className="text-sm text-gray-600 mb-4">
          The chatbot widget could not be found
        </p>
        <Link href="/settings/chatbot">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Back to Chatbot Settings
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings/chatbot">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Chatbot Web</h1>
          <p className="text-sm text-gray-600">
            Testing: <span className="font-medium">{widget.name}</span>
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Test your chatbot
            </p>
            <p className="text-sm text-green-700 mt-1">
              Click on the chat bubble in the bottom right corner to open the chat and test your bot.
              This is exactly how it will appear on your website.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="bg-gray-100 rounded-lg p-8 min-h-[500px] relative">
        <div className="text-center text-gray-500">
          <p className="text-sm">Preview area - The chat widget will appear in the corner</p>
          <p className="text-xs mt-2">
            {widgetLoaded ? '✓ Widget loaded' : 'Loading widget...'}
          </p>
        </div>
        
        {/* Simulated website content */}
        <div className="mt-8 max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Sample Website Content</h2>
            <p className="text-gray-600 text-sm">
              This is a preview area that simulates your website. The chat widget will appear 
              in the corner just like it would on your actual site.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-2">Test the following:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click the chat bubble to open the chat</li>
              <li>• Send a message to test the AI response</li>
              <li>• Check the typing indicator</li>
              <li>• Test the emoji picker</li>
              <li>• Verify the header logo and colors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestWebChatbotPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary, #22c55e)' }} />
      </div>
    }>
      <TestWebChatbotContent />
    </Suspense>
  )
}

