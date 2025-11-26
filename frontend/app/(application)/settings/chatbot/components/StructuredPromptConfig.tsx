"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  Package, 
  FileText, 
  Phone, 
  Users, 
  MessageSquare, 
  HelpCircle, 
  Info,
  Lightbulb,
  Save,
  Loader2,
  TestTube
} from "lucide-react"

interface PromptSection {
  id: string
  title: string
  icon: React.ReactNode
  required: 'Obligatorio' | 'Recomendado' | 'Opcional'
  requiredColor: string
  fields: PromptField[]
}

interface PromptField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'list'
  placeholder: string
  example?: string
  description?: string
}

interface StructuredPromptData {
  // Business Info
  business_name: string
  business_type: string
  business_description: string
  business_location: string
  business_hours: string
  
  // Products
  products_description: string
  products_list: string
  price_range: string
  
  // Policies
  shipping_policy: string
  return_policy: string
  payment_methods: string
  warranty_info: string
  
  // Contact
  contact_phone: string
  contact_email: string
  contact_address: string
  social_media: string
  
  // Human Handoff
  handoff_triggers: string
  handoff_message: string
  handoff_schedule: string
  
  // Communication Style
  greeting_message: string
  farewell_message: string
  personality_traits: string
  forbidden_topics: string
  
  // FAQs
  faqs: string
  
  // Additional
  additional_info: string
  special_instructions: string
}

const defaultPromptData: StructuredPromptData = {
  business_name: '',
  business_type: '',
  business_description: '',
  business_location: '',
  business_hours: '',
  products_description: '',
  products_list: '',
  price_range: '',
  shipping_policy: '',
  return_policy: '',
  payment_methods: '',
  warranty_info: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  social_media: '',
  handoff_triggers: '',
  handoff_message: '',
  handoff_schedule: '',
  greeting_message: '',
  farewell_message: '',
  personality_traits: '',
  forbidden_topics: '',
  faqs: '',
  additional_info: '',
  special_instructions: ''
}

