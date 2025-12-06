"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Clock,
  ChevronDown,
  ChevronRight,
  Info
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SectionProps } from "../types"

interface AvailabilitySectionProps extends Pick<SectionProps, 'formData' | 'updateField'> {
  isOpen: boolean
  onToggle: () => void
}

const TIMEZONES = [
  { value: 'Europe/Madrid', label: 'España (Madrid)' },
  { value: 'Europe/London', label: 'Reino Unido (Londres)' },
  { value: 'America/New_York', label: 'EEUU (Nueva York)' },
  { value: 'America/Los_Angeles', label: 'EEUU (Los Ángeles)' },
  { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
  { value: 'UTC', label: 'UTC' },
]

export function AvailabilitySection({ 
  formData, 
  updateField,
  isOpen,
  onToggle
}: AvailabilitySectionProps) {
  const t = useTranslations('settings.chatbot.availabilitySection')
  const scheduleMode = formData?.schedule_mode || 'always_on'

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
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
            {/* Mode selection */}
            <div className="space-y-4">
              <h4 className="font-medium">{t('whenRespond')}</h4>
              
              <div className="space-y-3">
                {/* Always on */}
                <label 
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    scheduleMode === 'always_on' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule_mode"
                    value="always_on"
                    checked={scheduleMode === 'always_on'}
                    onChange={() => updateField('schedule_mode', 'always_on')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-green-600 dark:text-green-400">🟢 {t('alwaysOn')}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('alwaysOnDesc')}
                    </p>
                  </div>
                </label>

                {/* Only outside business hours */}
                <label 
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    scheduleMode === 'outside_hours' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule_mode"
                    value="outside_hours"
                    checked={scheduleMode === 'outside_hours'}
                    onChange={() => updateField('schedule_mode', 'outside_hours')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-green-600 dark:text-green-400">🌙 {t('outsideHours')}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('outsideHoursDesc')}
                    </p>
                  </div>
                </label>

                {/* Only during business hours */}
                <label 
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    scheduleMode === 'during_hours' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule_mode"
                    value="during_hours"
                    checked={scheduleMode === 'during_hours'}
                    onChange={() => updateField('schedule_mode', 'during_hours')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-green-600 dark:text-green-400">☀️ {t('duringHours')}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('duringHoursDesc')}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Schedule configuration - only show if not always_on */}
            {scheduleMode !== 'always_on' && (
              <>
                <hr className="border-dashed" />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {t('configureSchedule')}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t('timezone')}</Label>
                      <Select 
                        value={formData?.timezone || 'Europe/Madrid'} 
                        onValueChange={(value) => updateField('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectTimezone')} />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('startTime')}</Label>
                      <Input
                        type="time"
                        value={formData?.business_hours_start || '09:00'}
                        onChange={(e) => updateField('business_hours_start', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('endTime')}</Label>
                      <Input
                        type="time"
                        value={formData?.business_hours_end || '18:00'}
                        onChange={(e) => updateField('business_hours_end', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Days of week */}
                  <div className="space-y-2">
                    <Label>{t('workDays')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'mon', label: t('mon') },
                        { value: 'tue', label: t('tue') },
                        { value: 'wed', label: t('wed') },
                        { value: 'thu', label: t('thu') },
                        { value: 'fri', label: t('fri') },
                        { value: 'sat', label: t('sat') },
                        { value: 'sun', label: t('sun') }
                      ].map((day) => {
                        const selectedDays = formData?.business_days || ['mon', 'tue', 'wed', 'thu', 'fri']
                        const isSelected = selectedDays.includes(day.value)
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                updateField('business_days', selectedDays.filter((d: string) => d !== day.value))
                              } else {
                                updateField('business_days', [...selectedDays, day.value])
                              }
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {day.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <hr className="border-dashed" />

                {/* Message when bot is off */}
                <div className="space-y-3">
                  <h4 className="font-medium">
                    {scheduleMode === 'outside_hours' 
                      ? t('messageDuringHours')
                      : t('messageOutsideHours')
                    }
                  </h4>
                  <Textarea
                    placeholder={
                      scheduleMode === 'outside_hours'
                        ? t('messageDuringHoursPlaceholder')
                        : t('messageOutsideHoursPlaceholder')
                    }
                    rows={3}
                    value={formData?.schedule_off_message || ''}
                    onChange={(e) => updateField('schedule_off_message', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {t('hoursPlaceholderHint')}
                  </p>
                </div>
              </>
            )}

            {/* Info box */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>💡 {t('tip')}:</strong> {t('tipDesc')}
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

