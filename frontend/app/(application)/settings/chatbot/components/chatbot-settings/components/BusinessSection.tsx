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
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Tu Negocio</h3>
                  <p className="text-sm text-muted-foreground">Cuéntale al bot sobre tu empresa para que pueda informar a los clientes</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Business Info */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 mb-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>¿Para qué sirve esto?</strong> El bot usará esta información para responder preguntas como "¿Qué vendéis?", "¿Cómo os contacto?" o "¿Dónde estáis ubicados?".
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Nombre del negocio *</Label>
                <Input
                  id="business_name"
                  placeholder="Ej: Floristería María, TechStore, Clínica Dental Sonrisa..."
                  value={formData?.business_name || ''}
                  onChange={(e) => updateField('business_name', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">El nombre comercial de tu empresa o tienda</p>
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="business_description">Descripción breve *</Label>
                <Textarea
                  id="business_description"
                  placeholder="Ej: Somos una floristería familiar con 20 años de experiencia. Vendemos flores frescas, plantas y hacemos arreglos para bodas y eventos."
                  rows={3}
                  value={formData?.business_description || ''}
                  onChange={(e) => updateField('business_description', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Explica qué hace tu negocio en 2-3 frases. El bot usará esto para presentarse.</p>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Contact */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Contacto
              </h4>
              <p className="text-sm text-muted-foreground mb-3">Cuando un cliente pregunte cómo contactaros, el bot le dará esta información.</p>
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
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Horario de atención
              </h4>
              <p className="text-sm text-muted-foreground mb-3">El bot informará de tu horario cuando pregunten "¿A qué hora abrís?" o "¿Estáis abiertos?"</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Horario</Label>
                  <Input
                    placeholder="Ej: Lunes a Viernes 9:00-18:00, Sábados 10:00-14:00"
                    value={formData?.business_hours || ''}
                    onChange={(e) => updateField('business_hours', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Escríbelo como quieras que el bot lo diga a los clientes</p>
                </div>
                <div className="space-y-2">
                  <Label>Mensaje fuera de horario (opcional)</Label>
                  <Textarea
                    placeholder="Ej: Gracias por escribirnos. Ahora mismo estamos cerrados pero te responderemos mañana a primera hora."
                    rows={2}
                    value={formData?.out_of_hours_message || ''}
                    onChange={(e) => updateField('out_of_hours_message', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Este mensaje se envía cuando alguien escribe fuera de tu horario (si tienes activada esa opción)</p>
                </div>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Social Media */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Redes sociales
              </h4>
              <p className="text-sm text-muted-foreground mb-3">Si un cliente pregunta "¿Tenéis Instagram?" o "¿Dónde os puedo seguir?", el bot le dará estos enlaces.</p>
              <div className="space-y-2">
                {(formData?.social_media || []).map((social: { platform?: string; handle?: string }, index: number) => (
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
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Ubicaciones físicas
              </h4>
              <p className="text-sm text-muted-foreground mb-3">Si tienes tienda física, añádela aquí. El bot podrá decir "Estamos en Calle Mayor 123" o enviar el enlace de Google Maps.</p>
              <div className="space-y-3">
                {(formData?.locations || []).map((location: { name?: string; address?: string; google_maps_url?: string }, index: number) => (
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
