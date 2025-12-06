'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Users,
  MessageSquare,
  Filter,
  Sparkles,
  Clock,
  Shield,
  ChevronRight,
  Info
} from 'lucide-react'

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess: () => void
  initialFilters?: Record<string, any>
}

interface PreviewData {
  total: number
  by_source: { whatsapp: number; web: number }
  by_engagement: Record<string, number>
  preview: Array<{ id: string; name: string; phone: string; source: string }>
}

const FILTER_OPTIONS = {
  source: [
    { value: 'whatsapp', label: '📱 WhatsApp', icon: '📱' },
    { value: 'web', label: '🌐 Web Chat', icon: '🌐' }
  ],
  status: [
    { value: 'lead', label: 'Lead' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'customer', label: 'Customer' },
    { value: 'inactive', label: 'Inactive' }
  ],
  engagement_level: [
    { value: 'hot', label: '🔥 Hot' },
    { value: 'high', label: '⬆️ High' },
    { value: 'medium', label: '➡️ Medium' },
    { value: 'low', label: '⬇️ Low' },
    { value: 'cold', label: '❄️ Cold' }
  ],
  lifecycle_stage: [
    { value: 'new', label: '✨ New' },
    { value: 'engaged', label: '💬 Engaged' },
    { value: 'qualified', label: '✅ Qualified' },
    { value: 'opportunity', label: '🎯 Opportunity' },
    { value: 'customer', label: '👤 Customer' }
  ],
  satisfaction: [
    { value: 'happy', label: '😊 Happy' },
    { value: 'neutral', label: '😐 Neutral' },
    { value: 'unhappy', label: '😞 Unhappy' }
  ],
  urgency: [
    { value: 'immediate', label: '🚨 Immediate' },
    { value: 'high', label: '⚡ High' },
    { value: 'normal', label: '📋 Normal' },
    { value: 'low', label: '🐢 Low' }
  ],
  budget_range: [
    { value: 'premium', label: '💎 Premium' },
    { value: 'high', label: '💰 High' },
    { value: 'medium', label: '💵 Medium' },
    { value: 'low', label: '💸 Low' }
  ]
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
  initialFilters = {}
}: CreateCampaignDialogProps) {
  const t = useTranslations('campaigns')
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'whatsapp' | 'email'>('whatsapp')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters)

  // Anti-ban settings
  const [randomizeMessage, setRandomizeMessage] = useState(true)
  const [respectQuietHours, setRespectQuietHours] = useState(true)
  const [dailyLimit, setDailyLimit] = useState(100)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1)
      setName('')
      setDescription('')
      setType('whatsapp')
      setMessageTemplate('')
      setFilters(initialFilters)
      setPreview(null)
    }
  }, [open, initialFilters])

  // Fetch preview when filters change
  useEffect(() => {
    const fetchPreview = async () => {
      if (!workspaceId || Object.keys(filters).length === 0) {
        setPreview(null)
        return
      }

      setIsPreviewLoading(true)
      try {
        const response = await ApiClient.request<{ success: boolean; data: PreviewData }>(
          '/api/campaigns/segments/preview',
          {
            method: 'POST',
            body: JSON.stringify({ workspace_id: workspaceId, filters })
          }
        )
        if (response.data?.data) {
          setPreview(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching preview:', error)
      } finally {
        setIsPreviewLoading(false)
      }
    }

    const debounce = setTimeout(fetchPreview, 500)
    return () => clearTimeout(debounce)
  }, [workspaceId, filters])

  const toggleFilter = (key: string, value: string) => {
    setFilters(prev => {
      const current = prev[key] || []
      const updated = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value]
      
      if (updated.length === 0) {
        const { [key]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: updated }
    })
  }

  const handleCreate = async () => {
    if (!name || !messageTemplate) return

    setIsLoading(true)
    try {
      await ApiClient.request('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: workspaceId,
          name,
          description,
          type,
          message_template: messageTemplate,
          filters,
          total_recipients: preview?.total || 0,
          send_settings: {
            randomize_message: randomizeMessage,
            respect_quiet_hours: respectQuietHours,
            daily_limit: dailyLimit,
            min_delay_seconds: 30,
            max_delay_seconds: 120,
            batch_size: 10,
            batch_pause_minutes: 5
          }
        })
      })
      onSuccess()
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t('createCampaign')}
          </DialogTitle>
          <DialogDescription>
            {t('createCampaignDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <ChevronRight className={`w-4 h-4 mx-2 ${step > s ? 'text-green-600' : 'text-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Audience Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Users className="w-5 h-5" />
              {t('step1Title')}
            </div>

            {/* Source Filter - Most Important */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {t('filterBySource')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {FILTER_OPTIONS.source.map(option => (
                    <Button
                      key={option.value}
                      variant={filters.source?.includes(option.value) ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => toggleFilter('source', option.value)}
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Other Filters */}
            <Tabs defaultValue="engagement">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="engagement">{t('engagement')}</TabsTrigger>
                <TabsTrigger value="status">{t('status')}</TabsTrigger>
                <TabsTrigger value="intent">{t('intent')}</TabsTrigger>
                <TabsTrigger value="advanced">{t('advanced')}</TabsTrigger>
              </TabsList>

              <TabsContent value="engagement" className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">{t('engagementLevel')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FILTER_OPTIONS.engagement_level.map(option => (
                      <Badge
                        key={option.value}
                        variant={filters.engagement_level?.includes(option.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleFilter('engagement_level', option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('lifecycleStage')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FILTER_OPTIONS.lifecycle_stage.map(option => (
                      <Badge
                        key={option.value}
                        variant={filters.lifecycle_stage?.includes(option.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleFilter('lifecycle_stage', option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="status" className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">{t('clientStatus')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FILTER_OPTIONS.status.map(option => (
                      <Badge
                        key={option.value}
                        variant={filters.status?.includes(option.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleFilter('status', option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('satisfaction')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FILTER_OPTIONS.satisfaction.map(option => (
                      <Badge
                        key={option.value}
                        variant={filters.satisfaction?.includes(option.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleFilter('satisfaction', option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="intent" className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">{t('urgency')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FILTER_OPTIONS.urgency.map(option => (
                      <Badge
                        key={option.value}
                        variant={filters.urgency?.includes(option.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleFilter('urgency', option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('budgetRange')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {FILTER_OPTIONS.budget_range.map(option => (
                      <Badge
                        key={option.value}
                        variant={filters.budget_range?.includes(option.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleFilter('budget_range', option.value)}
                      >
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t('purchaseIntentMin')}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      value={filters.purchase_intent_min || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        purchase_intent_min: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('leadScoreMin')}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      value={filters.lead_score_min || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        lead_score_min: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t('lastContactDays')}</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder={t('lastContactDaysPlaceholder')}
                      value={filters.last_contact_days || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        last_contact_days: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('noContactDays')}</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder={t('noContactDaysPlaceholder')}
                      value={filters.no_contact_days || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        no_contact_days: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t('notCampaignedDays')}</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder={t('notCampaignedDaysPlaceholder')}
                      value={filters.not_campaigned_days || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        not_campaigned_days: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Checkbox
                      id="has_email"
                      checked={filters.has_email || false}
                      onCheckedChange={(checked) => setFilters(prev => ({
                        ...prev,
                        has_email: checked || undefined
                      }))}
                    />
                    <Label htmlFor="has_email">{t('hasEmail')}</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Preview */}
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-medium">{t('audiencePreview')}</span>
                  </div>
                  {isPreviewLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-2xl font-bold text-green-600">
                      {preview?.total || 0}
                    </span>
                  )}
                </div>
                {preview && (
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>📱 WhatsApp: {preview.by_source.whatsapp}</span>
                    <span>🌐 Web: {preview.by_source.web}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Message */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <MessageSquare className="w-5 h-5" />
              {t('step2Title')}
            </div>

            <div className="space-y-4">
              <div>
                <Label>{t('campaignName')}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('campaignNamePlaceholder')}
                />
              </div>

              <div>
                <Label>{t('description')}</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                />
              </div>

              <div>
                <Label>{t('campaignType')}</Label>
                <Select value={type} onValueChange={(v: 'whatsapp' | 'email') => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t('messageTemplate')}</Label>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Info className="w-3 h-3" />
                    {t('variablesHint')}
                  </div>
                </div>
                <Textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder={t('messageTemplatePlaceholder')}
                  rows={6}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['{name}', '{company}', '{phone}'].map(variable => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => setMessageTemplate(prev => prev + ' ' + variable)}
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Anti-Ban Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="w-5 h-5" />
              {t('step3Title')}
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">{t('antiBanProtection')}</h4>
                    <p className="text-sm text-green-700 mt-1">{t('antiBanDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium">{t('randomizeMessage')}</p>
                    <p className="text-sm text-gray-500">{t('randomizeMessageDesc')}</p>
                  </div>
                </div>
                <Checkbox
                  checked={randomizeMessage}
                  onCheckedChange={(checked) => setRandomizeMessage(!!checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{t('respectQuietHours')}</p>
                    <p className="text-sm text-gray-500">{t('respectQuietHoursDesc')}</p>
                  </div>
                </div>
                <Checkbox
                  checked={respectQuietHours}
                  onCheckedChange={(checked) => setRespectQuietHours(!!checked)}
                />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium">{t('dailyLimit')}</p>
                    <p className="text-sm text-gray-500">{t('dailyLimitDesc')}</p>
                  </div>
                </div>
                <Input
                  type="number"
                  min={10}
                  max={500}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 100)}
                />
              </div>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('recipients')}:</span>
                  <span className="font-medium">{preview?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('type')}:</span>
                  <span className="font-medium">{type === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('delayBetweenMessages')}:</span>
                  <span className="font-medium">30-120s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('estimatedTime')}:</span>
                  <span className="font-medium">
                    ~{Math.ceil((preview?.total || 0) * 75 / 60)} min
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                {t('back')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!preview || preview.total === 0)}
              >
                {t('next')}
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isLoading || !name || !messageTemplate}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('createAndSave')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
