"use client"

import { useTranslations } from 'next-intl'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = Record<string, any>

interface AdvancedConfigTabProps {
  formData: FormData
  updateField: (field: string, value: boolean | string | number) => void
}

export function AdvancedConfigTab({ formData, updateField }: AdvancedConfigTabProps) {
  const t = useTranslations('settings.chatbot.advancedConfig')
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logging Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">{t('conversationLogging')}</Label>
              <p className="text-xs text-muted-foreground">{t('conversationLoggingDesc')}</p>
            </div>
            <Switch 
              checked={formData.log_conversations !== false} 
              onCheckedChange={(c) => updateField('log_conversations', c)} 
            />
          </div>

          {formData.log_conversations !== false && (
            <>
              <div className="space-y-2">
                <Label>{t('logLevel')}</Label>
                <select
                  value={formData.log_level || 'detailed'}
                  onChange={(e) => updateField('log_level', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                >
                  <option value="basic">{t('logLevelBasic')}</option>
                  <option value="detailed">{t('logLevelDetailed')}</option>
                  <option value="full">{t('logLevelFull')}</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  📊 {t('logLevelDesc')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('logUserMessages')}</Label>
                    <p className="text-xs text-muted-foreground">{t('logUserMessagesDesc')}</p>
                  </div>
                  <Switch 
                    checked={formData.log_user_messages !== false} 
                    onCheckedChange={(c) => updateField('log_user_messages', c)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('logBotResponses')}</Label>
                    <p className="text-xs text-muted-foreground">{t('logBotResponsesDesc')}</p>
                  </div>
                  <Switch 
                    checked={formData.log_bot_responses !== false} 
                    onCheckedChange={(c) => updateField('log_bot_responses', c)} 
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Data Retention Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">{t('dataRetention')}</Label>
            <p className="text-xs text-muted-foreground">{t('dataRetentionDesc')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('retentionDays')}</Label>
            <input
              type="number"
              min="30"
              max="365"
              value={formData.data_retention_days || 90}
              onChange={(e) => updateField('data_retention_days', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-muted-foreground">
              🗓️ {t('retentionDaysDesc')}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('autoDelete')}</Label>
                <p className="text-xs text-muted-foreground">{t('autoDeleteDesc')}</p>
              </div>
              <Switch 
                checked={formData.auto_delete_enabled !== false} 
                onCheckedChange={(c) => updateField('auto_delete_enabled', c)} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('softDelete')}</Label>
                <p className="text-xs text-muted-foreground">{t('softDeleteDesc')}</p>
              </div>
              <Switch 
                checked={formData.soft_delete_enabled !== false} 
                onCheckedChange={(c) => updateField('soft_delete_enabled', c)} 
              />
            </div>
          </div>

          {formData.soft_delete_enabled !== false && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800">
                ℹ️ <strong>{t('softDeleteLabel')}:</strong> {t('softDeleteInfo')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

