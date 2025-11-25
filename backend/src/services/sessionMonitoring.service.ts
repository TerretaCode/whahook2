import { whatsappService } from '../modules/whatsapp/whatsapp.service'
import { supabaseAdmin } from '../config/supabase'

/**
 * Servicio de Monitoreo de Sesiones
 * 
 * Ejecuta cada hora para:
 * 1. Verificar salud de todas las sesiones
 * 2. Detectar sesiones inactivas (>5 días)
 * 3. Detectar sesiones desconectadas
 * 4. Enviar alertas por email si es necesario
 */
class SessionMonitoringService {
  private intervalId: NodeJS.Timeout | null = null
  private readonly MONITORING_INTERVAL_MS = 60 * 60 * 1000 // 1 hora
  private readonly INACTIVITY_WARNING_DAYS = 5

  /**
   * Iniciar servicio de monitoreo
   */
  start(): void {
    if (this.intervalId) return

    // Ejecutar inmediatamente y luego cada hora
    this.runMonitoring()
    
    this.intervalId = setInterval(() => {
      this.runMonitoring()
    }, this.MONITORING_INTERVAL_MS)

    console.log('🏥 Session monitoring service started (every 1 hour)')
  }

  /**
   * Detener servicio
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    console.log('🏥 Session monitoring service stopped')
  }

  /**
   * Ejecutar monitoreo
   */
  private async runMonitoring(): Promise<void> {
    console.log('🔍 Running session health check...')

    try {
      // Obtener sesiones activas de Supabase
      const { data: accounts, error } = await supabaseAdmin
        .from('whatsapp_accounts')
        .select('*')
        .in('status', ['ready', 'disconnected', 'error'])

      if (error) {
        console.error('Error fetching accounts for monitoring:', error)
        return
      }

      if (!accounts || accounts.length === 0) {
        console.log('No sessions to monitor')
        return
      }

      console.log(`📊 Monitoring ${accounts.length} session(s)`)

      for (const account of accounts) {
        await this.checkSessionHealth(account)
      }

      console.log('✅ Session health check completed')

    } catch (error) {
      console.error('Session monitoring error:', error)
    }
  }

  /**
   * Verificar salud de una sesión
   */
  private async checkSessionHealth(account: any): Promise<void> {
    const { session_id, last_seen, user_id, phone_number, status } = account

    // Calcular tiempo de inactividad
    const lastSeenDate = new Date(last_seen)
    const timeSinceLastSeen = Date.now() - lastSeenDate.getTime()
    const daysSinceLastSeen = timeSinceLastSeen / (24 * 60 * 60 * 1000)

    console.log(`   Checking: ${session_id}`)
    console.log(`   Status: ${status}, Last seen: ${daysSinceLastSeen.toFixed(1)} days ago`)

    // 1. Verificar si está en memoria
    const sessionInMemory = whatsappService.getSession(session_id)

    // 2. Si está marcada como "ready" pero no está en memoria, hay problema
    if (status === 'ready' && !sessionInMemory) {
      console.warn(`   ⚠️ Session marked as ready but not in memory`)
      await this.markSessionAsError(account, 'Sesión no encontrada en memoria')
      return
    }

    // 3. Alerta por inactividad prolongada (>5 días)
    if (daysSinceLastSeen > this.INACTIVITY_WARNING_DAYS) {
      console.warn(`   ⚠️ Session inactive for ${daysSinceLastSeen.toFixed(0)} days`)
      // Aquí podrías enviar email de alerta
    }

    // 4. Verificar conexión real si está en memoria
    if (sessionInMemory) {
      try {
        const state = await Promise.race([
          sessionInMemory.client.getState(),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ])

        if (state !== 'CONNECTED') {
          console.error(`   ❌ Session disconnected (state: ${state})`)
          await this.markSessionAsError(account, `Desconectado (estado: ${state})`)
        } else {
          console.log(`   ✅ Session healthy`)
        }
      } catch (error) {
        console.error(`   ❌ Cannot verify session state`)
      }
    }
  }

  /**
   * Marcar sesión como error
   */
  private async markSessionAsError(account: any, errorMessage: string): Promise<void> {
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({
        status: 'error',
        error_message: errorMessage,
      })
      .eq('id', account.id)
  }

  /**
   * Obtener resumen de salud
   */
  async getHealthSummary(): Promise<{
    total: number
    ready: number
    disconnected: number
    error: number
  }> {
    const { data: accounts } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('status')

    if (!accounts) {
      return { total: 0, ready: 0, disconnected: 0, error: 0 }
    }

    return {
      total: accounts.length,
      ready: accounts.filter(a => a.status === 'ready').length,
      disconnected: accounts.filter(a => a.status === 'disconnected').length,
      error: accounts.filter(a => a.status === 'error').length,
    }
  }
}

export const sessionMonitoringService = new SessionMonitoringService()
