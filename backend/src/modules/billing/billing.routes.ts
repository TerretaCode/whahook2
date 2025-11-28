import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { supabase, supabaseAdmin } from '../../config'

const router = Router()

// Initialize Stripe (will be null if not configured)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// Price IDs from environment
const PRICE_IDS = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
  professional_yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
}

// Plan features configuration
const PLAN_FEATURES = {
  free: {
    name: 'Trial Gratuito',
    whatsapp_sessions: 1,
    web_widgets: 1,
    messages_per_month: 100,
    ai_responses: true,
    support: 'community',
  },
  starter: {
    name: 'Starter',
    whatsapp_sessions: 1,
    web_widgets: 1,
    messages_per_month: 100,
    ai_responses: true,
    support: 'email',
  },
  professional: {
    name: 'Professional',
    whatsapp_sessions: 3,
    web_widgets: 3,
    messages_per_month: -1, // unlimited
    ai_responses: true,
    support: 'priority',
    priority_support: true,
    api_access: true,
  },
  enterprise: {
    name: 'Enterprise',
    whatsapp_sessions: 10,
    web_widgets: -1, // unlimited
    messages_per_month: -1, // unlimited
    ai_responses: true,
    support: 'dedicated',
    priority_support: true,
    custom_integrations: true,
    custom_workflows: true,
  },
}

// Helper to get user from token
async function getUserFromToken(req: Request) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) throw new Error('No token provided')
  
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error('Invalid token')
  
  return data.user
}

/**
 * GET /api/billing/plans
 * Get available plans and pricing
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfecto para pequeños negocios',
        price_monthly: 49,
        price_yearly: 490,
        price_id_monthly: PRICE_IDS.starter_monthly,
        price_id_yearly: PRICE_IDS.starter_yearly,
        features: PLAN_FEATURES.starter,
        highlighted: false,
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Para negocios en crecimiento',
        price_monthly: 99,
        price_yearly: 990,
        price_id_monthly: PRICE_IDS.professional_monthly,
        price_id_yearly: PRICE_IDS.professional_yearly,
        features: PLAN_FEATURES.professional,
        highlighted: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Para grandes organizaciones',
        price_monthly: 149,
        price_yearly: 1490,
        price_id_monthly: PRICE_IDS.enterprise_monthly,
        price_id_yearly: PRICE_IDS.enterprise_yearly,
        features: PLAN_FEATURES.enterprise,
        highlighted: false,
      },
    ]

    res.json({ success: true, data: { plans } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/billing/subscription
 * Get current user's subscription status
 */
router.get('/subscription', async (req: Request, res: Response) => {
  try {
    const user = await getUserFromToken(req)
    
    const subscription = {
      plan: user.user_metadata?.subscription_tier || 'free',
      status: user.user_metadata?.subscription_status || 'active',
      current_period_end: user.user_metadata?.subscription_period_end || null,
      cancel_at_period_end: user.user_metadata?.cancel_at_period_end || false,
      stripe_customer_id: user.user_metadata?.stripe_customer_id || null,
      stripe_subscription_id: user.user_metadata?.stripe_subscription_id || null,
      features: PLAN_FEATURES[user.user_metadata?.subscription_tier as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free,
    }

    res.json({ success: true, data: { subscription } })
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/billing/create-checkout-session
 * Create Stripe Checkout session for subscription
 */
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        success: false, 
        error: 'Stripe not configured. Please add STRIPE_SECRET_KEY to environment.' 
      })
    }

    const user = await getUserFromToken(req)
    const { price_id, success_url, cancel_url } = req.body

    if (!price_id) {
      return res.status(400).json({ success: false, error: 'price_id is required' })
    }

    // Get or create Stripe customer
    let customerId = user.user_metadata?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to user metadata
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          stripe_customer_id: customerId,
        },
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${process.env.FRONTEND_URL}/settings/billing?success=true`,
      cancel_url: cancel_url || `${process.env.FRONTEND_URL}/settings/billing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      allow_promotion_codes: true,
    })

    res.json({ success: true, data: { url: session.url, session_id: session.id } })
  } catch (error: any) {
    console.error('Checkout session error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/billing/create-portal-session
 * Create Stripe Customer Portal session for managing subscription
 */
router.post('/create-portal-session', async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ 
        success: false, 
        error: 'Stripe not configured' 
      })
    }

    const user = await getUserFromToken(req)
    const customerId = user.user_metadata?.stripe_customer_id

    if (!customerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'No subscription found. Please subscribe first.' 
      })
    }

    const { return_url } = req.body

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || `${process.env.FRONTEND_URL}/settings/billing`,
    })

    res.json({ success: true, data: { url: session.url } })
  } catch (error: any) {
    console.error('Portal session error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/billing/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(503).json({ success: false, error: 'Stripe not configured' })
    }

    const sig = req.headers['stripe-signature'] as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return res.status(500).json({ success: false, error: 'Webhook secret not configured' })
    }

    let event: Stripe.Event

    try {
      // Note: req.body should be raw buffer for webhook verification
      // Make sure to configure express.raw() for this route
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).json({ success: false, error: `Webhook Error: ${err.message}` })
    }

    console.log('📦 Stripe webhook received:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('💰 Payment succeeded for invoice:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Webhook handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  console.log('✅ Checkout completed for user:', userId)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) {
    console.error('No user_id in subscription metadata')
    return
  }

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id
  let plan = 'free'

  if (priceId === PRICE_IDS.starter_monthly || priceId === PRICE_IDS.starter_yearly) {
    plan = 'starter'
  } else if (priceId === PRICE_IDS.professional_monthly || priceId === PRICE_IDS.professional_yearly) {
    plan = 'professional'
  } else if (priceId === PRICE_IDS.enterprise_monthly || priceId === PRICE_IDS.enterprise_yearly) {
    plan = 'enterprise'
  }

  // Update user metadata
  const periodEnd = (subscription as any).current_period_end
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      subscription_tier: plan,
      subscription_status: subscription.status,
      subscription_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_subscription_id: subscription.id,
    },
  })

  if (error) {
    console.error('Error updating user subscription:', error)
  } else {
    console.log(`✅ User ${userId} subscription updated to ${plan}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) return

  // Downgrade to free plan
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_period_end: null,
      cancel_at_period_end: false,
      stripe_subscription_id: null,
    },
  })

  console.log(`⚠️ User ${userId} subscription canceled, downgraded to free`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  console.error(`❌ Payment failed for customer: ${customerId}`)
  
  // You could send an email notification here
  // or update the user's subscription status
}

export default router
