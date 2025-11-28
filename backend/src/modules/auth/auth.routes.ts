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
    
    res.status(201).json({ 
      success: true, 
      data: { 
        user: data.user,
        requires_email_verification: true,
        message: 'Please check your email to verify your account'
      }
    })
  } catch (error: any) {
    console.log('❌ Register failed:', error.message)
    res.status(400).json({ success: false, error: error.message })
  }
})

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
    
    // Build profile from user_metadata
    const user = {
      id: authUser.id,
      email: authUser.email,
      email_confirmed: !!authUser.email_confirmed_at,
      profile: {
        user_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || null,
        company_name: authUser.user_metadata?.company_name || null,
        account_type: authUser.user_metadata?.account_type || 'saas',
        subscription_tier: authUser.user_metadata?.subscription_tier || 'free',
        has_gemini_api_key: !!authUser.user_metadata?.has_gemini_api_key,
        created_at: authUser.created_at,
        metadata: authUser.user_metadata || {}
      }
    }
    
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
    
    // Build profile from user_metadata
    const user = {
      id: authUser.id,
      email: authUser.email,
      email_confirmed: !!authUser.email_confirmed_at,
      profile: {
        user_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || null,
        company_name: authUser.user_metadata?.company_name || null,
        account_type: authUser.user_metadata?.account_type || 'saas',
        subscription_tier: authUser.user_metadata?.subscription_tier || 'free',
        has_gemini_api_key: !!authUser.user_metadata?.has_gemini_api_key,
        created_at: authUser.created_at,
        metadata: authUser.user_metadata || {}
      }
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
    const { full_name, company_name } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) throw new Error('No token provided')
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      throw new Error('Invalid token')
    }

    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.user.id,
      { 
        user_metadata: { 
          ...userData.user.user_metadata,
          full_name,
          company_name
        } 
      }
    )
    
    if (updateError) throw updateError
    
    res.json({ success: true, message: 'Profile updated successfully' })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router
