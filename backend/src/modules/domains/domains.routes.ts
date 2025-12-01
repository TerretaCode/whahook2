import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import dns from 'dns'
import { promisify } from 'util'

const router = Router()
const resolveCname = promisify(dns.resolveCname)

// Vercel API configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID

// Helper to get user ID from token
async function getUserIdFromToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) return null
  return user.id
}

// Validate domain format
function isValidDomain(domain: string): boolean {
  // Basic domain validation
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  return domainRegex.test(domain)
}

/**
 * GET /api/domains
 * Get the current user's custom domain configuration
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('custom_domain, custom_domain_verified, subscription_tier')
      .eq('id', userId)
      .single()

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    // Only enterprise users can have custom domains
    if (profile.subscription_tier !== 'enterprise') {
      return res.json({
        success: true,
        data: null,
        message: 'Custom domains are only available for Enterprise plan'
      })
    }

    res.json({
      success: true,
      data: {
        domain: profile.custom_domain || null,
        verified: profile.custom_domain_verified || false,
        cname_target: 'cname.vercel-dns.com'
      }
    })
  } catch (error: any) {
    console.error('Error in GET /domains:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/domains
 * Set a custom domain (pending verification)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Check if user has enterprise plan
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError || profile.subscription_tier !== 'enterprise') {
      return res.status(403).json({ 
        success: false, 
        error: 'Custom domains are only available for Enterprise plan' 
      })
    }

    const { domain } = req.body

    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain is required' })
    }

    // Normalize domain (lowercase, no protocol, no trailing slash)
    const normalizedDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')

    // Validate domain format
    if (!isValidDomain(normalizedDomain)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid domain format. Example: panel.youragency.com' 
      })
    }

    // Check if domain is already in use by another user
    const { data: existingDomain } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('custom_domain', normalizedDomain)
      .neq('id', userId)
      .single()

    if (existingDomain) {
      return res.status(400).json({ 
        success: false, 
        error: 'This domain is already in use by another account' 
      })
    }

    // Save domain (pending verification)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        custom_domain: normalizedDomain,
        custom_domain_verified: false
      })
      .eq('id', userId)

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    res.json({
      success: true,
      data: {
        domain: normalizedDomain,
        verified: false,
        cname_target: 'cname.vercel-dns.com',
        instructions: `Add a CNAME record pointing ${normalizedDomain} to cname.vercel-dns.com`
      }
    })
  } catch (error: any) {
    console.error('Error in POST /domains:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/domains/verify
 * Verify DNS configuration and add domain to Vercel
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Get user's domain
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('custom_domain, custom_domain_verified, subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError) {
      return res.status(500).json({ success: false, error: profileError.message })
    }

    if (profile.subscription_tier !== 'enterprise') {
      return res.status(403).json({ 
        success: false, 
        error: 'Custom domains are only available for Enterprise plan' 
      })
    }

    if (!profile.custom_domain) {
      return res.status(400).json({ 
        success: false, 
        error: 'No domain configured. Please set a domain first.' 
      })
    }

    // If already verified, return success
    if (profile.custom_domain_verified) {
      return res.json({
        success: true,
        data: {
          domain: profile.custom_domain,
          verified: true,
          message: 'Domain is already verified and active'
        }
      })
    }

    // Verify DNS configuration
    let dnsVerified = false
    try {
      const records = await resolveCname(profile.custom_domain)
      // Check if CNAME points to Vercel
      dnsVerified = records.some(record => 
        record.includes('vercel') || record.includes('vercel-dns.com')
      )
    } catch (dnsError: any) {
      console.log('DNS lookup failed:', dnsError.message)
      // DNS might not be propagated yet
    }

    if (!dnsVerified) {
      return res.status(400).json({
        success: false,
        error: 'DNS not configured correctly. Please add a CNAME record pointing to cname.vercel-dns.com and wait for DNS propagation (can take up to 48 hours).',
        data: {
          domain: profile.custom_domain,
          verified: false,
          expected_cname: 'cname.vercel-dns.com'
        }
      })
    }

    // Add domain to Vercel
    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      console.error('Vercel credentials not configured')
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error. Please contact support.' 
      })
    }

    try {
      const vercelResponse = await fetch(
        `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: profile.custom_domain }),
        }
      )

      const vercelData = await vercelResponse.json() as { error?: { code?: string; message?: string } }

      if (!vercelResponse.ok) {
        // Domain might already exist in Vercel (which is fine)
        if (vercelData.error?.code !== 'domain_already_exists') {
          console.error('Vercel API error:', vercelData)
          return res.status(500).json({ 
            success: false, 
            error: vercelData.error?.message || 'Failed to add domain to Vercel' 
          })
        }
      }

      // Mark domain as verified
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ custom_domain_verified: true })
        .eq('id', userId)

      if (updateError) {
        return res.status(500).json({ success: false, error: updateError.message })
      }

      res.json({
        success: true,
        data: {
          domain: profile.custom_domain,
          verified: true,
          message: 'Domain verified and active! SSL certificate will be provisioned automatically.'
        }
      })
    } catch (vercelError: any) {
      console.error('Vercel API error:', vercelError)
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to connect to Vercel. Please try again.' 
      })
    }
  } catch (error: any) {
    console.error('Error in POST /domains/verify:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/domains
 * Remove custom domain
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // Get current domain
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('custom_domain')
      .eq('id', userId)
      .single()

    if (profileError) {
      return res.status(500).json({ success: false, error: profileError.message })
    }

    // Remove from Vercel if configured
    if (profile.custom_domain && VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      try {
        await fetch(
          `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${profile.custom_domain}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${VERCEL_TOKEN}`,
            },
          }
        )
      } catch (vercelError) {
        console.error('Failed to remove domain from Vercel:', vercelError)
        // Continue anyway - we still want to remove from our DB
      }
    }

    // Remove from database
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        custom_domain: null,
        custom_domain_verified: false
      })
      .eq('id', userId)

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    res.json({ success: true, message: 'Domain removed successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /domains:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/domains/lookup/:domain
 * Public endpoint to get branding for a custom domain
 * Used by middleware to load agency branding
 */
router.get('/lookup/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params

    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain is required' })
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, agency_branding, custom_domain, custom_domain_verified')
      .eq('custom_domain', domain.toLowerCase())
      .eq('custom_domain_verified', true)
      .single()

    if (error || !profile) {
      return res.status(404).json({ success: false, error: 'Domain not found' })
    }

    // Return branding info
    const branding = profile.agency_branding || {}
    res.json({
      success: true,
      data: {
        owner_id: profile.id,
        logo_url: branding.logo_url || null,
        logo_text: branding.logo_text || '',
        favicon_url: branding.favicon_url || null,
        tab_title: branding.tab_title || '',
        primary_color: branding.primary_color || '#22c55e',
        agency_name: branding.agency_name || ''
      }
    })
  } catch (error: any) {
    console.error('Error in GET /domains/lookup:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
