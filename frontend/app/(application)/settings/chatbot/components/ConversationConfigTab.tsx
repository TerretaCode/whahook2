"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = Record<string, any>

interface ConversationConfigTabProps {
  formData: FormData
  updateField: (field: string, value: number | string | boolean) => void
}

export function ConversationConfigTab({ formData, updateField }: ConversationConfigTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Conversación</CardTitle>
        <CardDescription>Controla el flujo y comportamiento de las conversaciones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Ventana de Contexto (mensajes)</Label>
          <Input
            type="number"
            min="0"
            max="50"
            value={formData.context_window || 10}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('context_window', parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Número de mensajes previos a incluir en el contexto</p>
        </div>

        <div className="space-y-2">
          <Label>Longitud Máxima de Conversación</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={formData.max_conversation_length || 20}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('max_conversation_length', parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Máximo de mensajes antes de reiniciar la conversación</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Memoria entre Sesiones</Label>
            <p className="text-xs text-muted-foreground">Recordar contexto entre conversaciones diferentes</p>
          </div>
          <Switch checked={formData.enable_memory !== false} onCheckedChange={(c) => updateField('enable_memory', c)} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Indicador de Escritura</Label>
            <p className="text-xs text-muted-foreground">Mostrar "escribiendo..." mientras espera agrupar mensajes</p>
          </div>
          <Switch checked={formData.enable_typing_indicator !== false} onCheckedChange={(c) => updateField('enable_typing_indicator', c)} />
        </div>

        {/* Message Batching Configuration */}
        <div className="border-t pt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">⚡ Agrupación de Mensajes</h3>
            <p className="text-xs text-muted-foreground">
              Agrupa mensajes rápidos del usuario para responder una sola vez con todo el contexto
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tiempo de Espera entre Mensajes (segundos)</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={Math.round((formData.debounce_delay_ms || 5000) / 1000)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('debounce_delay_ms', parseInt(e.target.value) * 1000)}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>⏱️ <strong>¿Qué hace?</strong> Espera este tiempo antes de responder para agrupar mensajes rápidos.</p>
              <p>📝 <strong>Ejemplo:</strong> Si el usuario escribe "Hola", "Busco serum", "Piel grasa" en 4 segundos, el bot esperará 5 segundos y responderá 1 sola vez con todo el contexto.</p>
              <p>✅ <strong>Recomendado:</strong> 5 segundos (evita spam del bot)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Máximo de Mensajes por Grupo</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={formData.max_batch_size || 20}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('max_batch_size', parseInt(e.target.value))}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>📦 <strong>¿Qué hace?</strong> Límite de mensajes a agrupar antes de responder automáticamente.</p>
              <p>🔒 <strong>Ejemplo:</strong> Si el usuario envía 10 mensajes rápidos, el bot responde inmediatamente sin esperar.</p>
              <p>✅ <strong>Recomendado:</strong> 10 mensajes</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tiempo Máximo de Espera (segundos)</Label>
            <Input
              type="number"
              min="10"
              max="20"
              value={Math.round((formData.max_wait_ms || 15000) / 1000)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('max_wait_ms', parseInt(e.target.value) * 1000)}
            />
            <p className="text-xs text-muted-foreground">
              ⏰ Tiempo máximo desde el primer mensaje. Evita esperar indefinidamente.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Delay del Indicador de Escritura (ms)</Label>
            <Input
              type="number"
              min="0"
              max="2000"
              step="100"
              value={formData.typing_indicator_delay_ms || 500}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('typing_indicator_delay_ms', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              ⌨️ Tiempo antes de mostrar "escribiendo...". 500ms recomendado.
            </p>
          </div>
        </div>

        {/* Fallback V2 Configuration */}
        <div className="border-t pt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">🚨 Sistema de Fallback V2</h3>
            <p className="text-xs text-muted-foreground">
              Detección automática de incertidumbre y solicitudes de atención humana
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground space-y-2 bg-green-50 p-4 rounded-md border border-green-200">
              <p className="font-semibold text-green-900">ℹ️ Cómo funciona el sistema automático:</p>
              
              <div className="space-y-1 pl-2">
                <p><strong>1. Incertidumbre de la IA:</strong></p>
                <p className="pl-4 text-green-800">• La IA está instruida para responder <code className="bg-green-100 px-1 rounded">[FALLBACK]</code> cuando no tiene información</p>
                <p className="pl-4 text-green-800">• El sistema detecta esto automáticamente y envía tu mensaje de fallback personalizado</p>
                
                <p className="pt-2"><strong>2. Solicitud de humano:</strong></p>
                <p className="pl-4 text-green-800">• Si el usuario pide hablar con alguien, se detecta automáticamente (sin palabras clave)</p>
                <p className="pl-4 text-green-800">• El sistema usa inteligencia artificial para interpretar la intención</p>
                
                <p className="pt-2"><strong>3. Acción automática:</strong></p>
                <p className="pl-4 text-green-800">• Pausa la IA inmediatamente</p>
                <p className="pl-4 text-green-800">• Envía notificación por email + campanita en el dashboard</p>
                <p className="pl-4 text-green-800">• Solo 1 mensaje de fallback, luego espera intervención manual</p>
              </div>
              
              <p className="pt-2 text-xs italic text-green-700">
                💡 El mensaje que se envía al usuario es el "Mensaje de Fallback" que configuraste en la sección de Prompt
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

