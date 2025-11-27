// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormDataValue = any

export interface ChatbotSettingsProps {
  formData: Record<string, FormDataValue>
  updateField: (field: string, value: FormDataValue) => void
  onFormDataChange?: (data: Record<string, FormDataValue>) => void
  sessionId?: string
  widgetId?: string
  ecommerceConnections?: { id: string; platform: string; store_name: string }[]
}

export interface SectionProps {
  formData: Record<string, FormDataValue>
  updateField: (field: string, value: FormDataValue) => void
  updateNestedField: (parent: string, field: string, value: FormDataValue) => void
  addToArray: (field: string, item: FormDataValue) => void
  removeFromArray: (field: string, index: number) => void
  updateArrayItem: (field: string, index: number, value: FormDataValue) => void
  ecommerceConnections?: { id: string; platform: string; store_name: string }[]
}
