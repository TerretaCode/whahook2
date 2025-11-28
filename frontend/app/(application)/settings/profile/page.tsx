"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
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

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, refreshUser } = useAuth()
  
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

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      const response = await ApiClient.request('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name: fullName, company_name: companyName, phone })
      })
      
      if (response.success) {
        toast.success('Perfil actualizado correctamente')
        await refreshUser()
      } else {
        throw new Error(response.error || 'Error al actualizar')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      setIsChangingPassword(true)
      const response = await ApiClient.request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword })
      })
      
      if (response.success) {
        toast.success('Contraseña cambiada correctamente')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordForm(false)
      } else {
        throw new Error(response.error || 'Error al cambiar contraseña')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar la contraseña')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const getPlanName = () => {
    switch (user?.profile?.subscription_tier) {
      case 'trial': return 'Trial Gratuito'
      case 'starter': return 'Plan Starter'
      case 'professional': return 'Plan Professional'
      case 'enterprise': return 'Plan Enterprise'
      default: return 'Trial'
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
        <p className="text-sm text-gray-500">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            Información Personal
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
            <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
          </div>

          {/* Full Name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              Nombre completo
            </Label>
            <Input 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          {/* Company Name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              Empresa (opcional)
            </Label>
            <Input 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nombre de tu empresa"
            />
          </div>

          {/* Phone */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-gray-400" />
              Teléfono (opcional)
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
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Plan Card */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Tu Plan</h2>
            </div>
            <p className="text-2xl font-bold">{getPlanName()}</p>
            <p className="text-green-100 text-sm mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Miembro desde {formatDate(user.profile?.created_at)}
            </p>
          </div>
          <Button 
            variant="secondary" 
            className="bg-white text-green-600 hover:bg-gray-100"
            onClick={() => router.push('/pricing')}
          >
            Ver planes
          </Button>
        </div>
      </div>

      {/* Security Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-green-600" />
            Seguridad
          </h2>
        </div>
        <div className="p-6">
          {!showPasswordForm ? (
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordForm(true)}
            >
              <Key className="w-4 h-4 mr-2" />
              Cambiar contraseña
            </Button>
          ) : (
            <div className="space-y-4 max-w-md">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nueva contraseña
                </Label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Confirmar contraseña
                </Label>
                <Input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Guardar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                >
                  Cancelar
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
              <h2 className="text-lg font-semibold text-gray-900">Cerrar sesión</h2>
              <p className="text-sm text-gray-500 mt-1">
                Cierra tu sesión en este dispositivo
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
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
