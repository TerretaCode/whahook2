"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  Target,
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

interface BehaviorSectionProps extends SectionProps {
  isOpen: boolean
  onToggle: () => void
}

export function BehaviorSection({ 
  formData, 
  updateField,
  addToArray,
  removeFromArray,
  updateArrayItem,
  isOpen,
  onToggle
}: BehaviorSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Comportamiento del Bot</h3>
                  <p className="text-sm text-muted-foreground">Objetivos, restricciones e instrucciones</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Objectives - Multi-select */}
            <div>
              <h4 className="font-medium mb-3">Objetivos del bot:</h4>
              <div className="space-y-2">
                {[
                  { value: 'sell', label: 'Vender / Recomendar productos' },
                  { value: 'inform', label: 'Informar / Resolver dudas' },
                  { value: 'leads', label: 'Captar leads / Recopilar datos' },
                  { value: 'support', label: 'Soporte post-venta' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData?.bot_objectives || []).includes(option.value)}
                      onChange={(e) => {
                        const current = formData?.bot_objectives || []
                        if (e.target.checked) {
                          updateField('bot_objectives', [...current, option.value])
                        } else {
                          updateField('bot_objectives', current.filter((v: string) => v !== option.value))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
                {/* Custom objectives */}
                {(formData?.custom_objectives || []).map((objective: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input type="checkbox" checked className="w-4 h-4" readOnly />
                    <Input
                      value={objective}
                      onChange={(e) => updateArrayItem('custom_objectives', index, e.target.value)}
                      className="flex-1"
                      placeholder="Objetivo personalizado"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFromArray('custom_objectives', index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToArray('custom_objectives', '')}
                >
                  <Plus className="w-4 h-4 mr-2" /> Añadir objetivo personalizado
                </Button>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Restrictions */}
            <div>
              <h4 className="font-medium mb-3">El bot NO debe:</h4>
              <div className="space-y-2">
                {(formData?.restrictions || []).map((restriction: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={restriction}
                      onChange={(e) => updateArrayItem('restrictions', index, e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFromArray('restrictions', index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToArray('restrictions', '')}
                >
                  <Plus className="w-4 h-4 mr-2" /> Añadir restricción
                </Button>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Special instructions */}
            <div>
              <h4 className="font-medium mb-3">Instrucciones especiales:</h4>
              <Textarea
                placeholder="Instrucciones específicas para el bot..."
                rows={3}
                value={formData?.special_instructions || ''}
                onChange={(e) => updateField('special_instructions', e.target.value)}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
