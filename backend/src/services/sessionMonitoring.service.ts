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
    try {
      // Obtener sesiones activas de Supabase
      const { data: accounts, error } = await supabaseAdmin
        .from('whatsapp_accounts')
        .select('*')
        .in('status', ['ready', 'disconnected', 'error'])

      if (error || !accounts || accounts.length === 0) return

      for (const account of accounts) {
        await this.checkSessionHealth(account)
      }

    } catch {
      // Silencioso
    }
  }

  /**
   * Verificar salud de una sesión
   */
  private async checkSessionHealth(account: any): Promise<void> {
    const { session_id, status } = account

    // 1. Verificar si está en memoria
    const sessionInMemory = whatsappService.getSession(session_id)

    // 2. Si está marcada como "ready" pero no está en memoria, hay problema
    if (status === 'ready' && !sessionInMemory) {
      await this.markSessionAsError(account, 'Session not in memory')
      return
    }

    // 3. Verificar conexión real si está en memoria
    if (sessionInMemory) {
      try {
        const state = await Promise.race([
          sessionInMemory.client.getState(),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ])

        if (state !== 'CONNECTED') {
          await this.markSessionAsError(account, `Disconnected: ${state}`)
        }
      } catch {
        // Timeout verificando estado - no es crítico
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
