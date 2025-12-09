/**
 * Client AI Extraction Service
 * 
 * Intelligent extraction system with:
 * - Cumulative summaries (builds on previous analysis)
 * - Session detection (gaps >4h = new session)
 * - Rate limiting (max 1 analysis/hour unless high-priority event)
 * - Context-aware analysis (passes previous summary to AI)
 * - Smart triggering (message count, keywords, inactivity)
 */

import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32'
const ALGORITHM = 'aes-256-cbc'

// Configuration
const CONFIG = {
  MIN_MESSAGES_FOR_ANALYSIS: 3,           // Minimum messages needed
  MAX_MESSAGES_TO_ANALYZE: 100,           // Max messages to send to AI
  MIN_INTERVAL_BETWEEN_ANALYSIS_MS: 60 * 60 * 1000, // 1 hour minimum between analyses
  INACTIVITY_TRIGGER_MS: 3 * 60 * 1000,   // 3 minutes of inactivity triggers analysis
  SESSION_GAP_MS: 4 * 60 * 60 * 1000,     // 4 hours gap = new session
  MESSAGE_COUNT_TRIGGER: 10,               // Analyze every N new messages
  HIGH_PRIORITY_KEYWORDS: [
    'comprar', 'precio', 'presupuesto', 'contratar', 'pagar',
    'buy', 'price', 'budget', 'hire', 'pay',
    'urgente', 'urgent', 'ahora', 'now', 'hoy', 'today'
  ]
}

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
  // Advanced segmentation fields
  interests?: string[]
  product_interests?: string[]
  sentiment_score?: number
  engagement_level?: 'cold' | 'low' | 'medium' | 'high' | 'hot'
  lifecycle_stage?: 'new' | 'engaged' | 'qualified' | 'opportunity' | 'customer' | 'churned'
  preferred_contact_time?: 'morning' | 'afternoon' | 'evening'
  // New fields for cumulative tracking
  conversation_topics?: string[]
  key_questions?: string[]
  objections?: string[]
  next_steps?: string
}

interface ConversationMessage {
  content: string
  direction: 'incoming' | 'outgoing'
  timestamp: string
}

interface ClientContext {
  id: string
  previous_summary?: string
  previous_tags?: string[]
  previous_interests?: string[]
  ai_analysis_count: number
  last_ai_analysis_at: string | null
  messages_since_last_analysis: number
}

/**
 * Check if a message contains high-priority keywords
 */
