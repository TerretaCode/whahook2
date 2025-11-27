"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bot,
  Building2,
  Package,
  Truck,
  Target,
  MessageSquare,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  MapPin,
  Globe,
  Clock,
  CreditCard,
  RotateCcw,
  Shield,
  Link2,
  RefreshCw,
  FileSpreadsheet,
  Edit3,
  Eye
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface ChatbotSettingsTabProps {
  formData: any
  updateField: (field: string, value: any) => void
  onFormDataChange?: (data: any) => void
  sessionId?: string
  widgetId?: string
  ecommerceConnections?: { id: string; platform: string; store_name: string }[]
}

export function ChatbotSettingsTab({ 
  formData, 
  updateField, 
  onFormDataChange,
  sessionId,
  widgetId,
  ecommerceConnections = []
}: ChatbotSettingsTabProps) {
  // Section collapse states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    bot: true,
    business: false,
    products: false,
    shipping: false,
    behavior: false,
    conversation: false,
    escalation: false,
    additional: false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Helper to update nested objects
  const updateNestedField = (parent: string, field: string, value: any) => {
    const current = formData[parent] || {}
    updateField(parent, { ...current, [field]: value })
  }

  // Helper to add item to array
  const addToArray = (field: string, item: any) => {
    const current = formData[field] || []
    updateField(field, [...current, item])
  }

  // Helper to remove item from array
  const removeFromArray = (field: string, index: number) => {
    const current = formData[field] || []
    updateField(field, current.filter((_: any, i: number) => i !== index))
  }

  // Helper to update item in array
  const updateArrayItem = (field: string, index: number, value: any) => {
    const current = formData[field] || []
    const updated = [...current]
    updated[index] = value
    updateField(field, updated)
  }

  return (
    <div className="space-y-4">
      {/* 🤖 TU BOT - Always visible */}
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

      {/* 🏢 TU NEGOCIO */}
      <Collapsible open={openSections.business} onOpenChange={() => toggleSection('business')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Tu Negocio</h3>
                    <p className="text-sm text-muted-foreground">Información, contacto, horarios y ubicaciones</p>
                  </div>
                </div>
                {openSections.business ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Business Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nombre del negocio *</Label>
                  <Input
                    id="business_name"
                    placeholder="Mi Empresa"
                    value={formData?.business_name || ''}
                    onChange={(e) => updateField('business_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="business_description">Descripción breve *</Label>
                  <Textarea
                    id="business_description"
                    placeholder="Describe tu negocio en 2-3 líneas..."
                    rows={3}
                    value={formData?.business_description || ''}
                    onChange={(e) => updateField('business_description', e.target.value)}
                  />
                </div>
              </div>

              <hr className="border-dashed" />

              {/* Contact */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Contacto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="info@empresa.com"
                      value={formData?.contact?.email || ''}
                      onChange={(e) => updateNestedField('contact', 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="+34 900 123 456"
                      value={formData?.contact?.phone || ''}
                      onChange={(e) => updateNestedField('contact', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Web</Label>
                    <Input
                      placeholder="www.empresa.com"
                      value={formData?.contact?.website || ''}
                      onChange={(e) => updateNestedField('contact', 'website', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-dashed" />

              {/* Business Hours */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Horario de atención
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Horario</Label>
                    <Input
                      placeholder="Lunes a Viernes 9:00-18:00, Sábados 10:00-14:00"
                      value={formData?.business_hours || ''}
                      onChange={(e) => updateField('business_hours', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje fuera de horario</Label>
                    <Textarea
                      placeholder="Ahora no hay nadie disponible. Te contactamos mañana."
                      rows={2}
                      value={formData?.out_of_hours_message || ''}
                      onChange={(e) => updateField('out_of_hours_message', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-dashed" />

              {/* Social Media */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Redes sociales
                </h4>
                <div className="space-y-2">
                  {(formData?.social_media || []).map((social: any, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Instagram, TikTok..."
                        value={social.platform || ''}
                        onChange={(e) => updateArrayItem('social_media', index, { ...social, platform: e.target.value })}
                        className="w-1/3"
                      />
                      <Input
                        placeholder="@usuario o URL"
                        value={social.handle || ''}
                        onChange={(e) => updateArrayItem('social_media', index, { ...social, handle: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromArray('social_media', index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToArray('social_media', { platform: '', handle: '' })}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Añadir red social
                  </Button>
                </div>
              </div>

              <hr className="border-dashed" />

              {/* Locations */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Ubicaciones físicas
                </h4>
                <div className="space-y-3">
                  {(formData?.locations || []).map((location: any, index: number) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nombre (Tienda Central)"
                            value={location.name || ''}
                            onChange={(e) => updateArrayItem('locations', index, { ...location, name: e.target.value })}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromArray('locations', index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Dirección completa"
                          value={location.address || ''}
                          onChange={(e) => updateArrayItem('locations', index, { ...location, address: e.target.value })}
                        />
                        <Input
                          placeholder="Link de Google Maps (opcional)"
                          value={location.google_maps_url || ''}
                          onChange={(e) => updateArrayItem('locations', index, { ...location, google_maps_url: e.target.value })}
                        />
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToArray('locations', { name: '', address: '', google_maps_url: '' })}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Añadir ubicación
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 🛒 PRODUCTOS */}
      <Collapsible open={openSections.products} onOpenChange={() => toggleSection('products')}>
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
                {openSections.products ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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

      {/* 📦 ENVÍOS Y PAGOS */}
      <Collapsible open={openSections.shipping} onOpenChange={() => toggleSection('shipping')}>
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
                    <p className="text-sm text-muted-foreground">Métodos de envío, pago, devoluciones</p>
                  </div>
                </div>
                {openSections.shipping ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Shipping methods */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Métodos de envío
                </h4>
                <div className="space-y-2">
                  {(formData?.shipping_methods || []).map((method: any, index: number) => (
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
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Zonas de envío
                </h4>
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
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Métodos de pago
                </h4>
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
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Devoluciones
                </h4>
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
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Garantías
                </h4>
                <Textarea
                  placeholder="2 años en todos los productos..."
                  rows={2}
                  value={formData?.warranty || ''}
                  onChange={(e) => updateField('warranty', e.target.value)}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 🎯 COMPORTAMIENTO DEL BOT */}
      <Collapsible open={openSections.behavior} onOpenChange={() => toggleSection('behavior')}>
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
                    <p className="text-sm text-muted-foreground">Objetivo, restricciones e instrucciones</p>
                  </div>
                </div>
                {openSections.behavior ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Objective */}
              <div>
                <h4 className="font-medium mb-3">Objetivo principal:</h4>
                <div className="space-y-2">
                  {[
                    { value: 'sell', label: 'Vender / Recomendar productos' },
                    { value: 'inform', label: 'Informar / Resolver dudas' },
                    { value: 'leads', label: 'Captar leads / Recopilar datos' },
                    { value: 'support', label: 'Soporte post-venta' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bot_objective"
                        checked={formData?.bot_objective === option.value}
                        onChange={() => updateField('bot_objective', option.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
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

      {/* 💬 CONVERSACIÓN */}
      <Collapsible open={openSections.conversation} onOpenChange={() => toggleSection('conversation')}>
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
                {openSections.conversation ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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

      {/* 🚨 ESCALACIÓN */}
      <Collapsible open={openSections.escalation} onOpenChange={() => toggleSection('escalation')}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Escalación</h3>
                    <p className="text-sm text-muted-foreground">Cuándo pasar a humano e info a recopilar</p>
                  </div>
                </div>
                {openSections.escalation ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Escalation triggers */}
              <div>
                <h4 className="font-medium mb-3">Pasar a humano cuando:</h4>
                <div className="space-y-2">
                  {[
                    'Cliente pide hablar con persona',
                    'Queja o reclamación',
                    'Problema con pedido'
                  ].map((trigger) => (
                    <label key={trigger} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData?.escalation_triggers || []).includes(trigger)}
                        onChange={(e) => {
                          const current = formData?.escalation_triggers || []
                          if (e.target.checked) {
                            updateField('escalation_triggers', [...current, trigger])
                          } else {
                            updateField('escalation_triggers', current.filter((t: string) => t !== trigger))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{trigger}</span>
                    </label>
                  ))}
                  {(formData?.custom_escalation_triggers || []).map((trigger: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input type="checkbox" checked className="w-4 h-4" readOnly />
                      <Input
                        value={trigger}
                        onChange={(e) => updateArrayItem('custom_escalation_triggers', index, e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeFromArray('custom_escalation_triggers', index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToArray('custom_escalation_triggers', '')}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Añadir motivo personalizado
                  </Button>
                </div>
              </div>

              <hr className="border-dashed" />

              {/* Escalation message */}
              <div>
                <h4 className="font-medium mb-3">Mensaje al escalar:</h4>
                <Textarea
                  placeholder="Te paso con un compañero que te ayudará mejor. Un momento."
                  rows={2}
                  value={formData?.escalation_message || ''}
                  onChange={(e) => updateField('escalation_message', e.target.value)}
                />
              </div>

              <hr className="border-dashed" />

              {/* Info to collect */}
              <div>
                <h4 className="font-medium mb-3">Información a recopilar del cliente:</h4>
                <div className="space-y-2">
                  {['Nombre completo', 'Email', 'Teléfono', 'Número de pedido', 'Empresa'].map((field) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData?.info_fields_to_collect || ['Nombre completo', 'Email', 'Teléfono']).includes(field)}
                        onChange={(e) => {
                          const current = formData?.info_fields_to_collect || ['Nombre completo', 'Email', 'Teléfono']
                          if (e.target.checked) {
                            updateField('info_fields_to_collect', [...current, field])
                          } else {
                            updateField('info_fields_to_collect', current.filter((f: string) => f !== field))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{field}</span>
                    </label>
                  ))}
                  {(formData?.custom_info_fields || []).map((field: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input type="checkbox" checked className="w-4 h-4" readOnly />
                      <Input
                        value={field}
                        onChange={(e) => updateArrayItem('custom_info_fields', index, e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeFromArray('custom_info_fields', index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addToArray('custom_info_fields', '')}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Añadir campo personalizado
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                  <span className="text-blue-500">💡</span>
                  Esta info se guarda en la ficha del cliente (CRM)
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ➕ INFORMACIÓN ADICIONAL */}
      <Collapsible open={openSections.additional} onOpenChange={() => toggleSection('additional')}>
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
                {openSections.additional ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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
    </div>
  )
}
