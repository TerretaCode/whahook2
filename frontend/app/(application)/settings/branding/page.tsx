"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { useAuth } from "@/contexts/AuthContext"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/toast"
import {
  Palette,
  Loader2,
  Upload,
  Save,
  Crown,
  AlertCircle,
  Globe,
  CheckCircle2,
  Copy,
  Trash2,
  RefreshCw,
  Mail,
  Eye,
  EyeOff,
  Send
} from "lucide-react"
import Link from "next/link"

interface AgencyBranding {
  logo_url: string | null
  logo_text: string           // Texto opcional al lado del logo
  favicon_url: string | null  // Favicon para la pestaña del navegador
  tab_title: string           // Título de la pestaña del navegador
  primary_color: string       // Color de marca (botones, iconos, acentos)
  agency_name: string
  powered_by_text: string
  show_powered_by: boolean
}

interface SmtpConfig {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  auth_user: string
  auth_pass: string
  from_email: string
  from_name: string
  reply_to: string
}

const DEFAULT_BRANDING: AgencyBranding = {
  logo_url: null,
  logo_text: '',
  favicon_url: null,
  tab_title: '',
  primary_color: '#22c55e',
  agency_name: '',
  powered_by_text: '',
  show_powered_by: true
}

const DEFAULT_SMTP: SmtpConfig = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  auth_user: '',
  auth_pass: '',
  from_email: '',
  from_name: '',
  reply_to: ''
}

