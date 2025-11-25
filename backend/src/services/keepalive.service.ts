import { whatsappService } from '../modules/whatsapp/whatsapp.service'
import { supabaseAdmin } from '../config/supabase'
import { KEEPALIVE_CONFIG } from '../modules/whatsapp/whatsapp.types'

/**
 * Servicio de Keepalive - Mantiene las sesiones WhatsApp activas
 * 
 * 3 mecanismos:
 * 1. Heartbeat (cada 2 min) - sendPresenceAvailable + actualizar DB
 * 2. Watchdog (cada 1 min) - verificar estado y reconectar si necesario
 * 3. Browser Activity (cada 45 seg) - simular actividad en Chromium
 */
class KeepaliveService {
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map()
  private watchdogIntervals: Map<string, NodeJS.Timeout> = new Map()
  private activityIntervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Iniciar todos los mecanismos de keepalive para una sesión
   */
  startAll(sessionId: string): void {
    this.startHeartbeat(sessionId)
    this.startWatchdog(sessionId)
    this.startBrowserActivity(sessionId)
    console.log(`💓 Keepalive started for ${sessionId}`)
  }

  /**
   * Detener todos los mecanismos de keepalive para una sesión
   */
  stopAll(sessionId: string): void {
    this.stopHeartbeat(sessionId)
    this.stopWatchdog(sessionId)
    this.stopBrowserActivity(sessionId)
    console.log(`💔 Keepalive stopped for ${sessionId}`)
  }

  // ==================== HEARTBEAT ====================

  private startHeartbeat(sessionId: string): void {
    if (this.heartbeatIntervals.has(sessionId)) return

    const interval = setInterval(async () => {
      await this.doHeartbeat(sessionId)
    }, KEEPALIVE_CONFIG.heartbeatIntervalMs)

    this.heartbeatIntervals.set(sessionId, interval)
  }

  private stopHeartbeat(sessionId: string): void {
    const interval = this.heartbeatIntervals.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.heartbeatIntervals.delete(sessionId)
    }
  }

  private async doHeartbeat(sessionId: string): Promise<void> {
    const session = whatsappService.getSession(sessionId)
    if (!session || session.status !== 'ready') return

    try {
      // Enviar presencia "disponible"
      await session.client.sendPresenceAvailable()

      // Actualizar last_seen en DB
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({ last_seen: new Date().toISOString() })
        .eq('session_id', sessionId)

      // Actualizar en memoria
      session.lastActivity = Date.now()

    } catch (error) {
      console.error(`Heartbeat failed for ${sessionId}:`, error)
    }
  }

  // ==================== WATCHDOG ====================

  private startWatchdog(sessionId: string): void {
    if (this.watchdogIntervals.has(sessionId)) return

    const interval = setInterval(async () => {
      await this.doWatchdog(sessionId)
    }, KEEPALIVE_CONFIG.watchdogIntervalMs)

    this.watchdogIntervals.set(sessionId, interval)
  }

  private stopWatchdog(sessionId: string): void {
    const interval = this.watchdogIntervals.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.watchdogIntervals.delete(sessionId)
    }
  }

  private async doWatchdog(sessionId: string): Promise<void> {
    const session = whatsappService.getSession(sessionId)
    if (!session) return

    try {
      const state = await session.client.getState()

      if (state === 'CONNECTED') {
        // Todo OK
        return
      }

      // Estados que permiten reconexión
      const reconnectableStates = ['UNPAIRED_IDLE', 'OPENING', 'PAIRING', 'TIMEOUT']
      
      if (reconnectableStates.includes(state)) {
        console.log(`🔄 Watchdog: ${sessionId} state is ${state}, attempting reconnect`)
        await session.client.initialize()
      } else {
        console.log(`⚠️ Watchdog: ${sessionId} state is ${state}, cannot auto-reconnect`)
      }

    } catch (error) {
      console.error(`Watchdog check failed for ${sessionId}:`, error)
    }
  }

  // ==================== BROWSER ACTIVITY ====================

  private startBrowserActivity(sessionId: string): void {
    if (this.activityIntervals.has(sessionId)) return

    const interval = setInterval(async () => {
      await this.doBrowserActivity(sessionId)
    }, KEEPALIVE_CONFIG.browserActivityIntervalMs)

    this.activityIntervals.set(sessionId, interval)
  }

  private stopBrowserActivity(sessionId: string): void {
    const interval = this.activityIntervals.get(sessionId)
    if (interval) {
      clearInterval(interval)
      this.activityIntervals.delete(sessionId)
    }
  }

  private async doBrowserActivity(sessionId: string): Promise<void> {
    const session = whatsappService.getSession(sessionId)
    if (!session?.client.pupPage) return

    try {
      // El código dentro de evaluate() se ejecuta en el navegador (Chromium)
      // No en Node.js, por eso usamos Function para evitar errores de TS
      await session.client.pupPage.evaluate(new Function(`
        // Simular movimiento de mouse
        const mouseEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: Math.random() * 100,
          clientY: Math.random() * 100
        });
        document.dispatchEvent(mouseEvent);

        // Simular tecla neutral (Shift)
        const keyEvent = new KeyboardEvent('keydown', {
          key: 'Shift',
          code: 'ShiftLeft',
          bubbles: true
        });
        document.dispatchEvent(keyEvent);

        // Prevenir que el documento se marque como "hidden"
        Object.defineProperty(document, 'hidden', {
          value: false,
          writable: true
        });
      `) as () => void)
    } catch (error) {
      // Silenciar errores (no críticos)
    }
  }

  // ==================== STATS ====================

  getStats(): { heartbeats: number; watchdogs: number; activities: number } {
    return {
      heartbeats: this.heartbeatIntervals.size,
      watchdogs: this.watchdogIntervals.size,
      activities: this.activityIntervals.size,
    }
  }
}

export const keepaliveService = new KeepaliveService()
