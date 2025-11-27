"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WhatsAppAccountsSection } from "./components/WhatsAppAccountsSection"
import { ChatWidgetsSection } from "./components/ChatWidgetsSection"
import { EcommerceConnectionsSection } from "./components/EcommerceConnectionsSection"
import { WebhooksSection } from "./components/WebhooksSection"
import { Loader2, Smartphone, Bot, ShoppingCart, Webhook } from "lucide-react"

export default function ConnectionsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="whatsapp" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="whatsapp" className="flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </TabsTrigger>
        <TabsTrigger value="chat-widget" className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">Chatbot Web</span>
        </TabsTrigger>
        <TabsTrigger value="ecommerce" className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">E-commerce</span>
        </TabsTrigger>
        <TabsTrigger value="webhooks" className="flex items-center gap-2">
          <Webhook className="w-4 h-4" />
          <span className="hidden sm:inline">Webhooks</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="whatsapp" className="space-y-6">
        <WhatsAppAccountsSection />
      </TabsContent>

      <TabsContent value="chat-widget" className="space-y-6">
        <ChatWidgetsSection />
      </TabsContent>

      <TabsContent value="ecommerce" className="space-y-6">
        <EcommerceConnectionsSection />
      </TabsContent>

      <TabsContent value="webhooks" className="space-y-6">
        <WebhooksSection />
      </TabsContent>
    </Tabs>
  )
}