const sections: PromptSection[] = [
  {
    id: 'business',
    title: '1. Business Information',
    icon: <Building2 className="w-5 h-5" />,
    required: 'Obligatorio',
    requiredColor: 'text-red-600 bg-red-50',
    fields: [
      { id: 'business_name', label: 'Business Name', type: 'text', placeholder: 'e.g., TechStore Madrid', example: 'The official name of your business' },
      { id: 'business_type', label: 'Business Type', type: 'text', placeholder: 'e.g., Electronics store, Restaurant, Consulting', example: 'What type of business you run' },
      { id: 'business_description', label: 'Business Description', type: 'textarea', placeholder: 'Describe what your business does, your mission, and what makes you unique...', example: 'A brief description of your business for the AI to understand your context' },
      { id: 'business_location', label: 'Location', type: 'text', placeholder: 'e.g., Madrid, Spain - Online shipping nationwide', example: 'Where you operate or ship to' },
      { id: 'business_hours', label: 'Business Hours', type: 'text', placeholder: 'e.g., Mon-Fri 9:00-18:00, Sat 10:00-14:00', example: 'Your operating hours' },
    ]
  },
  {
    id: 'products',
    title: '2. Products',
    icon: <Package className="w-5 h-5" />,
    required: 'Opcional',
    requiredColor: 'text-gray-600 bg-gray-50',
    fields: [
      { id: 'products_description', label: 'Products/Services Overview', type: 'textarea', placeholder: 'Describe your main products or services...', example: 'General description of what you sell' },
      { id: 'products_list', label: 'Main Products/Services', type: 'textarea', placeholder: 'List your main products or services, one per line...', example: 'A list of your key offerings' },
      { id: 'price_range', label: 'Price Range', type: 'text', placeholder: 'e.g., €10-€500, Premium pricing, Budget-friendly', example: 'General price range of your products' },
    ]
  },
  {
    id: 'policies',
    title: '3. Policies & Services',
    icon: <FileText className="w-5 h-5" />,
    required: 'Recomendado',
    requiredColor: 'text-yellow-600 bg-yellow-50',
    fields: [
      { id: 'shipping_policy', label: 'Shipping Policy', type: 'textarea', placeholder: 'Describe your shipping options, times, and costs...', example: 'How you handle shipping' },
      { id: 'return_policy', label: 'Return Policy', type: 'textarea', placeholder: 'Describe your return and refund policy...', example: 'Your return/refund terms' },
      { id: 'payment_methods', label: 'Payment Methods', type: 'text', placeholder: 'e.g., Credit card, PayPal, Bank transfer, Cash on delivery', example: 'Accepted payment methods' },
      { id: 'warranty_info', label: 'Warranty Information', type: 'textarea', placeholder: 'Describe warranty terms if applicable...', example: 'Warranty details for your products' },
    ]
  },
  {
    id: 'contact',
    title: '4. Contact & Support',
    icon: <Phone className="w-5 h-5" />,
    required: 'Obligatorio',
    requiredColor: 'text-red-600 bg-red-50',
    fields: [
      { id: 'contact_phone', label: 'Phone Number', type: 'text', placeholder: 'e.g., +34 612 345 678', example: 'Your business phone' },
      { id: 'contact_email', label: 'Email', type: 'text', placeholder: 'e.g., info@yourbusiness.com', example: 'Your business email' },
      { id: 'contact_address', label: 'Physical Address', type: 'text', placeholder: 'e.g., Calle Gran Vía 123, Madrid', example: 'Your physical location if applicable' },
      { id: 'social_media', label: 'Social Media', type: 'text', placeholder: 'e.g., @yourbusiness on Instagram, Facebook', example: 'Your social media handles' },
    ]
  },
  {
    id: 'handoff',
    title: '5. Human Handoff',
    icon: <Users className="w-5 h-5" />,
    required: 'Recomendado',
    requiredColor: 'text-yellow-600 bg-yellow-50',
    fields: [
      { id: 'handoff_triggers', label: 'When to Transfer to Human', type: 'textarea', placeholder: 'e.g., Complex complaints, Refund requests over €100, Technical issues...', example: 'Situations when the bot should transfer to a human' },
      { id: 'handoff_message', label: 'Handoff Message', type: 'textarea', placeholder: 'e.g., I\'m connecting you with a human agent who can better assist you...', example: 'Message to show when transferring' },
      { id: 'handoff_schedule', label: 'Human Support Hours', type: 'text', placeholder: 'e.g., Mon-Fri 9:00-18:00', example: 'When human agents are available' },
    ]
  },
  {
    id: 'style',
    title: '6. Communication Style',
    icon: <MessageSquare className="w-5 h-5" />,
    required: 'Opcional',
    requiredColor: 'text-gray-600 bg-gray-50',
    fields: [
      { id: 'greeting_message', label: 'Greeting Message', type: 'textarea', placeholder: 'e.g., Hello! 👋 Welcome to TechStore. How can I help you today?', example: 'How the bot should greet customers' },
      { id: 'farewell_message', label: 'Farewell Message', type: 'textarea', placeholder: 'e.g., Thank you for contacting us! Have a great day! 🙏', example: 'How the bot should say goodbye' },
      { id: 'personality_traits', label: 'Personality Traits', type: 'text', placeholder: 'e.g., Friendly, Professional, Helpful, Uses emojis occasionally', example: 'How the bot should behave' },
      { id: 'forbidden_topics', label: 'Topics to Avoid', type: 'textarea', placeholder: 'e.g., Politics, Religion, Competitor comparisons...', example: 'Topics the bot should not discuss' },
    ]
  },
  {
    id: 'faqs',
    title: '7. FAQs',
    icon: <HelpCircle className="w-5 h-5" />,
    required: 'Opcional',
    requiredColor: 'text-gray-600 bg-gray-50',
    fields: [
      { id: 'faqs', label: 'Frequently Asked Questions', type: 'textarea', placeholder: 'Q: Do you ship internationally?\nA: Yes, we ship to all EU countries.\n\nQ: What is your return policy?\nA: 30-day returns on all items...', example: 'Common questions and their answers' },
    ]
  },
  {
    id: 'additional',
    title: '8. Additional Information',
    icon: <Info className="w-5 h-5" />,
    required: 'Opcional',
    requiredColor: 'text-gray-600 bg-gray-50',
    fields: [
      { id: 'additional_info', label: 'Additional Context', type: 'textarea', placeholder: 'Any other information the AI should know about your business...', example: 'Extra context for the AI' },
      { id: 'special_instructions', label: 'Special Instructions', type: 'textarea', placeholder: 'e.g., Always recommend our premium warranty, Mention current promotions...', example: 'Specific instructions for the AI' },
    ]
  },
]

