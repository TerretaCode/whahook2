"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  Plus
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SectionProps } from "../types"

interface EscalationSectionProps extends SectionProps {
  isOpen: boolean
  onToggle: () => void
}

export function EscalationSection({ 
  formData, 
  updateField,
  addToArray,
  removeFromArray,
  updateArrayItem,
  isOpen,
  onToggle
}: EscalationSectionProps) {
  const t = useTranslations('settings.chatbot.escalationSection')
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-green-600 dark:text-green-400" />
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
            {/* Info box */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>{t('whyThisTitle')}</strong> {t('whyThisDesc')}
              </p>
            </div>

            {/* Escalation triggers */}
            <div>
              <h4 className="font-medium mb-2">{t('triggers')}</h4>
              <p className="text-sm text-muted-foreground mb-3">{t('triggersDesc')}</p>
              <div className="space-y-2">
                {[
                  t('triggerHuman'),
                  t('triggerComplaint'),
                  t('triggerOrderProblem')
                ].map((trigger) => (
                  <label key={trigger} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData?.escalation_triggers || []).includes(trigger)}
                      onChange={(e) => {
                        const current = formData?.escalation_triggers || []
                        if (e.target.checked) {
                          updateField('escalation_triggers', [...current, trigger])
                        } else {
                          updateField('escalation_triggers', current.filter((t: string) => t !== trigger))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{trigger}</span>
                  </label>
                ))}
                {(formData?.custom_escalation_triggers || []).map((trigger: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input type="checkbox" checked className="w-4 h-4" readOnly />
                    <Input
                      value={trigger}
                      onChange={(e) => updateArrayItem('custom_escalation_triggers', index, e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFromArray('custom_escalation_triggers', index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToArray('custom_escalation_triggers', '')}
                >
                  <Plus className="w-4 h-4 mr-2" /> {t('addTrigger')}
                </Button>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Escalation message */}
            <div>
              <h4 className="font-medium mb-2">{t('escalationMessage')}</h4>
              <p className="text-sm text-muted-foreground mb-3">{t('escalationMessageDesc')}</p>
              <Textarea
                placeholder={t('escalationMessagePlaceholder')}
                rows={2}
                value={formData?.escalation_message || ''}
                onChange={(e) => updateField('escalation_message', e.target.value)}
              />
            </div>

            <hr className="border-dashed" />

            {/* Info to collect */}
            <div>
              <h4 className="font-medium mb-2">{t('infoToCollect')}</h4>
              <p className="text-sm text-muted-foreground mb-3">{t('infoToCollectDesc')}</p>
              <div className="space-y-2">
                {['Nombre completo', 'Email', 'Teléfono', 'Número de pedido', 'Empresa'].map((field) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData?.info_fields_to_collect || ['Nombre completo', 'Email', 'Teléfono']).includes(field)}
                      onChange={(e) => {
                        const current = formData?.info_fields_to_collect || ['Nombre completo', 'Email', 'Teléfono']
                        if (e.target.checked) {
                          updateField('info_fields_to_collect', [...current, field])
                        } else {
                          updateField('info_fields_to_collect', current.filter((f: string) => f !== field))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{field}</span>
                  </label>
                ))}
                {(formData?.custom_info_fields || []).map((field: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input type="checkbox" checked className="w-4 h-4" readOnly />
                    <Input
                      value={field}
                      onChange={(e) => updateArrayItem('custom_info_fields', index, e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFromArray('custom_info_fields', index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToArray('custom_info_fields', '')}
                >
                  <Plus className="w-4 h-4 mr-2" /> {t('addField')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                <span className="text-green-600">💡</span>
                {t('infoSavedCrm')}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

