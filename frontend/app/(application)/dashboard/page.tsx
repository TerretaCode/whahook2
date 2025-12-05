"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspaceContext } from "@/contexts/WorkspaceContext"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { 
  MessageSquare, 
  Users, 
  Globe,
  ArrowRight,
  Settings,
  Bot,
  Power,
  PowerOff,
  Loader2,
  Smartphone,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Zap,
  RefreshCw
} from "lucide-react"

interface DashboardStats {
  totalConversations: number
  whatsappConversations: number
  webConversations: number
  todayConversations: number
  totalClients: number
  whatsappSessions: number
  webWidgets: number
  needsAttention: number
  whatsappNeedsAttention: number
  webNeedsAttention: number
  whatsappAiActive: number
  webAiActive: number
  clientsAiActive: boolean
  totalAiActive: number
}

const DEFAULT_STATS: DashboardStats = {
  totalConversations: 0,
  whatsappConversations: 0,
  webConversations: 0,
  todayConversations: 0,
  totalClients: 0,
  whatsappSessions: 0,
  webWidgets: 0,
  needsAttention: 0,
  whatsappNeedsAttention: 0,
  webNeedsAttention: 0,
  whatsappAiActive: 0,
  webAiActive: 0,
  clientsAiActive: false,
  totalAiActive: 0
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { workspace, isOwner, hasPermission } = useWorkspaceContext()
  
  // Check permissions for different sections
  const canViewMessages = isOwner || hasPermission('messages')
  const canViewClients = isOwner || hasPermission('clients')
  const canViewSettings = isOwner || hasPermission('settings')
  
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [togglingAi, setTogglingAi] = useState<string | null>(null)
  const lastWorkspaceId = useRef<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Memoized fetch function to avoid recreating on every render
  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (!workspace?.id) return
    
    try {
      if (isManualRefresh) {
        setIsRefreshing(true)
      }
      
      const response = await ApiClient.request(
        `/api/dashboard/stats?workspace_id=${workspace.id}`
      )
      
      if (response.success && response.data) {
        setStats(response.data as DashboardStats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsInitialLoad(false)
      setIsRefreshing(false)
    }
  }, [workspace?.id])

  // Initial load and workspace change
  useEffect(() => {
    if (user && workspace?.id) {
      // Only show loading state on workspace change
      if (lastWorkspaceId.current !== workspace.id) {
        setIsInitialLoad(true)
        lastWorkspaceId.current = workspace.id
      }
      fetchStats()
    }
  }, [user, workspace?.id, fetchStats])

  // Auto-refresh every 30 seconds (silent, no loading state)
  useEffect(() => {
    if (!user || !workspace?.id) return
    
    const interval = setInterval(() => {
      fetchStats(false)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [user, workspace?.id, fetchStats])

  const toggleAi = async (type: 'all' | 'whatsapp' | 'web' | 'clients', enable: boolean) => {
    try {
      setTogglingAi(type)
      const response = await ApiClient.request('/api/dashboard/toggle-ai', {
        method: 'POST',
        body: JSON.stringify({ type, enabled: enable })
      })
      if (response.success) {
        toast.success(`IA ${enable ? 'activada' : 'desactivada'} correctamente`)
        fetchStats()
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-primary, #22c55e)' }} />
      </div>
    )
  }

  const getPlanName = () => {
    switch (user.profile?.subscription_tier) {
      case 'trial': return 'Trial Gratuito'
      case 'starter': return 'Plan Starter'
      case 'professional': return 'Plan Professional'
      case 'enterprise': return 'Plan Enterprise'
      default: return 'Trial'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Hola, {user.profile?.full_name?.split(' ')[0] || 'Usuario'}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Aquí tienes el resumen de tu actividad
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {canViewSettings && (
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Alert Banner - Needs Attention (only if > 0 and has permission) */}
        {stats.needsAttention > 0 && canViewMessages && (
          <Link href="/conversations?filter=attention">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 hover:bg-red-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-800">
                    {stats.needsAttention} {stats.needsAttention === 1 ? 'conversación requiere' : 'conversaciones requieren'} tu atención
                  </p>
                  <p className="text-sm text-red-600">
                    {stats.whatsappNeedsAttention > 0 && `${stats.whatsappNeedsAttention} WhatsApp`}
                    {stats.whatsappNeedsAttention > 0 && stats.webNeedsAttention > 0 && ' · '}
                    {stats.webNeedsAttention > 0 && `${stats.webNeedsAttention} Web`}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </Link>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Needs Attention Card - Only if can view messages */}
          {canViewMessages && (
          <Link href="/conversations?filter=attention" className="block">
            <div className={`bg-white rounded-xl border-2 p-5 hover:shadow-md transition-all h-full ${
              stats.needsAttention > 0 ? 'border-red-200 hover:border-red-300' : 'border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${stats.needsAttention > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <AlertCircle className={`w-5 h-5 ${stats.needsAttention > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
                {stats.needsAttention > 0 && (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                    URGENTE
                  </span>
                )}
              </div>
              <p className={`text-3xl font-bold transition-opacity duration-200 ${stats.needsAttention > 0 ? 'text-red-600' : 'text-gray-900'} ${isInitialLoad ? 'opacity-50' : 'opacity-100'}`}>
                {stats.needsAttention}
              </p>
              <p className="text-sm text-gray-500 mt-1">Requieren atención</p>
            </div>
          </Link>
          )}

          {/* Today's Conversations - Only if can view messages */}
          {canViewMessages && (
          <Link href="/conversations" className="block">
            <div className="bg-white rounded-xl border-2 border-gray-100 p-5 hover:shadow-md hover:border-green-200 transition-all h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  HOY
                </span>
              </div>
              <p className={`text-3xl font-bold text-gray-900 transition-opacity duration-200 ${isInitialLoad ? 'opacity-50' : 'opacity-100'}`}>
                {stats.todayConversations}
              </p>
              <p className="text-sm text-gray-500 mt-1">Conversaciones</p>
            </div>
          </Link>
          )}

          {/* Total Conversations - Only if can view messages */}
          {canViewMessages && (
          <Link href="/conversations" className="block">
            <div className="bg-white rounded-xl border-2 border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className={`text-3xl font-bold text-gray-900 transition-opacity duration-200 ${isInitialLoad ? 'opacity-50' : 'opacity-100'}`}>
                {stats.totalConversations}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total conversaciones</p>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> {stats.whatsappConversations}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {stats.webConversations}
                </span>
              </div>
            </div>
          </Link>
          )}

          {/* Clients - Only if can view clients */}
          {canViewClients && (
          <Link href="/clients" className="block">
            <div className="bg-white rounded-xl border-2 border-gray-100 p-5 hover:shadow-md hover:border-purple-200 transition-all h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className={`text-3xl font-bold text-gray-900 transition-opacity duration-200 ${isInitialLoad ? 'opacity-50' : 'opacity-100'}`}>
                {stats.totalClients}
              </p>
              <p className="text-sm text-gray-500 mt-1">Clientes</p>
            </div>
          </Link>
          )}
        </div>

        {/* Secondary Stats Row - Only show to workspace owners */}
        {isOwner && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* WhatsApp Sessions */}
          <Link href="/settings/connections" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Smartphone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.whatsappSessions}</p>
                  <p className="text-xs text-gray-500">WhatsApp conectados</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Web Widgets */}
          <Link href="/settings/connections" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.webWidgets}</p>
                  <p className="text-xs text-gray-500">Widgets Web</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Active AIs */}
          <Link href="/settings/chatbot" className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Bot className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.whatsappAiActive + stats.webAiActive}</p>
                  <p className="text-xs text-gray-500">IAs activas</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Plan - Only show to workspace owners */}
          {isOwner && (
            <Link href="/pricing" className="block">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 hover:shadow-sm transition-all text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{getPlanName()}</p>
                    <p className="text-xs text-green-100">Ver planes</p>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
        )}

        {/* Quick Actions - Show based on permissions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {canViewMessages && (
            <Link href="/conversations">
              <div className="group p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors text-center">
                <MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700 group-hover:text-green-700">Mensajes</p>
              </div>
            </Link>
            )}
            {canViewClients && (
            <Link href="/clients">
              <div className="group p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors text-center">
                <Users className="w-5 h-5 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700 group-hover:text-green-700">Clientes</p>
              </div>
            </Link>
            )}
            {isOwner && (
              <Link href="/settings/chatbot">
                <div className="group p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors text-center">
                  <Bot className="w-5 h-5 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700 group-hover:text-green-700">Chatbots</p>
                </div>
              </Link>
            )}
            {canViewSettings && (
              <Link href="/settings/connections">
                <div className="group p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors text-center">
                  <Settings className="w-5 h-5 text-gray-400 group-hover:text-green-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-700 group-hover:text-green-700">Conexiones</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* AI Control Panel - Show to everyone with at least one AI permission */}
        {(canViewMessages || canViewClients || isOwner) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              Control de IA
            </h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stats.totalAiActive > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span className="text-xs text-gray-500">{stats.totalAiActive} activas</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Activar Todas - Only for owners */}
            {isOwner && (
            <button
              onClick={() => toggleAi('all', true)}
              disabled={togglingAi !== null}
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 disabled:opacity-50"
            >
              {togglingAi === 'all' ? (
                <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
              ) : (
                <Power className="w-4 h-4 text-green-600" />
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-green-700">Activar todas</p>
              </div>
            </button>
            )}

            {/* WhatsApp AI - For users with messages permission */}
            {canViewMessages && (
            <button
              onClick={() => toggleAi('whatsapp', stats.whatsappAiActive === 0)}
              disabled={togglingAi !== null}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors border disabled:opacity-50 ${
                stats.whatsappAiActive > 0 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {togglingAi === 'whatsapp' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Smartphone className={`w-4 h-4 ${stats.whatsappAiActive > 0 ? 'text-green-600' : 'text-gray-400'}`} />
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-700">WhatsApp</p>
                <p className="text-[10px] text-gray-400">{stats.whatsappAiActive > 0 ? 'Activa' : 'Inactiva'}</p>
              </div>
            </button>
            )}

            {/* Web AI - For users with messages permission */}
            {canViewMessages && (
            <button
              onClick={() => toggleAi('web', stats.webAiActive === 0)}
              disabled={togglingAi !== null}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors border disabled:opacity-50 ${
                stats.webAiActive > 0 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {togglingAi === 'web' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe className={`w-4 h-4 ${stats.webAiActive > 0 ? 'text-green-600' : 'text-gray-400'}`} />
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-700">Web</p>
                <p className="text-[10px] text-gray-400">{stats.webAiActive > 0 ? 'Activa' : 'Inactiva'}</p>
              </div>
            </button>
            )}

            {/* Clients AI - For users with clients permission (marketing) */}
            {canViewClients && (
            <button
              onClick={() => toggleAi('clients', !stats.clientsAiActive)}
              disabled={togglingAi !== null}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors border disabled:opacity-50 ${
                stats.clientsAiActive 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {togglingAi === 'clients' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Users className={`w-4 h-4 ${stats.clientsAiActive ? 'text-green-600' : 'text-gray-400'}`} />
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-700">Clientes</p>
                <p className="text-[10px] text-gray-400">{stats.clientsAiActive ? 'Activa' : 'Inactiva'}</p>
              </div>
            </button>
            )}

            {/* Desactivar Todas - Only for owners */}
            {isOwner && (
            <button
              onClick={() => toggleAi('all', false)}
              disabled={togglingAi !== null}
              className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
            >
              {togglingAi === 'all' ? (
                <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
              ) : (
                <PowerOff className="w-4 h-4 text-red-600" />
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-red-700">Pausar todas</p>
              </div>
            </button>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
