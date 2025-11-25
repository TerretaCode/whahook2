import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { env, isDev } from './config/environment'
import { authRoutes } from './modules/auth'
import { setupWhatsAppSocket, whatsappService, whatsappRoutes } from './modules/whatsapp'
import { chatWidgetRoutes, chatWidgetPublicRoutes } from './modules/chatWidget'
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
app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true 
}))
app.use(express.json())
app.use(morgan(isDev ? 'dev' : 'combined'))

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}))

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

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

// Inicializar WhatsApp Socket
setupWhatsAppSocket(io)

// Start server
httpServer.listen(env.port, async () => {
  console.log(`✅ Server running on port ${env.port}`)
  console.log(`🌐 API: http://localhost:${env.port}`)
  console.log(`🔒 CORS: ${env.frontendUrl}`)
  console.log(`📱 WhatsApp Socket.IO ready`)
  
  // Restaurar sesiones activas
  await whatsappService.restoreActiveSessions()
  
  // Iniciar servicios globales
  keepaliveMessagesService.start()
  sessionMonitoringService.start()
  backupService.start()
  cacheCleanupService.start()
})