export default function AgencyBrandingPage() {
  const router = useRouter()
  const t = useTranslations('settings.branding')
  const tCommon = useTranslations('common')
  const { user, isLoading: authLoading } = useAuth()
  
  const [branding, setBranding] = useState<AgencyBranding>(DEFAULT_BRANDING)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const initialLoadDone = useRef(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  
  // Custom domain state
  const [customDomain, setCustomDomain] = useState('')
  const [domainVerified, setDomainVerified] = useState(false)
  const [domainInput, setDomainInput] = useState('')
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false)
  const [isSavingDomain, setIsSavingDomain] = useState(false)
  const [isDeletingDomain, setIsDeletingDomain] = useState(false)

  // SMTP state
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(DEFAULT_SMTP)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [isSavingSmtp, setIsSavingSmtp] = useState(false)
  const [isTestingSmtp, setIsTestingSmtp] = useState(false)

  const isEnterprise = user?.profile?.subscription_tier === 'enterprise'

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadBranding()
      loadDomain()
      loadSmtpConfig()
    }
  }, [user])

  const loadBranding = useCallback(async () => {
    try {
      const response = await ApiClient.get<AgencyBranding>('/api/branding')
      if (response.success && response.data) {
        setBranding({ ...DEFAULT_BRANDING, ...response.data })
      }
    } catch (error) {
      console.error('Error loading branding:', error)
    } finally {
      setIsInitialLoad(false)
    }
  }, [])

  const loadDomain = async () => {
    try {
      const response = await ApiClient.get<{ domain: string | null; verified: boolean }>('/api/domains')
      if (response.success && response.data) {
        setCustomDomain(response.data.domain || '')
        setDomainVerified(response.data.verified || false)
        setDomainInput(response.data.domain || '')
      }
    } catch (error) {
      console.error('Error loading domain:', error)
    }
  }

  const loadSmtpConfig = async () => {
    try {
      const response = await ApiClient.get<SmtpConfig>('/api/smtp')
      if (response.success && response.data) {
        // Don't load the password - it's encrypted and shouldn't be shown
        setSmtpConfig({ ...DEFAULT_SMTP, ...response.data, auth_pass: '' })
      }
    } catch (error) {
      console.error('Error loading SMTP config:', error)
    }
  }

  const handleSaveSmtp = async () => {
    if (!isEnterprise) {
      toast.error(t('enterpriseRequired'), t('upgradeForSmtp'))
      return
    }

    // Validate required fields if SMTP is enabled
    if (smtpConfig.enabled) {
      if (!smtpConfig.host || !smtpConfig.auth_user || !smtpConfig.from_email) {
        toast.error(t('requiredFields'), t('completeAllFields'))
        return
      }
    }

    try {
      setIsSavingSmtp(true)
      const response = await ApiClient.put('/api/smtp', smtpConfig)
      if (response.success) {
        toast.success(tCommon('success'), t('smtpSaved'))
        // Clear password field after save
        setSmtpConfig(prev => ({ ...prev, auth_pass: '' }))
      }
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('smtpSaveError'))
    } finally {
      setIsSavingSmtp(false)
    }
  }

  const handleTestSmtp = async () => {
    if (!smtpConfig.host || !smtpConfig.auth_user || !smtpConfig.from_email) {
      toast.error(t('incompleteConfig'), t('completeSmtpFirst'))
      return
    }

    try {
      setIsTestingSmtp(true)
      const response = await ApiClient.post('/api/smtp/test', {
        ...smtpConfig,
        test_email: user?.email
      })
      if (response.success) {
        toast.success(t('emailSent'), t('testEmailSentTo', { email: user?.email || '' }))
      }
    } catch (error: any) {
      toast.error(t('connectionError'), error.message || t('smtpConnectionError'))
    } finally {
      setIsTestingSmtp(false)
    }
  }

  const handleSaveDomain = async () => {
    if (!isEnterprise) {
      toast.error(t('enterpriseRequired'), t('upgradeForDomain'))
      return
    }

    if (!domainInput.trim()) {
      toast.error(tCommon('error'), t('enterValidDomain'))
      return
    }

    try {
      setIsSavingDomain(true)
      const response = await ApiClient.post('/api/domains', { domain: domainInput.trim() })
      if (response.success) {
        setCustomDomain(domainInput.trim())
        setDomainVerified(false)
        toast.success(t('domainSaved'), t('configureDnsNow'))
      }
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('domainSaveError'))
    } finally {
      setIsSavingDomain(false)
    }
  }

  const handleVerifyDomain = async () => {
    try {
      setIsVerifyingDomain(true)
      const response = await ApiClient.post('/api/domains/verify', {})
      if (response.success) {
        setDomainVerified(true)
        toast.success(t('domainVerified'), t('domainActive'))
      }
    } catch (error: any) {
      toast.error(t('verificationFailed'), error.message || t('checkDnsConfig'))
    } finally {
      setIsVerifyingDomain(false)
    }
  }

  const handleDeleteDomain = async () => {
    if (!confirm(t('confirmDeleteDomain'))) {
      return
    }

    try {
      setIsDeletingDomain(true)
      const response = await ApiClient.delete('/api/domains')
      if (response.success) {
        setCustomDomain('')
        setDomainVerified(false)
        setDomainInput('')
        toast.success(t('domainDeleted'), t('domainDeletedDesc'))
      }
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('domainDeleteError'))
    } finally {
      setIsDeletingDomain(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(tCommon('copied'), tCommon('copied'))
  }

  const handleSave = async () => {
    if (!isEnterprise) {
      toast.error(t('enterpriseRequired'), t('upgradeForBranding'))
      return
    }

    try {
      setIsSaving(true)
      const response = await ApiClient.put('/api/branding', branding)
      if (response.success) {
        toast.success(tCommon('success'), t('brandingSaved'))
      }
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('brandingSaveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isEnterprise) {
      toast.error(t('enterpriseRequired'), t('upgradeForLogos'))
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('logo', file)

      const response = await ApiClient.upload<{ url: string }>('/api/branding/logo', formData)

      if (response.success && response.data?.url) {
        setBranding(prev => ({
          ...prev,
          logo_url: response.data!.url
        }))
        toast.success(t('logoUploaded'), t('logoUploadedDesc'))
        // Auto-save after upload
        await handleSave()
      }
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('logoUploadError'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isEnterprise) {
      toast.error(t('enterpriseRequired'), t('upgradeForFavicon'))
      return
    }

    // Validate file size (max 100KB for favicon)
    if (file.size > 100 * 1024) {
      toast.error(t('fileTooLarge'), t('faviconMaxSize'))
      return
    }

    try {
      setIsUploadingFavicon(true)
      const formData = new FormData()
      formData.append('favicon', file)

      const response = await ApiClient.upload<{ url: string }>('/api/branding/favicon', formData)

      if (response.success && response.data?.url) {
        setBranding(prev => ({
          ...prev,
          favicon_url: response.data!.url
        }))
        toast.success(t('faviconUploaded'), t('faviconUploadedDesc'))
        // Auto-save after upload
        await handleSave()
      }
    } catch (error: any) {
      toast.error(tCommon('error'), error.message || t('faviconUploadError'))
    } finally {
      setIsUploadingFavicon(false)
    }
  }

  if (authLoading || isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Palette className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600">
              {t('subtitle')}
            </p>
          </div>
        </div>
        {isEnterprise && (
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('saveChanges')}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Enterprise Required Banner */}
      {!isEnterprise && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Crown className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-1">
                {t('enterpriseRequired')}
              </h3>
              <p className="text-green-700 mb-4">
                {t('enterpriseDescription')}
              </p>
              <Link href="/settings/billing">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  {t('upgradeToEnterprise')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Branding Form */}
      <div className={`space-y-6 ${!isEnterprise ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Logo Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('logo')}</h2>
          <div>
            <Label className="mb-2 block">{t('agencyLogo')}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors max-w-md">
              {branding.logo_url ? (
                <div className="space-y-3">
                  <img 
                    src={branding.logo_url} 
                    alt="Logo" 
                    className="max-h-16 mx-auto"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBranding(prev => ({ ...prev, logo_url: null }))}
                  >
                    {tCommon('delete')}
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">{t('clickToUpload')}</p>
                  <p className="text-xs text-gray-400">{t('logoFormats')}</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Favicon Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Label className="mb-2 block">
              {t('favicon')} <span className="text-gray-400 font-normal">({t('tabIcon')})</span>
            </Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center max-w-xs">
              {isUploadingFavicon ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              ) : branding.favicon_url ? (
                <div className="space-y-2">
                  <img 
                    src={branding.favicon_url} 
                    alt="Favicon" 
                    className="w-8 h-8 mx-auto"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBranding(prev => ({ ...prev, favicon_url: null }))}
                  >
                    {tCommon('delete')}
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">{t('uploadFavicon')}</p>
                  <p className="text-xs text-gray-400">{t('faviconFormats')}</p>
                  <input
                    type="file"
                    accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml"
                    className="hidden"
                    onChange={handleFaviconUpload}
                    disabled={isUploadingFavicon}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('faviconHint')}
            </p>
          </div>

          {/* Tab Title */}
          <div className="mt-4">
            <Label htmlFor="tab_title" className="mb-2 block">
              {t('tabTitle')}
            </Label>
            <Input
              id="tab_title"
              value={branding.tab_title}
              onChange={(e) => setBranding(prev => ({ ...prev, tab_title: e.target.value }))}
              placeholder={t('placeholders.tabTitle')}
              className="max-w-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('tabTitleHint')}
            </p>
          </div>
        </div>

        {/* Colors Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('brandColor')}</h2>
          <div>
            <Label htmlFor="primary_color" className="mb-2 block">{t('primaryColor')}</Label>
            <div className="flex gap-3 max-w-md">
              <input
                type="color"
                id="primary_color"
                value={branding.primary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <Input
                value={branding.primary_color}
                onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                placeholder={t('placeholders.primaryColor')}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('primaryColorHint')}
            </p>
          </div>
        </div>

        {/* Agency Info Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('agencyInfo')}</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agency_name" className="mb-2 block">{t('agencyName')}</Label>
              <Input
                id="agency_name"
                value={branding.agency_name}
                onChange={(e) => setBranding(prev => ({ ...prev, agency_name: e.target.value }))}
                placeholder={t('placeholders.agencyName')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('agencyNameHint')}
              </p>
            </div>
          </div>
        </div>

        {/* Powered By Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('poweredByBadge')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">{t('showPoweredBy')}</Label>
                <p className="text-sm text-gray-500">
                  {t('showPoweredByHint')}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding.show_powered_by}
                  onChange={(e) => setBranding(prev => ({ ...prev, show_powered_by: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {branding.show_powered_by && (
              <div>
                <Label htmlFor="powered_by_text" className="mb-2 block">{t('customText')}</Label>
                <Input
                  id="powered_by_text"
                  value={branding.powered_by_text}
                  onChange={(e) => setBranding(prev => ({ ...prev, powered_by_text: e.target.value }))}
                  placeholder={t('placeholders.poweredByText')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('customTextHint')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Custom Domain Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">{t('customDomain')}</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {t('customDomainDesc')}
          </p>

          {customDomain ? (
            <div className="space-y-4">
              {/* Current domain status */}
              <div className={`p-4 rounded-lg border ${domainVerified ? 'bg-green-50 border-green-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {domainVerified ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{customDomain}</p>
                      <p className={`text-sm ${domainVerified ? 'text-green-600' : 'text-green-600'}`}>
                        {domainVerified ? t('domainActiveVerified') : t('pendingDnsVerification')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteDomain}
                    disabled={isDeletingDomain}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeletingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* DNS Instructions (if not verified) */}
              {!domainVerified && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-gray-900">{t('configureDns')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('addCnameRecord')}
                  </p>
                  <div className="bg-white rounded border p-3 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-500">Tipo:</span> <span className="font-semibold">CNAME</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-gray-500">Nombre:</span> <span className="font-semibold">{customDomain.split('.')[0]}</span>
                      </div>
                      <button onClick={() => copyToClipboard(customDomain.split('.')[0])} className="text-gray-400 hover:text-gray-600">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-gray-500">Valor:</span> <span className="font-semibold">cname.vercel-dns.com</span>
                      </div>
                      <button onClick={() => copyToClipboard('cname.vercel-dns.com')} className="text-gray-400 hover:text-gray-600">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('dnsPropagation')}
                  </p>
                  <Button
                    onClick={handleVerifyDomain}
                    disabled={isVerifyingDomain}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isVerifyingDomain ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('verifying')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('verifyDns')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom_domain" className="mb-2 block">{t('yourDomain')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom_domain"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value.toLowerCase())}
                    placeholder={t('placeholders.customDomain')}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveDomain}
                    disabled={isSavingDomain || !domainInput.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSavingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : t('configure')}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('enterSubdomain')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SMTP Configuration Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('smtpServer')}</h2>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smtpConfig.enabled}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            {t('smtpDesc')}
          </p>

          {smtpConfig.enabled && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              {/* Server Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_host" className="mb-2 block">
                    {t('smtpHost')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtp_host"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder={t('placeholders.smtpHost')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="smtp_port" className="mb-2 block">{t('port')}</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                      placeholder={t('placeholders.smtpPort')}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">SSL/TLS</Label>
                    <div className="flex items-center h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smtpConfig.secure}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, secure: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Puerto 465</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authentication */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_user" className="mb-2 block">
                    {t('smtpUser')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtp_user"
                    value={smtpConfig.auth_user}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, auth_user: e.target.value }))}
                    placeholder={t('placeholders.smtpUser')}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_pass" className="mb-2 block">
                    {t('smtpPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="smtp_pass"
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpConfig.auth_pass}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, auth_pass: e.target.value }))}
                      placeholder={t('placeholders.smtpPassword')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('leaveEmptyPassword')}
                  </p>
                </div>
              </div>

              {/* From Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_from_email" className="mb-2 block">
                    {t('fromEmail')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="smtp_from_email"
                    type="email"
                    value={smtpConfig.from_email}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder={t('placeholders.fromEmail')}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_from_name" className="mb-2 block">
                    {t('fromName')}
                  </Label>
                  <Input
                    id="smtp_from_name"
                    value={smtpConfig.from_name}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, from_name: e.target.value }))}
                    placeholder={t('placeholders.fromName')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="smtp_reply_to" className="mb-2 block">
                  Reply-To <span className="text-gray-400 font-normal">(opcional)</span>
                </Label>
                <Input
                  id="smtp_reply_to"
                  type="email"
                  value={smtpConfig.reply_to}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, reply_to: e.target.value }))}
                  placeholder={t('placeholders.replyTo')}
                  className="max-w-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('replyToHint')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveSmtp}
                  disabled={isSavingSmtp}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSavingSmtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t('saveSmtp')}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestSmtp}
                  disabled={isTestingSmtp || !smtpConfig.host}
                >
                  {isTestingSmtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('sendTestEmail')}
                    </>
                  )}
                </Button>
              </div>

              {/* Help */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">{t('popularSmtpProviders')}:</p>
                    <ul className="space-y-1 text-green-700">
                      <li>• <strong>Gmail:</strong> smtp.gmail.com, puerto 587 (requiere contraseña de aplicación)</li>
                      <li>• <strong>Outlook:</strong> smtp.office365.com, puerto 587</li>
                      <li>• <strong>SendGrid:</strong> smtp.sendgrid.net, puerto 587</li>
                      <li>• <strong>Mailgun:</strong> smtp.mailgun.org, puerto 587</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!smtpConfig.enabled && (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('emailsFromWhahook')}</p>
            </div>
          )}
        </div>

        </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900 mb-1">{t('aboutBranding')}</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• {t('brandingAppliesAll')}</li>
              <li>• {t('brandingCustomizeEach')}</li>
              <li>• {t('brandingFallback')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

