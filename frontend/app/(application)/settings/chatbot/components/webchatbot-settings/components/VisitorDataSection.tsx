"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { 
  UserCircle,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  User
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionProps } from "../types"

interface VisitorDataSectionProps extends Pick<SectionProps, 'formData' | 'updateField'> {
  isOpen: boolean
  onToggle: () => void
}

export function VisitorDataSection({ 
  formData, 
  updateField, 
  isOpen,
  onToggle
}: VisitorDataSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                  <UserCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Datos del Visitante</h3>
                  <p className="text-sm text-muted-foreground">Configura qué información pedir a los visitantes web</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            <div className="p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg border border-cyan-200 dark:border-cyan-800 mb-4">
              <p className="text-sm text-cyan-800 dark:text-cyan-200">
                <strong>¿Para qué sirve?</strong> El bot puede pedir nombre, email o teléfono a los visitantes de tu web. 
                Esta información se guarda automáticamente en tu base de clientes.
              </p>
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Recolectar datos de visitantes</Label>
                <p className="text-sm text-muted-foreground">
                  El bot pedirá información de contacto durante la conversación
                </p>
              </div>
              <Switch
                checked={formData?.collect_visitor_data || false}
                onCheckedChange={(checked) => updateField('collect_visitor_data', checked)}
              />
            </div>

            {formData?.collect_visitor_data && (
              <>
                {/* What to collect */}
                <div className="space-y-4">
                  <h4 className="font-medium">¿Qué datos pedir?</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <Label>Nombre</Label>
                      </div>
                      <Switch
                        checked={formData?.collect_name || false}
                        onCheckedChange={(checked) => updateField('collect_name', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <Label>Email</Label>
                      </div>
                      <Switch
                        checked={formData?.collect_email || false}
                        onCheckedChange={(checked) => updateField('collect_email', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <Label>Teléfono</Label>
                      </div>
                      <Switch
                        checked={formData?.collect_phone || false}
                        onCheckedChange={(checked) => updateField('collect_phone', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* When to collect */}
                <div className="space-y-2">
                  <Label>¿Cuándo pedir los datos?</Label>
                  <Select 
                    value={formData?.collect_data_timing || 'during_chat'} 
                    onValueChange={(value) => updateField('collect_data_timing', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona momento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before_chat">Antes de empezar - Formulario inicial</SelectItem>
                      <SelectItem value="during_chat">Durante la conversación - El bot los pide naturalmente</SelectItem>
                      <SelectItem value="end_of_chat">Al final - Antes de despedirse</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    "Durante la conversación" es más natural y tiene mejor tasa de respuesta
                  </p>
                </div>

                {/* Human handoff email */}
                <div className="space-y-2">
                  <Label htmlFor="human_handoff_email">Email para transferencias a humano</Label>
                  <Input
                    id="human_handoff_email"
                    type="email"
                    placeholder="soporte@empresa.com"
                    value={formData?.human_handoff_email || ''}
                    onChange={(e) => updateField('human_handoff_email', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cuando un visitante pida hablar con un humano, recibirás una notificación en este email
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
