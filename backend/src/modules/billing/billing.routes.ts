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
  trial: {
    name: 'Trial',
    whatsapp_sessions: 1,
    web_widgets: 1,
    workspaces: 1,
    users_per_workspace: 1,
    messages_ai_month: 500,
    crm: 'basic',
    campaigns: false,
    client_access_links: false,
    white_label: false,
    support: 'email',
    history_days: 30,
  },
  starter: {
    name: 'Starter',
    whatsapp_sessions: 1,
    web_widgets: 1,
    workspaces: 1,
    users_per_workspace: 1,
    messages_ai_month: 500,
    crm: 'basic',
    campaigns: false,
    client_access_links: false,
    white_label: false,
    support: 'email',
    history_days: 30,
  },
  professional: {
    name: 'Professional',
    whatsapp_sessions: 3,
    web_widgets: 3,
    workspaces: 3,
    users_per_workspace: 3,
    messages_ai_month: 5000,
    crm: 'full',
    campaigns: true,
    client_access_links: false,
    white_label: false,
    support: 'priority',
    history_days: 365,
  },
  enterprise: {
    name: 'Enterprise',
    whatsapp_sessions: 10,
    web_widgets: 10,
    workspaces: 10,
    users_per_workspace: -1, // unlimited
    messages_ai_month: -1, // unlimited
    crm: 'full',
    campaigns: true,
    client_access_links: true,
    white_label: true,
    api_access: true,
    support: 'dedicated',
    history_days: -1, // unlimited
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

// Helper to get user profile from profiles table
async function getUserProfile(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return profile
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
        price_monthly: 12,
        price_yearly: 120,
        price_id_monthly: PRICE_IDS.starter_monthly,
        price_id_yearly: PRICE_IDS.starter_yearly,
        features: PLAN_FEATURES.starter,
        highlighted: false,
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Para negocios en crecimiento y pequeñas agencias',
        price_monthly: 28,
        price_yearly: 280,
        price_id_monthly: PRICE_IDS.professional_monthly,
        price_id_yearly: PRICE_IDS.professional_yearly,
        features: PLAN_FEATURES.professional,
        highlighted: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Para agencias y empresas con múltiples marcas',
        price_monthly: 89,
        price_yearly: 890,
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
    const profile = await getUserProfile(user.id)
    
    const subscription = {
      plan: profile?.subscription_tier || 'trial',
      status: profile?.subscription_status || 'active',
      trial_ends_at: profile?.trial_ends_at || null,
      stripe_customer_id: profile?.stripe_customer_id || null,
      stripe_subscription_id: profile?.stripe_subscription_id || null,
      features: PLAN_FEATURES[profile?.subscription_tier as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.trial,
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
    const profile = await getUserProfile(user.id)
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profiles table
      await supabaseAdmin
        .from('profiles')
        .update({ 
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
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
    const profile = await getUserProfile(user.id)
    const customerId = profile?.stripe_customer_id

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
  let plan = 'trial'

  if (priceId === PRICE_IDS.starter_monthly || priceId === PRICE_IDS.starter_yearly) {
    plan = 'starter'
  } else if (priceId === PRICE_IDS.professional_monthly || priceId === PRICE_IDS.professional_yearly) {
    plan = 'professional'
  } else if (priceId === PRICE_IDS.enterprise_monthly || priceId === PRICE_IDS.enterprise_yearly) {
    plan = 'enterprise'
  }

  // Update profile in profiles table
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: plan,
      subscription_status: subscription.status,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user subscription:', error)
  } else {
    console.log(`✅ User ${userId} subscription updated to ${plan}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) return

  // Downgrade to trial plan
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: 'trial',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error downgrading user subscription:', error)
  } else {
    console.log(`⚠️ User ${userId} subscription canceled, downgraded to trial`)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  console.error(`❌ Payment failed for customer: ${customerId}`)
  
  // You could send an email notification here
  // or update the user's subscription status
}

export default router
