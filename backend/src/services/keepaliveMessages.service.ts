import { whatsappService } from '../modules/whatsapp/whatsapp.service'
import { env } from '../config/environment'
import { KEEPALIVE_CONFIG } from '../modules/whatsapp/whatsapp.types'

/**
 * Servicio de Mensajes Keepalive
 * 
 * Envía mensajes REALES cada 2h45min - 3h15min (aleatorio) para:
 * 1. Forzar actividad genuina en WhatsApp
 * 2. Evitar que la sesión se "congele" por inactividad
 * 3. Monitoreo visual (si no llegan mensajes, algo falla)
 */
class KeepaliveMessagesService {
  private timeoutId: NodeJS.Timeout | null = null
  private isRunning = false

  // Mensajes naturales y variados para parecer humano
  private readonly MESSAGES = [
    'Sigo conectado 👍',
    'Todo bien por aquí',
    'Conexión activa ✓',
    'Aquí seguimos',
    'Sin novedades, todo ok',
    'Funcionando correctamente',
    'Sistema operativo',
    'Conectado y funcionando',
    'Todo en orden',
    'Aquí estamos',
    'Seguimos en línea',
    'Conexión estable',
    'Sin problemas',
    'Activo y funcionando',
    'Todo correcto',
    'En funcionamiento',
    'Operativo',
    'Online ✓',
    'Disponible',
    'Listo y funcionando',
  ]

  /**
   * Iniciar servicio de mensajes keepalive
   */
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log(`📱 Servicio de mensajes keepalive iniciado (intervalo: 2h45min - 3h15min)`)
    console.log(`📱 Número destino: ${env.keepaliveTargetNumber || 'NO CONFIGURADO'}`)
    this.scheduleNextMessage()
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
  }

  /**
   * Programar siguiente mensaje con intervalo ALEATORIO
   */
  private scheduleNextMessage(): void {
    if (!this.isRunning) return

    // Intervalo aleatorio entre 2h45min y 3h15min
    const minMs = KEEPALIVE_CONFIG.keepaliveMessageMinMs
    const maxMs = KEEPALIVE_CONFIG.keepaliveMessageMaxMs
    const randomMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs

    const nextIn = Math.round(randomMs / 60000)
    console.log(`📱 Próximo mensaje keepalive en ${nextIn} minutos`)

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
      // Verificar que hay número de destino configurado
      if (!env.keepaliveTargetNumber) {
        console.log('⚠️ No hay número de keepalive configurado (KEEPALIVE_TARGET_NUMBER)')
        return
      }

      // Obtener sesiones conectadas
      const sessions = whatsappService.getAllSessions()
      const connectedSessions = Array.from(sessions.values())
        .filter(s => s.status === 'ready')

      if (connectedSessions.length === 0) {
        console.log('⚠️ No hay sesiones conectadas para keepalive')
        return
      }

      // Usar la primera sesión conectada
      const session = connectedSessions[0]

      // Verificar estado real
      try {
        const state = await session.client.getState()
        if (state !== 'CONNECTED') {
          console.log('⚠️ Sesión no conectada para keepalive')
          return
        }
      } catch {
        return
      }

      // Seleccionar mensaje aleatorio (sin timestamp para parecer más natural)
      const randomMessage = this.MESSAGES[Math.floor(Math.random() * this.MESSAGES.length)]

      // Enviar mensaje
      const targetNumber = env.keepaliveTargetNumber.replace(/\D/g, '')
      const chatId = `${targetNumber}@c.us`
      
      await session.client.sendMessage(chatId, randomMessage)
      console.log(`📱 Keepalive enviado: "${randomMessage}" a ${targetNumber}`)

    } catch (error) {
      console.error('❌ Error enviando keepalive:', error)
    }
  }
}

export const keepaliveMessagesService = new KeepaliveMessagesService()
