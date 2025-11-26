"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Building2, 
  Package, 
  HelpCircle, 
  Truck, 
  Phone, 
  Target,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Sparkles,
  FileText,
  Lightbulb
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Prompt2ApiClient } from "@/lib/prompt2-api"
import { toast } from "sonner"
import type { WhatsAppPrompt2Config } from "@/types/prompt2.types"

interface Prompt2ConfigTabProps {
  formData: any
  updateField: (field: string, value: any) => void
  onFormDataChange?: (data: any) => void // Direct access to parent's setState
  sessionId?: string // WhatsApp session ID
  widgetId?: string // Widget ID (for future use)
}

export function Prompt2ConfigTab({ formData, updateField, onFormDataChange, sessionId, widgetId }: Prompt2ConfigTabProps) {
  // Debug: Log formData changes
  useEffect(() => {
    console.log('📊 formData changed:', formData)
    console.log('  - business_name:', formData?.business_name)
  }, [formData])

  // Loading states
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [recommendProducts, setRecommendProducts] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [featuredProducts, setFeaturedProducts] = useState<{
    name: string
    description: string
    price: string
    url: string
    additionalInfo?: string
  }[]>([])
  const [expandedProducts, setExpandedProducts] = useState<number[]>([])
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([
    { question: "", answer: "" }
  ])
  
  // Checkboxes predeterminados (no eliminables)
  const defaultEscalationReasons = [
    "Condiciones médicas mencionadas",
    "Productos defectuosos",
    "Consultas técnicas complejas",
    "Pedidos con problemas"
  ]
  const [selectedEscalationReasons, setSelectedEscalationReasons] = useState<string[]>(defaultEscalationReasons)
  const [customEscalationReasons, setCustomEscalationReasons] = useState<string[]>([])
  const [newEscalationReason, setNewEscalationReason] = useState("")
  
  const defaultInfoFields = ["Nombre", "Email", "Número de pedido", "Teléfono"]
  const [selectedInfoFields, setSelectedInfoFields] = useState<string[]>(defaultInfoFields)
  const [customInfoFields, setCustomInfoFields] = useState<string[]>([])
  const [newInfoField, setNewInfoField] = useState("")
  
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [newPaymentMethod, setNewPaymentMethod] = useState("")
  
  const defaultResponseItems = [
    "Incluir nombre del producto",
    "Incluir precio",
    "Incluir beneficios",
    "Incluir modo de uso",
    "Incluir enlace del producto"
  ]
  const [selectedResponseItems, setSelectedResponseItems] = useState<string[]>(defaultResponseItems)
  const [customResponseItems, setCustomResponseItems] = useState<string[]>([])
  const [newResponseItem, setNewResponseItem] = useState("")
  
  // Subcategories per category (JSONB: {category: "subcategories comma separated"})
  const [subcategories, setSubcategories] = useState<Record<string, string>>({})
  
  // Key questions per category: { category: ["question1", "question2", ...] }
  const [keyQuestions, setKeyQuestions] = useState<Record<string, string[]>>({})
  
  // Max questions per category: { category: number }
  const [maxQuestionsPerCategory, setMaxQuestionsPerCategory] = useState<Record<string, number>>({})
  
  // Social media (JSONB: {platform: "handle"})
  const [socialMedia, setSocialMedia] = useState<Record<string, string>>({
    instagram: "",
    facebook: "",
    twitter: "",
    tiktok: "",
    linkedin: "",
    youtube: ""
  })

  const addCategory = () => {
    if (newCategory.trim()) {
      const updatedCategories = [...categories, newCategory.trim()]
      setCategories(updatedCategories)
      setNewCategory("")
      // Sync with formData
      if (onFormDataChange) {
        onFormDataChange({ ...formData, product_categories: updatedCategories })
      }
    }
  }

  const removeCategory = (index: number) => {
    const updatedCategories = categories.filter((_, i) => i !== index)
    setCategories(updatedCategories)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, product_categories: updatedCategories })
    }
  }

  // Featured products
  const addFeaturedProduct = () => {
    const updatedProducts = [...featuredProducts, {
      name: "",
      description: "",
      price: "",
      url: "",
      additionalInfo: ""
    }]
    setFeaturedProducts(updatedProducts)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, featured_products: updatedProducts })
    }
  }

  const removeFeaturedProduct = (index: number) => {
    const updatedProducts = featuredProducts.filter((_, i) => i !== index)
    setFeaturedProducts(updatedProducts)
    setExpandedProducts(expandedProducts.filter(i => i !== index))
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, featured_products: updatedProducts })
    }
  }

  const updateFeaturedProduct = (index: number, field: keyof typeof featuredProducts[0], value: string) => {
    const newProducts = [...featuredProducts]
    newProducts[index][field] = value
    setFeaturedProducts(newProducts)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, featured_products: newProducts })
    }
  }

  const toggleProductExpanded = (index: number) => {
    setExpandedProducts(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  const addFaq = () => {
    const updatedFaqs = [...faqs, { question: "", answer: "" }]
    setFaqs(updatedFaqs)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, faqs: updatedFaqs })
    }
  }

  const removeFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index)
    setFaqs(updatedFaqs)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, faqs: updatedFaqs })
    }
  }

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]
    newFaqs[index][field] = value
    setFaqs(newFaqs)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, faqs: newFaqs })
    }
  }

  // Escalation reasons
  const toggleEscalationReason = (reason: string) => {
    const updated = selectedEscalationReasons.includes(reason) 
      ? selectedEscalationReasons.filter(r => r !== reason) 
      : [...selectedEscalationReasons, reason]
    setSelectedEscalationReasons(updated)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, escalation_reasons: updated })
    }
  }

  const addCustomEscalationReason = () => {
    if (newEscalationReason.trim()) {
      const updatedCustom = [...customEscalationReasons, newEscalationReason.trim()]
      const updatedSelected = [...selectedEscalationReasons, newEscalationReason.trim()]
      setCustomEscalationReasons(updatedCustom)
      setSelectedEscalationReasons(updatedSelected)
      setNewEscalationReason("")
      // Sync with formData
      if (onFormDataChange) {
        onFormDataChange({ 
          ...formData, 
          escalation_reasons: updatedSelected,
          custom_escalation_reasons: updatedCustom
        })
      }
    }
  }

  const removeCustomEscalationReason = (reason: string) => {
    const updatedCustom = customEscalationReasons.filter(r => r !== reason)
    const updatedSelected = selectedEscalationReasons.filter(r => r !== reason)
    setCustomEscalationReasons(updatedCustom)
    setSelectedEscalationReasons(updatedSelected)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ 
        ...formData, 
        escalation_reasons: updatedSelected,
        custom_escalation_reasons: updatedCustom
      })
    }
  }

  // Info fields
  const toggleInfoField = (field: string) => {
    const updated = selectedInfoFields.includes(field)
      ? selectedInfoFields.filter(f => f !== field)
      : [...selectedInfoFields, field]
    setSelectedInfoFields(updated)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, info_fields_to_collect: updated })
    }
  }

  const addCustomInfoField = () => {
    if (newInfoField.trim()) {
      const updatedCustom = [...customInfoFields, newInfoField.trim()]
      const updatedSelected = [...selectedInfoFields, newInfoField.trim()]
      setCustomInfoFields(updatedCustom)
      setSelectedInfoFields(updatedSelected)
      setNewInfoField("")
      // Sync with formData
      if (onFormDataChange) {
        onFormDataChange({ ...formData, info_fields_to_collect: updatedSelected })
      }
    }
  }

  const removeCustomInfoField = (field: string) => {
    const updatedCustom = customInfoFields.filter(f => f !== field)
    const updatedSelected = selectedInfoFields.filter(f => f !== field)
    setCustomInfoFields(updatedCustom)
    setSelectedInfoFields(updatedSelected)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, info_fields_to_collect: updatedSelected })
    }
  }

  // Payment methods
  const addPaymentMethod = () => {
    if (newPaymentMethod.trim()) {
      const updatedMethods = [...paymentMethods, newPaymentMethod.trim()]
      setPaymentMethods(updatedMethods)
      setNewPaymentMethod("")
      // Sync with formData
      if (onFormDataChange) {
        onFormDataChange({ ...formData, payment_methods: updatedMethods })
      }
    }
  }

  const removePaymentMethod = (index: number) => {
    const updatedMethods = paymentMethods.filter((_, i) => i !== index)
    setPaymentMethods(updatedMethods)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, payment_methods: updatedMethods })
    }
  }

  // Response structure
  const toggleResponseItem = (item: string) => {
    const updated = selectedResponseItems.includes(item)
      ? selectedResponseItems.filter(i => i !== item)
      : [...selectedResponseItems, item]
    setSelectedResponseItems(updated)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, response_structure_items: updated })
    }
  }

  const addCustomResponseItem = () => {
    if (newResponseItem.trim()) {
      const updatedCustom = [...customResponseItems, newResponseItem.trim()]
      const updatedSelected = [...selectedResponseItems, newResponseItem.trim()]
      setCustomResponseItems(updatedCustom)
      setSelectedResponseItems(updatedSelected)
      setNewResponseItem("")
      // Sync with formData
      if (onFormDataChange) {
        onFormDataChange({ ...formData, response_structure_items: updatedSelected })
      }
    }
  }

  const removeCustomResponseItem = (item: string) => {
    const updatedCustom = customResponseItems.filter(i => i !== item)
    const updatedSelected = selectedResponseItems.filter(i => i !== item)
    setCustomResponseItems(updatedCustom)
    setSelectedResponseItems(updatedSelected)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, response_structure_items: updatedSelected })
    }
  }

  // Helper functions for key questions
  const updateKeyQuestion = (category: string, questionIndex: number, value: string) => {
    const maxQuestions = maxQuestionsPerCategory[category] || 2
    const categoryQuestions = keyQuestions[category] || Array(maxQuestions).fill('')
    const updatedQuestions = [...categoryQuestions]
    updatedQuestions[questionIndex] = value
    const updatedKeyQuestions = {...keyQuestions, [category]: updatedQuestions}
    setKeyQuestions(updatedKeyQuestions)
    // Sync with formData
    if (onFormDataChange) {
      onFormDataChange({ ...formData, key_questions: updatedKeyQuestions })
    }
  }

  const updateMaxQuestionsForCategory = (category: string, newMax: number) => {
    const updatedMaxQuestions = {...maxQuestionsPerCategory, [category]: newMax}
    setMaxQuestionsPerCategory(updatedMaxQuestions)
    
    // Update formData to persist the change
    if (onFormDataChange) {
      onFormDataChange({
        ...formData,
        max_questions_per_category: updatedMaxQuestions
      })
    }
    
    // Adjust questions array if needed
    const currentQuestions = keyQuestions[category] || []
    if (currentQuestions.length < newMax) {
      // Add empty slots
      const updatedQuestions = [...currentQuestions, ...Array(newMax - currentQuestions.length).fill('')]
      setKeyQuestions({...keyQuestions, [category]: updatedQuestions})
    } else if (currentQuestions.length > newMax) {
      // Trim excess questions
      const updatedQuestions = currentQuestions.slice(0, newMax)
      setKeyQuestions({...keyQuestions, [category]: updatedQuestions})
    }
  }

  // ============================================
  // LOAD & SAVE CONFIGURATION
  // ============================================

  /**
   * Load configuration from backend
   */
  const loadConfig = async () => {
    if (!sessionId) {
      console.log('❌ No sessionId provided, skipping load')
      return
    }

    console.log('🔄 Loading Prompt2 config for sessionId:', sessionId)
    setLoading(true)
    try {
      const response = await Prompt2ApiClient.getWhatsAppConfig(sessionId)
      console.log('📥 Prompt2 API response:', response)

      if (!response.success || !response.data) {
        console.log('⚠️ No configuration found, using defaults')
        return
      }

      const config = response.data
      console.log('✅ Prompt2 config loaded:', config)

      // Map backend data to frontend state
      console.log('🔄 Setting state from config...')
      console.log('  - recommend_products:', config.recommend_products)
      console.log('  - featured_products:', config.featured_products)
      console.log('  - product_categories:', config.product_categories)
      console.log('  - subcategories:', config.subcategories)
      console.log('  - key_questions:', config.key_questions)
      console.log('  - max_questions_before_recommend:', config.max_questions_before_recommend)
      console.log('  - social_media:', config.social_media)
      console.log('  - faqs:', config.faqs)
      console.log('  - payment_methods:', config.payment_methods)

      // Update local state
      setRecommendProducts(config.recommend_products ?? true)
      setFeaturedProducts(config.featured_products || [])
      setCategories(config.product_categories || [])
      setSubcategories(config.subcategories || {})
      
      // Handle key_questions - can be old format (string) or new format (array)
      const loadedKeyQuestions: Record<string, string[]> = {}
      const loadedMaxQuestions: Record<string, number> = {}
      
      if (config.key_questions) {
        Object.entries(config.key_questions).forEach(([category, questions]) => {
          if (typeof questions === 'string') {
            // Old format: convert string to array (split by newlines or keep as single question)
            const questionsArray = (questions as string).split('\n').filter((q: string) => q.trim())
            loadedKeyQuestions[category] = questionsArray
            loadedMaxQuestions[category] = questionsArray.length || 2
          } else if (Array.isArray(questions)) {
            // New format: already an array
            loadedKeyQuestions[category] = questions as string[]
            loadedMaxQuestions[category] = questions.length || 2
          }
        })
      }
      
      // Load max_questions_per_category if exists, otherwise use calculated from questions length
      if (config.max_questions_per_category) {
        Object.assign(loadedMaxQuestions, config.max_questions_per_category)
      }
      
      setKeyQuestions(loadedKeyQuestions)
      setMaxQuestionsPerCategory(loadedMaxQuestions)
      setFaqs(config.faqs || [{ question: '', answer: '' }])
      setSelectedEscalationReasons(config.escalation_reasons || defaultEscalationReasons)
      setCustomEscalationReasons(config.custom_escalation_reasons || [])
      
      // Load info fields and separate custom ones
      const loadedInfoFields = config.info_fields_to_collect || defaultInfoFields
      setSelectedInfoFields(loadedInfoFields)
      const customInfo = loadedInfoFields.filter((field: string) => !defaultInfoFields.includes(field))
      setCustomInfoFields(customInfo)
      console.log('  - Loaded info fields:', loadedInfoFields, 'Custom:', customInfo)
      
      // Load response items and separate custom ones
      const loadedResponseItems = config.response_structure_items || defaultResponseItems
      setSelectedResponseItems(loadedResponseItems)
      const customResponse = loadedResponseItems.filter((item: string) => !defaultResponseItems.includes(item))
      setCustomResponseItems(customResponse)
      console.log('  - Loaded response items:', loadedResponseItems, 'Custom:', customResponse)
      
      setPaymentMethods(config.payment_methods || [])
      setSocialMedia({
        instagram: config.social_media?.instagram || "",
        facebook: config.social_media?.facebook || "",
        twitter: config.social_media?.twitter || "",
        tiktok: config.social_media?.tiktok || "",
        linkedin: config.social_media?.linkedin || "",
        youtube: config.social_media?.youtube || ""
      })

      // Update ALL formData fields in a SINGLE batch update
      console.log('🔄 Batch updating ALL formData fields...')
      console.log('  - business_name from config:', config.business_name)
      console.log('  - formData before update:', formData)
      
      // Create an object with ALL Prompt2 fields
      // IMPORTANT: Always set ALL fields, even if empty, to ensure formData stays in sync with local state
      const prompt2Fields: Record<string, any> = {
        // 1. Business Info
        business_name: config.business_name || '',
        business_description: config.business_description || '',
        business_values: config.business_values || '',
        store_type: config.store_type || '',
        
        // 2. Products
        recommend_products: config.recommend_products ?? true,
        featured_products: config.featured_products || [],
        
        // 3. Catalog
        product_categories: config.product_categories || [],
        subcategories: config.subcategories || {},
        
        // 4. Key Questions
        key_questions: loadedKeyQuestions,
        max_questions_per_category: loadedMaxQuestions,
        max_questions_before_recommend: config.max_questions_before_recommend || 2,
        
        // 5. Policies
        shipping_policy: config.shipping_policy || '',
        return_policy: config.return_policy || '',
        payment_methods: config.payment_methods || [],
        delivery_time: config.delivery_time || '',
        shipping_cost: config.shipping_cost || '',
        guarantees_certifications: config.guarantees_certifications || '',
        
        // 6. Contact
        contact_email: config.contact_email || '',
        contact_phone: config.contact_phone || '',
        contact_hours: config.contact_hours || '',
        physical_address: config.physical_address || '',
        social_media: config.social_media || {},
        out_of_hours_message: config.out_of_hours_message || '',
        
        // 7. Recommendation Rules
        response_structure_items: loadedResponseItems,
        special_recommendation_rules: config.special_recommendation_rules || '',
        recommendation_rules: config.recommendation_rules || [],
        
        // 8. Escalation
        escalation_reasons: config.escalation_reasons || defaultEscalationReasons,
        custom_escalation_reasons: config.custom_escalation_reasons || [],
        escalation_instructions: config.escalation_instructions || '',
        escalation_message_user: config.escalation_message_user || '',
        info_fields_to_collect: loadedInfoFields,
        
        // 9. Communication Style
        communication_style: config.communication_style || '',
        emoji_usage: config.emoji_usage || '',
        use_emojis: config.use_emojis ?? false,
        communication_priority: config.communication_priority || '',
        max_response_length: config.max_response_length || null,
        brand_voice_keywords: config.brand_voice_keywords || [],
        
        // 10. FAQs
        faqs: config.faqs || [],
        
        // 11. Additional Info
        additional_context: config.additional_context || '',
        special_instructions: config.special_instructions || '',
        seasonal_info: config.seasonal_info || ''
      }
      
      console.log('  📦 Prompt2 fields to batch update:', prompt2Fields)
      
      // CRITICAL: Update parent formData with ALL fields in ONE call
      // This prevents race conditions from multiple setState calls
      if (Object.keys(prompt2Fields).length > 0) {
        // Merge all Prompt2 fields into formData at once
        const updatedFormData = { ...formData, ...prompt2Fields }
        console.log('  📤 Calling onFormDataChange with merged data')
        console.log('  📊 Updated formData will be:', updatedFormData)
        
        // If we have direct access to onFormDataChange, use it for batch update
        if (onFormDataChange) {
          console.log('  ✅ Using onFormDataChange for batch update')
          onFormDataChange(updatedFormData)
        } else {
          // Fallback: update each field individually (React will batch in most cases)
          console.log('  ⚠️ Falling back to individual updateField calls')
          Object.entries(prompt2Fields).forEach(([field, value]) => {
            updateField(field, value)
          })
        }
      }
      
      console.log('  ✅ Batch update complete')

      console.log('✅ State updated successfully')
      toast.success('Configuración cargada correctamente')
    } catch (error: any) {
      console.error('❌ Error loading config:', error)
      if (error.response?.status !== 404) {
        toast.error('Error al cargar la configuración')
      }
    } finally {
      setLoading(false)
      console.log('🏁 Load complete')
    }
  }

  // Load configuration on mount or when sessionId changes
  useEffect(() => {
    console.log('🔄 useEffect triggered, sessionId:', sessionId)
    if (sessionId) {
      console.log('✅ SessionId available, loading config...')
      loadConfig()
    } else {
      console.log('⚠️ No sessionId, skipping load')
    }
  }, [sessionId])

  // Dynamic section numbering - calculates section numbers based on visible sections
  const getSectionNumber = (() => {
    let counter = 0
    return () => ++counter
  })()

  return (
    <div className="space-y-6">
      {/* Toggle de Recomendar Productos - Solo si API ecommerce está activa */}
      {formData.use_ecommerce_api && (
        <Card className="border border-muted bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Switch 
                id="recommend_products" 
                checked={recommendProducts}
                onCheckedChange={(checked) => {
                  setRecommendProducts(checked)
                  // Update formData to persist the change
                  if (onFormDataChange) {
                    onFormDataChange({
                      ...formData,
                      recommend_products: checked
                    })
                  }
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <Label htmlFor="recommend_products" className="text-base font-semibold cursor-pointer">
                    Recomendar Productos
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Activa si quieres que el chatbot recomiende productos. Con API activa, buscará en tu catálogo. Sin API, usará los productos manuales que añadas abajo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Header con info */}
      <div className="bg-muted/50 border border-muted rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Configuración Estructurada del Prompt
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Configura tu chatbot de forma sencilla rellenando solo las secciones relevantes para tu negocio. 
              Cada campo tiene ejemplos y explicaciones para ayudarte.
            </p>
            <p className="text-xs text-muted-foreground">
              💡 <strong className="text-foreground">Tip:</strong> No necesitas rellenar todo. Empieza por las secciones marcadas como "Obligatorio" y añade más según tus necesidades.
            </p>
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["business", "catalog"]} className="w-full">
        
        {/* INFORMACIÓN DEL NEGOCIO */}
        <AccordionItem value="business">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Información del Negocio</div>
                <div className="text-sm text-muted-foreground">Obligatorio</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Esta información ayuda al chatbot a presentarse correctamente y a entender el contexto de tu negocio.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name">Nombre del Negocio *</Label>
                  <Input
                    id="business_name"
                    placeholder="Ej: Beliór Cosmetics, TechStore Madrid, Café Delicias..."
                    className="max-w-md"
                    value={formData?.business_name || ''}
                    onChange={(e) => updateField('business_name', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    El chatbot se presentará con este nombre. Ej: "Soy el asistente virtual de [tu nombre]"
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_description">Descripción Breve *</Label>
                  <Textarea
                    id="business_description"
                    placeholder="Ej: Marca española de cosmética natural con +20 años de experiencia en productos veganos y sostenibles"
                    rows={3}
                    className="resize-none"
                    value={formData?.business_description || ''}
                    onChange={(e) => updateField('business_description', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Ayuda al chatbot a entender tu negocio y dar contexto en las conversaciones.<br/>
                    <strong>Consejo:</strong> Menciona tu especialidad, años de experiencia, o lo que te hace único (2-3 líneas máximo)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_values">Valores de Marca (Opcional)</Label>
                  <Textarea
                    id="business_values"
                    placeholder="Ej: Cruelty-free, sin parabenos, ingredientes 100% naturales, comercio justo, envases reciclables"
                    rows={2}
                    className="resize-none"
                    value={formData?.business_values || ''}
                    onChange={(e) => updateField('business_values', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> El chatbot mencionará estos valores cuando sea relevante.<br/>
                    <strong>Ejemplos:</strong> Certificaciones, prácticas sostenibles, garantías especiales, origen de productos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store_type">Tipo de Tienda *</Label>
                  <Select value={formData?.store_type || ''} onValueChange={(value) => updateField('store_type', value)}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Selecciona tipo de tienda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Solo Online - No tengo tienda física</SelectItem>
                      <SelectItem value="physical">Solo Física - No vendo online</SelectItem>
                      <SelectItem value="both">Ambas - Tienda física + venta online</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> El chatbot sabrá si puede ofrecer recogida en tienda o solo envíos a domicilio
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 2. PRODUCTOS - Solo si NO recomienda productos con API */}
        {!recommendProducts && (
        <AccordionItem value="products">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Productos</div>
                <div className="text-sm text-muted-foreground">Opcional</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Añade productos manualmente para que el chatbot pueda hablar de ellos y recomendarlos cuando sea apropiado.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Productos</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Añade los productos que quieres que el chatbot conozca y recomiende
                      </p>
                    </div>
                    <Button onClick={addFeaturedProduct} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir Producto
                    </Button>
                  </div>

                  {featuredProducts.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No hay productos añadidos. Haz clic en "Añadir Producto" para comenzar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {featuredProducts.map((product, index) => {
                        const isExpanded = expandedProducts.includes(index)
                        const productTitle = product.name || `Producto ${index + 1}`
                        
                        return (
                          <Collapsible
                            key={index}
                            open={isExpanded}
                            onOpenChange={() => toggleProductExpanded(index)}
                          >
                            <Card className="relative">
                              <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronUp className="w-4 h-4" />
                                      )}
                                      <Badge variant="outline" className="font-normal">
                                        {productTitle}
                                      </Badge>
                                      {product.price && (
                                        <span className="text-sm text-muted-foreground">- {product.price}</span>
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <Button
                                    onClick={() => removeFeaturedProduct(index)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>

                                <CollapsibleContent className="space-y-3 mt-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`product_name_${index}`}>Nombre del Producto *</Label>
                                    <Input
                                      id={`product_name_${index}`}
                                      placeholder="Ej: Sérum Retinol Plus"
                                      value={product.name}
                                      onChange={(e) => updateFeaturedProduct(index, 'name', e.target.value)}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`product_description_${index}`}>Descripción *</Label>
                                    <Textarea
                                      id={`product_description_${index}`}
                                      placeholder="Ej: Sérum antiedad con retinol puro que reduce arrugas y mejora la textura de la piel"
                                      rows={2}
                                      value={product.description}
                                      onChange={(e) => updateFeaturedProduct(index, 'description', e.target.value)}
                                      className="resize-none"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label htmlFor={`product_price_${index}`}>Precio *</Label>
                                      <Input
                                        id={`product_price_${index}`}
                                        placeholder="Ej: 27 €"
                                        value={product.price}
                                        onChange={(e) => updateFeaturedProduct(index, 'price', e.target.value)}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor={`product_url_${index}`}>URL del Producto *</Label>
                                      <Input
                                        id={`product_url_${index}`}
                                        placeholder="https://..."
                                        value={product.url}
                                        onChange={(e) => updateFeaturedProduct(index, 'url', e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`product_additional_${index}`}>Información Adicional (Opcional)</Label>
                                    <Textarea
                                      id={`product_additional_${index}`}
                                      placeholder="Ej: Solo para uso nocturno, no combinar con ácidos, incluye envío gratis"
                                      rows={2}
                                      value={product.additionalInfo}
                                      onChange={(e) => updateFeaturedProduct(index, 'additionalInfo', e.target.value)}
                                      className="resize-none"
                                    />
                                  </div>
                                </CollapsibleContent>
                              </CardContent>
                            </Card>
                          </Collapsible>
                        )
                      })}
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">💡 Consejo:</strong> Añade toda la información relevante de cada producto. El chatbot usará estos datos para hacer recomendaciones personalizadas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        )}

        {/* 3. CATÁLOGO Y PRODUCTOS - Solo si recomienda productos */}
        {recommendProducts && (
        <AccordionItem value="catalog">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Catálogo y Productos</div>
                <div className="text-sm text-muted-foreground">Obligatorio</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Define las categorías de productos que vendes. El chatbot usará esta información para hacer preguntas relevantes y buscar productos correctamente.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Categorías Principales *</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {categories.map((cat, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1.5">
                        {cat}
                        <button
                          onClick={() => removeCategory(index)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-md">
                    <Input
                      placeholder="Ej: Facial, Ropa Mujer, Portátiles, Cafés..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                    />
                    <Button onClick={addCategory} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Organiza tus productos en grupos principales.<br/>
                    <strong>Ejemplos:</strong> Cosmética (Facial, Corporal, Capilar) | Moda (Hombre, Mujer, Niños) | Tecnología (Portátiles, Móviles, Tablets)
                  </p>
                </div>

                {categories.map((category, index) => (
                  <div key={index} className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <Label htmlFor={`subcategories_${index}`}>
                      Subcategorías de {category}
                    </Label>
                    <Textarea
                      id={`subcategories_${index}`}
                      placeholder={`Ej: Antiarrugas, Hidratantes, Vitamina C, Retinol`}
                      rows={2}
                      className="resize-none"
                      value={subcategories[category] || ""}
                      onChange={(e) => {
                        const updated = {...subcategories, [category]: e.target.value}
                        setSubcategories(updated)
                        // Sync with formData
                        if (onFormDataChange) {
                          onFormDataChange({ ...formData, subcategories: updated })
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      <strong>Propósito:</strong> Ayuda al chatbot a ser más específico al buscar productos.<br/>
                      <strong>Formato:</strong> Separa con comas. Opcional pero recomendado.
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        )}

        {/* 4. PREGUNTAS CLAVE - Solo si recomienda productos */}
        {recommendProducts && (
        <AccordionItem value="questions">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <HelpCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Preguntas Clave por Categoría</div>
                <div className="text-sm text-muted-foreground">Recomendado</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Define qué información necesita el chatbot para recomendar productos correctamente en cada categoría. Esto evita recomendaciones genéricas y mejora la experiencia del usuario.
                  </p>
                </div>

                {/* Preguntas por categoría */}
                {categories.map((category, categoryIndex) => {
                  const maxForCategory = maxQuestionsPerCategory[category] || 2
                  const categoryQuestions = keyQuestions[category] || Array(maxForCategory).fill('')
                  
                  return (
                    <div key={categoryIndex} className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">{category}</Label>
                        
                        {/* Selector de máximo de preguntas POR CATEGORÍA */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Máx. preguntas:</span>
                          <Select 
                            value={maxForCategory.toString()} 
                            onValueChange={(value) => updateMaxQuestionsForCategory(category, parseInt(value))}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 pregunta</SelectItem>
                              <SelectItem value="2">2 preguntas</SelectItem>
                              <SelectItem value="3">3 preguntas</SelectItem>
                              <SelectItem value="4">4 preguntas</SelectItem>
                              <SelectItem value="5">5 preguntas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Individual input fields for each question */}
                      <div className="space-y-3">
                        {Array.from({ length: maxForCategory }).map((_, questionIndex) => (
                          <div key={questionIndex} className="space-y-1">
                            <Label htmlFor={`${category}-q${questionIndex}`} className="text-sm">
                              Pregunta {questionIndex + 1}
                            </Label>
                            <Input
                              id={`${category}-q${questionIndex}`}
                              placeholder={
                                questionIndex === 0 
                                  ? "Ej: ¿Qué tipo de piel tienes? (seca/mixta/grasa/sensible)"
                                  : questionIndex === 1
                                  ? "Ej: ¿Cuál es tu objetivo principal? (hidratación/anti-edad/manchas)"
                                  : `Pregunta ${questionIndex + 1} para ${category}`
                              }
                              value={categoryQuestions[questionIndex] || ''}
                              onChange={(e) => updateKeyQuestion(category, questionIndex, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        <strong>Propósito:</strong> El chatbot preguntará esto antes de recomendar productos de {category}.<br/>
                        <strong>Ejemplos:</strong> Cosmética (tipo de piel + objetivo) | Ropa (talla + ocasión) | Tecnología (uso + presupuesto)
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        )}

        {/* 4. POLÍTICAS Y SERVICIOS */}
        <AccordionItem value="policies">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Truck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Políticas y Servicios</div>
                <div className="text-sm text-muted-foreground">Recomendado</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Define las políticas comerciales de tu negocio. El chatbot usará esta información para responder preguntas sobre envíos, devoluciones, pagos y garantías.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping">Envíos</Label>
                  <Textarea
                    id="shipping"
                    placeholder="Ej: Envío gratis en península para pedidos superiores a 30 €. Entrega en 24-48h laborables."
                    rows={3}
                    className="resize-none"
                    value={formData?.shipping_policy || ''}
                    onChange={(e) => updateField('shipping_policy', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Informa sobre costes, plazos y condiciones de envío.<br/>
                    <strong>Ejemplos:</strong> "Gratis +30€, 24-48h" | "5€ península, 3-5 días" | "Envío express disponible"
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returns">Devoluciones</Label>
                  <Textarea
                    id="returns"
                    placeholder="Ej: 14 días para devoluciones. Productos sin abrir y en perfecto estado. Reembolso en 5-7 días."
                    rows={3}
                    className="resize-none"
                    value={formData?.return_policy || ''}
                    onChange={(e) => updateField('return_policy', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Define el plazo y condiciones para devolver productos.<br/>
                    <strong>Ejemplos:</strong> "14 días sin abrir" | "30 días con ticket" | "Cambios gratis en tienda"
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Métodos de Pago</Label>
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground">
                        No hay métodos de pago añadidos. Añade los que aceptas.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {paymentMethods.map((method, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1.5">
                          {method}
                          <button
                            onClick={() => removePaymentMethod(index)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: Tarjeta, PayPal, Bizum, Transferencia..."
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addPaymentMethod()}
                    />
                    <Button onClick={addPaymentMethod} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Lista los métodos de pago que aceptas.<br/>
                    <strong>Ejemplos:</strong> Tarjeta, PayPal, Bizum, Transferencia, Contra reembolso, Apple Pay
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guarantees">Garantías/Certificaciones</Label>
                  <Textarea
                    id="guarantees"
                    placeholder="Ej: Garantía de satisfacción 100%. Todos los productos con certificado CE. Envases reciclables."
                    rows={3}
                    className="resize-none"
                    value={formData?.guarantees_certifications || ''}
                    onChange={(e) => updateField('guarantees_certifications', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Destaca garantías, certificaciones o sellos de calidad.<br/>
                    <strong>Ejemplos:</strong> "Garantía 2 años" | "Certificado Bio" | "Cruelty-free" | "Fabricado en España"
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 5. CONTACTO Y ATENCIÓN */}
        <AccordionItem value="contact">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                <Phone className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Contacto y Atención</div>
                <div className="text-sm text-muted-foreground">Obligatorio</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Información de contacto que el chatbot proporcionará cuando los usuarios pregunten cómo contactar con tu negocio o cuando necesiten atención personalizada.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Horario de Atención *</Label>
                  <Input
                    id="schedule"
                    placeholder="Ej: Lunes a Viernes, 09:00-14:00 y 16:00-19:00 (CET)"
                    className="max-w-md"
                    value={formData?.contact_hours || ''}
                    onChange={(e) => updateField('contact_hours', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Define cuándo está disponible tu equipo de atención.<br/>
                    <strong>Ejemplos:</strong> "L-V 9-14h" | "24/7" | "L-S 10-20h" | Incluye zona horaria si es relevante
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="Ej: +34 968 15 14 48"
                    className="max-w-md"
                    value={formData?.contact_phone || ''}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Número de contacto para atención telefónica.<br/>
                    <strong>Consejo:</strong> Incluye prefijo internacional si tienes clientes de otros países
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ej: atencion@tutienda.com"
                    className="max-w-md"
                    value={formData?.contact_email || ''}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Email de contacto para consultas.<br/>
                    <strong>Consejo:</strong> Usa un email específico de atención al cliente (no personal)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección Física (Opcional)</Label>
                  <Textarea
                    id="address"
                    placeholder="Ej: Calle Principal 123, Local 5, 28001 Madrid, España"
                    rows={2}
                    className="resize-none"
                    value={formData?.physical_address || ''}
                    onChange={(e) => updateField('physical_address', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Ubicación física si tienes tienda o punto de recogida.<br/>
                    <strong>Cuándo incluirla:</strong> Si tienes tienda física, showroom o punto de recogida
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="out_of_hours">Mensaje Fuera de Horario</Label>
                  <Textarea
                    id="out_of_hours"
                    placeholder="Ej: Gracias por tu mensaje. Nuestro horario de atención es L-V de 9:00 a 14:00. Te responderemos lo antes posible."
                    rows={3}
                    className="resize-none"
                    value={formData?.out_of_hours_message || ''}
                    onChange={(e) => updateField('out_of_hours_message', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Mensaje automático cuando escriben fuera del horario de atención.<br/>
                    <strong>Consejo:</strong> Incluye el horario y cuándo pueden esperar respuesta
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label>Redes Sociales (Opcional)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Añade tus perfiles de redes sociales para que el chatbot pueda compartirlos cuando los usuarios pregunten.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                      <Input
                        id="instagram"
                        placeholder="@tuusuario"
                        value={socialMedia.instagram}
                        onChange={(e) => {
                          const updated = {...socialMedia, instagram: e.target.value}
                          setSocialMedia(updated)
                          if (onFormDataChange) {
                            onFormDataChange({ ...formData, social_media: updated })
                          }
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                      <Input
                        id="facebook"
                        placeholder="tupagina"
                        value={socialMedia.facebook}
                        onChange={(e) => {
                          const updated = {...socialMedia, facebook: e.target.value}
                          setSocialMedia(updated)
                          if (onFormDataChange) {
                            onFormDataChange({ ...formData, social_media: updated })
                          }
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-sm">Twitter/X</Label>
                      <Input
                        id="twitter"
                        placeholder="@tuusuario"
                        value={socialMedia.twitter}
                        onChange={(e) => {
                          const updated = {...socialMedia, twitter: e.target.value}
                          setSocialMedia(updated)
                          if (onFormDataChange) {
                            onFormDataChange({ ...formData, social_media: updated })
                          }
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tiktok" className="text-sm">TikTok</Label>
                      <Input
                        id="tiktok"
                        placeholder="@tuusuario"
                        value={socialMedia.tiktok}
                        onChange={(e) => {
                          const updated = {...socialMedia, tiktok: e.target.value}
                          setSocialMedia(updated)
                          if (onFormDataChange) {
                            onFormDataChange({ ...formData, social_media: updated })
                          }
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        placeholder="company/tuempresa"
                        value={socialMedia.linkedin}
                        onChange={(e) => {
                          const updated = {...socialMedia, linkedin: e.target.value}
                          setSocialMedia(updated)
                          if (onFormDataChange) {
                            onFormDataChange({ ...formData, social_media: updated })
                          }
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="youtube" className="text-sm">YouTube</Label>
                      <Input
                        id="youtube"
                        placeholder="@tucanal"
                        value={socialMedia.youtube}
                        onChange={(e) => {
                          const updated = {...socialMedia, youtube: e.target.value}
                          setSocialMedia(updated)
                          if (onFormDataChange) {
                            onFormDataChange({ ...formData, social_media: updated })
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> El chatbot compartirá estos perfiles cuando los usuarios pregunten por redes sociales.<br/>
                    <strong>Consejo:</strong> Solo rellena las que uses activamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 6. REGLAS DE RECOMENDACIÓN - Solo si recomienda productos */}
        {recommendProducts && (
        <AccordionItem value="rules">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Reglas de Recomendación</div>
                <div className="text-sm text-muted-foreground">Avanzado</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Define cómo el chatbot debe estructurar sus recomendaciones de productos y qué reglas especiales debe seguir. Esto garantiza respuestas completas y coherentes.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Estructura de Respuesta</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecciona qué información debe incluir el chatbot al recomendar productos:
                  </p>
                  
                  {/* Checkboxes predeterminados */}
                  <div className="space-y-2">
                    {defaultResponseItems.map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox 
                          id={item}
                          checked={selectedResponseItems.includes(item)}
                          onCheckedChange={() => toggleResponseItem(item)}
                        />
                        <label htmlFor={item} className="text-sm cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Checkboxes personalizados */}
                  {customResponseItems.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      {customResponseItems.map((item) => (
                        <div key={item} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={item}
                              checked={selectedResponseItems.includes(item)}
                              onCheckedChange={() => toggleResponseItem(item)}
                            />
                            <label htmlFor={item} className="text-sm cursor-pointer">
                              {item}
                            </label>
                          </div>
                          <Button
                            onClick={() => removeCustomResponseItem(item)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Añadir personalizado */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Ej: Incluir ingredientes, Incluir valoraciones..."
                      value={newResponseItem}
                      onChange={(e) => setNewResponseItem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomResponseItem()}
                    />
                    <Button onClick={addCustomResponseItem} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Nota:</strong> Los elementos predeterminados no se pueden eliminar, solo desmarcar. Los personalizados sí se pueden eliminar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_rules">Reglas Especiales (Opcional)</Label>
                  <Textarea
                    id="special_rules"
                    placeholder="Ej: Retinol: solo uso nocturno, no combinar con ácidos&#10;Vitamina C: aplicar por la mañana&#10;No recomendar productos con fragancia a pieles sensibles"
                    rows={4}
                    className="resize-none"
                    value={formData?.special_recommendation_rules || ''}
                    onChange={(e) => updateField('special_recommendation_rules', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Reglas específicas que el chatbot debe seguir al recomendar.<br/>
                    <strong>Ejemplos:</strong> Compatibilidades de productos, advertencias, restricciones, mejores prácticas<br/>
                    <strong>Formato:</strong> Una regla por línea para mayor claridad
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        )}

        {/* 7. DERIVACIÓN A HUMANO */}
        <AccordionItem value="escalation">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Derivación a Humano</div>
                <div className="text-sm text-muted-foreground">Recomendado</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Define cuándo y cómo el chatbot debe derivar la conversación a un humano. Esto garantiza que casos complejos o sensibles sean atendidos por tu equipo.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Cuándo Derivar</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecciona las situaciones en las que el chatbot debe derivar automáticamente:
                  </p>
                  
                  {/* Badge fijo: Usuario solicita humano - SIEMPRE ACTIVO */}
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Badge variant="default" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-600">
                      ✓ Usuario solicita hablar con humano
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Siempre activo:</strong> Este motivo nunca se puede desactivar. Respetar la solicitud del usuario es fundamental.
                    </p>
                  </div>

                  {/* Checkboxes predeterminados */}
                  <div className="space-y-2">
                    {defaultEscalationReasons.map((reason) => (
                      <div key={reason} className="flex items-center space-x-2">
                        <Checkbox 
                          id={reason}
                          checked={selectedEscalationReasons.includes(reason)}
                          onCheckedChange={() => toggleEscalationReason(reason)}
                        />
                        <label htmlFor={reason} className="text-sm cursor-pointer">
                          {reason}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Checkboxes personalizados */}
                  {customEscalationReasons.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      {customEscalationReasons.map((reason) => (
                        <div key={reason} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={reason}
                              checked={selectedEscalationReasons.includes(reason)}
                              onCheckedChange={() => toggleEscalationReason(reason)}
                            />
                            <label htmlFor={reason} className="text-sm cursor-pointer">
                              {reason}
                            </label>
                          </div>
                          <Button
                            onClick={() => removeCustomEscalationReason(reason)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Añadir personalizado */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Ej: Reclamaciones, Pedidos urgentes, Consultas legales..."
                      value={newEscalationReason}
                      onChange={(e) => setNewEscalationReason(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomEscalationReason()}
                    />
                    <Button onClick={addCustomEscalationReason} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Nota:</strong> Los motivos predeterminados no se pueden eliminar, solo desmarcar. Los personalizados sí se pueden eliminar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalation_message_user">Mensaje de Escalación</Label>
                  <Textarea
                    id="escalation_message_user"
                    placeholder="¡Claro! Te conecto con un asesor de nuestro equipo que te atenderá personalmente."
                    rows={3}
                    className="resize-none"
                    value={formData?.escalation_message_user || ''}
                    onChange={(e) => updateField('escalation_message_user', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Cuándo se usa:</strong> Cuando el usuario pide hablar con una persona O cuando acepta la escalación ofrecida por el bot<br/>
                    <strong>Consejo:</strong> Usa un tono amable y positivo. Este mensaje se usa en AMBOS casos de escalación.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Información a Solicitar</Label>
                  <p className="text-sm text-muted-foreground">
                    Datos que el chatbot debe pedir antes de derivar al usuario:
                  </p>
                  
                  {/* Checkboxes predeterminados */}
                  <div className="space-y-2">
                    {defaultInfoFields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox 
                          id={field}
                          checked={selectedInfoFields.includes(field)}
                          onCheckedChange={() => toggleInfoField(field)}
                        />
                        <label htmlFor={field} className="text-sm cursor-pointer">
                          {field}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Checkboxes personalizados */}
                  {customInfoFields.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      {customInfoFields.map((field) => (
                        <div key={field} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={field}
                              checked={selectedInfoFields.includes(field)}
                              onCheckedChange={() => toggleInfoField(field)}
                            />
                            <label htmlFor={field} className="text-sm cursor-pointer">
                              {field}
                            </label>
                          </div>
                          <Button
                            onClick={() => removeCustomInfoField(field)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Añadir personalizado */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Ej: Empresa, Asunto, Horario preferido..."
                      value={newInfoField}
                      onChange={(e) => setNewInfoField(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomInfoField()}
                    />
                    <Button onClick={addCustomInfoField} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Facilita el trabajo de tu equipo al tener contexto antes de atender.<br/>
                    <strong>Nota:</strong> Los campos predeterminados no se pueden eliminar, solo desmarcar. Los personalizados sí se pueden eliminar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 8. ESTILO DE COMUNICACIÓN */}
        <AccordionItem value="style">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <MessageSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Estilo de Comunicación</div>
                <div className="text-sm text-muted-foreground">Opcional</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Define la personalidad y estilo de comunicación del chatbot. Esto afecta cómo se expresa y cómo los usuarios perciben tu marca.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tono</Label>
                  <Select value={formData?.communication_style || 'professional'} onValueChange={(value) => updateField('communication_style', value)}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profesional</SelectItem>
                      <SelectItem value="friendly">Cercano</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual/Divertido</SelectItem>
                      <SelectItem value="technical">Técnico/Experto</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Define el estilo general de comunicación.<br/>
                    <strong>Ejemplos:</strong> Profesional (empresas B2B) | Cercano (retail, belleza) | Formal (legal, médico) | Casual (moda joven) | Técnico (software, hardware)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emojis">Uso de Emojis</Label>
                  <Select value={formData?.emoji_usage || 'minimal'} onValueChange={(value) => updateField('emoji_usage', value)}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin emojis</SelectItem>
                      <SelectItem value="minimal">Mínimo (1-2 por mensaje)</SelectItem>
                      <SelectItem value="moderate">Moderado (3-5 por mensaje)</SelectItem>
                      <SelectItem value="abundant">Abundante</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Controla la cantidad de emojis en las respuestas.<br/>
                    <strong>Recomendación:</strong> Mínimo para la mayoría de negocios. Sin emojis para sectores formales.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value={formData?.communication_priority || 'clarity'} onValueChange={(value) => updateField('communication_priority', value)}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clarity">Claridad sobre marketing</SelectItem>
                      <SelectItem value="balance">Balance claridad/marketing</SelectItem>
                      <SelectItem value="marketing">Marketing sobre claridad</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Define si priorizar información clara o lenguaje persuasivo.<br/>
                    <strong>Claridad:</strong> Respuestas directas y objetivas | <strong>Balance:</strong> Mezcla información con persuasión | <strong>Marketing:</strong> Enfoque en beneficios y venta
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 9. FAQs */}
        <AccordionItem value="faqs">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. FAQs (Preguntas Frecuentes)</div>
                <div className="text-sm text-muted-foreground">Opcional</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Añade preguntas frecuentes con sus respuestas. El chatbot usará esta información para responder directamente sin necesidad de buscar en otros lugares.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Preguntas Frecuentes</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Añade las preguntas que tus clientes hacen con más frecuencia
                      </p>
                    </div>
                    <Button onClick={addFaq} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir FAQ
                    </Button>
                  </div>
                  
                  {faqs.map((faq, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <Label className="text-sm">FAQ #{index + 1}</Label>
                        {faqs.length > 1 && (
                          <Button
                            onClick={() => removeFaq(index)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Ej: ¿Hacéis envíos internacionales?"
                        value={faq.question}
                        onChange={(e) => updateFaq(index, 'question', e.target.value)}
                      />
                      <Textarea
                        placeholder="Ej: Sí, realizamos envíos a toda Europa. Los gastos de envío varían según el destino y se calculan al finalizar la compra."
                        value={faq.answer}
                        onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  ))}
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">💡 Consejo:</strong> Añade preguntas sobre temas que no están cubiertos en otras secciones, como horarios especiales, servicios adicionales, colaboraciones, etc.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* 10. INFORMACIÓN ADICIONAL */}
        <AccordionItem value="additional">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{getSectionNumber()}. Información Adicional</div>
                <div className="text-sm text-muted-foreground">Opcional</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Descripción de la sección */}
                <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">¿Para qué sirve esta sección?</strong><br/>
                    Campo libre para añadir cualquier información, instrucción o contexto que no encaje en las secciones anteriores. El chatbot tendrá en cuenta todo lo que escribas aquí.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional_info">Información Adicional / Instrucciones Personalizadas</Label>
                  <Textarea
                    id="additional_info"
                    placeholder="Ejemplos de qué añadir aquí:&#10;&#10;• Promociones o descuentos especiales&#10;• Colaboraciones con influencers o marcas&#10;• Eventos o lanzamientos próximos&#10;• Contenido educativo sobre tus productos&#10;• Instrucciones especiales de uso&#10;• Advertencias importantes&#10;• Cualquier contexto relevante para tu negocio"
                    rows={10}
                    className="resize-none"
                    value={formData?.additional_context || ''}
                    onChange={(e) => updateField('additional_context', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    <strong>Propósito:</strong> Espacio flexible para información que no tiene una sección específica.<br/>
                    <strong>Ejemplos:</strong> "Tenemos un programa de fidelización con 10% de descuento en la segunda compra" | "Colaboramos con dermatólogos para formular nuestros productos" | "Próximo lanzamiento: línea vegana en marzo"
                  </p>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}
