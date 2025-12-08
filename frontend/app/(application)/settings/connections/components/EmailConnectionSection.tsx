"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ApiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Settings
} from "lucide-react"

interface EmailConnection {
  id: string
  provider: 'gmail' | 'outlook' | 'smtp'
  email_address: string
  display_name?: string
  is_active: boolean
  is_verified: boolean
  last_used_at?: string
  created_at: string
}

interface EmailConnectionSectionProps {
  workspaceId: string
}

export function EmailConnectionSection({ workspaceId }: EmailConnectionSectionProps) {
  const t = useTranslations('settings.connections.email')
  const [connections, setConnections] = useState<EmailConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showSmtpDialog, setShowSmtpDialog] = useState(false)
  const [smtpForm, setSmtpForm] = useState({
    email_address: '',
    display_name: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    smtp_secure: true
  })

  useEffect(() => {
    if (workspaceId) {
      loadConnections()
    }
  }, [workspaceId])

  const loadConnections = async () => {
    try {
      setIsLoading(true)
      const response = await ApiClient.request<{ data: EmailConnection[] }>(
        `/api/email/connections?workspace_id=${workspaceId}`
      )
      setConnections(response.data?.data || [])
    } catch (error) {
      console.error('Error loading email connections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connectOAuth = async (provider: 'gmail' | 'outlook') => {
    try {
      setIsConnecting(true)
      const response = await ApiClient.request<{ data: { url: string } }>(
        `/api/email/oauth/${provider}/url?workspace_id=${workspaceId}`
      )
      if (response.data?.data?.url) {
        window.location.href = response.data.data.url
      }
    } catch (error) {
      console.error('Error getting OAuth URL:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const connectSmtp = async () => {
    try {
      setIsConnecting(true)
      await ApiClient.request('/api/email/connections/smtp', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: workspaceId,
          ...smtpForm,
          smtp_port: parseInt(smtpForm.smtp_port)
        })
      })
      setShowSmtpDialog(false)
      setSmtpForm({
        email_address: '',
        display_name: '',
        smtp_host: '',
        smtp_port: '587',
        smtp_username: '',
        smtp_password: '',
        smtp_secure: true
      })
      loadConnections()
    } catch (error) {
      console.error('Error creating SMTP connection:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const testConnection = async (id: string) => {
    try {
      await ApiClient.request(`/api/email/connections/${id}/test`, {
        method: 'POST'
      })
      loadConnections()
    } catch (error) {
      console.error('Error testing connection:', error)
      loadConnections() // Reload to show error state
    }
  }

  const deleteConnection = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return
    }
    try {
      await ApiClient.request(`/api/email/connections/${id}`, {
        method: 'DELETE'
      })
      loadConnections()
    } catch (error) {
      console.error('Error deleting connection:', error)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return '📧'
      case 'outlook':
        return '📨'
      case 'smtp':
        return '⚙️'
      default:
        return '✉️'
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return 'Gmail'
      case 'outlook':
        return 'Outlook'
      case 'smtp':
        return 'SMTP'
      default:
        return provider
    }
  }

  const activeConnection = connections.find(c => c.is_active)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('title')}</CardTitle>
              <CardDescription>
                {t('subtitle')}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : activeConnection ? (
          // Show active connection
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getProviderIcon(activeConnection.provider)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{activeConnection.email_address}</span>
                    <Badge variant="outline" className="text-xs">
                      {getProviderName(activeConnection.provider)}
                    </Badge>
                    {activeConnection.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t('verified')}
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('notVerified')}
                      </Badge>
                    )}
                  </div>
                  {activeConnection.display_name && (
                    <p className="text-sm text-gray-500">
                      Nombre: {activeConnection.display_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!activeConnection.is_verified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testConnection(activeConnection.id)}
                  >
                    {t('verify')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => deleteConnection(activeConnection.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Show connection options
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('chooseMethod')}
            </p>
            
            {/* OAuth Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50"
                onClick={() => connectOAuth('gmail')}
                disabled={isConnecting}
              >
                <span className="text-2xl">📧</span>
                <span className="font-medium">{t('gmail')}</span>
                <span className="text-xs text-gray-500">{t('gmailDesc')}</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50"
                onClick={() => connectOAuth('outlook')}
                disabled={isConnecting}
              >
                <span className="text-2xl">📨</span>
                <span className="font-medium">{t('outlook')}</span>
                <span className="text-xs text-gray-500">{t('outlookDesc')}</span>
              </Button>
            </div>

            {/* SMTP Option */}
            <div className="border-t pt-4">
              <Dialog open={showSmtpDialog} onOpenChange={setShowSmtpDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-gray-600">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('smtpManual')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('smtpTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('smtpDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t('senderEmail')}</Label>
                      <Input
                        type="email"
                        placeholder="tu@empresa.com"
                        value={smtpForm.email_address}
                        onChange={(e) => setSmtpForm({ ...smtpForm, email_address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('displayName')}</Label>
                      <Input
                        placeholder="Mi Empresa"
                        value={smtpForm.display_name}
                        onChange={(e) => setSmtpForm({ ...smtpForm, display_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>{t('smtpServer')}</Label>
                        <Input
                          placeholder="smtp.gmail.com"
                          value={smtpForm.smtp_host}
                          onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('port')}</Label>
                        <Input
                          type="number"
                          placeholder="587"
                          value={smtpForm.smtp_port}
                          onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('smtpUsername')}</Label>
                      <Input
                        placeholder="tu@empresa.com"
                        value={smtpForm.smtp_username}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('smtpPassword')}</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={smtpForm.smtp_password}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={connectSmtp}
                      disabled={isConnecting || !smtpForm.email_address || !smtpForm.smtp_host || !smtpForm.smtp_password}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('connecting')}
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          {t('saveConnection')}
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
