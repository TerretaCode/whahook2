"use client"

import { useState, useEffect, Suspense, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { ApiClient } from "@/lib/api-client"
import { ConversationList } from "./components/ConversationList"
import { ChatWindow } from "./components/ChatWindow"
import { MessageSquare, Loader2 } from "lucide-react"

interface Conversation {
  id: string
  contact_phone: string
}

function ConversationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [initialPhoneProcessed, setInitialPhoneProcessed] = useState(false)

  const handleBack = useCallback(() => setSelectedConversationId(null), [])

  // Get initial filter from URL - memoized
  const initialFilter = useMemo(() => {
    const filterParam = searchParams.get('filter')
    return (filterParam === 'attention' || filterParam === 'whatsapp' || filterParam === 'web') 
      ? filterParam 
      : 'all'
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Handle phone parameter from URL to auto-select conversation
  useEffect(() => {
    const phone = searchParams.get('phone')
    if (phone && user && !initialPhoneProcessed) {
      setInitialPhoneProcessed(true)
      // Find conversation by phone number
      ApiClient.request<Conversation[]>('/api/whatsapp/conversations')
        .then((response) => {
          if (response.success && response.data) {
            const conversation = response.data.find((c) => 
              c.contact_phone === phone || c.contact_phone === phone.replace(/^\+/, '')
            )
            if (conversation) {
              setSelectedConversationId(conversation.id)
            }
          }
        })
        .catch(() => {})
    }
  }, [searchParams, user, initialPhoneProcessed])

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary, #22c55e)' }} />
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden bg-gray-50">
      {/* Sidebar - Lista de Conversaciones */}
      {/* En móvil: se oculta cuando hay conversación seleccionada */}
      <div className={`${
        selectedConversationId ? 'hidden md:flex' : 'flex'
      } w-full md:w-[400px] lg:w-[450px] border-r border-gray-200 flex-col bg-white`}>
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          initialFilter={initialFilter}
        />
      </div>

      {/* Chat Window */}
      {/* En móvil: se muestra en pantalla completa cuando hay conversación seleccionada */}
      <div className={`${
        selectedConversationId 
          ? 'flex fixed inset-0 z-50 md:static md:z-auto' 
          : 'hidden md:flex'
      } flex-1 flex-col`}>
        {selectedConversationId ? (
          <ChatWindow 
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <div className="text-center max-w-md px-4">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                <MessageSquare className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-3xl font-light text-gray-900 mb-4">WhaHook Web</h2>
              <p className="text-sm text-gray-600 mb-8">
                Send and receive messages without keeping your phone online.
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <p>🔒 End-to-end encrypted</p>
                <p>💬 Select a conversation to start messaging</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary, #22c55e)' }} />
      </div>
    }>
      <ConversationsContent />
    </Suspense>
  )
}

