import Redis from 'ioredis'
import { env, isDev } from './environment'

// Redis es opcional en desarrollo
let redis: Redis | null = null

if (env.redisUrl) {
  redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('❌ Redis connection failed after 3 retries')
        return null // Stop retrying
      }
      return Math.min(times * 200, 2000) // Retry with backoff
    }
  })

  redis.on('connect', () => {
    console.log('✅ Redis connected')
  })

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message)
  })
} else if (isDev) {
  console.log('⚠️ Redis URL not configured - running without Redis (dev mode)')
}

export { redis }
