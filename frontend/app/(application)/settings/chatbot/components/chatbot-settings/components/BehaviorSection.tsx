"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  Target,
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

interface BehaviorSectionProps extends SectionProps {
  isOpen: boolean
  onToggle: () => void
}

export function BehaviorSection({ 
  formData, 
  updateField,
  addToArray,
  removeFromArray,
  updateArrayItem,
  isOpen,
  onToggle
}: BehaviorSectionProps) {
  const t = useTranslations('settings.chatbot.behaviorSection')
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
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

            {/* Objectives - Multi-select */}
            <div>
              <h4 className="font-medium mb-2">{t('objectives')}</h4>
              <p className="text-sm text-muted-foreground mb-3">{t('objectivesDesc')}</p>
              <div className="space-y-2">
                {[
                  { value: 'sell', label: t('objectiveSell') },
                  { value: 'inform', label: t('objectiveInform') },
                  { value: 'leads', label: t('objectiveLeads') },
                  { value: 'support', label: t('objectiveSupport') }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData?.bot_objectives || []).includes(option.value)}
                      onChange={(e) => {
                        const current = formData?.bot_objectives || []
                        if (e.target.checked) {
                          updateField('bot_objectives', [...current, option.value])
                        } else {
                          updateField('bot_objectives', current.filter((v: string) => v !== option.value))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
                {/* Custom objectives */}
                {(formData?.custom_objectives || []).map((objective: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input type="checkbox" checked className="w-4 h-4" readOnly />
                    <Input
                      value={objective}
                      onChange={(e) => updateArrayItem('custom_objectives', index, e.target.value)}
                      className="flex-1"
                      placeholder={t('customObjective')}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFromArray('custom_objectives', index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToArray('custom_objectives', '')}
                >
                  <Plus className="w-4 h-4 mr-2" /> {t('addObjective')}
                </Button>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Restrictions */}
            <div>
              <h4 className="font-medium mb-2">{t('restrictions')}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t('restrictionsDesc')}
              </p>
              <div className="space-y-2">
                {(formData?.restrictions || []).map((restriction: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={restriction}
                      onChange={(e) => updateArrayItem('restrictions', index, e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFromArray('restrictions', index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToArray('restrictions', '')}
                >
                  <Plus className="w-4 h-4 mr-2" /> {t('addRestriction')}
                </Button>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Special instructions */}
            <div>
              <h4 className="font-medium mb-2">{t('specialInstructions')}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t('specialInstructionsDesc')}
              </p>
              <Textarea
                placeholder={t('specialInstructionsPlaceholder')}
                rows={4}
                value={formData?.special_instructions || ''}
                onChange={(e) => updateField('special_instructions', e.target.value)}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

