"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspaceContext } from "@/contexts/WorkspaceContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { 
  User, 
  Mail, 
  Building2, 
  LogOut, 
  Save, 
  Loader2,
  Key,
  Sparkles,
  Calendar,
  Phone
} from "lucide-react"
import { ProfileSkeleton } from "@/components/skeletons/SettingsSkeletons"

export default function ProfilePage() {
  const router = useRouter()
  const t = useTranslations('settings.profile')
  const tCommon = useTranslations('common')
  const { user, logout, refreshUser, isLoading: authLoading } = useAuth()
  const { isOwner, workspace } = useWorkspaceContext()
  
  // Check if user is truly an owner (not a member with a role)
  const isTrueOwner = !workspace?.member_role && isOwner
  
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  
  // Update form fields when user data changes
  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.full_name || '')
      setCompanyName(user.profile.company_name || '')
      setPhone(user.profile.phone || '')
    }
  }, [user])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleSaveProfile = useCallback(async () => {
    try {
      setIsSaving(true)
      const response = await ApiClient.request('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name: fullName, company_name: companyName, phone })
      })
      
      if (response.success) {
        toast.success(t('profileUpdated'))
        await refreshUser()
      } else {
        throw new Error(response.error || t('updateError'))
      }
    } catch (error: any) {
      toast.error(error.message || t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [fullName, companyName, phone, refreshUser])

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      toast.error(t('passwordMinLength'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'))
      return
    }

    try {
      setIsChangingPassword(true)
      const response = await ApiClient.request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword })
      })
      
      if (response.success) {
        toast.success(t('passwordChanged'))
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordForm(false)
      } else {
        throw new Error(response.error || t('passwordChangeError'))
      }
    } catch (error: any) {
      toast.error(error.message || t('passwordChangeError'))
    } finally {
      setIsChangingPassword(false)
    }
  }, [newPassword, confirmPassword])

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }, [logout, router])

  const getPlanName = useMemo(() => {
    switch (user?.profile?.subscription_tier) {
      case 'trial': return t('plans.trial')
      case 'starter': return t('plans.starter')
      case 'professional': return t('plans.professional')
      case 'enterprise': return t('plans.enterprise')
      default: return t('plans.trial')
    }
  }, [user?.profile?.subscription_tier])

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [])

  // Show skeleton while loading
  if (authLoading || !user) {
    return <ProfileSkeleton />
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            {t('personalInfo')}
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Email (read-only) */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-gray-400" />
              Email
            </Label>
            <Input 
              value={user.email} 
              disabled 
              className="bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-400 mt-1">{t('emailCannotChange')}</p>
          </div>

          {/* Full Name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              {t('fullName')}
            </Label>
            <Input 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('yourName')}
            />
          </div>

          {/* Company Name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              {t('company')}
            </Label>
            <Input 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t('companyPlaceholder')}
            />
          </div>

          {/* Phone */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {t('phone')}
            </Label>
            <Input 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              type="tel"
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('saveChanges')}
          </Button>
        </div>
      </div>

      {/* Plan Card - Only show to true workspace owners (not members) */}
      {isTrueOwner && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-lg font-semibold">{t('yourPlan')}</h2>
              </div>
              <p className="text-2xl font-bold">{getPlanName}</p>
              <p className="text-green-100 text-sm mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('memberSince')} {formatDate(user.profile?.created_at)}
              </p>
            </div>
            <Button 
              variant="secondary" 
              className="bg-white text-green-600 hover:bg-gray-100"
              onClick={() => router.push('/pricing')}
            >
              {t('viewPlans')}
            </Button>
          </div>
        </div>
      )}

      {/* Security Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-green-600" />
            {t('security')}
          </h2>
        </div>
        <div className="p-6">
          {!showPasswordForm ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordForm(true)}
            >
              <Key className="w-4 h-4 mr-2" />
              {t('changePassword')}
            </Button>
          ) : (
            <div className="space-y-4 max-w-md">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('newPassword')}
                </Label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('minChars')}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  {t('confirmPassword')}
                </Label>
                <Input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('repeatPassword')}
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {tCommon('save')}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                >
                  {tCommon('cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Card */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('logout')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('logoutDescription')}
              </p>
            </div>
            <Button 
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              {t('logout')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

