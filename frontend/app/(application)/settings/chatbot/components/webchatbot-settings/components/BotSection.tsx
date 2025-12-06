"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Bot } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionProps } from "../types"

type BotSectionProps = Pick<SectionProps, 'formData' | 'updateField'>

export function BotSection({ formData, updateField }: BotSectionProps) {
  const t = useTranslations('settings.chatbot.botSection')
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-lg">{t('title')}</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          {t('subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bot_name">{t('botName')}</Label>
            <Input
              id="bot_name"
              placeholder={t('botNamePlaceholder')}
              value={formData?.bot_name || ''}
              onChange={(e) => updateField('bot_name', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('botNameHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">{t('tone')}</Label>
            <Select 
              value={formData?.tone || 'profesional'} 
              onValueChange={(value) => updateField('tone', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectTone')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profesional">{t('toneProfessional')}</SelectItem>
                <SelectItem value="amigable">{t('toneFriendly')}</SelectItem>
                <SelectItem value="formal">{t('toneFormal')}</SelectItem>
                <SelectItem value="casual">{t('toneCasual')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('toneHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emoji_usage">{t('emojiUsage')}</Label>
            <Select 
              value={formData?.emoji_usage || 'moderado'} 
              onValueChange={(value) => updateField('emoji_usage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectEmoji')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">{t('emojiNone')}</SelectItem>
                <SelectItem value="pocos">{t('emojiFew')}</SelectItem>
                <SelectItem value="moderado">{t('emojiModerate')}</SelectItem>
                <SelectItem value="muchos">{t('emojiMany')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('emojiHint')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response_length">{t('responseLength')}</Label>
            <Select 
              value={formData?.response_length || 'normal'} 
              onValueChange={(value) => updateField('response_length', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectLength')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cortas">{t('lengthShort')}</SelectItem>
                <SelectItem value="normal">{t('lengthNormal')}</SelectItem>
                <SelectItem value="detalladas">{t('lengthDetailed')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('lengthHint')}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>💡 {t('autoLanguage')}:</strong> {t('autoLanguageDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

