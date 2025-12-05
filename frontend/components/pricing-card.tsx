"use client"

import Link from "next/link"
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

export const PLANS: Record<string, PlanData> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 12,
    yearlyPrice: 120,
    description: "Perfect for small businesses",
    features: [
      "1 WhatsApp connection",
      "1 Web widget",
      "1 Workspace",
      "1 User",
      "Unlimited AI (your own API key)",
      "Basic CRM (contacts & tags)",
      "Conversation history",
      "CSV export",
      "30-day message history",
      "Email support"
    ],
    cta: "Start Free Trial",
    ctaLink: "/register",
  },
  professional: {
    id: "professional",
    name: "Professional",
    monthlyPrice: 28,
    yearlyPrice: 280,
    description: "For growing businesses & small agencies",
    features: [
      "3 WhatsApp connections",
      "3 Web widgets",
      "3 Workspaces",
      "3 Users per workspace",
      "Unlimited AI (API key per workspace)",
      "Full CRM (tags, notes, custom fields)",
      "WhatsApp campaigns (scheduled bulk)",
      "Email campaigns",
      "Advanced segmentation",
      "Advanced analytics",
      "Client access links",
      "Remote QR connection",
      "API Key per workspace",
      "CSV export",
      "90-day message history",
      "Email support"
    ],
    cta: "Get Started",
    ctaLink: "/register",
    highlighted: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 89,
    yearlyPrice: 890,
    description: "For agencies & multi-brand businesses",
    features: [
      "10 WhatsApp connections",
      "10 Web widgets",
      "10 Workspaces",
      "10 Users per workspace",
      "Unlimited AI (API key per workspace)",
      "Full CRM (tags, notes, custom fields)",
      "WhatsApp campaigns (scheduled bulk)",
      "Email campaigns",
      "Advanced segmentation",
      "Advanced analytics",
      "Client access links",
      "Remote QR connection",
      "API Key per workspace",
      "White-label (hide Whahook brand)",
      "Custom domain support",
      "CSV export",
      "90-day message history",
      "Email support"
    ],
    cta: "Get Started",
    ctaLink: "/register",
  },
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
  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)
  const yearlyTotal = billingPeriod === 'yearly' ? plan.yearlyPrice : undefined

  return (
    <div className={`rounded-2xl p-8 ${
      plan.highlighted 
        ? 'bg-green-600 text-white ring-4 ring-green-600 ring-offset-4' 
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
      ) : showAsLink ? (
        <Link href={plan.ctaLink} className="block">
          <Button className={`w-full py-6 text-lg ${
            plan.highlighted 
              ? 'bg-white text-green-600 hover:bg-gray-100' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}>
            {plan.cta}
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
          {isProcessing ? 'Processing...' : plan.cta}
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
        Monthly
      </button>
      <button
        onClick={() => onToggle('yearly')}
        className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
          billingPeriod === 'yearly'
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Yearly
        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
          Save 17%
        </span>
      </button>
    </div>
  )
}

