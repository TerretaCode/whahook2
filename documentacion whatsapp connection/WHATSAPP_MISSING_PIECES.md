# 🔍 Piezas Faltantes - Conexión WhatsApp

## ⚠️ IMPORTANTE: Funcionalidades Adicionales Encontradas

Tras una revisión exhaustiva, encontré **3 componentes críticos** que NO estaban en los documentos anteriores:

---

## 1. 📱 Sistema de Keepalive con Mensajes Automáticos

### ¿Qué es?

**Envío automático de mensajes al número +34 602 71 84 51 con intervalos aleatorios** para mantener la sesión activa y evitar detección de bot.

### Configuración

```typescript
// config/cron.ts

/**
 * Sistema de keepalive con intervalos ALEATORIOS
 * Envía mensajes entre 55 minutos y 1 hora 5 minutos
 * Esto evita que WhatsApp detecte un patrón de bot
 */
const startRandomKeepaliveScheduler = () => {
  const scheduleNextKeepalive = () => {
    // Intervalo aleatorio entre 55m y 1h 5m
    const minMinutes = 55;
    const maxMinutes = 65;
    const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
    const randomMs = randomMinutes * 60 * 1000;
    
    console.log(`📱 Next keepalive message in ${randomMinutes} minutes`);
    
    setTimeout(async () => {
      await sendKeepaliveMessage();
      scheduleNextKeepalive(); // Programar el siguiente con otro intervalo aleatorio
    }, randomMs);
  };
  
  // Primer envío con delay aleatorio de 1-10 minutos
  const initialDelay = Math.floor(Math.random() * 10 + 1) * 60 * 1000;
  setTimeout(async () => {
    await sendKeepaliveMessage();
    scheduleNextKeepalive();
  }, initialDelay);
};
```

### Mensajes Aleatorios

```typescript
const messages = [
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

// Seleccionar mensaje aleatorio
const randomMessage = messages[Math.floor(Math.random() * messages.length)];
```

### Función de Envío

```typescript
const sendKeepaliveMessage = async () => {
  const targetNumber = '34602718451'; // Tu número sin el +
  
  try {
    // Obtener todas las sesiones activas
    const sessionsMap = whatsappService.getAllSessions();
    const sessions = Array.from(sessionsMap.values());
    
    // Filtrar solo sesiones conectadas
    const connectedSessions = sessions.filter(s => s.status === 'ready');
    
    if (connectedSessions.length === 0) {
      console.warn('⚠️ No connected sessions, skipping keepalive');
      return;
    }
    
    // Usar la primera sesión conectada
    const session = connectedSessions[0];
    
    // Verificar que el cliente está realmente listo
    const state = await session.client.getState();
    
    if (state && state !== 'CONNECTED') {
      console.warn(`⚠️ Session not connected (state: ${state}), skipping`);
      return;
    }
    
    // Enviar mensaje
    const normalizedPhone = `${targetNumber}@c.us`;
    await session.client.sendMessage(normalizedPhone, randomMessage);
    
    console.log(`✅ Keepalive message sent to ${targetNumber}`);
  } catch (error) {
    console.error(`❌ Failed to send keepalive:`, error);
  }
};
```

### ¿Por qué es Importante?

1. **Mantiene la sesión activa** - WhatsApp ve actividad regular
2. **Evita detección de bot** - Intervalos aleatorios (no cada hora exacta)
3. **Mensajes variados** - No siempre el mismo texto
4. **Monitoreo en tiempo real** - Recibes confirmación en tu teléfono
5. **Detección temprana de problemas** - Si no recibes mensajes, algo falla

---

## 2. 🏥 Session Monitoring Service (Cada Hora)

### ¿Qué es?

**Servicio que monitorea la salud de todas las sesiones cada hora** y envía alertas proactivas.

### Configuración

```typescript
// services/sessionMonitoring.service.ts

class SessionMonitoringService {
  private readonly MONITORING_INTERVAL = 60 * 60 * 1000; // 1 hora
  private readonly INACTIVITY_WARNING_DAYS = 5; // Alerta tras 5 días inactivo
  
  start(): void {
    // Ejecutar cada hora
    this.monitoringInterval = setInterval(() => {
      this.monitorSessions();
    }, this.MONITORING_INTERVAL);
    
    console.log('🏥 Session health monitoring started (every 1 hour)');
  }
}
```

### Monitoreo de Sesiones

```typescript
async monitorSessions(): Promise<void> {
  console.log('🔍 Running session health check...');
  
  // 1. Obtener todas las sesiones con status 'ready'
  const { data: sessions } = await supabaseAdmin
    .from('whatsapp_accounts')
    .select('*')
    .eq('status', 'ready');
  
  console.log(`📊 Monitoring ${sessions.length} active session(s)`);
  
  // 2. Verificar salud de cada sesión
  for (const session of sessions) {
    await this.checkSessionHealth(session);
  }
}
```

### Verificación de Salud

