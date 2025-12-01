import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../../config/supabase'
import multer from 'multer'

const router = Router()

// Configure multer for logo upload (2MB limit)
const uploadLogo = multer({
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

// Configure multer for favicon upload (100KB limit)
const uploadFavicon = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024, // 100KB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/x-icon', 'image/png', 'image/svg+xml', 'image/vnd.microsoft.icon']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only ICO, PNG, and SVG are allowed for favicon.'))
    }
  }
})

// Alias for backward compatibility
const upload = uploadLogo

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
      .select('agency_branding, subscription_tier')
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
      data: profile.agency_branding || {
        logo_url: null,
        logo_text: '',
        favicon_url: null,
        tab_title: '',
        primary_color: '#22c55e',
        agency_name: '',
        powered_by_text: '',
        show_powered_by: true
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

    // Validate branding data
    const validBranding = {
      logo_url: branding.logo_url || null,
      logo_text: branding.logo_text || '',
      favicon_url: branding.favicon_url || null,
      tab_title: branding.tab_title || '',
      primary_color: branding.primary_color || '#22c55e',
      agency_name: branding.agency_name || '',
      powered_by_text: branding.powered_by_text || '',
      show_powered_by: branding.show_powered_by !== false
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ agency_branding: validBranding })
      .eq('id', userId)

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    res.json({ success: true, data: validBranding })
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
 * POST /api/branding/favicon
 * Upload agency favicon
 */
router.post('/favicon', uploadFavicon.single('favicon'), async (req: Request, res: Response) => {
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
        error: 'Favicon upload is only available for Enterprise plan' 
      })
    }

    if (!(req as any).file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const file = (req as any).file

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop()
    const fileName = `${userId}/favicon-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('agency-logos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ success: false, error: 'Failed to upload favicon' })
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
    console.error('Error in POST /branding/favicon:', error)
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