function containsHighPriorityKeywords(text: string): boolean {
  const lowerText = text.toLowerCase()
  return CONFIG.HIGH_PRIORITY_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

/**
 * Detect conversation sessions based on time gaps
 * Returns messages grouped by session with session metadata
 */
function detectSessions(messages: ConversationMessage[]): { 
  sessions: ConversationMessage[][]
  currentSessionStart: string
  isNewSession: boolean 
} {
  if (messages.length === 0) {
    return { sessions: [], currentSessionStart: new Date().toISOString(), isNewSession: true }
  }

  const sessions: ConversationMessage[][] = []
  let currentSession: ConversationMessage[] = []
  let lastTimestamp = new Date(messages[0].timestamp).getTime()

  for (const msg of messages) {
    const msgTime = new Date(msg.timestamp).getTime()
    const gap = msgTime - lastTimestamp

    if (gap > CONFIG.SESSION_GAP_MS && currentSession.length > 0) {
      sessions.push(currentSession)
      currentSession = []
    }

    currentSession.push(msg)
    lastTimestamp = msgTime
  }

  if (currentSession.length > 0) {
    sessions.push(currentSession)
  }

  const currentSessionStart = currentSession.length > 0 
    ? currentSession[0].timestamp 
    : new Date().toISOString()

  // Check if this is a new session (last message was >4h ago)
  const lastMsgTime = new Date(messages[messages.length - 1].timestamp).getTime()
  const isNewSession = Date.now() - lastMsgTime > CONFIG.SESSION_GAP_MS

  return { sessions, currentSessionStart, isNewSession }
}

/**
 * Get AI configuration for a workspace
 */
async function getAIConfig(workspaceId: string): Promise<{ provider: string; model: string; apiKey: string } | null> {
  // Try to find config by workspace_id
  const { data: configByWorkspace } = await supabaseAdmin
    .from('chatbot_configs')
    .select('provider, model, api_key_encrypted')
    .eq('workspace_id', workspaceId)
    .not('api_key_encrypted', 'is', null)
    .limit(1)
    .single()
  
  if (configByWorkspace?.api_key_encrypted) {
    const apiKey = decrypt(configByWorkspace.api_key_encrypted)
    if (apiKey) {
      return { provider: configByWorkspace.provider, model: configByWorkspace.model, apiKey }
    }
  }

  // Fallback: get from ai_config table (global user config)
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('user_id')
    .eq('id', workspaceId)
    .single()
  
  if (workspace?.user_id) {
    const { data: aiConfig } = await supabaseAdmin
      .from('ai_config')
      .select('provider, model, api_key_encrypted')
      .eq('user_id', workspace.user_id)
      .single()
    
    if (aiConfig?.api_key_encrypted) {
      const apiKey = decrypt(aiConfig.api_key_encrypted)
      if (apiKey) {
        return { provider: aiConfig.provider, model: aiConfig.model, apiKey }
      }
    }
  }

  return null
}

/**
 * Extract client data from a conversation using AI
 * Now with context-aware cumulative analysis
 */
export async function extractClientDataFromConversation(
  conversationId: string,
  workspaceId: string,
  source: 'whatsapp' | 'web',
  clientContext?: ClientContext
): Promise<ExtractedClientData | null> {
  try {
    console.log(`🤖 [AI-EXTRACT] Starting extraction for conversation ${conversationId}`)

    // Get AI configuration
    const aiConfig = await getAIConfig(workspaceId)
    if (!aiConfig) {
      console.log(`⚠️ [AI-EXTRACT] No AI config found for workspace ${workspaceId}`)
      return null
    }

    // Get conversation messages
    let messages: ConversationMessage[] = []

    if (source === 'whatsapp') {
      const { data: waMessages } = await supabaseAdmin
        .from('messages')
        .select('content, direction, timestamp')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(CONFIG.MAX_MESSAGES_TO_ANALYZE)

      messages = waMessages || []
    } else {
      const { data: webMessages } = await supabaseAdmin
        .from('chat_widget_messages')
        .select('content, sender, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(CONFIG.MAX_MESSAGES_TO_ANALYZE)

      messages = (webMessages || []).map(m => ({
        content: m.content,
        direction: m.sender === 'user' ? 'incoming' as const : 'outgoing' as const,
        timestamp: m.created_at
      }))
    }

    if (messages.length < CONFIG.MIN_MESSAGES_FOR_ANALYSIS) {
      console.log(`⚠️ [AI-EXTRACT] Not enough messages (${messages.length}) for extraction`)
      return null
    }

    // Detect sessions and analyze conversation structure
    const { sessions, isNewSession } = detectSessions(messages)
    const totalSessions = sessions.length
    const hasHighPriorityContent = messages.some(m => 
      m.direction === 'incoming' && containsHighPriorityKeywords(m.content)
    )

    console.log(`📊 [AI-EXTRACT] Conversation analysis: ${messages.length} messages, ${totalSessions} sessions, high-priority: ${hasHighPriorityContent}`)

    // Format conversation for AI with timestamps for context
    const conversationText = messages.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      return `[${time}] ${m.direction === 'incoming' ? 'Cliente' : 'Asistente'}: ${m.content}`
    }).join('\n')

    // Call AI to extract data with context
    const extractedData = await callAIForExtraction(
      conversationText,
      aiConfig.provider || 'google',
      aiConfig.model || 'gemini-1.5-flash',
      aiConfig.apiKey,
      clientContext
    )

    console.log(`✅ [AI-EXTRACT] Extraction completed for conversation ${conversationId}`)
    return extractedData

  } catch (error) {
    console.error(`❌ [AI-EXTRACT] Error extracting data:`, error)
    return null
  }
}

/**
 * Build the AI prompt with optional previous context
 */
