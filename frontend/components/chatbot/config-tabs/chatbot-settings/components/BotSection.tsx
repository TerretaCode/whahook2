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
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-lg">Tu Bot</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bot_name">Nombre del bot</Label>
            <Input
              id="bot_name"
              placeholder="Asistente"
              value={formData?.bot_name || ''}
              onChange={(e) => updateField('bot_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tono</Label>
            <Select 
              value={formData?.tone || 'profesional'} 
              onValueChange={(value) => updateField('tone', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tono" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profesional">Profesional</SelectItem>
                <SelectItem value="amigable">Amigable</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="ninguno">Ninguno</SelectItem>
                <SelectItem value="pocos">Pocos</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="muchos">Muchos</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="cortas">Cortas</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="detalladas">Detalladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
          <span className="text-blue-500">💡</span>
          El bot responde automáticamente en el idioma del cliente
        </p>
      </CardContent>
    </Card>
  )
}
