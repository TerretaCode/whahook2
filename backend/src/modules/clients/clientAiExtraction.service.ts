/**
 * Client AI Extraction Service
 * 
 * Automatically extracts client data from conversations using AI.
 * Only processes NEW conversations to avoid overloading the AI.
 */

import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32'
const ALGORITHM = 'aes-256-cbc'

function decrypt(text: string): string {
  try {
    const [ivHex, encrypted] = text.split(':')
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return ''
  }
}

interface ExtractedClientData {
  full_name?: string
  email?: string
  company?: string
  interest_type?: string
  interest_details?: string
  ai_summary?: string
  satisfaction?: 'happy' | 'neutral' | 'unhappy' | 'unknown'
  language?: string
  location?: string
  purchase_intent?: number
  budget_range?: string
  urgency?: string
  tags?: string[]
}

interface ConversationMessage {
  content: string
  direction: 'incoming' | 'outgoing'
  timestamp: string
}

/**
 * Extract client data from a conversation using AI
 * Called when a conversation ends or reaches a certain message count
 */
export async function extractClientDataFromConversation(
  conversationId: string,
  workspaceId: string,
  source: 'whatsapp' | 'web'
): Promise<ExtractedClientData | null> {
  try {
    console.log(`🤖 [AI-EXTRACT] Starting extraction for conversation ${conversationId}`)

    // Get workspace's AI configuration from chatbot_configs
    const { data: chatbotConfig, error: configError } = await supabaseAdmin
      .from('chatbot_configs')
      .select('ai_provider, ai_model, api_key_encrypted')
      .eq('workspace_id', workspaceId)
      .single()

    if (configError || !chatbotConfig?.api_key_encrypted) {
      console.log(`⚠️ [AI-EXTRACT] No AI config found for workspace ${workspaceId}`)
      return null
    }

    // Decrypt API key
    const apiKey = decrypt(chatbotConfig.api_key_encrypted)
    if (!apiKey) {
      console.error(`❌ [AI-EXTRACT] Failed to decrypt API key for workspace ${workspaceId}`)
      return null
    }

    // Get conversation messages (limit to last 50 for efficiency)
    let messages: ConversationMessage[] = []

    if (source === 'whatsapp') {
      const { data: waMessages } = await supabaseAdmin
        .from('messages')
        .select('content, direction, timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(50)

      messages = waMessages || []
    } else {
      // Web widget messages
      const { data: webMessages } = await supabaseAdmin
        .from('chat_widget_messages')
        .select('content, sender, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50)

      messages = (webMessages || []).map(m => ({
        content: m.content,
        direction: m.sender === 'user' ? 'incoming' as const : 'outgoing' as const,
        timestamp: m.created_at
      }))
    }

    if (messages.length < 3) {
      console.log(`⚠️ [AI-EXTRACT] Not enough messages (${messages.length}) for extraction`)
      return null
    }

    // Format conversation for AI
    const conversationText = messages.map(m => 
      `${m.direction === 'incoming' ? 'Cliente' : 'Asistente'}: ${m.content}`
    ).join('\n')

    // Call AI to extract data
    const extractedData = await callAIForExtraction(
      conversationText,
      chatbotConfig.ai_provider || 'google',
      chatbotConfig.ai_model || 'gemini-1.5-flash',
      apiKey
    )

    console.log(`✅ [AI-EXTRACT] Extraction completed for conversation ${conversationId}`)
    return extractedData

  } catch (error) {
    console.error(`❌ [AI-EXTRACT] Error extracting data:`, error)
    return null
  }
}

/**
 * Call AI provider to extract client data
 */
async function callAIForExtraction(
  conversationText: string,
  provider: string,
  model: string,
  apiKey: string
): Promise<ExtractedClientData> {
  const prompt = `Analiza esta conversación y extrae información del cliente para segmentación de marketing.

CONVERSACIÓN:
${conversationText}

Extrae la siguiente información en formato JSON. Solo incluye campos que puedas identificar con certeza:

{
  "full_name": "nombre completo si se menciona",
  "email": "email si se menciona",
  "company": "empresa o negocio si se menciona",
  "interest_type": "product|service|support|information|complaint|other",
  "interest_details": "descripción breve del interés principal",
  "ai_summary": "resumen de 2-3 frases de la conversación y necesidades del cliente",
  "satisfaction": "happy|neutral|unhappy|unknown - basado en el tono",
  "language": "es|en|ca|etc - idioma detectado",
  "location": "ciudad/región si se menciona",
  "purchase_intent": 0-100 (probabilidad de compra basada en la conversación),
  "budget_range": "low|medium|high|premium - si se puede inferir",
  "urgency": "low|normal|high|immediate - urgencia del cliente",
  "tags": ["tag1", "tag2"] - etiquetas relevantes para segmentación
}

IMPORTANTE:
- purchase_intent: 0-30 = solo curiosidad, 30-60 = interés moderado, 60-80 = interés alto, 80-100 = muy probable compra
- Solo incluye campos que puedas determinar con confianza
- Los tags deben ser útiles para campañas de marketing (ej: "interesado-producto-x", "precio-sensible", "urgente")

Responde SOLO con el JSON, sin explicaciones adicionales.`

  try {
    let response: Response
    let text: string

    if (provider === 'google') {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
          })
        }
      )
      const data: any = await response.json()
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    } else if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1000
        })
      })
      const data: any = await response.json()
      text = data.choices?.[0]?.message?.content || '{}'
    } else if (provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data: any = await response.json()
      text = data.content?.[0]?.text || '{}'
    } else {
      return {}
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return {}
  } catch (error) {
    console.error('AI extraction error:', error)
    return {}
  }
}

