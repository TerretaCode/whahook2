import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'

const router = Router()

// Encryption for API keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32'
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
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

// Helper to get user ID from token
async function getUserIdFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) return null
  return user.id
}

/**
 * GET /api/ai/config
 * Get global AI configuration
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: config, error } = await supabaseAdmin
      .from('ai_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching AI config:', error)
      return res.status(500).json({ success: false, error: 'Error fetching config' })
    }

    if (!config) {
      return res.json({ success: true, data: null })
    }

    // Don't send the actual API key, just indicate if it exists
    const responseData = {
      ...config,
      api_key: undefined,
      has_api_key: !!config.api_key_encrypted
    }

    res.json({ success: true, data: responseData })
  } catch (error: any) {
    console.error('Error in GET /ai/config:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/ai/config
 * Create or update global AI configuration
 */
router.post('/config', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { provider, model, api_key } = req.body

    if (!provider || !model) {
      return res.status(400).json({ success: false, error: 'Provider and model are required' })
    }

    const updateData: any = {
      user_id: userId,
      provider,
      model,
      updated_at: new Date().toISOString()
    }

    // Only update API key if provided (not placeholder)
    if (api_key && api_key !== '••••••••') {
      updateData.api_key_encrypted = encrypt(api_key)
    }

    const { data: config, error } = await supabaseAdmin
      .from('ai_config')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error saving AI config:', error)
      return res.status(500).json({ success: false, error: 'Error saving config' })
    }

    res.json({ 
      success: true, 
      data: {
        ...config,
        api_key: undefined,
        has_api_key: !!config.api_key_encrypted
      }
    })
  } catch (error: any) {
    console.error('Error in POST /ai/config:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/ai/config/key
 * Get decrypted API key (internal use only)
 */
router.get('/config/key', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: config, error } = await supabaseAdmin
      .from('ai_config')
      .select('provider, model, api_key_encrypted')
      .eq('user_id', userId)
      .single()

    if (error || !config) {
      return res.status(404).json({ success: false, error: 'No AI config found' })
    }

    if (!config.api_key_encrypted) {
      return res.status(400).json({ success: false, error: 'No API key configured' })
    }

    res.json({ 
      success: true, 
      data: {
        provider: config.provider,
        model: config.model,
        api_key: decrypt(config.api_key_encrypted)
      }
    })
  } catch (error: any) {
    console.error('Error in GET /ai/config/key:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
