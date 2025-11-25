import fs from 'fs'
import path from 'path'
import * as cron from 'node-cron'
import { env } from '../config/environment'

/**
 * Servicio de limpieza de cache de Chromium
 * 
 * Ejecuta cada 6 horas para liberar espacio en disco
 * Típicamente libera 30-50MB por sesión
 */
class CacheCleanupService {
  private cronJob?: cron.ScheduledTask

  // Directorios de cache que se pueden eliminar de forma segura
  private readonly CACHE_DIRS = [
    'Default/Cache',
    'Default/Code Cache',
    'Default/GPUCache',
    'Default/Service Worker',
    'Crashpad',
  ]

  start(): void {
    if (this.cronJob) return

    // Ejecutar cada 6 horas
    this.cronJob = cron.schedule('0 */6 * * *', () => {
      this.cleanAllSessions()
    })

    console.log('🧹 Cache cleanup service started (every 6 hours)')
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob = undefined
      console.log('🧹 Cache cleanup service stopped')
    }
  }

  /**
   * Limpiar cache de todas las sesiones
   */
  async cleanAllSessions(): Promise<{ totalFreed: number; sessionsCleared: number }> {
    console.log('🧹 Starting cache cleanup...')
    
    const sessionsPath = env.sessionsPath
    let totalFreed = 0
    let sessionsCleared = 0

    try {
      if (!fs.existsSync(sessionsPath)) {
        console.log('🧹 Sessions path does not exist, skipping')
        return { totalFreed: 0, sessionsCleared: 0 }
      }

      const sessionDirs = fs.readdirSync(sessionsPath)
        .filter(f => f.startsWith('session-'))

      for (const sessionDir of sessionDirs) {
        const freed = this.cleanSessionCache(path.join(sessionsPath, sessionDir))
        if (freed > 0) {
          totalFreed += freed
          sessionsCleared++
        }
      }

      const freedMB = (totalFreed / (1024 * 1024)).toFixed(2)
      console.log(`🧹 Cache cleanup completed: ${freedMB} MB freed from ${sessionsCleared} session(s)`)

    } catch (error) {
      console.error('Cache cleanup error:', error)
    }

    return { totalFreed, sessionsCleared }
  }

  /**
   * Limpiar cache de una sesión específica
   */
  cleanSessionCache(sessionPath: string): number {
    let freedBytes = 0

    for (const cacheDir of this.CACHE_DIRS) {
      const fullPath = path.join(sessionPath, cacheDir)
      
      try {
        if (fs.existsSync(fullPath)) {
          freedBytes += this.getDirectorySize(fullPath)
          fs.rmSync(fullPath, { recursive: true, force: true })
        }
      } catch {
        // Ignorar errores (archivo en uso, etc.)
      }
    }

    return freedBytes
  }

  /**
   * Obtener tamaño de un directorio
   */
  private getDirectorySize(dirPath: string): number {
    let size = 0

    try {
      const files = fs.readdirSync(dirPath)
      
      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)
        
        if (stats.isDirectory()) {
          size += this.getDirectorySize(filePath)
        } else {
          size += stats.size
        }
      }
    } catch {
      // Ignorar errores
    }

    return size
  }

  /**
   * Obtener estadísticas de uso de disco
   */
  getDiskUsage(): { totalSize: number; sessionCount: number; avgPerSession: number } {
    const sessionsPath = env.sessionsPath
    let totalSize = 0
    let sessionCount = 0

    try {
      if (!fs.existsSync(sessionsPath)) {
        return { totalSize: 0, sessionCount: 0, avgPerSession: 0 }
      }

      const sessionDirs = fs.readdirSync(sessionsPath)
        .filter(f => f.startsWith('session-'))

      sessionCount = sessionDirs.length

      for (const sessionDir of sessionDirs) {
        totalSize += this.getDirectorySize(path.join(sessionsPath, sessionDir))
      }
    } catch {
      // Ignorar errores
    }

    return {
      totalSize,
      sessionCount,
      avgPerSession: sessionCount > 0 ? totalSize / sessionCount : 0,
    }
  }
}

export const cacheCleanupService = new CacheCleanupService()
