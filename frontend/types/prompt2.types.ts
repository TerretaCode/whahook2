/**
 * Tipos TypeScript para Configuración Prompt2
 * Mapea exactamente con las tablas de base de datos
 */

// ============================================
// TIPOS BASE
// ============================================

export type StoreType = 'online' | 'physical' | 'both';
export type CommunicationStyle = 'professional' | 'friendly' | 'formal' | 'casual' | 'technical';
export type EmojiUsage = 'none' | 'minimal' | 'moderate' | 'abundant';
export type CommunicationPriority = 'clarity' | 'balance' | 'marketing';
export type ResponseLength = 'short' | 'medium' | 'long';

// ============================================
// INTERFACES JSONB
// ============================================

/**
 * Producto manual destacado
 */
export interface FeaturedProduct {
  name: string;
  description: string;
  price: string;
  url: string;
  additionalInfo?: string;
}

/**
 * Preguntas clave por categoría
 * Formato: { "Facial": ["¿Tipo de piel?", "¿Objetivo?"] }
 */
export type KeyQuestions = Record<string, string[]>;

/**
 * Subcategorías por categoría
 * Formato: { "Facial": "Antiarrugas, Hidratantes, Vitamina C" }
 */
export type Subcategories = Record<string, string>;

/**
 * Redes sociales
 * Formato: { "instagram": "@usuario", "facebook": "pagina" }
 */
export type SocialMedia = Record<string, string>;

/**
 * FAQ (Pregunta frecuente)
 */
export interface FAQ {
  question: string;
  answer: string;
}

// ============================================
// CONFIGURACIÓN PROMPT2 - WHATSAPP
// ============================================

export interface WhatsAppPrompt2Config {
  // Primary Keys
  id?: string;
  user_id: string;
  session_id: string;

  // 1. INFORMACIÓN DEL NEGOCIO
  business_name?: string;
  business_description?: string;
  business_values?: string;
  store_type?: StoreType;

  // 2. PRODUCTOS (Manual)
  recommend_products?: boolean;
  featured_products?: FeaturedProduct[];

  // 3. CATÁLOGO Y PRODUCTOS (API)
  product_categories?: string[];
  subcategories?: Subcategories;

  // 4. PREGUNTAS CLAVE POR CATEGORÍA
  key_questions?: KeyQuestions;
  max_questions_per_category?: Record<string, number>; // Max questions per category
  max_questions_before_recommend?: number; // DEPRECATED: Use max_questions_per_category

  // 5. POLÍTICAS Y SERVICIOS
  shipping_policy?: string;
  return_policy?: string;
  payment_methods?: string[];
  delivery_time?: string;
  shipping_cost?: string;
  guarantees_certifications?: string;

  // 6. CONTACTO Y ATENCIÓN
  contact_email?: string;
  contact_phone?: string;
  contact_hours?: string;
  physical_address?: string;
  social_media?: SocialMedia;
  out_of_hours_message?: string;

  // 7. REGLAS DE RECOMENDACIÓN
  recommendation_rules?: string[];
  response_structure_items?: string[];
  special_recommendation_rules?: string;

  // 8. DERIVACIÓN A HUMANO
  escalation_reasons?: string[];
  custom_escalation_reasons?: string[];
  escalation_instructions?: string;
  escalation_message_user?: string;
  info_fields_to_collect?: string[];

  // 9. ESTILO DE COMUNICACIÓN
  communication_style?: CommunicationStyle;
  emoji_usage?: EmojiUsage;
  use_emojis?: boolean; // Alias/legacy field
  communication_priority?: CommunicationPriority;
  max_response_length?: ResponseLength;
  brand_voice_keywords?: string[];

  // 10. FAQs
  faqs?: FAQ[];

  // 11. INFORMACIÓN ADICIONAL
  additional_context?: string;
  special_instructions?: string;
  seasonal_info?: string;

  // Control Fields
  created_at?: string;
  updated_at?: string;
}

// ============================================
// CONFIGURACIÓN PROMPT2 - WIDGET
// ============================================

export interface WidgetPrompt2Config {
  // Primary Keys
  id?: string;
  user_id: string;
  widget_id: string;

  // 1. INFORMACIÓN DEL NEGOCIO
  business_name?: string;
  business_description?: string;
  business_values?: string;
  store_type?: StoreType;

  // 2. PRODUCTOS (Manual)
  recommend_products?: boolean;
  featured_products?: FeaturedProduct[];

  // 3. CATÁLOGO Y PRODUCTOS (API)
  product_categories?: string[];
  subcategories?: Subcategories;

  // 4. PREGUNTAS CLAVE POR CATEGORÍA
  key_questions?: KeyQuestions;
  max_questions_per_category?: Record<string, number>; // Max questions per category
  max_questions_before_recommend?: number; // DEPRECATED: Use max_questions_per_category

  // 5. POLÍTICAS Y SERVICIOS
  shipping_policy?: string;
  return_policy?: string;
  payment_methods?: string[];
  delivery_time?: string;
  shipping_cost?: string;
  guarantees_certifications?: string;

  // 6. CONTACTO Y ATENCIÓN
  contact_email?: string;
  contact_phone?: string;
  contact_hours?: string;
  physical_address?: string;
  social_media?: SocialMedia;
  out_of_hours_message?: string;

  // 7. REGLAS DE RECOMENDACIÓN
  recommendation_rules?: string[];
  response_structure_items?: string[];
  special_recommendation_rules?: string;

  // 8. DERIVACIÓN A HUMANO
  escalation_reasons?: string[];
  custom_escalation_reasons?: string[];
  escalation_instructions?: string;
  escalation_message_user?: string;
  info_fields_to_collect?: string[];

  // 9. ESTILO DE COMUNICACIÓN
  communication_style?: CommunicationStyle;
  emoji_usage?: EmojiUsage;
  use_emojis?: boolean; // Alias/legacy field
  communication_priority?: CommunicationPriority;
  max_response_length?: ResponseLength;
  brand_voice_keywords?: string[];

  // 10. FAQs
  faqs?: FAQ[];

  // 11. INFORMACIÓN ADICIONAL
  additional_context?: string;
  special_instructions?: string;
  seasonal_info?: string;

  // Control Fields
  created_at?: string;
  updated_at?: string;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface SavePrompt2ConfigRequest {
  // Todos los campos son opcionales en el request
  // Solo se actualizan los que se envían
  [key: string]: any;
}

export interface Prompt2ConfigResponse {
  success: boolean;
  data?: WhatsAppPrompt2Config | WidgetPrompt2Config;
  message?: string;
  error?: string;
}