```typescript
async checkSessionHealth(session: any): Promise<void> {
  const sessionId = session.session_id;
  const lastSeen = new Date(session.last_seen);
  const now = new Date();
  const timeSinceLastSeen = now.getTime() - lastSeen.getTime();
  
  console.log(`🔍 Checking session: ${sessionId}`);
  console.log(`   Last seen: ${lastSeen.toISOString()}`);
  console.log(`   Hours since last seen: ${Math.floor(timeSinceLastSeen / 1000 / 60 / 60)}`);
  
  // 1. Verificar si está en memoria
  const sessionInMemory = whatsappService.getSession(sessionId);
  if (!sessionInMemory) {
    console.log(`⚠️ Session not in memory (backend may have restarted)`);
    return;
  }
  
  // 2. Verificar inactividad prolongada (>5 días)
  const INACTIVITY_WARNING_MS = 5 * 24 * 60 * 60 * 1000;
  if (timeSinceLastSeen > INACTIVITY_WARNING_MS) {
    console.log(`⚠️ Session inactive for 5+ days`);
    await this.sendInactivityWarning(session);
  }
  
  // 3. Verificar que está realmente conectado
  const isConnected = await this.verifySessionConnection(sessionId);
  if (!isConnected) {
    console.log(`❌ Session appears disconnected despite 'ready' status`);
    await this.handleDisconnectedSession(session);
  }
}
```

### Verificación de Conexión

```typescript
async verifySessionConnection(sessionId: string): Promise<boolean> {
  try {
    const sessionData = whatsappService.getSession(sessionId);
    if (!sessionData) return false;
    
    if (sessionData.status === 'ready') {
      // Intentar obtener estado con timeout de 5 segundos
      const state = await Promise.race([
        sessionData.client.getState(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      console.log(`   Session state: ${state}`);
      
      if (state === 'CONNECTED') {
        return true;
      }
      
      // Si no está CONNECTED pero status es 'ready', dar beneficio de la duda
      // El watchdog y heartbeat se encargarán de reconectar si es necesario
      return true;
    }
    
    return false;
  } catch (error) {
    // En caso de error, asumir conectado para evitar falsos positivos
    return true;
  }
}
```

### Alerta de Inactividad

```typescript
async sendInactivityWarning(session: any): Promise<void> {
  // Verificar si ya enviamos alerta en las últimas 24h
  const { data: existingWarning } = await supabaseAdmin
    .from('whatsapp_accounts')
    .select('metadata')
    .eq('id', session.id)
    .single();
  
  if (existingWarning?.metadata) {
    const metadata = JSON.parse(existingWarning.metadata);
    if (metadata.last_inactivity_warning) {
      const lastWarning = new Date(metadata.last_inactivity_warning);
      const timeSinceWarning = Date.now() - lastWarning.getTime();
      
      // No enviar más de una alerta por día
      if (timeSinceWarning < 24 * 60 * 60 * 1000) {
        console.log(`   Skipping warning - already sent in last 24h`);
        return;
      }
    }
  }
  
  // Obtener email del usuario
  const { data: user } = await supabaseAdmin
    .from('users_profile')
    .select('email, full_name')
    .eq('id', session.user_id)
    .single();
  
  if (!user || !user.email) return;
  
  const daysSinceLastSeen = Math.floor(
    (Date.now() - new Date(session.last_seen).getTime()) / (24 * 60 * 60 * 1000)
  );
  
  // Enviar email de alerta
  await sendWhatsAppDisconnectedEmail(user.email, {
    user_name: user.full_name || 'Usuario',
    phone_number: session.phone_number || 'N/A',
    session_label: session.label || 'WhatsApp',
    disconnection_reason: `Sesión inactiva por ${daysSinceLastSeen} días. La sesión puede expirar pronto.`,
    disconnection_time: new Date().toLocaleString('es-ES'),
    login_url: `${process.env.FRONTEND_URL}/settings`
  });
  
  // Registrar que enviamos la alerta
  const metadata = existingWarning?.metadata ? JSON.parse(existingWarning.metadata) : {};
  metadata.last_inactivity_warning = new Date().toISOString();
  
  await supabaseAdmin
    .from('whatsapp_accounts')
    .update({ metadata: JSON.stringify(metadata) })
    .eq('id', session.id);
  
  console.log(`📧 Inactivity warning sent to ${user.email}`);
}
```

### Manejo de Sesión Desconectada

```typescript
async handleDisconnectedSession(session: any): Promise<void> {
  console.log(`   Marking session as error`);
  
  // Actualizar estado en Supabase
  await supabaseAdmin
    .from('whatsapp_accounts')
    .update({
      status: 'error',
      error_message: 'Session disconnected (detected by health check)',
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);
  
  // Enviar email de notificación
  const { data: user } = await supabaseAdmin
    .from('users_profile')
    .select('email, full_name')
    .eq('id', session.user_id)
    .single();
  
  if (user && user.email) {
    await sendWhatsAppDisconnectedEmail(user.email, {
      user_name: user.full_name || 'Usuario',
      phone_number: session.phone_number || 'N/A',
      session_label: session.label || 'WhatsApp',
      disconnection_reason: 'Sesión desconectada (detectado por monitoreo automático)',
      disconnection_time: new Date().toLocaleString('es-ES'),
      login_url: `${process.env.FRONTEND_URL}/settings`
    });
  }
}
```

