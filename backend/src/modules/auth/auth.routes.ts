import { Router } from 'express'
import { supabase, supabaseAdmin } from '../../config'

const router = Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body
    
    console.log('📝 Register attempt:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: `${process.env.CORS_ORIGIN}/login?verified=true`
      }
    })
    
    if (error) {
      console.log('❌ Register error:', error.message)
      throw error
    }
    
    console.log('✅ User registered:', data.user?.id)
    
    // If session exists, email verification is disabled in Supabase
    // User can login immediately
    const requiresVerification = !data.session
    
    res.status(201).json({ 
      success: true, 
      data: { 
        user: data.user,
        session: data.session, // Include session if available (no verification required)
        requires_email_verification: requiresVerification,
        message: requiresVerification 
          ? 'Please check your email to verify your account'
          : 'Account created successfully'
      }
    })
  } catch (error: any) {
    console.log('❌ Register failed:', error.message)
    res.status(400).json({ success: false, error: error.message })
  }
})

// Helper function to get effective plan for a member user
async function getEffectivePlanForMember(userId: string): Promise<string> {
  // Get the first workspace they're a member of
  const { data: membership } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (!membership) return 'trial'

  // Get the owner's plan
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('user_id')
    .eq('id', membership.workspace_id)
    .single()

  if (!workspace) return 'trial'

  const { data: ownerProfile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_tier')
    .eq('id', workspace.user_id)
    .single()

  return ownerProfile?.subscription_tier || 'trial'
}

// Helper function to get or create profile
async function getOrCreateProfile(authUser: any) {
  // Try to get profile from profiles table
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()
  
  if (profile) {
    // Calculate effective plan for members
    let effectivePlan = profile.subscription_tier || 'trial'
    if (profile.subscription_tier === 'member' || profile.is_invited_user) {
      effectivePlan = await getEffectivePlanForMember(authUser.id)
    }

    // Profile exists in table
    return {
      user_id: authUser.id,
      email: profile.email,
      full_name: profile.full_name,
      company_name: profile.company_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      account_type: profile.account_type || 'saas',
      subscription_tier: profile.subscription_tier || 'trial',
      effective_plan: effectivePlan,
      subscription_status: profile.subscription_status || 'active',
      trial_ends_at: profile.trial_ends_at,
      is_invited_user: profile.is_invited_user || false,
      invited_to_workspace_id: profile.invited_to_workspace_id,
      has_gemini_api_key: !!authUser.user_metadata?.has_gemini_api_key,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }
  }
  
  // Profile doesn't exist, create it from user_metadata (migration path)
  const newProfile = {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || '',
    company_name: authUser.user_metadata?.company_name || '',
    account_type: authUser.user_metadata?.account_type || 'saas',
    subscription_tier: authUser.user_metadata?.subscription_tier || 'trial'
  }
  
  const { data: createdProfile, error: createError } = await supabaseAdmin
    .from('profiles')
    .insert(newProfile)
    .select()
    .single()
  
  if (createError) {
    console.log('⚠️ Could not create profile, using user_metadata fallback:', createError.message)
    // Fallback to user_metadata if profiles table doesn't exist yet
    return {
      user_id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || null,
      company_name: authUser.user_metadata?.company_name || null,
      account_type: authUser.user_metadata?.account_type || 'saas',
      subscription_tier: authUser.user_metadata?.subscription_tier || 'trial',
      has_gemini_api_key: !!authUser.user_metadata?.has_gemini_api_key,
      created_at: authUser.created_at,
      metadata: authUser.user_metadata || {}
    }
  }
  
  return {
    user_id: authUser.id,
    email: createdProfile.email,
    full_name: createdProfile.full_name,
    company_name: createdProfile.company_name,
    phone: createdProfile.phone,
    avatar_url: createdProfile.avatar_url,
    account_type: createdProfile.account_type || 'saas',
    subscription_tier: createdProfile.subscription_tier || 'trial',
    subscription_status: createdProfile.subscription_status || 'active',
    trial_ends_at: createdProfile.trial_ends_at,
    has_gemini_api_key: !!authUser.user_metadata?.has_gemini_api_key,
    created_at: createdProfile.created_at,
    updated_at: createdProfile.updated_at
  }
}

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    console.log('🔐 Login attempt:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.log('❌ Login error:', error.message)
      throw error
    }
    
    console.log('✅ Login successful, user:', data.user?.id)
    console.log('📧 Email confirmed:', data.user?.email_confirmed_at)
    
    if (!data.user?.email_confirmed_at) {
      console.log('⚠️ Email not confirmed')
      return res.status(401).json({ 
        success: false, 
        error: 'Please verify your email before logging in' 
      })
    }
    
    const authUser = data.user
    
    // Get profile from profiles table (or create if doesn't exist)
    const profile = await getOrCreateProfile(authUser)
    
    const user = {
      id: authUser.id,
      email: authUser.email,
      email_confirmed: !!authUser.email_confirmed_at,
      profile
    }
    
    // Update last_login_at
    await supabaseAdmin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authUser.id)
    
    res.json({
      success: true,
      data: {
        user,
        session: {
          access_token: data.session?.access_token || '',
          refresh_token: data.session?.refresh_token || ''
        }
      }
    })
  } catch (error: any) {
    console.log('❌ Login failed:', error.message)
    res.status(401).json({ success: false, error: error.message })
  }
})

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    
    console.log('📧 Forgot password request:', email)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CORS_ORIGIN}/change-password`
    })
    
    if (error) throw error
    
    console.log('✅ Reset email sent')
    res.json({ success: true, message: 'Password reset email sent' })
  } catch (error: any) {
    console.log('❌ Forgot password error:', error.message)
    res.status(400).json({ success: false, error: error.message })
  }
})

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    console.log('🔑 Reset password attempt with token:', token ? 'present' : 'missing')
    
    if (!token) {
      throw new Error('No reset token provided')
    }
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      console.log('❌ Invalid token:', userError?.message)
      throw new Error('Invalid or expired reset token')
    }
    
    console.log('✅ Token valid for user:', userData.user.id)
    
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    )
    
    if (error) {
      console.log('❌ Password update failed:', error.message)
      throw error
    }
    
    console.log('✅ Password updated successfully')
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error: any) {
    console.log('❌ Reset password error:', error.message)
    res.status(400).json({ success: false, error: error.message })
  }
})

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) throw new Error('No token provided')
    
    const { data, error } = await supabase.auth.getUser(token)
    
    if (error) throw error
    
    const authUser = data.user
    
    // Get profile from profiles table
    const profile = await getOrCreateProfile(authUser)
    
    const user = {
      id: authUser.id,
      email: authUser.email,
      email_confirmed: !!authUser.email_confirmed_at,
      profile
    }
    
    res.json({ success: true, data: { user } })
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message })
  }
})

// Change Password (for logged in users)
router.post('/change-password', async (req, res) => {
  try {
    const { new_password } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) throw new Error('No token provided')
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      throw new Error('Invalid token')
    }
    
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { password: new_password }
    )
    
    if (error) throw error
    
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    const { full_name, company_name, phone } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) throw new Error('No token provided')
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      throw new Error('Invalid token')
    }

    // Update profile in profiles table
    const updateData: any = { updated_at: new Date().toISOString() }
    if (full_name !== undefined) updateData.full_name = full_name
    if (company_name !== undefined) updateData.company_name = company_name
    if (phone !== undefined) updateData.phone = phone
    
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userData.user.id)
    
    if (updateError) {
      // If profiles table doesn't exist yet, fallback to user_metadata
      console.log('⚠️ Profiles table update failed, using user_metadata fallback:', updateError.message)
      const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.user.id,
        { 
          user_metadata: { 
            ...userData.user.user_metadata,
            full_name,
            company_name
          } 
        }
      )
      if (metaError) throw metaError
    }
    
    res.json({ success: true, message: 'Profile updated successfully' })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

// Get Profile (direct endpoint)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) throw new Error('No token provided')
    
    const { data, error } = await supabase.auth.getUser(token)
    
    if (error) throw error
    
    const profile = await getOrCreateProfile(data.user)
    
    res.json({ success: true, data: profile })
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message })
  }
})

export default router
