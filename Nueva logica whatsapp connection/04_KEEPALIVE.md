# Mecanismos de Keepalive

## Objetivo

Mantener las sesiones WhatsApp activas 24/7, evitando:
- Desconexión por inactividad de WhatsApp
- Suspensión del navegador Chromium
- Pérdida de conexión por timeout
- Detección como bot por WhatsApp

---

## Arquitectura de Keepalive (5 Capas)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SISTEMA DE KEEPALIVE - 5 CAPAS                          │
│                                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │  HEARTBEAT  │ │  WATCHDOG   │ │  BROWSER    │ │  KEEPALIVE  │ │  SESSION   │ │
│  │  (2 min)    │ │  (1 min)    │ │  ACTIVITY   │ │  MESSAGES   │ │  MONITOR   │ │
│  │             │ │             │ │  (45 seg)   │ │  (55-65min) │ │  (1 hora)  │ │
│  │ • Presencia │ │ • Verificar │ │ • Mouse     │ │ • Mensajes  │ │ • Health   │ │
│  │ • Last seen │ │   estado    │ │ • Keyboard  │ │   reales    │ │   check    │ │
│  │ • DB sync   │ │ • Reconexión│ │ • Wake lock │ │ • Aleatorio │ │ • Alertas  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                                                                  │
│  CRÍTICO: Los mensajes reales (capa 4) son esenciales para evitar que WhatsApp  │
│  "congele" la sesión por inactividad prolongada (issue #377 whatsapp-web.js)    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Heartbeat (cada 2 minutos)

**Propósito:** Mantener la sesión activa y sincronizar estado con la base de datos.

```typescript
class KeepaliveService {
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  startHeartbeat(sessionId: string): void {
    // Evitar duplicados
    if (this.heartbeatIntervals.has(sessionId)) {
      return;
    }
    
    const interval = setInterval(async () => {
      await this.executeHeartbeat(sessionId);
    }, 2 * 60 * 1000); // 2 minutos
    
    this.heartbeatIntervals.set(sessionId, interval);
    console.log(`Heartbeat started for ${sessionId}`);
  }
  
  private async executeHeartbeat(sessionId: string): Promise<void> {
    const session = whatsappService.getSession(sessionId);
    if (!session) {
      this.stopHeartbeat(sessionId);
      return;
    }
    
    try {
      // 1. Verificar estado de conexión
      const state = await session.client.getState();
      
      if (state !== 'CONNECTED') {
        console.warn(`Heartbeat: ${sessionId} not connected (${state})`);
        // El watchdog se encargará de reconectar
        return;
      }
      
      // 2. Enviar presencia disponible
      await session.client.sendPresenceAvailable();
      
      // 3. Actualizar timestamp en Supabase
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          last_seen: new Date().toISOString(),
          status: 'ready'
        })
        .eq('id', session.accountId);
      
      // 4. Actualizar actividad local
      session.lastActivity = Date.now();
      
      console.log(`Heartbeat OK: ${sessionId}`);
      
    } catch (error) {
      console.error(`Heartbeat failed for ${sessionId}:`, error.message);
    }
  }
  
  stopHeartbeat(sessionId: string): void {
    const interval = this.heartbeatIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(sessionId);
      console.log(`Heartbeat stopped for ${sessionId}`);
    }
  }
}
```

---

## 2. Watchdog (cada 1 minuto)

**Propósito:** Detectar desconexiones rápidamente y forzar reconexión.

```typescript
class KeepaliveService {
  private watchdogIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  startWatchdog(sessionId: string): void {
    if (this.watchdogIntervals.has(sessionId)) {
      return;
    }
    
    const interval = setInterval(async () => {
      await this.executeWatchdog(sessionId);
    }, 60 * 1000); // 1 minuto
    
    this.watchdogIntervals.set(sessionId, interval);
    console.log(`Watchdog started for ${sessionId}`);
  }
  
  private async executeWatchdog(sessionId: string): Promise<void> {
    const session = whatsappService.getSession(sessionId);
    if (!session) {
      this.stopWatchdog(sessionId);
      return;
    }
    
    try {
      // Verificar estado con timeout
      const state = await Promise.race([
        session.client.getState(),
        this.timeout(5000, 'TIMEOUT')
      ]);
      
      if (state === 'CONNECTED') {
        return; // Todo OK
      }
      
      console.warn(`Watchdog: ${sessionId} state is ${state}, attempting reconnect`);
      
      // Intentar reconexión silenciosa
      await session.client.initialize();
      
      // Verificar resultado
      await this.sleep(5000);
      const newState = await session.client.getState();
      
      if (newState === 'CONNECTED') {
        console.log(`Watchdog: ${sessionId} reconnected successfully`);
        session.status = 'ready';
      } else {
        console.error(`Watchdog: ${sessionId} reconnection failed`);
      }
      
    } catch (error) {
      console.error(`Watchdog error for ${sessionId}:`, error.message);
    }
  }
  
  private timeout<T>(ms: number, value: T): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), ms));
  }
}
```

---

## 3. Browser Activity (cada 45 segundos)

**Propósito:** Prevenir que Chromium entre en modo de suspensión.

```typescript
class KeepaliveService {
  private activityIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  startBrowserActivity(sessionId: string): void {
    if (this.activityIntervals.has(sessionId)) {
      return;
    }
    
    const interval = setInterval(async () => {
      await this.simulateBrowserActivity(sessionId);
    }, 45 * 1000); // 45 segundos
    
    this.activityIntervals.set(sessionId, interval);
    console.log(`Browser activity started for ${sessionId}`);
  }
  
  private async simulateBrowserActivity(sessionId: string): Promise<void> {
    const session = whatsappService.getSession(sessionId);
    if (!session?.client.pupPage) {
      return;
    }
    
    try {
      await session.client.pupPage.evaluate(() => {
        // 1. Simular movimiento de mouse
        const mouseEvent = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: Math.random() * 100,
          clientY: Math.random() * 100
        });
        document.dispatchEvent(mouseEvent);
        
        // 2. Simular actividad de teclado (tecla neutral)
        const keyEvent = new KeyboardEvent('keydown', {
          key: 'Shift',
          code: 'ShiftLeft',
          bubbles: true
        });
        document.dispatchEvent(keyEvent);
        
        // 3. Solicitar Wake Lock si disponible
        if ('wakeLock' in navigator) {
          (navigator as any).wakeLock.request('screen').catch(() => {});
        }
        
        // 4. Prevenir visibilitychange
        Object.defineProperty(document, 'hidden', {
          value: false,
          writable: true
        });
      });
      
    } catch (error) {
      // Silenciar errores de actividad (no críticos)
    }
  }
}
```

---

## 4. Keepalive Messages (cada 55-65 minutos) ⭐ CRÍTICO

**Propósito:** Enviar mensajes REALES para forzar actividad en WhatsApp y evitar que la sesión se "congele" por inactividad prolongada.

> ⚠️ **¿Por qué es crítico?** Según el [issue #377](https://github.com/pedroslopez/whatsapp-web.js/issues/377) de whatsapp-web.js, `sendPresenceAvailable()` no siempre es suficiente. Las sesiones pueden congelarse tras horas de inactividad. Los mensajes reales fuerzan actividad genuina.

### Configuración

```typescript
// services/keepaliveMessages.service.ts

class KeepaliveMessagesService {
  // Número de destino para mensajes de keepalive
  private readonly TARGET_NUMBER = '34602718451'; // Sin el +
  
  // Mensajes aleatorios para evitar detección de bot
  private readonly MESSAGES = [
    '✅ Comprobación de conexión',
    '🔄 Verificando estado del sistema',
    '📡 Test de conectividad',
    '✓ Sistema operativo',
    '🟢 Conexión activa',
    '📊 Comprobación de ping',
    '⚡ Verificación rápida',
    '✅ Todo funcionando correctamente',
    '🔍 Revisión de estado',
    '📱 Comprobación automática',
    '✓ Estado: OK',
    '🌐 Conexión verificada',
    '⚙️ Sistema en línea',
    '✅ Servicio activo',
    '📡 Señal estable',
  ];

  start(): void {
    this.scheduleNextKeepalive();
    console.log('📱 Keepalive messages service started');
  }

  /**
   * Programar siguiente mensaje con intervalo ALEATORIO
   * Esto evita que WhatsApp detecte un patrón de bot
   */
  private scheduleNextKeepalive(): void {
    // Intervalo aleatorio entre 55 y 65 minutos
    const minMinutes = 55;
    const maxMinutes = 65;
    const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
    const randomMs = randomMinutes * 60 * 1000;
    
    console.log(`📱 Next keepalive message in ${randomMinutes} minutes`);
    
    setTimeout(async () => {
      await this.sendKeepaliveMessage();
      this.scheduleNextKeepalive(); // Programar siguiente
    }, randomMs);
  }

  /**
   * Enviar mensaje de keepalive
   */
  private async sendKeepaliveMessage(): Promise<void> {
    try {
      // Obtener sesiones activas
      const sessions = whatsappService.getAllSessions();
      const connectedSessions = Array.from(sessions.values())
        .filter(s => s.status === 'ready');
      
      if (connectedSessions.length === 0) {
        console.warn('⚠️ No connected sessions, skipping keepalive message');
        return;
      }
      
      // Usar la primera sesión conectada
      const session = connectedSessions[0];
      
      // Verificar que está realmente conectada
      const state = await session.client.getState();
      if (state !== 'CONNECTED') {
        console.warn(`⚠️ Session not connected (${state}), skipping`);
        return;
      }
      
      // Seleccionar mensaje aleatorio
      const randomMessage = this.MESSAGES[Math.floor(Math.random() * this.MESSAGES.length)];
      
      // Enviar mensaje
      const chatId = `${this.TARGET_NUMBER}@c.us`;
      await session.client.sendMessage(chatId, randomMessage);
      
      console.log(`✅ Keepalive message sent: "${randomMessage}"`);
      
    } catch (error: any) {
      console.error(`❌ Failed to send keepalive message:`, error.message);
    }
  }
}

export const keepaliveMessagesService = new KeepaliveMessagesService();
```

### ¿Por qué intervalos aleatorios?

| Intervalo | Riesgo |
|-----------|--------|
| Exacto (ej: cada 60 min) | WhatsApp puede detectar patrón de bot |
| Aleatorio (55-65 min) | Simula comportamiento humano |

### Monitoreo Visual

El número `+34 602 71 84 51` debe ser un teléfono que puedas verificar. Si dejas de recibir mensajes cada ~1 hora, sabes que algo falla.

---

## 5. Session Monitoring Service (cada hora) ⭐ CRÍTICO

**Propósito:** Monitorear la salud de las sesiones y enviar alertas proactivas.

```typescript
// services/sessionMonitoring.service.ts

class SessionMonitoringService {
  private readonly MONITORING_INTERVAL = 60 * 60 * 1000; // 1 hora
  private readonly INACTIVITY_WARNING_DAYS = 5;
  
  start(): void {
    setInterval(() => {
      this.monitorSessions();
    }, this.MONITORING_INTERVAL);
    
    console.log('🏥 Session monitoring started (every 1 hour)');
  }

  /**
   * Monitorear todas las sesiones activas
   */
  private async monitorSessions(): Promise<void> {
    console.log('🔍 Running session health check...');
    
    const { data: sessions } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('status', 'ready');
    
    if (!sessions?.length) {
      console.log('No active sessions to monitor');
      return;
    }
    
    console.log(`📊 Monitoring ${sessions.length} active session(s)`);
    
    for (const session of sessions) {
      await this.checkSessionHealth(session);
    }
  }

  /**
   * Verificar salud de una sesión específica
   */
  private async checkSessionHealth(account: any): Promise<void> {
    const { session_id, last_seen, user_id, phone_number } = account;
    
    // Calcular tiempo de inactividad
    const lastSeenDate = new Date(last_seen);
    const timeSinceLastSeen = Date.now() - lastSeenDate.getTime();
    const daysSinceLastSeen = timeSinceLastSeen / (24 * 60 * 60 * 1000);
    
    console.log(`   Checking: ${session_id}`);
    console.log(`   Last seen: ${daysSinceLastSeen.toFixed(1)} days ago`);
    
    // 1. Verificar si está en memoria
    const sessionInMemory = whatsappService.getSession(session_id);
    if (!sessionInMemory) {
      console.warn(`   ⚠️ Session not in memory`);
      return;
    }
    
    // 2. Alerta por inactividad prolongada (>5 días)
    if (daysSinceLastSeen > this.INACTIVITY_WARNING_DAYS) {
      console.warn(`   ⚠️ Session inactive for ${daysSinceLastSeen.toFixed(0)} days`);
      await this.sendInactivityWarning(account, daysSinceLastSeen);
    }
    
    // 3. Verificar conexión real
    try {
      const state = await Promise.race([
        sessionInMemory.client.getState(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as string;
      
      if (state !== 'CONNECTED') {
        console.error(`   ❌ Session disconnected (state: ${state})`);
        await this.handleDisconnectedSession(account);
      } else {
        console.log(`   ✅ Session healthy`);
      }
    } catch (error) {
      console.error(`   ❌ Cannot verify session state`);
    }
  }

  /**
   * Enviar alerta de inactividad por email
   */
  private async sendInactivityWarning(account: any, daysSinceLastSeen: number): Promise<void> {
    // Obtener email del usuario
    const { data: user } = await supabaseAdmin
      .from('users_profile')
      .select('email, full_name')
      .eq('id', account.user_id)
      .single();
    
    if (!user?.email) return;
    
    // Enviar email de alerta
    await sendEmail({
      to: user.email,
      subject: '⚠️ Tu sesión de WhatsApp puede expirar pronto',
      html: `
        <p>Hola ${user.full_name || 'Usuario'},</p>
        <p>Tu sesión de WhatsApp (${account.phone_number}) lleva 
        <strong>${Math.floor(daysSinceLastSeen)} días</strong> sin actividad.</p>
        <p>Para evitar que expire, te recomendamos enviar algún mensaje o 
        verificar el estado en la app.</p>
        <p><a href="${process.env.FRONTEND_URL}/settings/connections">
        Ver estado de conexión</a></p>
      `
    });
    
    console.log(`   📧 Inactivity warning sent to ${user.email}`);
  }

  /**
   * Manejar sesión desconectada detectada por monitoreo
   */
  private async handleDisconnectedSession(account: any): Promise<void> {
    // Actualizar estado en Supabase
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({
        status: 'error',
        error_message: 'Desconectado (detectado por monitoreo automático)'
      })
      .eq('id', account.id);
    
    // Enviar notificación por email
    const { data: user } = await supabaseAdmin
      .from('users_profile')
      .select('email, full_name')
      .eq('id', account.user_id)
      .single();
    
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: '❌ Tu WhatsApp se ha desconectado',
        html: `
          <p>Hola ${user.full_name || 'Usuario'},</p>
          <p>Tu sesión de WhatsApp (${account.phone_number}) se ha desconectado.</p>
          <p>Por favor, vuelve a escanear el código QR para reconectar.</p>
          <p><a href="${process.env.FRONTEND_URL}/settings/connections">
          Reconectar ahora</a></p>
        `
      });
    }
  }
}

export const sessionMonitoringService = new SessionMonitoringService();
```

---

## Gestión Centralizada

```typescript
// keepalive.service.ts
class KeepaliveService {
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private watchdogIntervals: Map<string, NodeJS.Timeout> = new Map();
  private activityIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Iniciar todos los mecanismos de keepalive para una sesión
   */
  startAll(sessionId: string): void {
    this.startHeartbeat(sessionId);
    this.startWatchdog(sessionId);
    this.startBrowserActivity(sessionId);
    
    console.log(`All keepalive mechanisms started for ${sessionId}`);
  }
  
  /**
   * Detener todos los mecanismos de keepalive para una sesión
   */
  stopAll(sessionId: string): void {
    this.stopHeartbeat(sessionId);
    this.stopWatchdog(sessionId);
    this.stopBrowserActivity(sessionId);
    
    console.log(`All keepalive mechanisms stopped for ${sessionId}`);
  }
  
  /**
   * Verificar estado de keepalive para una sesión
   */
  getStatus(sessionId: string): KeepaliveStatus {
    return {
      heartbeat: this.heartbeatIntervals.has(sessionId),
      watchdog: this.watchdogIntervals.has(sessionId),
      browserActivity: this.activityIntervals.has(sessionId)
    };
  }
  
  /**
   * Obtener estadísticas globales
   */
  getStats(): KeepaliveStats {
    return {
      activeHeartbeats: this.heartbeatIntervals.size,
      activeWatchdogs: this.watchdogIntervals.size,
      activeActivities: this.activityIntervals.size
    };
  }
}

export const keepaliveService = new KeepaliveService();
```

---

## Integración con WhatsAppService

```typescript
// whatsapp.service.ts
class WhatsAppService {
  // En el evento 'ready'
  client.on('ready', async () => {
    // ... código existente ...
    
    // Iniciar keepalive
    keepaliveService.startAll(sessionId);
  });
  
  // En destroySession
  async destroySession(sessionId: string): Promise<void> {
    // Detener keepalive primero
    keepaliveService.stopAll(sessionId);
    
    // ... resto del código ...
  }
  
  // En restoreSession
  async restoreSession(account: WhatsAppAccount): Promise<void> {
    // ... código de restauración ...
    
    // Iniciar keepalive tras restauración exitosa
    keepaliveService.startAll(account.session_id);
  }
}
```

---

## Configuración de Intervalos

```typescript
// config/keepalive.config.ts
export const KEEPALIVE_CONFIG = {
  // Heartbeat: verificación de estado y presencia
  heartbeat: {
    intervalMs: 2 * 60 * 1000,  // 2 minutos
    enabled: true
  },
  
  // Watchdog: detección rápida de desconexiones
  watchdog: {
    intervalMs: 60 * 1000,       // 1 minuto
    reconnectTimeoutMs: 5000,    // Timeout para reconexión
    enabled: true
  },
  
  // Browser Activity: prevenir suspensión
  browserActivity: {
    intervalMs: 45 * 1000,       // 45 segundos
    enabled: true
  }
};
```

---

## Monitoreo de Sesiones Inactivas

```typescript
// Servicio adicional para detectar sesiones problemáticas
class SessionMonitorService {
  private readonly INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutos
  
  start(): void {
    // Verificar cada 10 minutos
    setInterval(() => {
      this.checkInactiveSessions();
    }, 10 * 60 * 1000);
  }
  
  private async checkInactiveSessions(): Promise<void> {
    const sessions = whatsappService.getAllSessions();
    const now = Date.now();
    
    for (const [sessionId, session] of sessions) {
      const inactiveTime = now - session.lastActivity;
      
      if (inactiveTime > this.INACTIVITY_THRESHOLD) {
        console.warn(`Session ${sessionId} inactive for ${inactiveTime / 1000}s`);
        
        // Verificar si realmente está desconectada
        try {
          const state = await session.client.getState();
          
          if (state !== 'CONNECTED') {
            console.error(`Inactive session ${sessionId} is disconnected`);
            // El watchdog debería encargarse, pero forzamos verificación
            keepaliveService.stopAll(sessionId);
            keepaliveService.startAll(sessionId);
          }
        } catch (error) {
          console.error(`Cannot check state for ${sessionId}:`, error);
        }
      }
    }
  }
}
```

---

## Logs y Debugging

### Logs Esperados (Operación Normal)

```
[12:00:00] Heartbeat OK: user_abc123_wa_def456
[12:00:45] Browser activity simulated for user_abc123_wa_def456
[12:01:00] Watchdog: user_abc123_wa_def456 state is CONNECTED
[12:01:30] Browser activity simulated for user_abc123_wa_def456
[12:02:00] Heartbeat OK: user_abc123_wa_def456
```

### Logs de Reconexión

```
[12:03:00] Watchdog: user_abc123_wa_def456 state is UNPAIRED_IDLE, attempting reconnect
[12:03:05] Watchdog: user_abc123_wa_def456 reconnected successfully
```

### Logs de Fallo

```
[12:05:00] Watchdog: user_abc123_wa_def456 state is CONFLICT, not reconnectable
[12:05:00] Session user_abc123_wa_def456 requires manual reconnection
```

---

## Resumen de las 5 Capas de Keepalive

| # | Mecanismo | Intervalo | Propósito | Crítico |
|---|-----------|-----------|-----------|---------|
| 1 | Heartbeat | 2 min | `sendPresenceAvailable()` + DB sync | Sí |
| 2 | Watchdog | 1 min | Detección rápida de desconexión | Sí |
| 3 | Browser Activity | 45 seg | Simular mouse/keyboard, anti-suspensión | Sí |
| 4 | **Keepalive Messages** | 55-65 min (aleatorio) | **Mensajes REALES** al +34 602 71 84 51 | ⭐ MUY CRÍTICO |
| 5 | **Session Monitoring** | 1 hora | Health check + alertas por email | ⭐ MUY CRÍTICO |

---

## Inicialización de Todos los Servicios

```typescript
// Al iniciar el backend
async function startAllServices(): Promise<void> {
  // 1. Restaurar sesiones existentes
  await whatsappService.restoreActiveSessions();
  
  // 2. Iniciar servicio de mensajes keepalive (GLOBAL, no por sesión)
  keepaliveMessagesService.start();
  
  // 3. Iniciar monitoreo de sesiones (GLOBAL)
  sessionMonitoringService.start();
  
  // 4. Heartbeat, Watchdog, Browser Activity se inician POR SESIÓN
  //    en el evento 'ready' de cada cliente WhatsApp
  
  console.log('✅ All keepalive services started');
}
```

---

## Notas Importantes

1. **Los mensajes reales son la capa más importante:** Sin ellos, las sesiones pueden "congelarse" tras horas de inactividad (issue #377).

2. **Intervalos aleatorios:** Usar intervalos fijos puede causar detección como bot.

3. **El número de destino (+34 602 71 84 51):** Debe ser un teléfono que puedas verificar para monitoreo visual.

4. **Limpieza al destruir:** Siempre detener keepalive por sesión antes de destruirla.

5. **Servicios globales vs por sesión:**
   - **Globales:** Keepalive Messages, Session Monitoring
   - **Por sesión:** Heartbeat, Watchdog, Browser Activity

---

## Comparación con Documentación Anterior

| Aspecto | Doc. Antigua | Nueva Doc. v2.1 |
|---------|--------------|-----------------|
| Heartbeat | ✅ | ✅ |
| Watchdog | ✅ | ✅ |
| Browser Activity | ✅ | ✅ |
| Keepalive Messages | ✅ | ✅ Ahora incluido |
| Session Monitoring | ✅ | ✅ Ahora incluido |
| **Total capas** | 5 | 5 |

---

**Documento:** 04_KEEPALIVE.md  
**Versión:** 2.1 (Actualizado con capas críticas faltantes)