interface StructuredPromptConfigProps {
  sessionId: string
  useEcommerceApi: boolean
  onUseEcommerceApiChange: (value: boolean) => void
  promptData: StructuredPromptData
  onPromptDataChange: (data: StructuredPromptData) => void
  onSave: () => void
  onTest: () => void
  isLoading: boolean
}

export function StructuredPromptConfig({
  sessionId,
  useEcommerceApi,
  onUseEcommerceApiChange,
  promptData,
  onPromptDataChange,
  onSave,
  onTest,
  isLoading
}: StructuredPromptConfigProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['business'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const updateField = (fieldId: string, value: string) => {
    onPromptDataChange({
      ...promptData,
      [fieldId]: value
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Prompt 2</h3>
        <p className="text-sm text-gray-600 mt-1">Configure your chatbot's knowledge and behavior</p>
      </div>

      {/* E-commerce Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Recommend Products via E-commerce API</p>
              <p className="text-sm text-gray-600">
                Enable to automatically recommend products from your connected store. Disable to add products manually or if your chatbot doesn't recommend products.
              </p>
            </div>
          </div>
          <Switch 
            checked={useEcommerceApi} 
            onCheckedChange={onUseEcommerceApiChange}
          />
        </div>
      </div>

      {/* Structured Prompt Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Structured Prompt Configuration
        </h4>
        <p className="text-sm text-gray-600 mt-1">
          Configure your chatbot easily by filling in only the relevant sections for your business. Each field has examples and explanations to help you.
        </p>
        <div className="flex items-center gap-2 mt-3 text-sm text-green-700 bg-green-100 rounded-lg px-3 py-2">
          <Lightbulb className="w-4 h-4" />
          <span><strong>Tip:</strong> You don't need to fill everything. Start with sections marked as "Obligatorio" and add more as needed.</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSections.includes(section.id)
          
          return (
            <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-green-600">{section.icon}</div>
                  <span className="font-medium text-gray-900">{section.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${section.requiredColor}`}>
                    {section.required}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-4 space-y-4 bg-white">
                  {section.fields.map((field) => {
                    const fieldValue = promptData[field.id as keyof StructuredPromptData] || ''
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={`${sessionId}-${field.id}`} className="text-sm font-medium">
                          {field.label}
                        </Label>
                        {field.example && (
                          <p className="text-xs text-gray-500">{field.example}</p>
                        )}
                        {field.type === 'textarea' ? (
                          <Textarea
                            id={`${sessionId}-${field.id}`}
                            value={fieldValue}
                            onChange={(e) => updateField(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={4}
                            className="resize-none"
                          />
                        ) : (
                          <Input
                            id={`${sessionId}-${field.id}`}
                            value={fieldValue}
                            onChange={(e) => updateField(field.id, e.target.value)}
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button 
          onClick={onSave} 
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
        <Button 
          onClick={onTest} 
          variant="outline"
          disabled={isLoading}
        >
          <TestTube className="w-4 h-4 mr-2" />
          Test Bot
        </Button>
      </div>
    </div>
  )
}

export type { StructuredPromptData }
export { defaultPromptData }