/**
 * Update client with extracted data
 */
export async function updateClientWithExtractedData(
  clientId: string,
  extractedData: ExtractedClientData
): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {
      ...extractedData,
      last_ai_analysis_at: new Date().toISOString(),
      ai_extraction_status: 'completed',
      updated_at: new Date().toISOString()
    }

    // Increment analysis count
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('ai_analysis_count')
      .eq('id', clientId)
      .single()

    updateData.ai_analysis_count = (client?.ai_analysis_count || 0) + 1

    const { error } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('id', clientId)

    if (error) {
      console.error(`❌ [AI-EXTRACT] Error updating client ${clientId}:`, error)
      return false
    }

    console.log(`✅ [AI-EXTRACT] Client ${clientId} updated with extracted data`)
    return true
  } catch (error) {
    console.error(`❌ [AI-EXTRACT] Error updating client:`, error)
    return false
  }
}

/**
 * Process a new conversation for AI extraction
 * Called when a conversation is marked as ended or after X messages
 */
export async function processConversationForClient(
  conversationId: string,
  workspaceId: string,
  userId: string,
  contactPhone: string,
  contactName: string | null,
  source: 'whatsapp' | 'web'
): Promise<void> {
  try {
    console.log(`🔄 [AI-EXTRACT] Processing conversation for client: ${contactPhone}`)

    // Check if client exists
    let { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, ai_analysis_count, last_ai_analysis_at')
      .eq('workspace_id', workspaceId)
      .eq('phone', contactPhone)
      .single()

    // Create client if doesn't exist
    if (!client) {
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          phone: contactPhone,
          whatsapp_name: contactName,
          source,
          status: 'lead',
          first_contact_at: new Date().toISOString(),
          last_contact_at: new Date().toISOString(),
          ai_extraction_status: 'processing',
          conversation_id: conversationId
        })
        .select('id')
        .single()

      if (createError || !newClient) {
        console.error(`❌ [AI-EXTRACT] Error creating client:`, createError)
        return
      }
      client = { id: newClient.id, ai_analysis_count: 0, last_ai_analysis_at: null }
    } else {
      // Update last contact
      await supabaseAdmin
        .from('clients')
        .update({ 
          last_contact_at: new Date().toISOString(),
          ai_extraction_status: 'processing'
        })
        .eq('id', client.id)
    }

    // Extract data using AI
    const extractedData = await extractClientDataFromConversation(
      conversationId,
      workspaceId,
      source
    )

    if (extractedData) {
      await updateClientWithExtractedData(client.id, extractedData)
    } else {
      // Mark as completed even if no data extracted
      await supabaseAdmin
        .from('clients')
        .update({ ai_extraction_status: 'completed' })
        .eq('id', client.id)
    }
  } catch (error) {
    console.error(`❌ [AI-EXTRACT] Error processing conversation:`, error)
  }
}
