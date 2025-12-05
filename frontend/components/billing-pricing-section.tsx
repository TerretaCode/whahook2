"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import { PLANS, BillingToggle, type PlanData } from "@/components/pricing-card"

interface BillingPricingCardProps {
  plan: PlanData
  billingPeriod: 'monthly' | 'yearly'
  isCurrentPlan: boolean
  onSubscribe: () => void
  isProcessing: boolean
  currentPlanId?: string
}

export function BillingPricingCard({ 
  plan,
  billingPeriod,
  isCurrentPlan,
  onSubscribe,
  isProcessing,
  currentPlanId,
}: BillingPricingCardProps) {
  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)
  const yearlyTotal = billingPeriod === 'yearly' ? plan.yearlyPrice : undefined

  return (
    <div className={`rounded-2xl p-8 ${
      plan.highlighted 
        ? 'bg-green-600 text-white ring-4 ring-green-600 ring-offset-4' 
        : isCurrentPlan
        ? 'bg-white border-2 border-green-300 ring-2 ring-green-100'
        : 'bg-white border-2 border-gray-200'
    }`}>
      <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
        {plan.name}
      </h3>
      <p className={`mb-6 ${plan.highlighted ? 'text-green-100' : 'text-gray-600'}`}>
        {plan.description}
      </p>
      <div className="mb-6">
        <span className="text-5xl font-bold">€{price}</span>
        <span className={`text-xl ${plan.highlighted ? 'text-green-100' : 'text-gray-600'}`}>/month</span>
        {yearlyTotal && (
          <p className={`text-sm mt-1 ${plan.highlighted ? 'text-green-200' : 'text-gray-500'}`}>
            Billed annually (€{yearlyTotal}/year)
          </p>
        )}
      </div>
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-green-200' : 'text-green-600'}`} />
            <span className={plan.highlighted ? 'text-green-50' : 'text-gray-700'}>{feature}</span>
          </li>
        ))}
      </ul>
      
      {isCurrentPlan ? (
        <Button 
          className={`w-full py-6 text-lg ${plan.highlighted ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-100 text-gray-500'}`}
          disabled
        >
          Current Plan
        </Button>
      ) : (
        <Button 
          className={`w-full py-6 text-lg ${
            plan.highlighted 
              ? 'bg-white text-green-600 hover:bg-gray-100' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          onClick={onSubscribe}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            currentPlanId && currentPlanId !== 'trial' ? 'Change Plan' : 'Subscribe'
          )}
        </Button>
      )}
    </div>
  )
}

export { PLANS, BillingToggle }

