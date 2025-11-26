"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export function BasicConfigTab({ formData, updateField, showApiKey, onToggleApiKey, providerModels, ecommerceConnections }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración Básica</CardTitle>
        <CardDescription>Configura el proveedor de IA, modelo y credenciales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Proveedor de IA *</Label>
          <Select value={formData.provider || ''} onValueChange={(v) => updateField('provider', v)}>
            <SelectTrigger><SelectValue placeholder="Selecciona un proveedor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Gemini</SelectItem>
              <SelectItem value="openai">OpenAI GPT</SelectItem>
              <SelectItem value="anthropic">Anthropic Claude</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.provider && (
          <div className="space-y-2">
            <Label>Modelo *</Label>
            <Select value={formData.model || ''} onValueChange={(v) => updateField('model', v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona un modelo" /></SelectTrigger>
              <SelectContent>
                {providerModels[formData.provider]?.map((m: any) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>API Key *</Label>
          <div className="flex gap-2">
            <Input
              type={showApiKey ? "text" : "password"}
              value={formData.api_key || ''}
              onChange={(e) => updateField('api_key', e.target.value)}
              placeholder="sk-..."
            />
            <Button type="button" variant="outline" size="icon" onClick={onToggleApiKey}>
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nombre del Bot</Label>
          <Input value={formData.bot_name || ''} onChange={(e) => updateField('bot_name', e.target.value)} placeholder="Asistente" />
        </div>

        <div className="space-y-2">
          <Label>Idioma</Label>
          <Select value={formData.language || 'es'} onValueChange={(v) => updateField('language', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="it">Italiano</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tono de Conversación</Label>
          <Select value={formData.tone || 'professional'} onValueChange={(v) => updateField('tone', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Profesional</SelectItem>
              <SelectItem value="friendly">Amigable</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="enthusiastic">Entusiasta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Integración E-commerce</Label>
            <Switch checked={formData.use_ecommerce_api || false} onCheckedChange={(c) => updateField('use_ecommerce_api', c)} />
          </div>
          {formData.use_ecommerce_api && (
            <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Selecciona las APIs a integrar:</p>
                {ecommerceConnections.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay conexiones de e-commerce disponibles</p>
                ) : (
                  ecommerceConnections.map((c: any) => {
                    const isSelected = (formData.ecommerce_connection_ids || []).includes(c.id)
                    return (
                      <div key={c.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`ecommerce-${c.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            const currentIds = formData.ecommerce_connection_ids || []
                            const newIds = e.target.checked
                              ? [...currentIds, c.id]
                              : currentIds.filter((id: string) => id !== c.id)
                            updateField('ecommerce_connection_ids', newIds)
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`ecommerce-${c.id}`} className="text-sm text-gray-900 cursor-pointer">
                          <span className="font-medium">{c.platform}</span> - {c.store_name}
                        </label>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="pt-3 border-t border-blue-200">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">Búsqueda Automática Activada</p>
                      <p className="text-xs text-green-700 mt-1">
                        El bot buscará automáticamente en tu catálogo con cada mensaje. Si encuentra productos relacionados (como "absolut confort"), los incluirá en la respuesta. Si no encuentra nada, responderá normalmente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Mensaje Mientras Busca
                  </Label>
                  <p className="text-xs text-gray-600">
                    Este mensaje se enviará al usuario mientras el bot busca en tu catálogo de productos.
                  </p>
                  <input
                    type="text"
                    value={formData.ecommerce_search_message || 'Estoy buscando la mejor solución para ti...'}
                    onChange={(e) => updateField('ecommerce_search_message', e.target.value)}
                    placeholder="Estoy buscando la mejor solución para ti..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
