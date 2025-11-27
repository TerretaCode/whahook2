import { Router, Request, Response } from 'express'
import { chatWidgetService } from './chatWidget.service'
import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'

const router = Router()

// Encryption for API keys (same as chatbot.routes.ts)
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

// Language names for translation prompts
const languageNames: Record<string, string> = {
  es: 'Spanish', en: 'English', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', ru: 'Russian', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish', cs: 'Czech',
  el: 'Greek', he: 'Hebrew', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
  ms: 'Malay', ro: 'Romanian', hu: 'Hungarian', uk: 'Ukrainian', ca: 'Catalan'
}

// AI Response types
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>
}

interface AnthropicResponse {
  content?: Array<{ text?: string }>
}

// ==============================================
// RUTAS PÚBLICAS (sin autenticación)
// Para uso desde el widget embebido
// ==============================================

/**
 * Translate text using the user's configured AI provider
 */
async function translateWithAI(
  text: string, 
  targetLang: string, 
  userId: string
): Promise<string | null> {
  try {
    // Get user's first chatbot config (they share the same AI settings)
    const { data: config } = await supabaseAdmin
      .from('chatbot_configs')
      .select('provider, model, api_key_encrypted')
      .eq('user_id', userId)
      .limit(1)
      .single()

    if (!config?.api_key_encrypted) {
      return null // No AI configured
    }

    const apiKey = decrypt(config.api_key_encrypted)
    if (!apiKey) return null

    const targetLanguage = languageNames[targetLang] || 'English'
    const prompt = `Translate the following text to ${targetLanguage}. Only return the translated text, nothing else:\n\n${text}`

    // Call the appropriate AI provider
    if (config.provider === 'google') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
          })
        }
      )
      const data = await response.json() as GeminiResponse
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
    } 
    else if (config.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500
        })
      })
      const data = await response.json() as OpenAIResponse
      return data.choices?.[0]?.message?.content?.trim() || null
    }
    else if (config.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json() as AnthropicResponse
      return data.content?.[0]?.text?.trim() || null
    }

    return null
  } catch (error) {
    console.error('Translation error:', error)
    return null
  }
}

/**
 * GET /api/public/chat-widgets/:id/config
 * Obtener configuración pública del widget
 * Query params: lang (optional) - visitor's language code
 */
router.get('/:id/config', async (req: Request, res: Response) => {
  try {
    const visitorLang = (req.query.lang as string)?.toLowerCase() || 'en'
    const config = await chatWidgetService.getPublicConfig(req.params.id)
    
    if (!config) {
      return res.status(404).json({ success: false, error: 'Widget not found' })
    }

    // Get widget's user_id for AI translation
    const { data: widget } = await supabaseAdmin
      .from('chat_widgets')
      .select('user_id')
      .eq('id', req.params.id)
      .single()

    // Translate welcome message and placeholder to visitor's language
    // AI will auto-detect the source language
    if (widget?.user_id && config.welcome_message) {
      const translatedWelcome = await translateWithAI(
        config.welcome_message,
        visitorLang,
        widget.user_id
      )
      
      if (translatedWelcome) {
        config.welcome_message = translatedWelcome
      }

      // Also translate placeholder if exists
      if (config.placeholder_text) {
        const translatedPlaceholder = await translateWithAI(
          config.placeholder_text,
          visitorLang,
          widget.user_id
        )
        if (translatedPlaceholder) {
          config.placeholder_text = translatedPlaceholder
        }
      }
    }

    // Include detected language in response
    res.json({ 
      success: true, 
      data: {
        ...config,
        detected_language: visitorLang
      }
    })
  } catch (error) {
    console.error('Get widget config error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch config' })
  }
})

/**
 * POST /api/public/chat-widgets/:id/messages
 * Enviar mensaje desde el widget
 */
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { conversationId, visitorId, message, visitorName, visitorEmail, pageUrl, referrer } = req.body

    if (!visitorId || !message) {
      return res.status(400).json({ success: false, error: 'visitorId and message are required' })
    }

    const result = await chatWidgetService.sendMessage(
      req.params.id,
      { conversationId, visitorId, message, visitorName, visitorEmail, pageUrl, referrer },
      { userAgent: req.headers['user-agent'], ip: req.ip }
    )

    console.log(`💬 Widget message received: ${req.params.id}`)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ success: false, error: 'Failed to send message' })
  }
})

/**
 * GET /api/public/chat-widgets/:id/conversations/:conversationId/messages
 * Obtener mensajes de una conversación
 */
router.get('/:id/conversations/:conversationId/messages', async (req: Request, res: Response) => {
  try {
    const messages = await chatWidgetService.getMessages(req.params.id, req.params.conversationId)
    res.json({ success: true, data: messages })
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch messages' })
  }
})

/**
 * POST /api/public/chat-widgets/:id/visitor
 * Update visitor data (called when AI collects data during conversation)
 */
router.post('/:id/visitor', async (req: Request, res: Response) => {
  try {
    const { visitorId, name, email, phone } = req.body

    if (!visitorId) {
      return res.status(400).json({ success: false, error: 'visitorId is required' })
    }

    // Only sync if we have at least one piece of data
    if (name || email || phone) {
      await chatWidgetService.syncVisitorToClient(req.params.id, visitorId, {
        name,
        email,
        phone
      })

      // Also update the conversation record
      await supabaseAdmin
        .from('chat_widget_conversations')
        .update({
          visitor_name: name || undefined,
          visitor_email: email || undefined,
        })
        .eq('widget_id', req.params.id)
        .eq('visitor_id', visitorId)

      console.log(`👤 Visitor data updated: ${req.params.id} - ${visitorId}`)
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Update visitor error:', error)
    res.status(500).json({ success: false, error: 'Failed to update visitor' })
  }
})

export { router as chatWidgetPublicRoutes }
