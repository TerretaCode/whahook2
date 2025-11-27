"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  Building2,
  ChevronDown,
  ChevronRight,
  X,
  MapPin,
  Globe,
  Clock,
  Link2,
  Plus
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SectionProps } from "../types"

interface BusinessSectionProps extends SectionProps {
  isOpen: boolean
  onToggle: () => void
}

export function BusinessSection({ 
  formData, 
  updateField, 
  updateNestedField,
  addToArray,
  removeFromArray,
  updateArrayItem,
  isOpen,
  onToggle
}: BusinessSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
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
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
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
  )
}
