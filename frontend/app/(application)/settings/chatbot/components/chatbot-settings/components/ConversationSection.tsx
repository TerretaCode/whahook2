"use client"

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
                  <h3 className="font-semibold text-lg">Conversación</h3>
                  <p className="text-sm text-muted-foreground">Cómo saluda el bot y respuestas a preguntas frecuentes</p>
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
                <strong>¿Para qué sirve esto?</strong> Configura cómo empieza la conversación y añade respuestas predefinidas a preguntas que te hacen siempre.
              </p>
            </div>

            {/* Welcome message */}
            <div>
              <h4 className="font-medium mb-2">Mensaje de bienvenida:</h4>
              <p className="text-sm text-muted-foreground mb-3">Este es el primer mensaje que verá el cliente cuando empiece a chatear. Déjalo vacío si no quieres mensaje automático.</p>
              <Textarea
                placeholder="Ej: ¡Hola! 👋 Soy Ana, la asistente virtual de Floristería María. ¿En qué puedo ayudarte hoy?"
                rows={2}
                value={formData?.welcome_message || ''}
                onChange={(e) => updateField('welcome_message', e.target.value)}
              />
            </div>

            <hr className="border-dashed" />

            {/* FAQs */}
            <div>
              <h4 className="font-medium mb-2">Preguntas frecuentes (FAQs):</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Añade preguntas que te hacen siempre con sus respuestas exactas. El bot las usará cuando detecte esas preguntas.
                <br/><span className="text-xs">Ej: "¿Hacéis envíos a Canarias?" → "Sí, enviamos a Canarias. El envío tarda 5-7 días y cuesta 8€."</span>
              </p>
              <div className="space-y-3">
                {(formData?.faqs || []).map((faq: { question?: string; answer?: string }, index: number) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Pregunta"
                          value={faq.question || ''}
                          onChange={(e) => updateArrayItem('faqs', index, { ...faq, question: e.target.value })}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeFromArray('faqs', index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Respuesta"
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
                  <Plus className="w-4 h-4 mr-2" /> Añadir FAQ
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