function buildExtractionPrompt(conversationText: string, clientContext?: ClientContext): string {
  // Build context section if we have previous data
  let contextSection = ''
  if (clientContext?.previous_summary || clientContext?.previous_tags?.length || clientContext?.previous_interests?.length) {
    contextSection = `
CONTEXTO PREVIO DEL CLIENTE (de análisis anteriores):
${clientContext.previous_summary ? `- Resumen anterior: ${clientContext.previous_summary}` : ''}
${clientContext.previous_tags?.length ? `- Tags existentes: ${clientContext.previous_tags.join(', ')}` : ''}
${clientContext.previous_interests?.length ? `- Intereses conocidos: ${clientContext.previous_interests.join(', ')}` : ''}
${clientContext.ai_analysis_count > 0 ? `- Este es el análisis #${clientContext.ai_analysis_count + 1} de este cliente` : '- Este es el primer análisis de este cliente'}

INSTRUCCIÓN ESPECIAL: Combina la información nueva con el contexto previo. Actualiza el resumen para que sea ACUMULATIVO, no lo reemplaces completamente. Mantén los tags e intereses anteriores si siguen siendo relevantes y añade nuevos.

`
  }

  return `Eres un analista de CRM experto. Analiza esta conversación y extrae información del cliente para segmentación de marketing profesional.
${contextSection}
CONVERSACIÓN ACTUAL:
${conversationText}

Extrae la siguiente información en formato JSON. Solo incluye campos que puedas identificar con certeza:

{
  "full_name": "nombre completo si se menciona",
  "email": "email si se menciona",
  "company": "empresa o negocio si se menciona",
  "interest_type": "product|service|support|information|complaint|other",
  "interest_details": "descripción breve del interés principal actual",
  "ai_summary": "resumen ACUMULATIVO de 3-5 frases: quién es el cliente, qué necesita, historial de interacciones, estado actual",
  "satisfaction": "happy|neutral|unhappy|unknown",
  "language": "es|en|ca|pt|fr|de|it",
  "location": "ciudad/región/país si se menciona",
  "purchase_intent": 0-100,
  "budget_range": "low|medium|high|premium",
  "urgency": "low|normal|high|immediate",
  "tags": ["tag1", "tag2", "..."],
  "interests": ["tema1", "tema2"],
  "product_interests": ["producto1", "servicio1"],
  "sentiment_score": -100 a 100,
  "engagement_level": "cold|low|medium|high|hot",
  "lifecycle_stage": "new|engaged|qualified|opportunity|customer",
  "preferred_contact_time": "morning|afternoon|evening",
  "conversation_topics": ["tema discutido 1", "tema discutido 2"],
  "key_questions": ["pregunta importante 1", "pregunta importante 2"],
  "objections": ["objeción o duda 1", "objeción o duda 2"],
  "next_steps": "siguiente acción recomendada basada en la conversación"
}

GUÍA DE VALORES:

purchase_intent (0-100):
- 0-20: Solo curiosidad, sin intención real
- 20-40: Interés leve, explorando opciones
- 40-60: Interés moderado, comparando
- 60-80: Interés alto, cerca de decidir
- 80-100: Muy probable compra, listo para comprar

sentiment_score (-100 a 100):
- -100 a -50: Muy negativo, frustrado, enojado
- -50 a -20: Negativo, insatisfecho
- -20 a 20: Neutral
- 20 a 50: Positivo, satisfecho
- 50 a 100: Muy positivo, entusiasmado

engagement_level:
- cold: Sin respuesta o muy poco interés
- low: Respuestas cortas, poco engagement
- medium: Conversación normal, hace preguntas
- high: Muy interesado, muchas preguntas
- hot: Extremadamente interesado, urgente

lifecycle_stage:
- new: Primer contacto
- engaged: Ha mostrado interés, interactúa
- qualified: Tiene necesidad real y presupuesto
- opportunity: Listo para propuesta/oferta
- customer: Ya ha comprado

IMPORTANTE:
- SIEMPRE genera un ai_summary aunque sea breve, describiendo el tipo de relación/conversación
- El ai_summary debe ser ACUMULATIVO: si hay contexto previo, intégralo con la nueva información
- Los tags deben ser útiles para segmentación (ej: "personal", "familia", "amigo", "cliente", "proveedor", "b2b", "premium")
- Si es una conversación personal/familiar, usa tags como "personal", "familia", "amigo" y engagement_level apropiado
- conversation_topics: temas específicos discutidos en ESTA conversación (aunque sean personales)
- NUNCA devuelvas un JSON vacío {}. Siempre incluye al menos: ai_summary, tags, engagement_level, sentiment_score

Responde SOLO con el JSON válido, sin explicaciones ni markdown. Ejemplo mínimo:
{"ai_summary": "Contacto personal, conversación casual", "tags": ["personal"], "engagement_level": "medium", "sentiment_score": 50}`
}

/**
 * Call AI provider to extract client data
 */
async function callAIForExtraction(
  conversationText: string,
  provider: string,
  model: string,
  apiKey: string,
  clientContext?: ClientContext
): Promise<ExtractedClientData> {
  const prompt = buildExtractionPrompt(conversationText, clientContext)

  try {
    let response: Response
    let text: string = '{}'

    if (provider === 'google') {
      // Retry logic for Google AI rate limits
      let retries = 0
      const maxRetries = 3
      
      while (retries < maxRetries) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
            })
          }
        )
        const data: any = await response.json()
        
        if (data.error) {
          // Check if it's a rate limit error (429)
          if (data.error.code === 429) {
            retries++
            const waitTime = Math.min(15 * retries, 60) // Wait 15s, 30s, 45s max
            console.log(`⏳ [AI-EXTRACT] Google AI rate limited, waiting ${waitTime}s (retry ${retries}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
            continue
          }
          console.error(`❌ [AI-EXTRACT] Google AI error:`, data.error)
          return {}
        }
        
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log(`⚠️ [AI-EXTRACT] Google AI response structure:`, JSON.stringify(data, null, 2).substring(0, 500))
        }
        break // Success, exit retry loop
      }
      
      if (retries >= maxRetries) {
        console.error(`❌ [AI-EXTRACT] Google AI rate limit exceeded after ${maxRetries} retries`)
        return {}
      }
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
          temperature: 0.2,
          max_tokens: 2000
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
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data: any = await response.json()
      text = data.content?.[0]?.text || '{}'
    } else {
      return {}
    }

    // Extract JSON from response
    console.log(`🤖 [AI-EXTRACT] Raw AI response (${text.length} chars): ${text.substring(0, 1000)}`)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      console.log(`🤖 [AI-EXTRACT] Parsed data:`, JSON.stringify(parsed, null, 2))
      return parsed
    }
    console.log(`⚠️ [AI-EXTRACT] No JSON found in AI response`)
    return {}
  } catch (error) {
    console.error('❌ [AI-EXTRACT] AI extraction error:', error)
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
    console.log(`📝 [AI-EXTRACT] Updating client ${clientId} with data:`, JSON.stringify(extractedData, null, 2))
    
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
 * Check if we should run AI analysis based on rate limiting and priority
 */
function shouldRunAnalysis(
  lastAnalysisAt: string | null,
  messagesSinceLastAnalysis: number,
  hasHighPriorityContent: boolean
): { shouldRun: boolean; reason: string } {
  const now = Date.now()
  const lastAnalysisTime = lastAnalysisAt ? new Date(lastAnalysisAt).getTime() : 0
  const timeSinceLastAnalysis = now - lastAnalysisTime

  // First analysis - always run
  if (!lastAnalysisAt) {
    return { shouldRun: true, reason: 'first_analysis' }
  }

  // High priority content bypasses rate limit (but still needs 10 min minimum)
  if (hasHighPriorityContent && timeSinceLastAnalysis > 10 * 60 * 1000) {
    return { shouldRun: true, reason: 'high_priority_content' }
  }

  // Rate limit: minimum 1 hour between analyses
  if (timeSinceLastAnalysis < CONFIG.MIN_INTERVAL_BETWEEN_ANALYSIS_MS) {
    return { shouldRun: false, reason: 'rate_limited' }
  }

  // Message count trigger
  if (messagesSinceLastAnalysis >= CONFIG.MESSAGE_COUNT_TRIGGER) {
    return { shouldRun: true, reason: 'message_count_trigger' }
  }

  // Default: run after inactivity period
  return { shouldRun: true, reason: 'inactivity_trigger' }
}

/**
 * Process a new conversation for AI extraction
 * Includes rate limiting, context passing, and smart triggering
 */
export async function processConversationForClient(
  conversationId: string,
  workspaceId: string,
  userId: string,
  contactPhone: string,
  contactName: string | null,
  source: 'whatsapp' | 'web',
  forceAnalysis: boolean = false
): Promise<void> {
  try {
    // Skip WhatsApp groups and newsletters - they are not individual clients
    if (contactPhone.includes('@g.us') || contactPhone.includes('@newsletter') || contactPhone.includes('@broadcast')) {
      console.log(`⏭️ [AI-EXTRACT] Skipping group/newsletter/broadcast: ${contactPhone}`)
      return
    }
    
    console.log(`🔄 [AI-EXTRACT] Processing conversation for client: ${contactPhone}`)

    // Get or create client with full context
    // Note: unique constraint is on (user_id, phone), so we search by that
    let { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, ai_analysis_count, last_ai_analysis_at, ai_summary, tags, interests, messages_since_last_analysis, workspace_id')
      .eq('user_id', userId)
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
          ai_extraction_status: 'pending',
          conversation_id: conversationId,
          messages_since_last_analysis: 1
        })
        .select('id, ai_analysis_count, last_ai_analysis_at, ai_summary, tags, interests, messages_since_last_analysis, workspace_id')
        .single()

      if (createError || !newClient) {
        console.error(`❌ [AI-EXTRACT] Error creating client:`, createError)
        return
      }
      client = newClient
      console.log(`✨ [AI-EXTRACT] Created new client ${client.id} for ${contactPhone}`)
    } else {
      // Client exists - increment message count and update last contact
      const newMessageCount = (client.messages_since_last_analysis || 0) + 1
      const updateData: Record<string, unknown> = { 
        last_contact_at: new Date().toISOString(),
        messages_since_last_analysis: newMessageCount,
        conversation_id: conversationId // Update to latest conversation
      }
      
      // Update workspace_id if different (same phone, different workspace)
      if (client.workspace_id !== workspaceId) {
        updateData.workspace_id = workspaceId
      }
      
      // Update whatsapp_name if we have a new one
      if (contactName && contactName !== 'Unknown') {
        updateData.whatsapp_name = contactName
      }
      
      await supabaseAdmin
        .from('clients')
        .update(updateData)
        .eq('id', client.id)
      
      client.messages_since_last_analysis = newMessageCount
      console.log(`📝 [AI-EXTRACT] Updated existing client ${client.id} for ${contactPhone}`)
    }

    // At this point client is guaranteed to exist
    if (!client) {
      console.error(`❌ [AI-EXTRACT] Client is null after create/update - this should not happen`)
      return
    }

    // Check if we should run analysis (rate limiting)
    const { shouldRun, reason } = shouldRunAnalysis(
      client.last_ai_analysis_at,
      client.messages_since_last_analysis || 0,
      false // We'll check high priority in the extraction
    )

    if (!shouldRun && !forceAnalysis) {
      console.log(`⏳ [AI-EXTRACT] Skipping analysis for ${contactPhone}: ${reason}`)
      return
    }

    console.log(`🚀 [AI-EXTRACT] Running analysis for ${contactPhone}: ${reason}`)

    // Mark as processing
    await supabaseAdmin
      .from('clients')
      .update({ ai_extraction_status: 'processing' })
      .eq('id', client.id)

    // Build client context for cumulative analysis
    const clientContext: ClientContext = {
      id: client.id,
      previous_summary: client.ai_summary || undefined,
      previous_tags: client.tags || undefined,
      previous_interests: client.interests || undefined,
      ai_analysis_count: client.ai_analysis_count || 0,
      last_ai_analysis_at: client.last_ai_analysis_at,
      messages_since_last_analysis: client.messages_since_last_analysis || 0
    }

    // Extract data using AI with context
    const extractedData = await extractClientDataFromConversation(
      conversationId,
      workspaceId,
      source,
      clientContext
    )

    if (extractedData) {
      // Reset message counter after successful analysis
      await updateClientWithExtractedData(client.id, extractedData)
      await supabaseAdmin
        .from('clients')
        .update({ messages_since_last_analysis: 0 })
        .eq('id', client.id)
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
