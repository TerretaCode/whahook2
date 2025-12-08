/**
 * Email Connections Routes
 * 
 * Handles email connection management for campaign sending:
 * - OAuth connections (Gmail, Outlook)
 * - SMTP connections (manual)
 */

import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const router = Router()

// Encryption for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32'
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
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
  
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) return null
  return user.id
}

// OAuth configuration
const OAUTH_CONFIG = {
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'],
  },
  outlook: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/User.Read', 'offline_access'],
  }
}

/**
 * GET /api/email/connections
 * Get all email connections for a workspace
 */
router.get('/connections', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const workspaceId = req.query.workspace_id as string
    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'workspace_id is required' })
    }

    const { data: connections, error } = await supabaseAdmin
      .from('email_connections')
      .select('id, workspace_id, provider, email_address, display_name, is_active, is_verified, last_used_at, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching email connections:', error)
      return res.status(500).json({ success: false, error: 'Error fetching connections' })
    }

    res.json({ success: true, data: connections })
  } catch (error: any) {
    console.error('Error in GET /email/connections:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/email/oauth/:provider/url
 * Get OAuth URL for Gmail or Outlook
 */
router.get('/oauth/:provider/url', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { provider } = req.params
    const workspaceId = req.query.workspace_id as string

    if (!workspaceId) {
      return res.status(400).json({ success: false, error: 'workspace_id is required' })
    }

    if (provider !== 'gmail' && provider !== 'outlook') {
      return res.status(400).json({ success: false, error: 'Invalid provider' })
    }

    const config = OAUTH_CONFIG[provider]
    if (!config.clientId) {
      return res.status(500).json({ success: false, error: `${provider} OAuth not configured` })
    }

    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/email/oauth/${provider}/callback`
    
    // State contains workspace_id and user_id for callback
    const state = Buffer.from(JSON.stringify({ workspaceId, userId })).toString('base64')

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    })

    const authUrl = `${config.authUrl}?${params.toString()}`

    res.json({ success: true, data: { url: authUrl } })
  } catch (error: any) {
    console.error('Error in GET /email/oauth/:provider/url:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/email/oauth/:provider/callback
 * OAuth callback handler
 */
router.get('/oauth/:provider/callback', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params
    const { code, state, error: oauthError } = req.query

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

    if (oauthError) {
      return res.redirect(`${frontendUrl}/settings/connections?error=oauth_denied`)
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/settings/connections?error=missing_params`)
    }

    if (provider !== 'gmail' && provider !== 'outlook') {
      return res.redirect(`${frontendUrl}/settings/connections?error=invalid_provider`)
    }

    // Decode state
    let stateData: { workspaceId: string; userId: string }
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString())
    } catch {
      return res.redirect(`${frontendUrl}/settings/connections?error=invalid_state`)
    }

    const config = OAUTH_CONFIG[provider]
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/email/oauth/${provider}/callback`

    // Exchange code for tokens
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    const tokens: any = await tokenResponse.json()

    if (tokens.error) {
      console.error('OAuth token error:', tokens)
      return res.redirect(`${frontendUrl}/settings/connections?error=token_error`)
    }

    // Get user email
    let email: string
    if (provider === 'gmail') {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      })
      const userInfo: any = await userInfoResponse.json()
      email = userInfo.email
    } else {
      const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      })
      const userInfo: any = await userInfoResponse.json()
      email = userInfo.mail || userInfo.userPrincipalName
    }

    // Deactivate any existing active connection for this workspace
    await supabaseAdmin
      .from('email_connections')
      .update({ is_active: false })
      .eq('workspace_id', stateData.workspaceId)
      .eq('is_active', true)

    // Save connection
    const { error: insertError } = await supabaseAdmin
      .from('email_connections')
      .insert({
        workspace_id: stateData.workspaceId,
        user_id: stateData.userId,
        provider,
        email_address: email,
        oauth_access_token_encrypted: encrypt(tokens.access_token),
        oauth_refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        oauth_expires_at: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        is_active: true,
        is_verified: true
      })

    if (insertError) {
      console.error('Error saving email connection:', insertError)
      return res.redirect(`${frontendUrl}/settings/connections?error=save_error`)
    }

    res.redirect(`${frontendUrl}/settings/connections?success=email_connected`)
  } catch (error: any) {
    console.error('Error in OAuth callback:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/settings/connections?error=unknown`)
  }
})

/**
 * POST /api/email/connections/smtp
 * Create SMTP connection
 */
router.post('/connections/smtp', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { workspace_id, email_address, display_name, smtp_host, smtp_port, smtp_username, smtp_password, smtp_secure } = req.body

    if (!workspace_id || !email_address || !smtp_host || !smtp_port || !smtp_username || !smtp_password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    // Deactivate any existing active connection
    await supabaseAdmin
      .from('email_connections')
      .update({ is_active: false })
      .eq('workspace_id', workspace_id)
      .eq('is_active', true)

    // Create new SMTP connection
    const { data: connection, error } = await supabaseAdmin
      .from('email_connections')
      .insert({
        workspace_id,
        user_id: userId,
        provider: 'smtp',
        email_address,
        display_name,
        smtp_host,
        smtp_port,
        smtp_username,
        smtp_password_encrypted: encrypt(smtp_password),
        smtp_secure: smtp_secure !== false,
        is_active: true,
        is_verified: false // Will be verified on first test
      })
      .select('id, workspace_id, provider, email_address, display_name, is_active, is_verified, created_at')
      .single()

    if (error) {
      console.error('Error creating SMTP connection:', error)
      return res.status(500).json({ success: false, error: 'Error creating connection' })
    }

    res.json({ success: true, data: connection })
  } catch (error: any) {
    console.error('Error in POST /email/connections/smtp:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/email/connections/:id/test
 * Test email connection by sending a test email
 */
router.post('/connections/:id/test', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id } = req.params

    const { data: connection, error } = await supabaseAdmin
      .from('email_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' })
    }

    // Test the connection based on provider
    try {
      if (connection.provider === 'smtp') {
        // Test SMTP connection
        const transporter = nodemailer.createTransport({
          host: connection.smtp_host,
          port: connection.smtp_port,
          secure: connection.smtp_secure,
          auth: {
            user: connection.smtp_username,
            pass: decrypt(connection.smtp_password_encrypted)
          }
        })

        await transporter.verify()
      } else {
        // For OAuth, try to refresh token if needed
        // This is a basic check - actual sending will be tested separately
        if (!connection.oauth_access_token_encrypted) {
          throw new Error('No access token')
        }
      }

      // Mark as verified
      await supabaseAdmin
        .from('email_connections')
        .update({ is_verified: true, last_error: null })
        .eq('id', id)

      res.json({ success: true, message: 'Connection verified successfully' })
    } catch (testError: any) {
      // Save error
      await supabaseAdmin
        .from('email_connections')
        .update({ is_verified: false, last_error: testError.message })
        .eq('id', id)

      res.status(400).json({ success: false, error: `Connection test failed: ${testError.message}` })
    }
  } catch (error: any) {
    console.error('Error in POST /email/connections/:id/test:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/email/connections/:id
 * Delete email connection
 */
router.delete('/connections/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('email_connections')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting email connection:', error)
      return res.status(500).json({ success: false, error: 'Error deleting connection' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /email/connections/:id:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
