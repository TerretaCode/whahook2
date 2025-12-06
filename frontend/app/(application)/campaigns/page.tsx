'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { ApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  Send,
  Pause,
  Play,
  Trash2,
  Eye,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Target,
  Zap,
  TrendingUp
} from 'lucide-react'
import { WorkspaceSelectorHeader } from '@/components/WorkspaceSelectorHeader'
import { CreateCampaignDialog } from './components/CreateCampaignDialog'
import { SegmentSelector } from './components/SegmentSelector'

interface Campaign {
  id: string
  name: string
  description: string | null
  type: 'whatsapp' | 'email'
  status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled'
  message_template: string
  filters: Record<string, unknown>
  total_recipients: number
  sent_count: number
  failed_count: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

interface Segment {
  id: string
  name: string
  description: string
  icon: string
  count: number
  filters: Record<string, unknown>
}

interface SegmentsResponse {
  success: boolean
  data: {
    segments: Segment[]
    total: number
  }
}

export default function CampaignsPage() {
  const t = useTranslations('campaigns')
  const router = useRouter()
  const { user, isLoading: authLoading, effectivePlan } = useAuth()
  const { workspace, hasPermission, isOwner, isLoading: workspaceLoading } = useWorkspaceContext()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [totalClients, setTotalClients] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSegmentSelector, setShowSegmentSelector] = useState(false)

  const canAccessCampaigns = isOwner || hasPermission('campaigns')
  const canCreateCampaigns = effectivePlan === 'professional' || effectivePlan === 'enterprise'

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!workspace?.id) return

    try {
      const response = await ApiClient.request<Campaign[]>(
        `/api/campaigns?workspace_id=${workspace.id}`
      )
      if (response.data) {
        setCampaigns(response.data)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }, [workspace?.id])

  // Fetch segments
  const fetchSegments = useCallback(async () => {
    if (!workspace?.id) return

    try {
      const response = await ApiClient.request<SegmentsResponse>(
        `/api/campaigns/segments/predefined?workspace_id=${workspace.id}`
      )
      if (response.data?.data) {
        setSegments(response.data.data.segments || [])
        setTotalClients(response.data.data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching segments:', error)
    }
  }, [workspace?.id])

  // Initial load
  useEffect(() => {
    if (!authLoading && !workspaceLoading && user && !canAccessCampaigns) {
      router.push('/dashboard')
    }
  }, [user, authLoading, workspaceLoading, canAccessCampaigns, router])

  useEffect(() => {
    const loadData = async () => {
      if (!workspace?.id) return
      setIsLoading(true)
      await Promise.all([fetchCampaigns(), fetchSegments()])
      setIsLoading(false)
    }
    loadData()
  }, [workspace?.id, fetchCampaigns, fetchSegments])

  // Campaign actions
  const handleSendCampaign = async (campaignId: string) => {
    try {
      await ApiClient.request(`/api/campaigns/${campaignId}/send`, { method: 'POST' })
      await fetchCampaigns()
    } catch (error) {
      console.error('Error sending campaign:', error)
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await ApiClient.request(`/api/campaigns/${campaignId}/pause`, { method: 'POST' })
      await fetchCampaigns()
    } catch (error) {
      console.error('Error pausing campaign:', error)
    }
  }

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      await ApiClient.request(`/api/campaigns/${campaignId}/resume`, { method: 'POST' })
      await fetchCampaigns()
    } catch (error) {
      console.error('Error resuming campaign:', error)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm(t('confirmDelete'))) return
    try {
      await ApiClient.request(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
      await fetchCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || campaign.status === activeTab
    return matchesSearch && matchesTab
  })

  // Status badge
  const getStatusBadge = (status: Campaign['status']) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      scheduled: { variant: 'outline', icon: <Clock className="w-3 h-3" /> },
      sending: { variant: 'default', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      paused: { variant: 'secondary', icon: <Pause className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> }
    }
    const { variant, icon } = config[status] || config.draft
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {t(`status.${status}`)}
      </Badge>
    )
  }

  if (authLoading || workspaceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!canAccessCampaigns) {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <WorkspaceSelectorHeader namespace="campaigns" />
          </div>
          <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSegmentSelector(true)}
          >
            <Target className="w-4 h-4 mr-2" />
            {t('segments')}
          </Button>
          {canCreateCampaigns ? (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('createCampaign')}
            </Button>
          ) : (
            <Button disabled variant="outline">
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('upgradeToPro')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('stats.totalClients')}</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('stats.activeCampaigns')}</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'sending').length}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('stats.messagesSent')}</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0)}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('stats.successRate')}</p>
                <p className="text-2xl font-bold">
                  {campaigns.length > 0
                    ? Math.round(
                        (campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0) /
                          Math.max(1, campaigns.reduce((acc, c) => acc + (c.total_recipients || 0), 0))) * 100
                      )
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segments Quick Access */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t('quickSegments')}
          </CardTitle>
          <CardDescription>{t('quickSegmentsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {segments.slice(0, 6).map(segment => (
              <Button
                key={segment.id}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowCreateDialog(true)}
              >
                <span>{segment.icon}</span>
                <span>{segment.name}</span>
                <Badge variant="secondary" className="ml-1">{segment.count}</Badge>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSegmentSelector(true)}
            >
              {t('viewAll')} →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>{t('campaignsList')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
              <TabsTrigger value="draft">{t('tabs.draft')}</TabsTrigger>
              <TabsTrigger value="sending">{t('tabs.sending')}</TabsTrigger>
              <TabsTrigger value="paused">{t('tabs.paused')}</TabsTrigger>
              <TabsTrigger value="completed">{t('tabs.completed')}</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noCampaigns')}</h3>
                  <p className="text-gray-500 mb-4">{t('noCampaignsDesc')}</p>
                  {canCreateCampaigns && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('createFirst')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map(campaign => (
                    <div
                      key={campaign.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                            {getStatusBadge(campaign.status)}
                            <Badge variant="outline">
                              {campaign.type === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}
                            </Badge>
                          </div>
                          {campaign.description && (
                            <p className="text-sm text-gray-500 mb-2">{campaign.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {campaign.total_recipients} {t('recipients')}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {campaign.sent_count || 0} {t('sent')}
                            </span>
                            {campaign.failed_count > 0 && (
                              <span className="flex items-center gap-1 text-red-500">
                                <XCircle className="w-4 h-4" />
                                {campaign.failed_count} {t('failed')}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {campaign.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              {t('send')}
                            </Button>
                          )}
                          {campaign.status === 'sending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePauseCampaign(campaign.id)}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              {t('pause')}
                            </Button>
                          )}
                          {campaign.status === 'paused' && (
                            <Button
                              size="sm"
                              onClick={() => handleResumeCampaign(campaign.id)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              {t('resume')}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(campaign.status === 'draft' || campaign.status === 'cancelled') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        workspaceId={workspace?.id || ''}
        onSuccess={() => {
          fetchCampaigns()
          setShowCreateDialog(false)
        }}
      />

      <SegmentSelector
        open={showSegmentSelector}
        onOpenChange={setShowSegmentSelector}
        workspaceId={workspace?.id || ''}
        segments={segments}
        onSelectSegment={(segment: Segment) => {
          setShowSegmentSelector(false)
          setShowCreateDialog(true)
        }}
      />
    </div>
  )
}
