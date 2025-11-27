"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = Record<string, any>

interface HoursConfigTabProps {
  formData: FormData
  updateField: (field: string, value: string | boolean) => void
  updateArrayField: (field: string, index: number, value: string) => void
  addArrayItem: (field: string) => void
  removeArrayItem: (field: string, index: number) => void
}

export function HoursConfigTab({ formData, updateField, updateArrayField, addArrayItem, removeArrayItem }: HoursConfigTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horarios y Disponibilidad</CardTitle>
        <CardDescription>Configura horarios de atención y mensajes fuera de horario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Horario Comercial</Label>
            <p className="text-xs text-muted-foreground">Restringir respuestas a horario de atención</p>
          </div>
          <Switch checked={formData.business_hours_enabled || false} onCheckedChange={(c) => updateField('business_hours_enabled', c)} />
        </div>

        {formData.business_hours_enabled && (
          <>
            <div className="space-y-2">
              <Label>Zona Horaria</Label>
              <Select value={formData.business_hours_timezone || 'UTC'} onValueChange={(v) => updateField('business_hours_timezone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/Madrid">Europe/Madrid (CET)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                  <SelectItem value="America/Mexico_City">America/Mexico_City (CST)</SelectItem>
                  <SelectItem value="America/Argentina/Buenos_Aires">America/Buenos_Aires (ART)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora de Inicio</Label>
                <Input
                  type="time"
                  value={formData.active_hours_start || '09:00'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('active_hours_start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora de Fin</Label>
                <Input
                  type="time"
                  value={formData.active_hours_end || '18:00'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('active_hours_end', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mensaje Fuera de Horario</Label>
              <Textarea
                value={formData.out_of_hours_message || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('out_of_hours_message', e.target.value)}
                placeholder="Gracias por contactarnos. Estamos fuera de horario..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Usa {'{hours}'} para insertar el horario automáticamente</p>
            </div>
          </>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transferencia a Humano</Label>
              <p className="text-xs text-muted-foreground">Permitir transferencia a agente humano</p>
            </div>
            <Switch checked={formData.handoff_enabled || false} onCheckedChange={(c) => updateField('handoff_enabled', c)} />
          </div>

          {formData.handoff_enabled && (
            <div className="space-y-2">
              <Label>Palabras Clave de Transferencia</Label>
              {(formData.handoff_keywords || ['human', 'agent', 'representative', 'support']).map((keyword: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={keyword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateArrayField('handoff_keywords', index, e.target.value)}
                    placeholder="humano"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem('handoff_keywords', index)}>×</Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('handoff_keywords')}>+ Agregar Palabra Clave</Button>
            </div>
          )}

          {formData.handoff_enabled && (
            <div className="space-y-2">
              <Label>Mensaje de Transferencia</Label>
              <textarea
                value={formData.handoff_message || 'Entiendo que necesitas ayuda adicional. Te estoy transfiriendo con un agente humano que podrá asistirte mejor. Por favor, espera un momento...'}
                onChange={(e) => updateField('handoff_message', e.target.value)}
                placeholder="Mensaje que se envía al transferir a un humano"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                💬 Mensaje enviado al usuario cuando se transfiere a un agente humano
              </p>
            </div>
          )}

          {formData.handoff_enabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detección de Frustración</Label>
                  <p className="text-xs text-muted-foreground">Detectar frustración automáticamente</p>
                </div>
                <Switch 
                  checked={formData.handoff_frustration_detection || false} 
                  onCheckedChange={(c) => updateField('handoff_frustration_detection', c)} 
                />
              </div>

              {formData.handoff_frustration_detection && (
                <div className="space-y-2">
                  <Label>Palabras Clave de Frustración</Label>
                  {(formData.handoff_frustration_keywords || ['no sirve', 'inútil', 'mal servicio']).map((keyword: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={keyword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateArrayField('handoff_frustration_keywords', index, e.target.value)}
                        placeholder="no sirve"
                      />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeArrayItem('handoff_frustration_keywords', index)}>×</Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem('handoff_frustration_keywords')}>+ Agregar Palabra</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
