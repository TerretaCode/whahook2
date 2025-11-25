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
import { keepaliveMessagesService, sessionMonitoringService } from './services'

const app = express()
const httpServer = createServer(app)

// Socket.IO
const io = new SocketServer(httpServer, {
  cors: {
    origin: env.frontendUrl,
    credentials: true,
  },
})

// Middleware
app.use(helmet())
app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(express.json())
app.use(morgan(isDev ? 'dev' : 'combined'))

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}))

// Health check (para UptimeRobot)
app.get('/health', (req, res) => {
  const sessions = whatsappService.getAllSessions()
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    sessions: {
      active: sessions.size,
      ready: Array.from(sessions.values()).filter(s => s.status === 'ready').length,
    }
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() })
})

// Placeholder para notificaciones (silenciar 404)
app.get('/notifications/unread-count', (req, res) => {
  res.json({ success: true, data: { count: 0 } })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', authRoutes)
app.use('/api/whatsapp', whatsappRoutes)

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
  
  // Iniciar servicios globales de keepalive
  keepaliveMessagesService.start()
  sessionMonitoringService.start()
})
