"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { ApiClient } from "@/lib/api-client"
import { toast } from "@/lib/toast"
import { 
  Loader2,
  ExternalLink,
  Calendar,
  AlertCircle,
  Crown
} from "lucide-react"
import { BillingPricingCard, BillingToggle, PLANS } from "@/components/billing-pricing-section"
import { BillingSkeleton } from "@/components/skeletons/SettingsSkeletons"
import { getCached, setCache, getFromSession, persistToSession } from "@/lib/cache"

interface Subscription {
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

interface StripePriceIds {
  starter_monthly?: string
  starter_yearly?: string
  professional_monthly?: string
  professional_yearly?: string
  enterprise_monthly?: string
  enterprise_yearly?: string
}

interface BillingData {
  subscription: Subscription | null
  priceIds: StripePriceIds
}

const CACHE_KEY = 'billing-data'

// Component that uses searchParams
function BillingPageContent() {
  const { refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const initialLoadDone = useRef(false)
  
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [priceIds, setPriceIds] = useState<StripePriceIds>({})
  const [isLoading, setIsLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [isManaging, setIsManaging] = useState(false)

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      fetchData()
    }
    
    // Check for success/cancel from Stripe
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    
    if (success === 'true') {
      toast.success('Subscription activated successfully!')
      refreshUser()
    } else if (canceled === 'true') {
      toast.error('Subscription canceled')
    }
  }, [searchParams, refreshUser])

  const fetchData = async () => {
    // Try cache first
    const cached = getCached<BillingData>(CACHE_KEY) || getFromSession<BillingData>(CACHE_KEY)
    if (cached) {
      setSubscription(cached.subscription)
      setPriceIds(cached.priceIds)
      setIsLoading(false)
      // Revalidate in background
      revalidateInBackground()
      return
    }

    try {
      setIsLoading(true)
      
      const [plansRes, subRes] = await Promise.all([
        ApiClient.request<{ plans: any[], priceIds: StripePriceIds }>('/api/billing/plans'),
        ApiClient.request<{ subscription: Subscription }>('/api/billing/subscription')
      ])
      
      const data: BillingData = {
        subscription: null,
        priceIds: {}
      }
      
      if (plansRes.success && plansRes.data?.priceIds) {
        setPriceIds(plansRes.data.priceIds)
        data.priceIds = plansRes.data.priceIds
      }
      
      if (subRes.success && subRes.data) {
        setSubscription(subRes.data.subscription)
        data.subscription = subRes.data.subscription
      }

      // Cache the data
      setCache(CACHE_KEY, data)
      persistToSession(CACHE_KEY, data)
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const revalidateInBackground = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        ApiClient.request<{ plans: any[], priceIds: StripePriceIds }>('/api/billing/plans'),
        ApiClient.request<{ subscription: Subscription }>('/api/billing/subscription')
      ])
      
      const data: BillingData = {
        subscription: null,
        priceIds: {}
      }
      
      if (plansRes.success && plansRes.data?.priceIds) {
        setPriceIds(plansRes.data.priceIds)
        data.priceIds = plansRes.data.priceIds
      }
      
      if (subRes.success && subRes.data) {
        setSubscription(subRes.data.subscription)
        data.subscription = subRes.data.subscription
      }

      setCache(CACHE_KEY, data)
      persistToSession(CACHE_KEY, data)
    } catch (error) {
      console.warn('Background revalidation failed:', error)
    }
  }

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessingPlan(planId)
      
      const priceKey = `${planId}_${billingPeriod}` as keyof StripePriceIds
      const priceId = priceIds[priceKey]
      
      if (!priceId) {
        toast.error('Plan not available at this time')
        return
      }
      
      const response = await ApiClient.request<{ url: string }>('/api/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ price_id: priceId })
      })
      
      if (response.success && response.data?.url) {
        window.location.href = response.data.url
      } else {
        throw new Error(response.error || 'Error creating checkout session')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error processing payment')
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
        throw new Error(response.error || 'Error opening billing portal')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error managing subscription')
    } finally {
      setIsManaging(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return <BillingSkeleton />
  }

  const plansList = [PLANS.starter, PLANS.professional, PLANS.enterprise]

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your plan and payment method</p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Your Current Subscription
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
                    {subscription.plan === 'trial' ? 'Trial (7 days)' : 
                     subscription.plan === 'starter' ? 'Starter' : 
                     subscription.plan === 'professional' ? 'Professional' : 
                     subscription.plan === 'enterprise' ? 'Enterprise' :
                     subscription.plan}
                  </span>
                  {subscription.status === 'active' && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                
                {subscription.current_period_end && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {subscription.cancel_at_period_end 
                      ? `Cancels on ${formatDate(subscription.current_period_end)}`
                      : `Next renewal: ${formatDate(subscription.current_period_end)}`
                    }
                  </p>
                )}
                
                {subscription.cancel_at_period_end && (
                  <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    Your subscription will not renew
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
                  Manage subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing Period Toggle */}
      <BillingToggle billingPeriod={billingPeriod} onToggle={setBillingPeriod} />

      {/* Plans Grid - Same style as home/pricing pages */}
      <div className="grid md:grid-cols-3 gap-8">
        {plansList.map((plan) => (
          <BillingPricingCard
            key={plan.id}
            plan={plan}
            billingPeriod={billingPeriod}
            isCurrentPlan={subscription?.plan === plan.id}
            onSubscribe={() => handleSubscribe(plan.id)}
            isProcessing={processingPlan === plan.id}
            currentPlanId={subscription?.plan}
          />
        ))}
      </div>

      {/* Payment Methods Info */}
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Secure payments processed by Stripe
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
    <Suspense fallback={<BillingSkeleton />}>
      <BillingPageContent />
    </Suspense>
  )
}
