"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormData = Record<string, any>

interface ModelConfigTabProps {
  formData: FormData
  updateField: (field: string, value: number) => void
}

export function ModelConfigTab({ formData, updateField }: ModelConfigTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros del Modelo IA</CardTitle>
        <CardDescription>Ajusta el comportamiento y calidad de las respuestas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <span className="text-sm text-muted-foreground">{formData.temperature || 0.7}</span>
          </div>
          <Input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={formData.temperature || 0.7}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('temperature', parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">0 = Determinista | 0.7 = Balanceado (recomendado) | 2 = Muy creativo</p>
        </div>

        <div className="space-y-2">
          <Label>Max Tokens (Longitud de Respuesta)</Label>
          <Input
            type="number"
            min="50"
            value={formData.max_tokens || 1000}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('max_tokens', parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Máximo de tokens en la respuesta. Mayor = respuestas más largas pero más costo.
            <br />
            <strong>Recomendado: 1000-2000</strong> | Mínimo: 50
            <br />
            ⚠️ <span className="text-yellow-600">No se recomienda más de 4000 tokens</span> (mayor latencia y costo)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Top P (Nucleus Sampling)</Label>
            <span className="text-sm text-muted-foreground">{formData.top_p || 1.0}</span>
          </div>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={formData.top_p || 1.0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('top_p', parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Alternativa a temperature. 1.0 = usar temperature</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Frequency Penalty</Label>
            <span className="text-sm text-muted-foreground">{formData.frequency_penalty || 0.0}</span>
          </div>
          <Input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={formData.frequency_penalty || 0.0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('frequency_penalty', parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Reduce la repetición de palabras. 0 = sin penalización</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Presence Penalty</Label>
            <span className="text-sm text-muted-foreground">{formData.presence_penalty || 0.0}</span>
          </div>
          <Input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={formData.presence_penalty || 0.0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('presence_penalty', parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Fomenta hablar de nuevos temas. 0 = sin penalización</p>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Label className="text-base font-semibold">Configuración Avanzada</Label>
          <div className="space-y-2 mt-4">
            <Label>Max Tokens del Intent Classifier</Label>
            <Input
              type="number"
              min="100"
              value={formData.intent_classifier_max_tokens || 1000}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('intent_classifier_max_tokens', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Tokens máximos para el análisis de intenciones (uso interno). 
              <br />
              <strong>Recomendado: 1000-2000</strong> | Mínimo: 100
              <br />
              ⚠️ <span className="text-yellow-600">No se recomienda más de 4000 tokens</span> (mayor latencia y costo)
              <br />
              Solo modifica si experimentas errores de MAX_TOKENS en los logs.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