---

## 3. 🐧 Configuración Nixpacks para Railway

### ¿Qué es?

**Archivo de configuración que le dice a Railway qué paquetes instalar** para que Chromium funcione correctamente.

### nixpacks.toml

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "chromium"]
aptPkgs = [
  "fonts-liberation",
  "libasound2t64",
  "libatk-bridge2.0-0",
  "libatk1.0-0",
  "libatspi2.0-0",
  "libcairo2",
  "libcups2",
  "libdbus-1-3",
  "libdrm2",
  "libgbm1",
  "libglib2.0-0",
  "libgtk-3-0",
  "libnspr4",
  "libnss3",
  "libpango-1.0-0",
  "libx11-6",
  "libxcb1",
  "libxcomposite1",
  "libxdamage1",
  "libxext6",
  "libxfixes3",
  "libxkbcommon0",
  "libxrandr2",
  "xdg-utils"
]

[phases.install]
cmds = ["npm install --production"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### ¿Por qué es Crítico?

Sin estos paquetes, Chromium NO funcionará en Railway:
- **nodejs_20** - Node.js 20
- **chromium** - Navegador headless
- **fonts-liberation** - Fuentes para renderizado
- **libnss3, libatk, libgtk** - Librerías de sistema necesarias
- **libgbm1, libdrm2** - Aceleración gráfica
- **xdg-utils** - Utilidades X11

---

## 📊 Resumen de las 3 Piezas Faltantes

### 1. Keepalive con Mensajes (55-65 min)
```
Propósito: Mantener sesión activa + Monitoreo en tiempo real
Frecuencia: Aleatoria (55-65 minutos)
Destino: +34 602 71 84 51
Mensajes: 15 variaciones aleatorias
Inicio: Delay aleatorio de 1-10 min tras arranque
```

### 2. Session Monitoring (Cada hora)
```
Propósito: Verificar salud de sesiones
Frecuencia: Cada 1 hora
Verificaciones:
  - Sesión en memoria
  - Inactividad > 5 días → Email de alerta
  - Estado de conexión → Si desconectado, marcar como error
```

### 3. Nixpacks Configuration
```
Propósito: Instalar dependencias de Chromium en Railway
Paquetes: nodejs_20, chromium + 20 librerías del sistema
Crítico: Sin esto, Chromium NO arranca
```

---

## 🔄 Flujo Completo Actualizado

```
BACKEND INICIA
      ↓
1. Conectar Supabase/Redis
      ↓
2. Inicializar Socket.IO
      ↓
3. ⭐ INICIAR CRON JOBS ⭐
   - Backup diario (2 AM)
   - Keepalive aleatorio (55-65 min) → +34 602 71 84 51
      ↓
4. Restaurar Sesiones Activas
   - Desde disco (LocalAuth)
   - Limpiar lock files
   - Verificar archivos críticos
   - Restaurar desde backup si falla
      ↓
5. ⭐ INICIAR SERVICIOS DE MONITOREO ⭐
   - Health Check (cada 5 min)
   - Session Cleanup (periódico)
   - Session Monitoring (cada 1 hora)
      ↓
6. Iniciar Servidor HTTP
      ↓
✅ SISTEMA COMPLETO ACTIVO

Mecanismos Activos:
├─ Heartbeat (cada 2 min)
├─ Watchdog (cada 1 min)
├─ Mouse Activity (cada 30 seg)
├─ Keepalive Messages (55-65 min) ⭐ NUEVO
├─ Session Monitoring (cada 1 hora) ⭐ NUEVO
├─ Backup Automático (2 AM diario)
└─ Health Check (cada 5 min)
```

---

## 🎯 Conclusión Final

### Ahora SÍ tenemos TODO:

✅ **LocalAuth + Railway Volume** - Persistencia física
✅ **Backup Automático** - Diario a las 2 AM
✅ **Restauración al Iniciar** - Desde disco o backup
✅ **Limpieza de Lock Files** - Chromium sin bloqueos
✅ **Verificación de Archivos** - Integridad garantizada
✅ **Heartbeat** - Cada 2 minutos
✅ **Watchdog** - Cada 1 minuto
✅ **Mouse Activity** - Cada 30 segundos
✅ **Keepalive Messages** - 55-65 min aleatorio → +34 602 71 84 51 ⭐
✅ **Session Monitoring** - Cada hora con alertas ⭐
✅ **Nixpacks Config** - Dependencias de Chromium ⭐

### Total: **10 Capas de Protección**

**¡Ahora sí está COMPLETO!** 🎉

---

**Documentos Relacionados:**
- `WHATSAPP_CONNECTION_ARCHITECTURE.md` - Arquitectura base
- `WHATSAPP_TECHNICAL_DETAILS.md` - Detalles técnicos
- `WHATSAPP_PERSISTENCE_SUMMARY.md` - Resumen de persistencia
