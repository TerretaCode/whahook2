"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { 
  MessageSquare, 
  Users, 
  Globe,
  Activity,
  ArrowRight,
  Settings,
  Bot,
  Power,
  PowerOff,
  Loader2,
  Smartphone,
  Sparkles
} from "lucide-react"

interface DashboardStats {
  totalConversations: number
  whatsappConversations: number
  webConversations: number
  todayConversations: number
  totalClients: number
  whatsappSessions: number
  webWidgets: number
  whatsappAiActive: number
  webAiActive: number
  clientsAiActive: boolean
  totalAiActive: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    whatsappConversations: 0,
    webConversations: 0,
    todayConversations: 0,
    totalClients: 0,
    whatsappSessions: 0,
    webWidgets: 0,
    whatsappAiActive: 0,
    webAiActive: 0,
    clientsAiActive: false,
    totalAiActive: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [togglingAi, setTogglingAi] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await ApiClient.request('/api/dashboard/stats')
      if (response.success && response.data) {
        setStats(response.data as DashboardStats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAi = async (type: 'all' | 'whatsapp' | 'web' | 'clients', enable: boolean) => {
    try {
      setTogglingAi(type)
      const response = await ApiClient.request('/api/dashboard/toggle-ai', {
        method: 'POST',
        body: JSON.stringify({ type, enabled: enable })
      })
      if (response.success) {
        toast.success(`IA ${enable ? 'activada' : 'desactivada'} correctamente`)
        fetchStats() // Refresh stats
      }
    } catch (error) {
      console.error('Failed to toggle AI:', error)
      toast.error('Error al cambiar estado de IA')
    } finally {
      setTogglingAi(null)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Bienvenido, <span className="font-medium text-gray-900">{user.profile?.full_name || user.email}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Control Panel */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Control de IA</h2>
          </div>
          <p className="text-green-100 mb-6">Activa o desactiva la IA de tus chatbots con un solo clic</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Activar Todas las IA */}
            <button
              onClick={() => toggleAi('all', true)}
              disabled={togglingAi !== null}
              className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
            >
              <div className="flex items-center gap-3">
                <Power className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">Activar Todas</p>
                  <p className="text-xs text-green-200">{stats.totalAiActive} activas</p>
                </div>
              </div>
              {togglingAi === 'all' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>

            {/* WhatsApp AI */}
            <button
              onClick={() => toggleAi('whatsapp', stats.whatsappAiActive === 0)}
              disabled={togglingAi !== null}
              className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">WhatsApp AI</p>
                  <p className="text-xs text-green-200">
                    {stats.whatsappAiActive > 0 ? `${stats.whatsappAiActive} activa(s)` : 'Desactivada'}
                  </p>
                </div>
              </div>
              {togglingAi === 'whatsapp' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : stats.whatsappAiActive > 0 ? (
                <Power className="w-4 h-4 text-green-400" />
              ) : (
                <PowerOff className="w-4 h-4 text-red-300" />
              )}
            </button>

            {/* Web AI */}
            <button
              onClick={() => toggleAi('web', stats.webAiActive === 0)}
              disabled={togglingAi !== null}
              className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">Web Chatbot AI</p>
                  <p className="text-xs text-green-200">
                    {stats.webAiActive > 0 ? `${stats.webAiActive} activa(s)` : 'Desactivada'}
                  </p>
                </div>
              </div>
              {togglingAi === 'web' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : stats.webAiActive > 0 ? (
                <Power className="w-4 h-4 text-green-400" />
              ) : (
                <PowerOff className="w-4 h-4 text-red-300" />
              )}
            </button>

            {/* Clients AI */}
            <button
              onClick={() => toggleAi('clients', !stats.clientsAiActive)}
              disabled={togglingAi !== null}
              className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/20"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">AI Clientes</p>
                  <p className="text-xs text-green-200">
                    {stats.clientsAiActive ? 'Activa' : 'Desactivada'}
                  </p>
                </div>
              </div>
              {togglingAi === 'clients' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : stats.clientsAiActive ? (
                <Power className="w-4 h-4 text-green-400" />
              ) : (
                <PowerOff className="w-4 h-4 text-red-300" />
              )}
            </button>

            {/* Desactivar Todas */}
            <button
              onClick={() => toggleAi('all', false)}
              disabled={togglingAi !== null}
              className="flex items-center justify-between p-4 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all border border-red-400/30"
            >
              <div className="flex items-center gap-3">
                <PowerOff className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">Desactivar Todas</p>
                  <p className="text-xs text-red-200">Pausar IA</p>
                </div>
              </div>
              {togglingAi === 'all' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Conversations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? '-' : stats.totalConversations}
            </h3>
            <p className="text-sm text-gray-600">Conversaciones</p>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <Smartphone className="w-3 h-3" /> {stats.whatsappConversations}
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <Globe className="w-3 h-3" /> {stats.webConversations}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href="/conversations" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                Ver todas
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">Hoy</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? '-' : stats.todayConversations}
            </h3>
            <p className="text-sm text-gray-600">Conversaciones hoy</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">Actualizado ahora</span>
            </div>
          </div>

          {/* Total Clients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">CRM</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? '-' : stats.totalClients}
            </h3>
            <p className="text-sm text-gray-600">Clientes</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href="/clients" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                Ver clientes
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Connections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Bot className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">Conexiones</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {isLoading ? '-' : stats.whatsappSessions + stats.webWidgets}
            </h3>
            <p className="text-sm text-gray-600">Canales activos</p>
            <div className="mt-3 flex gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <Smartphone className="w-3 h-3" /> {stats.whatsappSessions} WhatsApp
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <Globe className="w-3 h-3" /> {stats.webWidgets} Web
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href="/settings/connections" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                Gestionar
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-600" />
              Acciones rápidas
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/conversations">
                <div className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Mensajes</h3>
                  <p className="text-sm text-gray-600">Ver y gestionar chats</p>
                </div>
              </Link>

              <Link href="/settings/chatbot">
                <div className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <Bot className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Configurar IA</h3>
                  <p className="text-sm text-gray-600">Ajustar chatbots</p>
                </div>
              </Link>

              <Link href="/clients">
                <div className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Clientes</h3>
                  <p className="text-sm text-gray-600">Gestionar CRM</p>
                </div>
              </Link>

              <Link href="/settings/connections">
                <div className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <Settings className="w-5 h-5 text-gray-600 group-hover:text-green-600" />
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Conexiones</h3>
                  <p className="text-sm text-gray-600">WhatsApp y Web widgets</p>
                </div>
              </Link>
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-sm p-6 text-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Estado de IA
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>WhatsApp AI</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  stats.whatsappAiActive > 0 ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                }`}>
                  {stats.whatsappAiActive > 0 ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Web Chatbot AI</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  stats.webAiActive > 0 ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                }`}>
                  {stats.webAiActive > 0 ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="pt-4 border-t border-green-500">
                <Link href="/settings/chatbot">
                  <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                    <Bot className="w-4 h-4 mr-2" />
                    Configurar Chatbots
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
