"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  const scheduleMode = formData?.schedule_mode || 'always_on'

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Disponibilidad del Bot</h3>
                  <p className="text-sm text-muted-foreground">Cuándo responde el bot automáticamente</p>
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
              <h4 className="font-medium">¿Cuándo quieres que el bot responda?</h4>
              
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
                    <div className="font-medium text-green-600 dark:text-green-400">🟢 Siempre activo (24/7)</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      El bot responde a cualquier hora, todos los días. <strong>Recomendado</strong> para maximizar la atención al cliente.
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
                    <div className="font-medium text-blue-600 dark:text-blue-400">🌙 Solo fuera de horario laboral</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      El bot responde cuando tu equipo no está disponible. Durante el horario laboral, los mensajes los gestiona tu equipo humano.
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
                    <div className="font-medium text-orange-600 dark:text-orange-400">☀️ Solo en horario laboral</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      El bot solo responde durante tu horario de atención. Fuera de horario, se envía un mensaje automático.
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
                    <Clock className="w-4 h-4" /> Configurar horario laboral
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Zona horaria</Label>
                      <Select 
                        value={formData?.timezone || 'Europe/Madrid'} 
                        onValueChange={(value) => updateField('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona zona" />
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
                      <Label>Hora de inicio</Label>
                      <Input
                        type="time"
                        value={formData?.business_hours_start || '09:00'}
                        onChange={(e) => updateField('business_hours_start', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hora de fin</Label>
                      <Input
                        type="time"
                        value={formData?.business_hours_end || '18:00'}
                        onChange={(e) => updateField('business_hours_end', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Days of week */}
                  <div className="space-y-2">
                    <Label>Días laborables</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'mon', label: 'Lun' },
                        { value: 'tue', label: 'Mar' },
                        { value: 'wed', label: 'Mié' },
                        { value: 'thu', label: 'Jue' },
                        { value: 'fri', label: 'Vie' },
                        { value: 'sat', label: 'Sáb' },
                        { value: 'sun', label: 'Dom' }
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
                      ? 'Mensaje durante horario laboral (cuando el bot está pausado):'
                      : 'Mensaje fuera de horario:'
                    }
                  </h4>
                  <Textarea
                    placeholder={
                      scheduleMode === 'outside_hours'
                        ? 'Gracias por tu mensaje. Nuestro equipo te responderá en breve.'
                        : 'Gracias por contactarnos. Nuestro horario de atención es {hours}. Te responderemos lo antes posible.'
                    }
                    rows={3}
                    value={formData?.schedule_off_message || ''}
                    onChange={(e) => updateField('schedule_off_message', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Usa <code className="bg-muted px-1 rounded">{'{hours}'}</code> para insertar el horario automáticamente
                  </p>
                </div>
              </>
            )}

            {/* Info box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Consejo:</strong> Tener el bot activo 24/7 mejora la experiencia del cliente y no pierdes oportunidades de venta fuera de horario. 
                Solo limita el horario si realmente necesitas que tu equipo gestione los mensajes en tiempo real.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
