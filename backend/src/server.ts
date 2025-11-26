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
import { keepaliveMessagesService, sessionMonitoringService, backupService, cacheCleanupService } from './services'
import { healthRoutes } from './routes'

const app = express()
const httpServer = createServer(app)

// Trust proxy para Railway (necesario para rate limiting y headers)
app.set('trust proxy', 1)

// Socket.IO con múltiples orígenes permitidos
const allowedOrigins = [
  env.frontendUrl,
  'http://localhost:3000',
  'https://localhost:3000',
].filter(Boolean)

const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

// Middleware
app.use(helmet())
app.use(compression()) // Gzip compression
app.use(cors({ origin: allowedOrigins, credentials: true }))
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
app.use('/api/public/chat-widgets', chatWidgetPublicRoutes)
app.use('/api/ecommerce', ecommerceRoutes)
app.use('/api/webhooks', webhookRoutes)

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Inicializar WhatsApp Socket
setupWhatsAppSocket(io)

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🚫 ${signal} received, shutting down...`)
  
  // Detener servicios
  keepaliveMessagesService.stop()
  sessionMonitoringService.stop()
  backupService.stop()
  cacheCleanupService.stop()
  
  // Cerrar servidor HTTP
  httpServer.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
  
  // Forzar cierre después de 10s
  setTimeout(() => process.exit(1), 10000)
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
