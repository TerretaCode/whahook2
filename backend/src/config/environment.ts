import dotenv from 'dotenv'

dotenv.config()

// Validar variables requeridas
const requiredEnvVars = [
  'SUPABASE_URL', 
  'SUPABASE_SERVICE_KEY',
  'CORS_ORIGIN',
  'FRONTEND_URL',
  'WHATSAPP_SESSION_PATH',
  'KEEPALIVE_TARGET_NUMBER',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

export const env = {
  // Server
  port: parseInt(process.env.PORT!, 10),
  nodeEnv: process.env.NODE_ENV!,
  
  // CORS / Frontend / Backend
  corsOrigin: process.env.CORS_ORIGIN!,
  frontendUrl: process.env.FRONTEND_URL!,
  backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`,
  
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY!,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY!,
  
  // Redis
  redisUrl: process.env.REDIS_URL!,
  
  // WhatsApp
  sessionsPath: process.env.WHATSAPP_SESSION_PATH!,
  
  // Puppeteer
  puppeteerSkipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true',
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH!,
  
  // Keepalive
  keepaliveTargetNumber: process.env.KEEPALIVE_TARGET_NUMBER!,
}

export const isDev = env.nodeEnv === 'development'
export const isProd = env.nodeEnv === 'production'
