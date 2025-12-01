import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import multer from 'multer'

const router = Router()

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed.'))
    }
  }
})

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
 * GET /api/branding/agency/:slug
 * Get agency branding by slug (PUBLIC - no auth required)
 * Used for agency portal pages (/a/:slug/login, etc.)
 */
router.get('/agency/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params

    if (!slug || slug.length < 3) {
      return res.status(400).json({ success: false, error: 'Invalid slug' })
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('agency_branding, agency_slug, subscription_tier')
      .eq('agency_slug', slug.toLowerCase())
      .eq('subscription_tier', 'enterprise')
      .single()

    if (error || !profile) {
      return res.status(404).json({ success: false, error: 'Agency not found' })
    }

    // Return only public branding info (no sensitive data)
    const branding = profile.agency_branding || {}
    res.json({
      success: true,
      data: {
        logo_url: branding.logo_url || null,
        logo_text: branding.logo_text || '',
        primary_color: branding.primary_color || '#22c55e',
        agency_name: branding.agency_name || '',
        agency_slug: profile.agency_slug
      }
    })
  } catch (error: any) {
    console.error('Error in GET /branding/agency/:slug:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/branding
 * Get the current user's agency branding
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('agency_branding, agency_slug, subscription_tier')
      .eq('id', userId)
      .single()

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    // Only enterprise users can have branding
    if (profile.subscription_tier !== 'enterprise') {
      return res.json({
        success: true,
        data: null,
        message: 'Branding is only available for Enterprise plan'
      })
    }

    res.json({
      success: true,
      data: {
        ...(profile.agency_branding || {
          logo_url: null,
          logo_text: '',
          primary_color: '#22c55e',
          agency_name: '',
          powered_by_text: '',
          show_powered_by: true
        }),
        agency_slug: profile.agency_slug || ''
      }
    })
  } catch (error: any) {
    console.error('Error in GET /branding:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * PUT /api/branding
 * Update the current user's agency branding
 */
router.put('/', async (req: Request, res: Response) => {
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
        error: 'Branding is only available for Enterprise plan' 
      })
    }

    const branding = req.body

    // Validate agency_slug if provided
    let agency_slug = branding.agency_slug || null
    if (agency_slug) {
      // Normalize slug: lowercase, only alphanumeric and hyphens
      agency_slug = agency_slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
      
      // Validate slug format
      if (agency_slug.length < 3) {
        return res.status(400).json({ 
          success: false, 
          error: 'El slug debe tener al menos 3 caracteres' 
        })
      }
      if (agency_slug.length > 50) {
        return res.status(400).json({ 
          success: false, 
          error: 'El slug no puede tener más de 50 caracteres' 
        })
      }
      if (agency_slug.startsWith('-') || agency_slug.endsWith('-')) {
        return res.status(400).json({ 
          success: false, 
          error: 'El slug no puede empezar ni terminar con guión' 
        })
      }

      // Check if slug is already taken by another user
      const { data: existingSlug } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('agency_slug', agency_slug)
        .neq('id', userId)
        .single()

      if (existingSlug) {
        return res.status(400).json({ 
          success: false, 
          error: 'Este slug ya está en uso. Por favor elige otro.' 
        })
      }
    }

    // Validate branding data
    const validBranding = {
      logo_url: branding.logo_url || null,
      logo_text: branding.logo_text || '',
      primary_color: branding.primary_color || '#22c55e',
      agency_name: branding.agency_name || '',
      powered_by_text: branding.powered_by_text || '',
      show_powered_by: branding.show_powered_by !== false
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        agency_branding: validBranding,
        agency_slug: agency_slug
      })
      .eq('id', userId)

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    res.json({ success: true, data: { ...validBranding, agency_slug } })
  } catch (error: any) {
    console.error('Error in PUT /branding:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/branding/logo
 * Upload agency logo
 */
router.post('/logo', upload.single('logo'), async (req: Request, res: Response) => {
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
        error: 'Logo upload is only available for Enterprise plan' 
      })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    // Generate unique filename
    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `${userId}/logo-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('agency-logos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ success: false, error: 'Failed to upload logo' })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('agency-logos')
      .getPublicUrl(fileName)

    res.json({
      success: true,
      data: {
        url: urlData.publicUrl
      }
    })
  } catch (error: any) {
    console.error('Error in POST /branding/logo:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * DELETE /api/branding/logo
 * Delete agency logo
 */
router.delete('/logo', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    // List and delete all logos for this user
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('agency-logos')
      .list(userId)

    if (listError) {
      console.error('List error:', listError)
      return res.status(500).json({ success: false, error: 'Failed to list logos' })
    }

    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${userId}/${f.name}`)
      await supabaseAdmin.storage
        .from('agency-logos')
        .remove(filesToDelete)
    }

    // Update profile to remove logo URL
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('agency_branding')
      .eq('id', userId)
      .single()

    if (profile?.agency_branding) {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          agency_branding: { 
            ...profile.agency_branding, 
            logo_url: null 
          } 
        })
        .eq('id', userId)
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /branding/logo:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
