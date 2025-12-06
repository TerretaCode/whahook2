"use client"

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('settings.chatbot.shippingSection')
  
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="pt-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Info box */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>{t('whyThisTitle')}</strong> {t('whyThisDesc')}
              </p>
            </div>

            {/* Shipping methods */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" /> {t('shippingMethods')}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{t('shippingMethodsDesc')}</p>
              <div className="space-y-2">
                {(formData?.shipping_methods || []).map((method: { name?: string; delivery_time?: string; price?: string; free_from?: string }, index: number) => (
                  <Card key={index} className="p-3">
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder={t('name')}
                        value={method.name || ''}
                        onChange={(e) => updateArrayItem('shipping_methods', index, { ...method, name: e.target.value })}
                      />
                      <Input
                        placeholder={t('time')}
                        value={method.delivery_time || ''}
                        onChange={(e) => updateArrayItem('shipping_methods', index, { ...method, delivery_time: e.target.value })}
                      />
                      <Input
                        placeholder={t('price')}
                        value={method.price || ''}
                        onChange={(e) => updateArrayItem('shipping_methods', index, { ...method, price: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('freeFrom')}
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
                  <Plus className="w-4 h-4 mr-2" /> {t('addShippingMethod')}
                </Button>
              </div>
            </div>

            <hr className="border-dashed" />

            {/* Shipping zones */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> {t('shippingZones')}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{t('shippingZonesDesc')}</p>
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
                  placeholder={t('newZone')}
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
                <CreditCard className="w-4 h-4" /> {t('paymentMethods')}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{t('paymentMethodsDesc')}</p>
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
                  placeholder={t('newMethod')}
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
                <RotateCcw className="w-4 h-4" /> {t('returns')}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{t('returnsDesc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('returnDays')}</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={formData?.returns?.days || ''}
                    onChange={(e) => updateNestedField('returns', 'days', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('returnCost')}</Label>
                  <Input
                    placeholder={t('free')}
                    value={formData?.returns?.cost || ''}
                    onChange={(e) => updateNestedField('returns', 'cost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('returnConditions')}</Label>
                  <Input
                    placeholder={t('unopenedProduct')}
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
                <Shield className="w-4 h-4" /> {t('warranty')}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">{t('warrantyDesc')}</p>
              <Textarea
                placeholder={t('warrantyPlaceholder')}
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

