"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Truck,
  ChevronDown,
  ChevronRight,
  X,
  Globe,
  CreditCard,
  RotateCcw,
  Shield,
  Plus
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SectionProps } from "../types"

interface ShippingSectionProps extends SectionProps {
  isOpen: boolean
  onToggle: () => void
}

export function ShippingSection({ 
  formData, 
  updateField, 
  updateNestedField,
  addToArray,
  removeFromArray,
  updateArrayItem,
  isOpen,
  onToggle
}: ShippingSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Truck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Envíos y Pagos</h3>
                  <p className="text-sm text-muted-foreground">Info para responder "¿Cuánto cuesta el envío?" o "¿Aceptáis Bizum?"</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Info box */}
            <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>¿Para qué sirve esto?</strong> Cuando un cliente pregunte sobre envíos, pagos o devoluciones, el bot usará esta información para responder.
              </p>
            </div>

            {/* Shipping methods */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Métodos de envío
              </h4>
              <p className="text-sm text-muted-foreground mb-3">Añade las opciones de envío que ofreces. Ej: "Envío estándar - 3-5 días - 4,95€"</p>
              <div className="space-y-2">
                {(formData?.shipping_methods || []).map((method: { name?: string; delivery_time?: string; price?: string; free_from?: string }, index: number) => (
                  <Card key={index} className="p-3">
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Nombre"
                        value={method.name || ''}
                        onChange={(e) => updateArrayItem('shipping_methods', index, { ...method, name: e.target.value })}
                      />
                      <Input
                        placeholder="Tiempo"
                        value={method.delivery_time || ''}
                        onChange={(e) => updateArrayItem('shipping_methods', index, { ...method, delivery_time: e.target.value })}
                      />
                      <Input
                        placeholder="Precio"
                        value={method.price || ''}
                        onChange={(e) => updateArrayItem('shipping_methods', index, { ...method, price: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Gratis desde"
                          value={method.free_from || ''}
                          onChange={(e) => updateArrayItem('shipping_methods', index, { ...method, free_from: e.target.value })}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeFromArray('shipping_methods', index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToArray('shipping_methods', { name: '', delivery_time: '', price: '', free_from: '' })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Añadir método de envío
                </Button>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Shipping zones */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Zonas de envío
              </h4>
              <p className="text-sm text-muted-foreground mb-3">¿A dónde envías? Escribe y pulsa Enter. Ej: "España", "Europa", "Todo el mundo"</p>
              <div className="flex flex-wrap gap-2">
                {(formData?.shipping_zones || []).map((zone: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {zone}
                    <button onClick={() => removeFromArray('shipping_zones', index)} className="ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Nueva zona..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('shipping_zones', (e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                  className="max-w-xs"
                />
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Payment methods */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Métodos de pago
              </h4>
              <p className="text-sm text-muted-foreground mb-3">¿Cómo pueden pagar tus clientes? Escribe y pulsa Enter. Ej: "Tarjeta", "PayPal", "Bizum"</p>
              <div className="flex flex-wrap gap-2">
                {(formData?.payment_methods || []).map((method: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {method}
                    <button onClick={() => removeFromArray('payment_methods', index)} className="ml-2">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Nuevo método..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('payment_methods', (e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                  className="max-w-xs"
                />
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Returns */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Devoluciones
              </h4>
              <p className="text-sm text-muted-foreground mb-3">Cuando pregunten "¿Puedo devolver un producto?", el bot dará esta info.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Plazo (días)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={formData?.returns?.days || ''}
                    onChange={(e) => updateNestedField('returns', 'days', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coste</Label>
                  <Input
                    placeholder="Gratis"
                    value={formData?.returns?.cost || ''}
                    onChange={(e) => updateNestedField('returns', 'cost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condiciones</Label>
                  <Input
                    placeholder="Producto sin abrir"
                    value={formData?.returns?.conditions || ''}
                    onChange={(e) => updateNestedField('returns', 'conditions', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Warranty */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Garantías
              </h4>
              <p className="text-sm text-muted-foreground mb-3">¿Ofreces garantía en tus productos? Descríbela aquí.</p>
              <Textarea
                placeholder="Ej: 2 años de garantía en todos los productos. Garantía de satisfacción: si no te gusta, te devolvemos el dinero."
                rows={2}
                value={formData?.warranty || ''}
                onChange={(e) => updateField('warranty', e.target.value)}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
