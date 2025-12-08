import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { env } from './config/environment'
import { authRoutes } from './modules/auth'
import { setupWhatsAppSocket, whatsappService, whatsappRoutes } from './modules/whatsapp'
import { chatWidgetRoutes, chatWidgetPublicRoutes } from './modules/chatWidget'
import { ecommerceRoutes } from './modules/ecommerce'
import { webhookRoutes } from './modules/webhooks'
import { chatbotRoutes } from './modules/chatbot'
import { clientsRoutes } from './modules/clients'
import { aiRoutes } from './modules/ai'
import dashboardRoutes from './modules/dashboard/dashboard.routes'
import billingRoutes from './modules/billing/billing.routes'
import workspacesRoutes from './modules/workspaces/workspaces.routes'
import invitationsRoutes from './modules/workspaces/invitations.routes'
import brandingRoutes from './modules/branding/branding.routes'
import domainsRoutes from './modules/domains/domains.routes'
import campaignsRoutes from './modules/campaigns/campaigns.routes'
import emailRoutes from './modules/email/email.routes'
import { keepaliveMessagesService, sessionMonitoringService, backupService, cacheCleanupService } from './services'
import { healthRoutes } from './routes'

const app = express()
const httpServer = createServer(app)

// Trust proxy para Railway (necesario para rate limiting y headers)
app.set('trust proxy', 1)

// Static allowed origins
const staticAllowedOrigins = [
  env.frontendUrl,
  'http://localhost:3000',
  'https://localhost:3000',
].filter(Boolean) as string[]

// Dynamic CORS - allows custom domains from database
const dynamicCorsOrigin = async (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) {
    return callback(null, true)
  }
  
  // Allow static origins
  if (staticAllowedOrigins.includes(origin)) {
    return callback(null, true)
  }
  
  // Check if it's a custom domain from our database
  try {
    const { supabaseAdmin } = await import('./config/supabase')
    const hostname = new URL(origin).hostname
    
    // Check profiles custom domain
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('custom_domain', hostname)
      .eq('custom_domain_verified', true)
      .single()
    
    if (profileData) {
      return callback(null, true)
    }
    
    // Check workspace branding custom domain
    const { data: brandingData } = await supabaseAdmin
      .from('workspace_branding')
      .select('id')
      .eq('custom_domain', hostname)
      .eq('custom_domain_verified', true)
      .single()
    
    if (brandingData) {
      return callback(null, true)
    }
  } catch (e) {
    // Domain not found or error - continue to deny
  }
  
  // Log denied origin for debugging
  console.log(`⚠️ [CORS] Denied origin: ${origin}`)
  
  // Deny unknown origins
  callback(new Error('Not allowed by CORS'))
}

const io = new SocketServer(httpServer, {
  cors: {
    origin: async (origin, callback) => {
      // Allow no origin (same-origin requests)
      if (!origin) {
        return callback(null, true)
      }
      // Allow static origins
      if (staticAllowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      // Check custom domains
      try {
        const { supabaseAdmin } = await import('./config/supabase')
        const hostname = new URL(origin).hostname
        
        const { data: brandingData } = await supabaseAdmin
          .from('workspace_branding')
          .select('id')
          .eq('custom_domain', hostname)
          .eq('custom_domain_verified', true)
          .single()
        
        if (brandingData) {
          return callback(null, true)
        }
      } catch (e) {
        // Continue to deny
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  },
})

// Middleware
app.use(helmet())
app.use(compression()) // Gzip compression

// CORS abierto para rutas públicas del widget (ANTES del CORS restrictivo)
// Esto permite que el widget se embeba en cualquier sitio web
app.use('/api/public', cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Handle preflight OPTIONS for public routes explicitly
app.options('/api/public/*', cors({ origin: '*' }))

// CORS with dynamic origin checking for custom domains
app.use(cors({
  origin: dynamicCorsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '1mb' }))

// Rate limiting por tipo de endpoint
const strictLimit = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: 'Too many requests' } })
const normalLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false })

app.use('/api/whatsapp/send', strictLimit) // Anti-spam para envío
app.use('/api/', normalLimit)

// Health check avanzado (para UptimeRobot)
app.use('/api', healthRoutes)

// Placeholder para notificaciones (silenciar 404)
app.get('/notifications/unread-count', (_req, res) => {
  res.json({ success: true, data: { count: 0 } })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', authRoutes)
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/chat-widgets', chatWidgetRoutes)

// Public widget routes - CORS abierto para permitir embed en cualquier web
app.use('/api/public/chat-widgets', cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }), chatWidgetPublicRoutes)

// Public connection routes for remote QR (no auth required)
app.use('/api/connect', cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }), workspacesRoutes)
app.use('/api/ecommerce', ecommerceRoutes)
app.use('/api/webhooks', webhookRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/workspaces', workspacesRoutes)
app.use('/api/branding', brandingRoutes)
app.use('/api/domains', domainsRoutes)
app.use('/api/campaigns', campaignsRoutes)
app.use('/api/email', emailRoutes)

// Public domain lookup (no auth required for middleware)
app.use('/api/domains/lookup', cors({ origin: '*', methods: ['GET', 'OPTIONS'] }), domainsRoutes)

// Public invitation routes (no auth required)
app.use('/api/invitations', cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }), invitationsRoutes)

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Inicializar WhatsApp Socket
setupWhatsAppSocket(io)

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🚫 ${signal} received, shutting down gracefully...`)
  
  // Detener servicios
  keepaliveMessagesService.stop()
  sessionMonitoringService.stop()
  backupService.stop()
  cacheCleanupService.stop()
  
  // Preservar estado de sesiones activas antes de cerrar
  // Esto asegura que las sesiones 'ready' se puedan restaurar después del reinicio
  try {
    console.log('💾 Preserving WhatsApp session states...')
    await whatsappService.preserveSessionsBeforeShutdown()
    console.log('✅ Session states preserved')
  } catch (error) {
    console.error('⚠️ Error preserving sessions:', error)
  }
  
  // Cerrar servidor HTTP
  httpServer.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
  
  // Forzar cierre después de 15s (más tiempo para guardar sesiones)
  setTimeout(() => process.exit(1), 15000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
httpServer.listen(env.port, async () => {
  console.log(`✅ Server ready | Port ${env.port} | ${env.frontendUrl}`)
  
  await whatsappService.restoreActiveSessions()
  
  keepaliveMessagesService.start()
  sessionMonitoringService.start()
  backupService.start()
  cacheCleanupService.start()
})
