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
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Conversación</h3>
                  <p className="text-sm text-muted-foreground">Mensaje de bienvenida y FAQs</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Welcome message */}
            <div>
              <h4 className="font-medium mb-3">Mensaje de bienvenida:</h4>
              <Textarea
                placeholder="¡Hola! Soy el asistente de [tu negocio]. ¿En qué puedo ayudarte?"
                rows={2}
                value={formData?.welcome_message || ''}
                onChange={(e) => updateField('welcome_message', e.target.value)}
              />
            </div>

            <hr className="border-dashed" />

            {/* FAQs */}
            <div>
              <h4 className="font-medium mb-3">FAQs (el bot responderá automáticamente):</h4>
              <div className="space-y-3">
                {(formData?.faqs || []).map((faq: any, index: number) => (
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
