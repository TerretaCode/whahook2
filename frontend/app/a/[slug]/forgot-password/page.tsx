"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import { toast } from "@/lib/toast"
import { ApiClient } from "@/lib/api-client"

export default function AgencyForgotPasswordPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")

  const validateEmail = (email: string) => {
    if (!email) {
      return "El email es obligatorio"
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Introduce un email válido"
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await ApiClient.post('/api/auth/forgot-password', { email })

      if (!response.success) {
        toast.error("Error", response.error || "No se pudo enviar el email")
        setError(response.error || "No se pudo enviar el email")
        return
      }

      setEmailSent(true)
      toast.success("Email enviado", "Revisa tu bandeja de entrada")

    } catch {
      toast.error("Error", "Algo salió mal. Inténtalo de nuevo.")
      setError("Algo salió mal. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) {
      setError("")
    }
  }

  // Success state
  if (emailSent) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Revisa tu email</h1>
              <p className="text-gray-600 mt-2">Te hemos enviado instrucciones</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Hemos enviado un enlace de recuperación a:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
                <p className="text-sm text-gray-600">
                  Haz clic en el enlace del email para restablecer tu contraseña. El enlace expira en 1 hora.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  ¿No has recibido el email?
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false)
                    setEmail("")
                  }}
                  className="w-full"
                >
                  Intentar de nuevo
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href={`/a/${slug}/login`}
                  className="inline-flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--brand-primary, #22c55e)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Form state
  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">¿Olvidaste tu contraseña?</h1>
            <p className="text-gray-600 mt-2">Introduce tu email y te enviaremos instrucciones</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={`pl-10 ${error ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Si existe una cuenta con este email, recibirás instrucciones para restablecer tu contraseña.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              style={{ 
                backgroundColor: 'var(--brand-primary, #22c55e)',
                color: 'var(--brand-text, #ffffff)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar enlace"
              )}
            </Button>

            <div className="text-center">
              <Link
                href={`/a/${slug}/login`}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
