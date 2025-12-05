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
                  <p className="text-sm text-muted-foreground">Todo lo demás que el bot deba saber</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Info box */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>¿Para qué sirve esto?</strong> Aquí puedes escribir cualquier cosa que no encaje en las otras secciones pero que el bot deba saber. Es como un "cajón de sastre" de información.
              </p>
            </div>

            <Textarea
              placeholder="Escribe aquí cualquier información adicional..."
              rows={5}
              value={formData?.additional_info || ''}
              onChange={(e) => updateField('additional_info', e.target.value)}
            />
            
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">💡 Ideas de qué poner aquí:</p>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 ml-4">
                <li>• <strong>Promociones:</strong> "Ahora mismo tenemos 20% de descuento con el código VERANO20"</li>
                <li>• <strong>Avisos temporales:</strong> "Esta semana estamos de vacaciones, los pedidos se envían el lunes"</li>
                <li>• <strong>Reglas especiales:</strong> "Los pedidos de más de 100€ tienen regalo sorpresa"</li>
                <li>• <strong>Información de temporada:</strong> "En Navidad hacemos cestas personalizadas"</li>
                <li>• <strong>Cualquier otra cosa:</strong> Lo que se te ocurra que el bot deba mencionar</li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

