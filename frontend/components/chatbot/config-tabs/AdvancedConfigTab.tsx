"use client"

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración Avanzada</CardTitle>
        <CardDescription>Funciones avanzadas y experimentales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logging Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Registro de Conversaciones</Label>
              <p className="text-xs text-muted-foreground">Guardar logs de interacciones</p>
            </div>
            <Switch 
              checked={formData.log_conversations !== false} 
              onCheckedChange={(c) => updateField('log_conversations', c)} 
            />
          </div>

          {formData.log_conversations !== false && (
            <>
              <div className="space-y-2">
                <Label>Nivel de Detalle del Log</Label>
                <select
                  value={formData.log_level || 'detailed'}
                  onChange={(e) => updateField('log_level', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basic">Básico - Solo mensajes</option>
                  <option value="detailed">Detallado - Mensajes + Intent + Tokens</option>
                  <option value="full">Completo - Todo + Metadata + Errores</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  📊 Nivel de información guardada en los logs
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registrar Mensajes de Usuario</Label>
                    <p className="text-xs text-muted-foreground">Guardar lo que escribe el usuario</p>
                  </div>
                  <Switch 
                    checked={formData.log_user_messages !== false} 
                    onCheckedChange={(c) => updateField('log_user_messages', c)} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registrar Respuestas del Bot</Label>
                    <p className="text-xs text-muted-foreground">Guardar lo que responde el bot</p>
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
            <Label className="text-base font-semibold">Retención de Datos</Label>
            <p className="text-xs text-muted-foreground">Gestión automática de datos antiguos</p>
          </div>

          <div className="space-y-2">
            <Label>Días de Retención</Label>
            <input
              type="number"
              min="30"
              max="365"
              value={formData.data_retention_days || 90}
              onChange={(e) => updateField('data_retention_days', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground">
              🗓️ Tiempo que se mantienen los datos antes de eliminarse (30-365 días)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Eliminación Activada</Label>
                <p className="text-xs text-muted-foreground">Eliminar datos antiguos automáticamente</p>
              </div>
              <Switch 
                checked={formData.auto_delete_enabled !== false} 
                onCheckedChange={(c) => updateField('auto_delete_enabled', c)} 
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Eliminación Suave (Soft Delete)</Label>
                <p className="text-xs text-muted-foreground">Marcar como eliminado antes de borrar permanentemente</p>
              </div>
              <Switch 
                checked={formData.soft_delete_enabled !== false} 
                onCheckedChange={(c) => updateField('soft_delete_enabled', c)} 
              />
            </div>
          </div>

          {formData.soft_delete_enabled !== false && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                ℹ️ <strong>Soft Delete:</strong> Los datos se marcan como eliminados y se mantienen 30 días antes de borrarse permanentemente. Cumple con GDPR.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
