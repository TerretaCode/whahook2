"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SectionProps } from "../types"

interface AdditionalSectionProps extends Pick<SectionProps, 'formData' | 'updateField'> {
  isOpen: boolean
  onToggle: () => void
}

export function AdditionalSection({ 
  formData, 
  updateField,
  isOpen,
  onToggle
}: AdditionalSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Información Adicional</h3>
                  <p className="text-sm text-muted-foreground">Promociones, reglas especiales, etc.</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <Textarea
              placeholder="Cualquier otra cosa que el bot deba saber..."
              rows={4}
              value={formData?.additional_info || ''}
              onChange={(e) => updateField('additional_info', e.target.value)}
            />
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">💡 Ejemplos de qué poner aquí:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Promociones activas (2x1, descuentos, códigos...)</li>
                <li>Reglas especiales del negocio</li>
                <li>Información temporal o de temporada</li>
                <li>Cualquier contexto extra para el bot</li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
