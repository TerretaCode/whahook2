"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Package,
  ChevronDown,
  ChevronRight,
  Plus,
  Link2,
  RefreshCw,
  FileSpreadsheet,
  Edit3,
  Eye
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SectionProps } from "../types"

interface ProductsSectionProps extends SectionProps {
  isOpen: boolean
  onToggle: () => void
}

export function ProductsSection({ 
  formData, 
  updateField,
  ecommerceConnections = [],
  isOpen,
  onToggle
}: ProductsSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Productos</h3>
                  <p className="text-sm text-muted-foreground">Catálogo, categorías y recomendaciones</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Recommend products toggle */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Label className="flex-1">¿Quieres que el bot recomiende productos?</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recommend_products"
                    checked={formData?.recommend_products === true}
                    onChange={() => updateField('recommend_products', true)}
                    className="w-4 h-4"
                  />
                  <span>Sí, tengo productos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recommend_products"
                    checked={formData?.recommend_products === false}
                    onChange={() => updateField('recommend_products', false)}
                    className="w-4 h-4"
                  />
                  <span>No, solo informativo</span>
                </label>
              </div>
            </div>

            {formData?.recommend_products && (
              <>
                {/* Product sources */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* API Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">API</span>
                    </div>
                    {ecommerceConnections.length > 0 ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">
                          {ecommerceConnections.length} conexión(es)
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">Sin conexiones</p>
                        <Button variant="outline" size="sm" className="w-full">
                          Conectar API
                        </Button>
                      </>
                    )}
                  </Card>

                  {/* CSV Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileSpreadsheet className="w-5 h-5 text-green-500" />
                      <span className="font-medium">CSV</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">0 productos</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Importar CSV
                    </Button>
                  </Card>

                  {/* Manual Card */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 className="w-5 h-5 text-purple-500" />
                      <span className="font-medium">Manual</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">0 productos</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-2" /> Añadir
                    </Button>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" /> Ver todos los productos
                  </Button>
                </div>

                <hr className="border-dashed" />

                {/* Categories placeholder */}
                <div>
                  <h4 className="font-medium mb-3">Categorías y preguntas de filtrado</h4>
                  <p className="text-sm text-muted-foreground">
                    Las categorías se detectarán automáticamente de tus productos o puedes añadirlas manualmente.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="w-4 h-4 mr-2" /> Nueva categoría
                  </Button>
                </div>

                <hr className="border-dashed" />

                {/* Recommendation format */}
                <div>
                  <h4 className="font-medium mb-3">Al recomendar incluir:</h4>
                  <div className="flex flex-wrap gap-3">
                    {['Nombre', 'Precio', 'Beneficios', 'Link', 'Ingredientes', 'Modo de uso'].map((field) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData?.recommendation_format || ['Nombre', 'Precio', 'Beneficios', 'Link']).includes(field)}
                          onChange={(e) => {
                            const current = formData?.recommendation_format || ['Nombre', 'Precio', 'Beneficios', 'Link']
                            if (e.target.checked) {
                              updateField('recommendation_format', [...current, field])
                            } else {
                              updateField('recommendation_format', current.filter((f: string) => f !== field))
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Max products */}
                <div className="flex items-center gap-4">
                  <Label>Máx. productos por respuesta:</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData?.max_products_per_response || 3}
                    onChange={(e) => updateField('max_products_per_response', parseInt(e.target.value))}
                    className="w-20"
                  />
                </div>

                {/* No results behavior */}
                <div>
                  <h4 className="font-medium mb-3">Si no encuentra productos:</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'alternatives', label: 'Sugerir alternativas similares' },
                      { value: 'ask_more', label: 'Pedir más información al cliente' },
                      { value: 'offer_human', label: 'Ofrecer atención humana' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData?.no_results_behavior || ['alternatives']).includes(option.value)}
                          onChange={(e) => {
                            const current = formData?.no_results_behavior || ['alternatives']
                            if (e.target.checked) {
                              updateField('no_results_behavior', [...current, option.value])
                            } else {
                              updateField('no_results_behavior', current.filter((v: string) => v !== option.value))
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
