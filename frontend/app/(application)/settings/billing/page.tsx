"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { 
  CreditCard, 
  Check, 
  Loader2,
  Sparkles,
  Zap,
  Building2,
  ExternalLink,
  Calendar,
  AlertCircle,
  Crown
} from "lucide-react"

interface Plan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  price_id_monthly?: string
  price_id_yearly?: string
  features: {
    name: string
    whatsapp_sessions: number
    web_widgets: number
    workspaces: number
    users_per_workspace: number
    messages_ai_month: number
    crm: string
    campaigns: boolean
    client_access_links: boolean
    white_label: boolean
    support: string
    history_days: number
    api_access?: boolean
  }
  highlighted: boolean
}

interface Subscription {
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  features: Plan['features']
}

// Component that uses searchParams
function BillingPageContent() {
  const { refreshUser } = useAuth()
  const searchParams = useSearchParams()
  
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)

  useEffect(() => {
    fetchData()
    
    // Check for success/cancel from Stripe
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    
    if (success === 'true') {
      toast.success('¡Suscripción activada correctamente!')
      refreshUser()
    } else if (canceled === 'true') {
      toast.error('Suscripción cancelada')
    }
  }, [searchParams, refreshUser])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      const [plansRes, subRes] = await Promise.all([
        ApiClient.request<{ plans: Plan[] }>('/api/billing/plans'),
        ApiClient.request<{ subscription: Subscription }>('/api/billing/subscription')
      ])
      
      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data.plans)
      }
      
      if (subRes.success && subRes.data) {
        setSubscription(subRes.data.subscription)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async (plan: Plan) => {
    try {
      setProcessingPlan(plan.id)
      
      const priceId = billingPeriod === 'monthly' 
        ? plan.price_id_monthly 
        : plan.price_id_yearly
      
      if (!priceId) {
        toast.error('Plan no disponible en este momento')
        return
      }
      
      const response = await ApiClient.request<{ url: string }>('/api/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ price_id: priceId })
      })
      
      if (response.success && response.data?.url) {
        window.location.href = response.data.url
      } else {
        throw new Error(response.error || 'Error al crear sesión de pago')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago')
    } finally {
      setProcessingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setIsManaging(true)
      
      const response = await ApiClient.request<{ url: string }>('/api/billing/create-portal-session', {
        method: 'POST',
        body: JSON.stringify({})
      })
      
      if (response.success && response.data?.url) {
        window.location.href = response.data.url
      } else {
        throw new Error(response.error || 'Error al abrir portal de facturación')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al gestionar suscripción')
    } finally {
      setIsManaging(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return <Sparkles className="w-5 h-5" />
      case 'professional': return <Zap className="w-5 h-5" />
      case 'enterprise': return <Building2 className="w-5 h-5" />
      default: return <Sparkles className="w-5 h-5" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona tu plan y método de pago</p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Tu Suscripción Actual
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                    subscription.plan === 'enterprise' 
                      ? 'bg-purple-100 text-purple-700'
                      : subscription.plan === 'professional'
                      ? 'bg-green-100 text-green-700'
                      : subscription.plan === 'starter'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {getPlanIcon(subscription.plan)}
                    {subscription.plan === 'trial' ? 'Trial (7 días)' : 
                     subscription.plan === 'starter' ? 'Starter' : 
                     subscription.plan === 'professional' ? 'Professional' : 
                     subscription.plan === 'enterprise' ? 'Enterprise' :
                     subscription.plan}
                  </span>
                  {subscription.status === 'active' && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Activo
                    </span>
                  )}
                </div>
                
                {subscription.current_period_end && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {subscription.cancel_at_period_end 
                      ? `Se cancela el ${formatDate(subscription.current_period_end)}`
                      : `Próxima renovación: ${formatDate(subscription.current_period_end)}`
                    }
                  </p>
                )}
                
                {subscription.cancel_at_period_end && (
                  <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    Tu suscripción no se renovará
                  </p>
                )}
              </div>
              
              {subscription.stripe_subscription_id && (
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  disabled={isManaging}
                >
                  {isManaging ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Gestionar suscripción
                </Button>
              )}
            </div>

            {/* Current Plan Features */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tu plan incluye:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">WhatsApp</p>
                  <p className="font-semibold text-gray-900">{subscription.features.whatsapp_sessions} conexiones</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Widgets Web</p>
                  <p className="font-semibold text-gray-900">{subscription.features.web_widgets} widgets</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">Workspaces</p>
                  <p className="font-semibold text-gray-900">{subscription.features.workspaces} empresas</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500">CRM</p>
                  <p className="font-semibold text-gray-900 capitalize">{subscription.features.crm === 'full' ? 'Completo' : 'Básico'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billingPeriod === 'monthly'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billingPeriod === 'yearly'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Anual
          <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
            -17%
          </span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan === plan.id
          const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly
          const pricePerMonth = billingPeriod === 'yearly' 
            ? Math.round(plan.price_yearly / 12) 
            : plan.price_monthly
          
          return (
            <div 
              key={plan.id}
              className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                plan.highlighted 
                  ? 'border-green-500 shadow-lg shadow-green-100' 
                  : isCurrentPlan
                  ? 'border-green-200'
                  : 'border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-green-500 text-white text-center text-sm font-medium py-1">
                  Más popular
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  {getPlanIcon(plan.id)}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {price === 0 ? 'Gratis' : `${pricePerMonth}€`}
                  </span>
                  {price > 0 && (
                    <span className="text-gray-500 text-sm">/mes</span>
                  )}
                  {billingPeriod === 'yearly' && price > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Facturado anualmente ({price}€/año)
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{plan.features.whatsapp_sessions} conexión{plan.features.whatsapp_sessions > 1 ? 'es' : ''} WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{plan.features.web_widgets} widget{plan.features.web_widgets > 1 ? 's' : ''} web</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{plan.features.workspaces} workspace{plan.features.workspaces > 1 ? 's' : ''} (empresa{plan.features.workspaces > 1 ? 's' : ''})</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>CRM {plan.features.crm === 'full' ? 'completo' : 'básico'}</span>
                  </li>
                  {plan.features.campaigns && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Campañas automáticas</span>
                    </li>
                  )}
                  {plan.features.client_access_links && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Enlaces de acceso para clientes</span>
                    </li>
                  )}
                  {plan.features.white_label && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>White-label (sin marca Whahook)</span>
                    </li>
                  )}
                  {plan.features.api_access && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Acceso API</span>
                    </li>
                  )}
                </ul>

                {/* CTA Button */}
                {isCurrentPlan ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    Plan actual
                  </Button>
                ) : (
                  <Button 
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : ''
                    }`}
                    onClick={() => handleSubscribe(plan)}
                    disabled={processingPlan !== null}
                  >
                    {processingPlan === plan.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    {subscription?.plan !== 'free' ? 'Cambiar plan' : 'Suscribirse'}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment Methods Info */}
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Pagos seguros procesados por Stripe
        </p>
        <div className="flex items-center justify-center gap-4 opacity-50">
          <span className="text-xs font-medium text-gray-400">VISA</span>
          <span className="text-xs font-medium text-gray-400">Mastercard</span>
          <span className="text-xs font-medium text-gray-400">American Express</span>
        </div>
      </div>
    </div>
  )
}

// Wrapper with Suspense for useSearchParams
export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  )
}
