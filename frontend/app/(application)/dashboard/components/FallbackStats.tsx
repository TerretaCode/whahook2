'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ApiClient } from '@/lib/api-client'
import { AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface FallbackStats {
  total: number
  uncertainty: number
  human_request: number
  today: number
  thisWeek: number
  lastWeek?: number
  avgResponseTime: number
  lastFallback: string | null
}

export function FallbackStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<FallbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')

  useEffect(() => {
    if (!user) return
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadStats = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get fallback stats from backend
      const response = await ApiClient.get<FallbackStats>('/api/dashboard/fallback-stats')

      if (!response.success || !response.data) {
        throw new Error('Failed to load stats')
      }

      setStats(response.data)
      
      // Calculate trend from data
      if (response.data.thisWeek > (response.data.lastWeek || 0)) {
        setTrend('up')
      } else if (response.data.thisWeek < (response.data.lastWeek || 0)) {
        setTrend('down')
      } else {
        setTrend('stable')
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Fallbacks</CardTitle>
          <CardDescription>Análisis de intervenciones manuales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Fallbacks</CardTitle>
          <CardDescription>Análisis de intervenciones manuales</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No hay datos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-green-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getTrendText = () => {
    if (trend === 'up') return 'Aumentando'
    if (trend === 'down') return 'Disminuyendo'
    return 'Estable'
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-red-600'
    if (trend === 'down') return 'text-green-600'
    return 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Estadísticas de Fallbacks
        </CardTitle>
        <CardDescription>
          Análisis de intervenciones manuales y solicitudes de atención
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400">Todos los tiempos</p>
          </div>

          {/* Today */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Hoy</p>
            <p className="text-2xl font-bold text-orange-600">{stats.today}</p>
            <p className="text-xs text-gray-400">Últimas 24h</p>
          </div>

          {/* This Week */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Esta Semana</p>
            <p className="text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <p className={`text-xs font-medium ${getTrendColor()}`}>
                {getTrendText()}
              </p>
            </div>
          </div>

          {/* Last Fallback */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Último Fallback</p>
            <p className="text-sm font-semibold text-gray-900">
              {stats.lastFallback ? (
                formatDistanceToNow(new Date(stats.lastFallback), {
                  addSuffix: true,
                  locale: es
                })
              ) : (
                'Nunca'
              )}
            </p>
            <p className="text-xs text-gray-400">Más reciente</p>
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Desglose por Tipo</h4>
          
          <div className="space-y-2">
            {/* Uncertainty */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Incertidumbre de IA</p>
                  <p className="text-xs text-gray-500">Bot no pudo responder</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{stats.uncertainty}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? Math.round((stats.uncertainty / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Human Request */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Solicitud Humana</p>
                  <p className="text-xs text-gray-500">Cliente pidió agente</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-600">{stats.human_request}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? Math.round((stats.human_request / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        {stats.total > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Insights</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              {stats.uncertainty > stats.human_request && (
                <li>• Considera mejorar el prompt o agregar más contexto al bot</li>
              )}
              {stats.human_request > stats.uncertainty && (
                <li>• Los clientes prefieren atención humana. Considera mejorar la confianza del bot</li>
              )}
              {trend === 'up' && (
                <li>• Los fallbacks están aumentando. Revisa la configuración del bot</li>
              )}
              {trend === 'down' && (
                <li>• ¡Excelente! Los fallbacks están disminuyendo</li>
              )}
              {stats.today === 0 && (
                <li>• ¡Perfecto! No hay fallbacks hoy</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
