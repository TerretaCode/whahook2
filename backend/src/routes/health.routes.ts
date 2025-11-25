import { Router } from 'express'
import os from 'os'
import fs from 'fs'
import { redis } from '../config/redis'
import { supabaseAdmin } from '../config/supabase'
import { whatsappService } from '../modules/whatsapp/whatsapp.service'
import { env } from '../config/environment'

const router = Router()

interface HealthCheck {
  status: 'up' | 'down'
  responseTime: number
  details: Record<string, unknown>
}

// Health check completo para UptimeRobot
router.get('/health', async (_req, res) => {
  const startTime = Date.now()

  const checks = {
    redis: await checkRedis(),
    supabase: await checkSupabase(),
    disk: checkDisk(),
    whatsapp: checkWhatsApp(),
  }

  // Determinar estado general
  const criticalServices = [checks.supabase, checks.disk]
  const allCriticalUp = criticalServices.every(c => c.status === 'up')

  const status = allCriticalUp
    ? checks.whatsapp.status === 'up' ? 'healthy' : 'degraded'
    : 'unhealthy'

  const response = {
    status,
    timestamp: Date.now(),
    uptime: Math.floor(process.uptime()),
    responseTime: Date.now() - startTime,
    checks,
    system: {
      memory: {
        total: formatBytes(os.totalmem()),
        free: formatBytes(os.freemem()),
        used: formatBytes(os.totalmem() - os.freemem()),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1) + '%',
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg().map(l => l.toFixed(2)),
      },
    },
  }

  const httpStatus = status === 'unhealthy' ? 503 : 200
  res.status(httpStatus).json(response)
})

// Health check simple (para pings rápidos)
router.get('/ping', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now()
  
  if (!redis) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      details: { connected: false, reason: 'Redis not configured' },
    }
  }

  try {
    await redis.ping()
    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: { connected: true, mode: redis.status },
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      details: { connected: false, error: error instanceof Error ? error.message : 'Unknown' },
    }
  }
}

async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const { error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('id')
      .limit(1)

    if (error) throw error

    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: { connected: true, latency: Date.now() - start },
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      details: { connected: false, error: error instanceof Error ? error.message : 'Unknown' },
    }
  }
}

function checkDisk(): HealthCheck {
  const start = Date.now()
  const sessionsPath = env.sessionsPath

  try {
    // Verificar que el directorio existe
    if (!fs.existsSync(sessionsPath)) {
      fs.mkdirSync(sessionsPath, { recursive: true })
    }

    // Verificar que es escribible
    fs.accessSync(sessionsPath, fs.constants.W_OK)

    // Contar sesiones
    const sessions = fs.readdirSync(sessionsPath).filter(f => f.startsWith('session-'))

    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: {
        path: sessionsPath,
        writable: true,
        sessionFolders: sessions.length,
      },
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      details: { writable: false, error: error instanceof Error ? error.message : 'Unknown' },
    }
  }
}

function checkWhatsApp(): HealthCheck {
  const start = Date.now()
  const sessions = whatsappService.getAllSessions()
  const sessionsArray = Array.from(sessions.values())

  const activeSessions = sessionsArray.length
  const readySessions = sessionsArray.filter(s => s.status === 'ready').length
  const errorSessions = sessionsArray.filter(s => s.status === 'error').length

  return {
    status: activeSessions === 0 || readySessions > 0 ? 'up' : 'down',
    responseTime: Date.now() - start,
    details: {
      activeSessions,
      readySessions,
      errorSessions,
      initializingSessions: activeSessions - readySessions - errorSessions,
    },
  }
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2) + ' GB'
}

export { router as healthRoutes }
