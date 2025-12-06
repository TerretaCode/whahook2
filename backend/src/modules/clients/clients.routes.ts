import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'

const router = Router()

// Encryption for API keys
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

// Helper to get user ID from token
async function getUserIdFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) return null
  return user.id
}

// Helper to check if user has access to a workspace
async function getUserWorkspaceAccess(userId: string, workspaceId: string): Promise<{ hasAccess: boolean; isOwner: boolean; permissions?: Record<string, boolean> }> {
  // Check if user owns the workspace
  const { data: ownedWorkspace } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (ownedWorkspace) {
    return { hasAccess: true, isOwner: true }
  }

  // Check if user is a member
  const { data: membership } = await supabaseAdmin
    .from('workspace_members')
    .select('permissions')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (membership) {
    return { hasAccess: true, isOwner: false, permissions: membership.permissions as Record<string, boolean> }
  }

  return { hasAccess: false, isOwner: false }
}

// Helper to get user's default workspace (first owned or first member)
async function getUserDefaultWorkspace(userId: string): Promise<string | null> {
  // First try owned workspaces
  const { data: owned } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (owned) return owned.id

  // Then try member workspaces
  const { data: member } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .single()

  return member?.workspace_id || null
}

/**
 * GET /api/clients
 * List all clients for the user's workspace
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { status, interest_type, search, limit = '50', offset = '0', workspace_id } = req.query

    // Determine which workspace to use
    let targetWorkspaceId = workspace_id as string | undefined
    
    if (!targetWorkspaceId) {
      // Get user's default workspace
      targetWorkspaceId = await getUserDefaultWorkspace(userId) || undefined
    }

    // If workspace specified, verify access
    if (targetWorkspaceId) {
      const access = await getUserWorkspaceAccess(userId, targetWorkspaceId)
      if (!access.hasAccess) {
        return res.status(403).json({ success: false, error: 'Access denied to this workspace' })
      }
      // Check if user has clients permission
      if (!access.isOwner && access.permissions && !access.permissions.clients) {
        return res.status(403).json({ success: false, error: 'You do not have permission to view clients' })
      }
    }

    let query = supabaseAdmin
      .from('clients')
      .select('*')
      .order('last_contact_at', { ascending: false, nullsFirst: false })
      .limit(parseInt(limit as string))
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)

    // Filter by workspace_id if available, otherwise by user_id (legacy)
    if (targetWorkspaceId) {
      query = query.eq('workspace_id', targetWorkspaceId)
    } else {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }
    if (interest_type) {
      query = query.eq('interest_type', interest_type)
    }
    if (search) {
      query = query.or(`phone.ilike.%${search}%,whatsapp_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: clients, error } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return res.status(500).json({ success: false, error: 'Error fetching clients' })
    }

    res.json({ success: true, data: clients })
  } catch (error: any) {
    console.error('Error in GET /clients:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/clients/settings
 * Get client capture settings
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: settings, error } = await supabaseAdmin
      .from('client_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching client settings:', error)
      return res.status(500).json({ success: false, error: 'Error fetching settings' })
    }

    res.json({ 
      success: true, 
      data: settings || { auto_capture_enabled: false }
    })
  } catch (error: any) {
    console.error('Error in GET /clients/settings:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/clients/settings
 * Update client capture settings
 */
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { auto_capture_enabled } = req.body

    const { data: settings, error } = await supabaseAdmin
      .from('client_settings')
      .upsert({
        user_id: userId,
        auto_capture_enabled: auto_capture_enabled ?? false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error updating client settings:', error)
      return res.status(500).json({ success: false, error: 'Error updating settings' })
    }

    res.json({ success: true, data: settings })
  } catch (error: any) {
    console.error('Error in POST /clients/settings:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/clients/:id
 * Get a single client
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      return res.status(404).json({ success: false, error: 'Client not found' })
    }

    res.json({ success: true, data: client })
  } catch (error: any) {
    console.error('Error in GET /clients/:id:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/clients/:id
 * Update a client
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    const body = req.body
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const updateData: any = {}
    const allowedFields = [
      'full_name', 'email', 'company', 'interest_type', 'interest_details',
      'tags', 'notes', 'status', 'priority'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return res.status(500).json({ success: false, error: 'Error updating client' })
    }

    res.json({ success: true, data: client })
  } catch (error: any) {
    console.error('Error in PUT /clients/:id:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/clients/:id
 * Delete a client
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting client:', error)
      return res.status(500).json({ success: false, error: 'Error deleting client' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /clients/:id:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/clients/:id/extract-info
 * Extract client info from conversations using AI
 */
router.post('/:id/extract-info', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    const { id } = req.params
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Get client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (clientError || !client) {
      return res.status(404).json({ success: false, error: 'Client not found' })
    }

    // Mark as processing
    await supabaseAdmin
      .from('clients')
      .update({ ai_extraction_status: 'processing' })
      .eq('id', id)

    // Get user's global AI config
    const { data: aiConfig } = await supabaseAdmin
      .from('ai_config')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!aiConfig?.api_key_encrypted) {
      await supabaseAdmin
        .from('clients')
        .update({ ai_extraction_status: 'failed' })
        .eq('id', id)
      return res.status(400).json({ 
        success: false, 
        error: 'No AI configuration found. Please configure your AI settings first.' 
      })
    }

    // Get conversation for this client
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .eq('contact_phone', client.phone)
      .single()

    if (!conversation) {
      await supabaseAdmin
        .from('clients')
        .update({ ai_extraction_status: 'failed' })
        .eq('id', id)
      return res.status(404).json({ success: false, error: 'No conversation found for this client' })
    }

    // Get messages from conversation
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('content, direction, timestamp')
      .eq('conversation_id', conversation.id)
      .order('timestamp', { ascending: true })
      .limit(100)

    if (!messages || messages.length === 0) {
      await supabaseAdmin
        .from('clients')
        .update({ ai_extraction_status: 'failed' })
        .eq('id', id)
      return res.status(404).json({ success: false, error: 'No messages found' })
    }

    // Format messages for AI
    const conversationText = messages.map(m => 
      `${m.direction === 'incoming' ? 'Cliente' : 'Bot'}: ${m.content}`
    ).join('\n')

    // Decrypt API key
    const apiKey = decrypt(aiConfig.api_key_encrypted)
    if (!apiKey) {
      await supabaseAdmin
        .from('clients')
        .update({ ai_extraction_status: 'failed' })
        .eq('id', id)
      return res.status(500).json({ success: false, error: 'Failed to decrypt API key' })
    }

    // Call AI to extract info
    const extractedInfo = await extractClientInfoWithAI(
      conversationText,
      aiConfig.provider,
      aiConfig.model,
      apiKey
    )

    // Update client with extracted info
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        ...extractedInfo,
        ai_extracted_at: new Date().toISOString(),
        ai_extraction_status: 'completed'
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating client with AI info:', updateError)
      return res.status(500).json({ success: false, error: 'Error saving extracted info' })
    }

    res.json({ success: true, data: updatedClient })
  } catch (error: any) {
    console.error('Error in POST /clients/:id/extract-info:', error)
    
    // Mark as failed
    const userId = await getUserIdFromToken(req)
    if (userId) {
      await supabaseAdmin
        .from('clients')
        .update({ ai_extraction_status: 'failed' })
        .eq('id', req.params.id)
    }
    
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * Extract client info using AI
 */
async function extractClientInfoWithAI(
  conversationText: string,
  provider: string,
  model: string,
  apiKey: string
): Promise<any> {
  const prompt = `Analyze this WhatsApp conversation and extract client information.

CONVERSATION:
${conversationText}

Extract the following information in JSON format. Only include fields you can identify with certainty:

{
  "full_name": "client's full name if mentioned",
  "email": "email address if mentioned (look for patterns like xxx@xxx.com)",
  "company": "company or business name if mentioned",
  "interest_type": "product|service|support|information|complaint|other",
  "interest_details": "brief description of client's main interest or need",
  "ai_summary": "2-3 sentence summary of what the client wants and the conversation context",
  "satisfaction": "happy|neutral|unhappy|unknown - based on client's tone and responses"
}

IMPORTANT:
- For "email": Look carefully for any email addresses in the conversation
- For "ai_summary": Summarize what the client is looking for or asking about
- For "satisfaction": Analyze if the client seems satisfied (happy), neutral, or frustrated (unhappy) based on their messages

Respond ONLY with the JSON, no additional explanations.`

  try {
    if (provider === 'google') {
      return await callGemini(prompt, model, apiKey)
    } else if (provider === 'openai') {
      return await callOpenAI(prompt, model, apiKey)
    } else if (provider === 'anthropic') {
      return await callAnthropic(prompt, model, apiKey)
    }
    
    throw new Error(`Unsupported provider: ${provider}`)
  } catch (error) {
    console.error('AI extraction error:', error)
    return {
      ai_summary: 'Error al extraer información automáticamente.',
      interest_type: 'other'
    }
  }
}

async function callGemini(prompt: string, model: string, apiKey: string): Promise<any> {
  const response = await fetch(
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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
}

async function callOpenAI(prompt: string, model: string, apiKey: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
  const text = data.choices?.[0]?.message?.content || '{}'
  
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
}

async function callAnthropic(prompt: string, model: string, apiKey: string): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
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
  const text = data.content?.[0]?.text || '{}'
  
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
}

/**
 * POST /api/clients/sync
 * Sync clients from existing conversations
 * Supports workspace_id filter
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspace_id } = req.body

    // Build query for conversations
    let convQuery = supabaseAdmin
      .from('conversations')
      .select('contact_phone, contact_name, created_at, last_message_at, workspace_id')
      .eq('user_id', userId)

    // Filter by workspace if provided
    if (workspace_id) {
      convQuery = convQuery.eq('workspace_id', workspace_id)
    }

    const { data: conversations, error: convError } = await convQuery

    if (convError) {
      return res.status(500).json({ success: false, error: 'Error fetching conversations' })
    }

    let synced = 0
    for (const conv of conversations || []) {
      // Count messages for this conversation
      const { count } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.contact_phone)

      const { error } = await supabaseAdmin
        .from('clients')
        .upsert({
          user_id: userId,
          workspace_id: conv.workspace_id || workspace_id || null,
          phone: conv.contact_phone,
          whatsapp_name: conv.contact_name,
          source: 'whatsapp',
          first_contact_at: conv.created_at,
          last_contact_at: conv.last_message_at,
          total_messages: count || 0,
          total_conversations: 1,
          status: 'lead'
        }, {
          onConflict: 'user_id,phone',
          ignoreDuplicates: false
        })

      if (!error) synced++
    }

    res.json({ success: true, data: { synced } })
  } catch (error: any) {
    console.error('Error in POST /clients/sync:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export { router as clientsRoutes }
