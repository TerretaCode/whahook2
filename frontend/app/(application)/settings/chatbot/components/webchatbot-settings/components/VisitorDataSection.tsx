"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { 
  UserCircle,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  User
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionProps } from "../types"

interface VisitorDataSectionProps extends Pick<SectionProps, 'formData' | 'updateField'> {
  isOpen: boolean
  onToggle: () => void
}

export function VisitorDataSection({ 
  formData, 
  updateField, 
  isOpen,
  onToggle
}: VisitorDataSectionProps) {
  const t = useTranslations('settings.chatbot.visitorDataSection')
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <UserCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 mb-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>{t('whyThisTitle')}</strong> {t('whyThisDesc')}
              </p>
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">{t('collectData')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('collectDataDesc')}
                </p>
              </div>
              <Switch
                checked={formData?.collect_visitor_data || false}
                onCheckedChange={(checked) => updateField('collect_visitor_data', checked)}
              />
            </div>

            {formData?.collect_visitor_data && (
              <>
                {/* What to collect */}
                <div className="space-y-4">
                  <h4 className="font-medium">{t('whatToCollect')}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <Label>{t('name')}</Label>
                      </div>
                      <Switch
                        checked={formData?.collect_name || false}
                        onCheckedChange={(checked) => updateField('collect_name', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <Label>{t('email')}</Label>
                      </div>
                      <Switch
                        checked={formData?.collect_email || false}
                        onCheckedChange={(checked) => updateField('collect_email', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <Label>{t('phone')}</Label>
                      </div>
                      <Switch
                        checked={formData?.collect_phone || false}
                        onCheckedChange={(checked) => updateField('collect_phone', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* When to collect */}
                <div className="space-y-2">
                  <Label>{t('whenToCollect')}</Label>
                  <Select 
                    value={formData?.collect_data_timing || 'during_chat'} 
                    onValueChange={(value) => updateField('collect_data_timing', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectTiming')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before_chat">{t('beforeChat')}</SelectItem>
                      <SelectItem value="during_chat">{t('duringChat')}</SelectItem>
                      <SelectItem value="end_of_chat">{t('endOfChat')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('timingHint')}
                  </p>
                </div>

                {/* Human handoff email */}
                <div className="space-y-2">
                  <Label htmlFor="human_handoff_email">{t('handoffEmail')}</Label>
                  <Input
                    id="human_handoff_email"
                    type="email"
                    placeholder={t('handoffEmailPlaceholder')}
                    value={formData?.human_handoff_email || ''}
                    onChange={(e) => updateField('human_handoff_email', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('handoffEmailHint')}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

