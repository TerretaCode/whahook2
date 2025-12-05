"use client"

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
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-lg">Tu Bot</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          Configura la personalidad de tu asistente virtual. Estos ajustes definen cómo se presenta y comunica con tus clientes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bot_name">Nombre del bot</Label>
            <Input
              id="bot_name"
              placeholder="Ej: Ana, Asistente, SoporteBot..."
              value={formData?.bot_name || ''}
              onChange={(e) => updateField('bot_name', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              El nombre con el que se presentará. Ej: "Hola, soy <strong>Ana</strong>, tu asistente virtual"
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tono de comunicación</Label>
            <Select 
              value={formData?.tone || 'profesional'} 
              onValueChange={(value) => updateField('tone', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tono" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profesional">Profesional - Serio pero cercano</SelectItem>
                <SelectItem value="amigable">Amigable - Cálido y simpático</SelectItem>
                <SelectItem value="formal">Formal - Muy serio y corporativo</SelectItem>
                <SelectItem value="casual">Casual - Relajado y coloquial</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Cómo habla el bot: ¿como un amigo o como un empleado de banco?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emoji_usage">Uso de emojis</Label>
            <Select 
              value={formData?.emoji_usage || 'moderado'} 
              onValueChange={(value) => updateField('emoji_usage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona uso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">Ninguno - Sin emojis</SelectItem>
                <SelectItem value="pocos">Pocos - Solo ocasionalmente</SelectItem>
                <SelectItem value="moderado">Moderado - Equilibrado 👍</SelectItem>
                <SelectItem value="muchos">Muchos - Muy expresivo 🎉😊✨</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              ¿Quieres que use 😊 en sus mensajes? Depende de tu marca.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response_length">Longitud de respuestas</Label>
            <Select 
              value={formData?.response_length || 'normal'} 
              onValueChange={(value) => updateField('response_length', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona longitud" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cortas">Cortas - Directo al grano</SelectItem>
                <SelectItem value="normal">Normal - Equilibrado</SelectItem>
                <SelectItem value="detalladas">Detalladas - Explicaciones completas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Respuestas cortas = más rápido. Detalladas = más información.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>💡 Idioma automático:</strong> El bot detecta en qué idioma escribe el cliente y responde en ese mismo idioma. No necesitas configurar nada.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

