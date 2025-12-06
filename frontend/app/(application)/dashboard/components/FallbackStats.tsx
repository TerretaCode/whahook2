'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('dashboard.fallbackStats')
  const { user } = useAuth()
  const [stats, setStats] = useState<FallbackStats | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')
  const initialLoadDone = useRef(false)

  const loadStats = useCallback(async () => {
    if (!user) return
    
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
      setIsInitialLoad(false)
    }
  }, [user])

  const trendIcon = useMemo(() => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-green-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }, [trend])

  const trendText = useMemo(() => {
    if (trend === 'up') return t('increasing')
    if (trend === 'down') return t('decreasing')
    return t('stable')
  }, [trend])

  const trendColor = useMemo(() => {
    if (trend === 'up') return 'text-red-600'
    if (trend === 'down') return 'text-green-600'
    return 'text-gray-600'
  }, [trend])

  useEffect(() => {
    if (user && !initialLoadDone.current) {
      initialLoadDone.current = true
      loadStats()
    }
  }, [user, loadStats])

  if (isInitialLoad) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
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
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t('noData')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('subtitleFull')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{t('total')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400">{t('allTime')}</p>
          </div>

          {/* Today */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{t('today')}</p>
            <p className="text-2xl font-bold text-orange-600">{stats.today}</p>
            <p className="text-xs text-gray-400">{t('last24h')}</p>
          </div>

          {/* This Week */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{t('thisWeek')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.thisWeek}</p>
            <div className="flex items-center gap-1">
              {trendIcon}
              <p className={`text-xs font-medium ${trendColor}`}>
                {trendText}
              </p>
            </div>
          </div>

          {/* Last Fallback */}
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{t('lastFallback')}</p>
            <p className="text-sm font-semibold text-gray-900">
              {stats.lastFallback ? (
                formatDistanceToNow(new Date(stats.lastFallback), {
                  addSuffix: true,
                  locale: es
                })
              ) : (
                t('never')
              )}
            </p>
            <p className="text-xs text-gray-400">{t('mostRecent')}</p>
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">{t('breakdownByType')}</h4>
          
          <div className="space-y-2">
            {/* Uncertainty */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('aiUncertainty')}</p>
                  <p className="text-xs text-gray-500">{t('aiUncertaintyDesc')}</p>
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
                  <p className="text-sm font-medium text-gray-900">{t('humanRequest')}</p>
                  <p className="text-xs text-gray-500">{t('humanRequestDesc')}</p>
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
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h4 className="text-sm font-semibold text-green-900 mb-2">💡 {t('insights')}</h4>
            <ul className="space-y-1 text-sm text-green-800">
              {stats.uncertainty > stats.human_request && (
                <li>• {t('insightImprovePrompt')}</li>
              )}
              {stats.human_request > stats.uncertainty && (
                <li>• {t('insightHumanPreferred')}</li>
              )}
              {trend === 'up' && (
                <li>• {t('insightIncreasing')}</li>
              )}
              {trend === 'down' && (
                <li>• {t('insightDecreasing')}</li>
              )}
              {stats.today === 0 && (
                <li>• {t('insightNoFallbacksToday')}</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

