export interface ChatbotSettingsProps {
  formData: any
  updateField: (field: string, value: any) => void
  onFormDataChange?: (data: any) => void
  sessionId?: string
  widgetId?: string
  ecommerceConnections?: { id: string; platform: string; store_name: string }[]
}

export interface SectionProps {
  formData: any
  updateField: (field: string, value: any) => void
  updateNestedField: (parent: string, field: string, value: any) => void
  addToArray: (field: string, item: any) => void
  removeFromArray: (field: string, index: number) => void
  updateArrayItem: (field: string, index: number, value: any) => void
  ecommerceConnections?: { id: string; platform: string; store_name: string }[]
}
