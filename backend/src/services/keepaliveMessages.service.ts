import { whatsappService } from '../modules/whatsapp/whatsapp.service'
import { env } from '../config/environment'
import { KEEPALIVE_CONFIG } from '../modules/whatsapp/whatsapp.types'

/**
 * Servicio de Mensajes Keepalive
 * 
 * Envía mensajes REALES cada 55-65 minutos (aleatorio) para:
 * 1. Forzar actividad genuina en WhatsApp
 * 2. Evitar que la sesión se "congele" por inactividad
 * 3. Monitoreo visual (si no llegan mensajes, algo falla)
 */
class KeepaliveMessagesService {
  private timeoutId: NodeJS.Timeout | null = null
  private isRunning = false

  // Mensajes aleatorios para evitar detección de bot
  private readonly MESSAGES = [
    '✅ Sistema activo',
    '🔄 Verificación automática',
    '📡 Conexión estable',
    '✓ Estado: OK',
    '🟢 Servicio operativo',
    '📊 Check de sistema',
    '⚡ Ping de conexión',
    '✅ Todo funcionando',
    '🔍 Revisión periódica',
    '📱 Comprobación activa',
    '✓ Conexión verificada',
    '🌐 Sistema en línea',
    '⚙️ Mantenimiento activo',
    '✅ Servicio estable',
    '📡 Señal confirmada',
  ]

  /**
   * Iniciar servicio de mensajes keepalive
   */
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.scheduleNextMessage()
    console.log(`📱 Keepalive messages service started (target: +${env.keepaliveTargetNumber})`)
  }

  /**
   * Detener servicio
   */
  stop(): void {
    this.isRunning = false
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    console.log('📱 Keepalive messages service stopped')
  }

  /**
   * Programar siguiente mensaje con intervalo ALEATORIO
   */
  private scheduleNextMessage(): void {
    if (!this.isRunning) return

    // Intervalo aleatorio entre 55 y 65 minutos
    const minMs = KEEPALIVE_CONFIG.keepaliveMessageMinMs
    const maxMs = KEEPALIVE_CONFIG.keepaliveMessageMaxMs
    const randomMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
    const randomMinutes = Math.round(randomMs / 60000)

    console.log(`📱 Next keepalive message in ${randomMinutes} minutes`)

    this.timeoutId = setTimeout(async () => {
      await this.sendKeepaliveMessage()
      this.scheduleNextMessage() // Programar siguiente
    }, randomMs)
  }

  /**
   * Enviar mensaje de keepalive
   */
  private async sendKeepaliveMessage(): Promise<void> {
    try {
      // Obtener sesiones conectadas
      const sessions = whatsappService.getAllSessions()
      const connectedSessions = Array.from(sessions.values())
        .filter(s => s.status === 'ready')

      if (connectedSessions.length === 0) {
        console.log('⚠️ No connected sessions, skipping keepalive message')
        return
      }

      // Usar la primera sesión conectada
      const session = connectedSessions[0]

      // Verificar estado real
      try {
        const state = await session.client.getState()
        if (state !== 'CONNECTED') {
          console.log(`⚠️ Session not connected (${state}), skipping`)
          return
        }
      } catch {
        console.log('⚠️ Cannot verify session state, skipping')
        return
      }

      // Seleccionar mensaje aleatorio
      const randomMessage = this.MESSAGES[Math.floor(Math.random() * this.MESSAGES.length)]
      
      // Añadir timestamp para que cada mensaje sea único
      const timestamp = new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      const finalMessage = `${randomMessage} [${timestamp}]`

      // Enviar mensaje
      const chatId = `${env.keepaliveTargetNumber}@c.us`
      await session.client.sendMessage(chatId, finalMessage)

      console.log(`✅ Keepalive message sent: "${finalMessage}"`)

    } catch (error: any) {
      console.error(`❌ Failed to send keepalive message:`, error.message)
    }
  }
}

export const keepaliveMessagesService = new KeepaliveMessagesService()
