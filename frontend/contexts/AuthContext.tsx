"use client"

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthStorage } from '@/lib/auth-storage'
import { ApiClient } from '@/lib/api-client'

interface UserProfile {
  user_id: string
  email: string
  full_name: string | null
  company_name?: string | null
  phone?: string | null
  avatar_url?: string | null
  billing_contact_email?: string | null
  custom_pricing_amount?: string | null
  account_type: string
  subscription_tier: string
  subscription_status?: string
  trial_ends_at?: string | null
  has_gemini_api_key?: boolean
  created_at: string
  updated_at?: string
  last_login_at?: string | null
  metadata?: {
    requires_password_change?: boolean
    [key: string]: any
  }
}

interface User {
  id: string
  email: string
  email_confirmed?: boolean
  profile: UserProfile
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return

    const refreshToken = AuthStorage.getRefreshToken()
    if (!refreshToken) return

    // Refresh token 5 minutes before expiry
    const refreshInterval = setInterval(async () => {
      await handleTokenRefresh()
    }, 25 * 60 * 1000) // 25 minutes

    return () => clearInterval(refreshInterval)
  }, [user])

  const checkSession = async () => {
    try {
      const token = AuthStorage.getAccessToken()
      
      if (!token || !AuthStorage.isSessionActive()) {
        setUser(null)
        setIsLoading(false)
        return
      }

      // Try to get current user from backend
      const response = await ApiClient.getCurrentUser()
      
      if (response.success && response.data) {
        console.log('🔐 AUTH CONTEXT - User loaded from API:', {
          email: response.data.user.email,
          subscription_tier: response.data.user.profile?.subscription_tier,
          user_id: response.data.user.profile?.user_id
        })
        setUser(response.data.user)
      } else {
        console.log('🔐 AUTH CONTEXT - Token invalid, trying refresh...')
        // Token invalid, try to refresh
        await handleTokenRefresh()
      }
    } catch (error) {
      console.error('Session check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTokenRefresh = async () => {
    try {
      const refreshToken = AuthStorage.getRefreshToken()
      
      if (!refreshToken) {
        await logout()
        return
      }

      const response = await ApiClient.refreshToken(refreshToken)
      
      if (response.success && response.data && response.data.session) {
        AuthStorage.updateAccessToken(response.data.session.access_token)
        
        // Refresh user data
        await refreshUser()
      } else {
        await logout()
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      await logout()
    }
  }

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      const response = await ApiClient.login({ email, password })
      
      if (!response.success || !response.data) {
        return false
      }

      const { user: userData, session } = response.data

      if (!session) {
        return false
      }

      AuthStorage.saveSession(
        session.access_token,
        session.refresh_token,
        userData,
        rememberMe
      )

      setUser(userData)
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await ApiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      AuthStorage.clearSession()
      setUser(null)
      router.push('/login')
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    try {
      const response = await ApiClient.getCurrentUser()
      
      if (response.success && response.data) {
        const updatedUser = response.data.user
        setUser(updatedUser)
        
        // Also update in storage so it persists on reload
        const rememberMe = AuthStorage.hasRememberMe()
        const accessToken = AuthStorage.getAccessToken()
        const refreshToken = AuthStorage.getRefreshToken()
        
        if (accessToken && refreshToken) {
          AuthStorage.saveSession(accessToken, refreshToken, updatedUser, rememberMe)
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  }), [user, isLoading, isAuthenticated, login, logout, refreshUser])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
