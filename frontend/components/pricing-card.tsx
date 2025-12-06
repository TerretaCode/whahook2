"use client"

import Link from "next/link"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export interface PlanData {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  features: string[]
  cta: string
  ctaLink: string
  highlighted?: boolean
}

// Plan data with translation keys for name, description, features, and cta
export const PLANS: Record<string, PlanData> = {
  starter: {
    id: "starter",
    name: "plans.starter.name",
    monthlyPrice: 12,
    yearlyPrice: 120,
    description: "plans.starter.description",
    features: [
      "features.whatsappConnections",
      "features.webWidgets",
      "features.workspaces",
      "features.users",
      "features.unlimitedAI",
      "features.basicCRM",
      "features.conversationHistory",
      "features.csvExport",
      "features.messageHistory30",
      "features.emailSupport"
    ],
    cta: "plans.starter.cta",
    ctaLink: "/register",
  },
  professional: {
    id: "professional",
    name: "plans.professional.name",
    monthlyPrice: 28,
    yearlyPrice: 280,
    description: "plans.professional.description",
    features: [
      "features.whatsappConnections",
      "features.webWidgets",
      "features.workspaces",
      "features.usersPerWorkspace",
      "features.unlimitedAIPerWorkspace",
      "features.fullCRM",
      "features.whatsappCampaigns",
      "features.emailCampaigns",
      "features.advancedSegmentation",
      "features.advancedAnalytics",
      "features.clientAccessLinks",
      "features.remoteQR",
      "features.apiKeyPerWorkspace",
      "features.csvExport",
      "features.messageHistory90",
      "features.emailSupport"
    ],
    cta: "plans.professional.cta",
    ctaLink: "/register",
    highlighted: true,
  },
  enterprise: {
    id: "enterprise",
    name: "plans.enterprise.name",
    monthlyPrice: 89,
    yearlyPrice: 890,
    description: "plans.enterprise.description",
    features: [
      "features.whatsappConnections",
      "features.webWidgets",
      "features.workspaces",
      "features.usersPerWorkspace",
      "features.unlimitedAIPerWorkspace",
      "features.fullCRM",
      "features.whatsappCampaigns",
      "features.emailCampaigns",
      "features.advancedSegmentation",
      "features.advancedAnalytics",
      "features.clientAccessLinks",
      "features.remoteQR",
      "features.apiKeyPerWorkspace",
      "features.whiteLabel",
      "features.customDomain",
      "features.csvExport",
      "features.messageHistory90",
      "features.emailSupport"
    ],
    cta: "plans.enterprise.cta",
    ctaLink: "/register",
  },
}

// Feature counts for interpolation
const FEATURE_COUNTS: Record<string, Record<string, number>> = {
  starter: { whatsapp: 1, widgets: 1, workspaces: 1, users: 1 },
  professional: { whatsapp: 3, widgets: 3, workspaces: 3, users: 3 },
  enterprise: { whatsapp: 10, widgets: 10, workspaces: 10, users: 10 },
}

interface PricingCardProps {
  plan: PlanData
  billingPeriod: 'monthly' | 'yearly'
  isCurrentPlan?: boolean
  onSubscribe?: () => void
  isProcessing?: boolean
  showAsLink?: boolean
}

export function PricingCard({ 
  plan,
  billingPeriod,
  isCurrentPlan = false,
  onSubscribe,
  isProcessing = false,
  showAsLink = true,
}: PricingCardProps) {
  const t = useTranslations('pricing')
  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)
  const yearlyTotal = billingPeriod === 'yearly' ? plan.yearlyPrice : undefined

  return (
    <div className={`rounded-2xl p-8 ${
      plan.highlighted 
        ? 'bg-green-600 text-white ring-4 ring-green-600 ring-offset-4' 
        : 'bg-white border-2 border-gray-200'
    }`}>
      <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
        {t(plan.name)}
      </h3>
      <p className={`mb-6 ${plan.highlighted ? 'text-green-100' : 'text-gray-600'}`}>
        {t(plan.description)}
      </p>
      <div className="mb-6">
        <span className="text-5xl font-bold">€{price}</span>
        <span className={`text-xl ${plan.highlighted ? 'text-green-100' : 'text-gray-600'}`}>/{t('month')}</span>
        {yearlyTotal && (
          <p className={`text-sm mt-1 ${plan.highlighted ? 'text-green-200' : 'text-gray-500'}`}>
            {t('billedAnnually', { total: yearlyTotal })}
          </p>
        )}
      </div>
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => {
          const counts = FEATURE_COUNTS[plan.id]
          return (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-green-200' : 'text-green-600'}`} />
              <span className={plan.highlighted ? 'text-green-50' : 'text-gray-700'}>
                {t(feature, { count: feature.includes('whatsapp') ? counts.whatsapp : feature.includes('widget') ? counts.widgets : feature.includes('workspace') ? counts.workspaces : counts.users })}
              </span>
            </li>
          )
        })}
      </ul>
      
      {isCurrentPlan ? (
        <Button 
          className={`w-full py-6 text-lg ${plan.highlighted ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-100 text-gray-500'}`}
          disabled
        >
          {t('currentPlan')}
        </Button>
      ) : showAsLink ? (
        <Link href={plan.ctaLink} className="block">
          <Button className={`w-full py-6 text-lg ${
            plan.highlighted 
              ? 'bg-white text-green-600 hover:bg-gray-100' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}>
            {t(plan.cta)}
          </Button>
        </Link>
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
          {isProcessing ? t('processing') : t(plan.cta)}
        </Button>
      )}
    </div>
  )
}

interface BillingToggleProps {
  billingPeriod: 'monthly' | 'yearly'
  onToggle: (period: 'monthly' | 'yearly') => void
}

export function BillingToggle({ billingPeriod, onToggle }: BillingToggleProps) {
  const t = useTranslations('pricing')
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <button
        onClick={() => onToggle('monthly')}
        className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
          billingPeriod === 'monthly'
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {t('monthly')}
      </button>
      <button
        onClick={() => onToggle('yearly')}
        className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
          billingPeriod === 'yearly'
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {t('yearly')}
        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
          {t('save17')}
        </span>
      </button>
    </div>
  )
}

