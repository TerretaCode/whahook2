"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare,
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

interface ConversationSectionProps extends SectionProps {
  isOpen: boolean
  onToggle: () => void
}

export function ConversationSection({ 
  formData, 
  updateField,
  addToArray,
  removeFromArray,
  updateArrayItem,
  isOpen,
  onToggle
}: ConversationSectionProps) {
  const t = useTranslations('settings.chatbot.conversationSection')
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
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

            {/* Welcome message */}
            <div>
              <h4 className="font-medium mb-2">{t('welcomeMessage')}</h4>
              <p className="text-sm text-muted-foreground mb-3">{t('welcomeMessageDesc')}</p>
              <Textarea
                placeholder={t('welcomeMessagePlaceholder')}
                rows={2}
                value={formData?.welcome_message || ''}
                onChange={(e) => updateField('welcome_message', e.target.value)}
              />
            </div>

            <hr className="border-dashed" />

            {/* FAQs */}
            <div>
              <h4 className="font-medium mb-2">{t('faqs')}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t('faqsDesc')}
                <br/><span className="text-xs">{t('faqsExample')}</span>
              </p>
              <div className="space-y-3">
                {(formData?.faqs || []).map((faq: { question?: string; answer?: string }, index: number) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('question')}
                          value={faq.question || ''}
                          onChange={(e) => updateArrayItem('faqs', index, { ...faq, question: e.target.value })}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeFromArray('faqs', index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder={t('answer')}
                        rows={2}
                        value={faq.answer || ''}
                        onChange={(e) => updateArrayItem('faqs', index, { ...faq, answer: e.target.value })}
                      />
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToArray('faqs', { question: '', answer: '' })}
                >
                  <Plus className="w-4 h-4 mr-2" /> {t('addFaq')}
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

