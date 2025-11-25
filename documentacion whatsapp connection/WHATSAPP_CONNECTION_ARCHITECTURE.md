# 🔌 Arquitectura Completa de Conexión WhatsApp - WhaHook

## 📋 Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Flujo de Conexión](#flujo-de-conexión)
4. [Persistencia de Sesión](#persistencia-de-sesión)
5. [Mecanismos de Keepalive](#mecanismos-de-keepalive)
6. [Sistema de Reconexión](#sistema-de-reconexión)
7. [Notificaciones y Alertas](#notificaciones-y-alertas)
8. [Infraestructura Railway](#infraestructura-railway)
9. [Optimizaciones de Memoria](#optimizaciones-de-memoria)
10. [Diagrama de Arquitectura](#diagrama-de-arquitectura)

---

## 🎯 Resumen Ejecutivo

WhaHook implementa un sistema **altamente resiliente** para mantener conexiones WhatsApp persistentes 24/7 en Railway. La arquitectura combina múltiples capas de redundancia y mecanismos de keepalive para garantizar que las sesiones permanezcan activas incluso en entornos con recursos limitados.

### Desafíos Superados:
- ✅ Persistencia en contenedores efímeros (Railway)
- ✅ Limitaciones de memoria (512MB)
- ✅ Desconexiones automáticas de WhatsApp
- ✅ Suspensión del navegador Chromium
- ✅ Pérdida de sesiones tras reinicios

### Solución Implementada:
**5 Capas de Protección** que trabajan en conjunto para mantener la conexión activa.

---

## 🛠️ Stack Tecnológico

### Core Technologies
```typescript
{
  "whatsapp-web.js": "^1.23.0",    // Cliente WhatsApp Web
  "puppeteer": "^18.2.0",          // Control de Chromium
  "ioredis": "^5.3.2",             // Cache y rate limiting
  "bull": "^4.11.5",               // Cola de mensajes
  "socket.io": "^4.6.1",           // Comunicación real-time
  "supabase": "^2.39.0"            // Base de datos y auth
}
```

### Infraestructura
- **Railway**: Hosting del backend
- **Volumen Persistente**: `/data/whatsapp-sessions` (Railway Volume)
- **Redis**: Cache y rate limiting
- **Supabase**: Base de datos PostgreSQL
- **Chromium**: Navegador headless (Nix package)

---

## 🔄 Flujo de Conexión

### 1. Inicialización de Sesión

```typescript
// whatsapp.service.ts - createSession()

async createSession(userId: string, accountId: string) {
  const sessionId = `user_${userId}_wa_${accountId}`;
  
  // 1. Configurar Puppeteer con optimizaciones de memoria
  const puppeteerConfig = {
    headless: true,
    timeout: 0,
    protocolTimeout: 240000, // 4 minutos
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',        // Crítico para Railway
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-background-networking',
      '--disable-renderer-backgrounding',
      // ... 20+ flags de optimización
    ],
    executablePath: '/nix/store/*/bin/chromium' // Sistema Chromium
  };
  
  // 2. Crear cliente con LocalAuth (persistencia en disco)
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionId,
      dataPath: '/data/whatsapp-sessions' // Volumen Railway
    }),
    puppeteer: puppeteerConfig,
    restartOnAuthFail: true,
    qrMaxRetries: 5,
    authTimeoutMs: 0 // Sin timeout
  });
  
  // 3. Setup event handlers
  this.setupEventHandlers(sessionData);
  
  // 4. Inicializar y esperar QR
  await client.initialize();
  await qrPromise; // Espera hasta que se genere el QR
}
```

### 2. Generación y Escaneo de QR

```typescript
// Event: 'qr'
client.on('qr', async (qr) => {
  // Generar QR como Data URL
  const qrDataUrl = await qrcode.toDataURL(qr);
  
  // Emitir SOLO el primer QR (ignorar regeneraciones)
  if (!qrEmitted) {
    qrEmitted = true;
    io.to(`user:${userId}`).emit('qr', {
      sessionId,
      qr: qrDataUrl,
      timestamp: Date.now()
    });
  }
  
  // ⚠️ NO actualizar Supabase - status permanece 'initializing'
});
```

### 3. Autenticación y Activación

```typescript
// Event: 'authenticated'
client.on('authenticated', async () => {
  // Sesión guardada localmente en /data/whatsapp-sessions
  logger.info('Session authenticated locally', { sessionId });
  
  // Verificar que archivos existen
  const sessionPath = path.join(this.sessionsPath, `session-${sessionId}`);
  if (fs.existsSync(sessionPath)) {
    logger.debug('Session files verified', { sessionPath });
  }
  
  // ⚠️ NO actualizar Supabase - esperar evento 'ready'
});

// Event: 'ready'
client.on('ready', async () => {
  sessionData.status = 'ready';
  
  // Obtener info del teléfono
  const info = client.info;
  sessionData.phoneNumber = info.wid.user;
  
  // Actualizar Supabase
  await supabaseAdmin
    .from('whatsapp_accounts')
    .update({
      status: 'ready',
      phone_number: sessionData.phoneNumber,
      profile_name: profileName,
      connected_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    })
    .eq('id', accountId);
  
  // 🚀 INICIAR MECANISMOS DE KEEPALIVE
  this.startHeartbeat(sessionId, accountId);
  this.startWatchdog(sessionId);
  this.startMouseActivity(sessionId);
  
  // Enviar email de confirmación
  await sendWhatsAppConnectedEmail(userId, sessionData.phoneNumber);
});
```

---

## 💾 Persistencia de Sesión

### LocalAuth + Railway Volume

```typescript
// Estructura de archivos en /data/whatsapp-sessions
/data/whatsapp-sessions/
  └── session-user_123_wa_456/
      ├── Default/
      │   ├── IndexedDB/
      │   ├── Local Storage/
      │   └── Session Storage/
      └── SingletonCookie
```

**Ventajas:**
- ✅ Sobrevive a reinicios del contenedor
- ✅ No requiere re-escaneo de QR
- ✅ Restauración automática al iniciar

### Lazy Loading de Sesiones

```typescript
async reloadSession(sessionId: string): Promise<SessionData | null> {
  // 1. Verificar que archivos existen en disco
  const sessionPath = path.join(this.sessionsPath, `session-${sessionId}`);
  if (!fs.existsSync(sessionPath)) {
    logger.warn('Session files not found', { sessionId, sessionPath });
    return null;
  }
  
  // 2. Obtener datos de Supabase
  const { data: account } = await supabaseAdmin
    .from('whatsapp_accounts')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  
  // 3. Recrear cliente con LocalAuth
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionId,
      dataPath: this.sessionsPath
    }),
    puppeteer: puppeteerConfig
  });
  
  // 4. Inicializar (auto-autentica desde disco)
  await client.initialize();
  
  // ✅ Sesión restaurada sin QR!
}
```

---

## 🔥 Mecanismos de Keepalive

### 1. Heartbeat (Cada 2 minutos)

**Propósito:** Mantener sesión activa y detectar desconexiones

```typescript
private startHeartbeat(sessionId: string, accountId: string): void {
  const interval = setInterval(async () => {
    // 1. Verificar estado de conexión
    const state = await client.getState();
    console.log(`💓 Heartbeat - ${sessionId} state: ${state}`);
    
    // 2. Si no está conectado, reconectar
    if (state !== 'CONNECTED') {
      console.warn(`⚠️ Not connected (${state}), reconnecting...`);
      await client.initialize();
      return;
    }
    
    // 3. Enviar presencia a WhatsApp (simula actividad)
    await client.sendPresenceAvailable();
    console.log(`✅ Presence sent for ${sessionId}`);
    
    // 4. Actualizar last_seen en Supabase
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({ 
        last_seen: new Date().toISOString(),
        last_check: new Date().toISOString(),
        status: 'ready'
      })
      .eq('id', accountId);
    
    console.log(`💓 Heartbeat completed for ${sessionId}`);
  }, 2 * 60 * 1000); // 2 minutos
  
  this.heartbeatIntervals.set(sessionId, interval);
}
```

**Funciones:**
- ✅ Verifica estado cada 2 minutos
- ✅ Envía presencia a WhatsApp
- ✅ Actualiza timestamp en DB
- ✅ Auto-reconecta si detecta desconexión

### 2. Watchdog (Cada 1 minuto)

**Propósito:** Detección agresiva de desconexiones

```typescript
private startWatchdog(sessionId: string): void {
  const interval = setInterval(async () => {
    const state = await client.getState();
    console.log(`🐕 Watchdog - ${sessionId} state: ${state}`);
    
    // Si NO está conectado, forzar reconexión inmediata
    if (state !== 'CONNECTED') {
      console.warn(`🚨 NOT CONNECTED (${state}), forcing reconnect!`);
      await client.initialize();
    }
  }, 60 * 1000); // 1 minuto - más agresivo que heartbeat
  
  this.watchdogIntervals.set(sessionId, interval);
}
```

**Funciones:**
- ✅ Chequeo más frecuente (1 min vs 2 min)
- ✅ Reconexión forzada inmediata
- ✅ Complementa al heartbeat

### 3. Mouse Activity (Cada 30 segundos)

**Propósito:** Prevenir suspensión del navegador Chromium

```typescript
private startMouseActivity(sessionId: string): void {
  const interval = setInterval(async () => {
    const session = this.sessions.get(sessionId);
    if (!session?.client.pupPage) return;
    
    // Simular actividad del usuario en el navegador
    await session.client.pupPage.evaluate(`
      // 1. Movimiento del ratón
      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      
      // 2. Actividad de teclado (no intrusiva)
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Shift',
        code: 'ShiftLeft',
        bubbles: true
      }));
      
      // 3. Wake Lock (prevenir sleep)
      if (window.navigator?.wakeLock) {
        window.navigator.wakeLock.request('screen').catch(() => {});
      }
    `);
    
    console.log(`🖱️ Mouse activity simulated for ${sessionId}`);
  }, 30 * 1000); // 30 segundos
  
  this.mouseActivityIntervals.set(sessionId, interval);
}
```

**Funciones:**
- ✅ Simula movimiento del ratón
- ✅ Simula pulsaciones de teclado
- ✅ Solicita Wake Lock API
- ✅ Previene suspensión del navegador

### 4. Session Cleanup Service

**Propósito:** Limpieza de sesiones inactivas

```typescript
// sessionCleanup.service.ts
class SessionCleanupService {
  async cleanupInactiveSessions() {
    // Buscar sesiones inactivas (>30 min sin actividad)
    const inactiveSessions = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('status', 'ready')
      .lt('last_seen', thirtyMinutesAgo);
    
    for (const session of inactiveSessions) {
      // Intentar reconectar
      await whatsappService.reconnectSession(session.session_id);
    }
  }
}
```

### 5. Auto-Reconnect con Exponential Backoff

**Propósito:** Reconexión inteligente tras desconexiones

```typescript
// autoReconnect.service.ts
class AutoReconnectService {
  async executeReconnection(
    sessionId: string,
    reconnectFn: () => Promise<boolean>,
    reason?: string
  ): Promise<ReconnectionResult> {
    
    // 1. Determinar si es desconexión permanente
    if (this.isPermanentDisconnection(reason)) {
      // Requiere re-escaneo de QR
      return { success: false, isPermanent: true };
    }
    
    // 2. Intentar reconexión con backoff exponencial
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Calcular delay: 2s, 4s, 8s, 16s, ...
      const delay = baseDelay * Math.pow(2, attempt);
      const jitteredDelay = delay * (0.5 + Math.random() * 0.5);
      
      await this.wait(jitteredDelay);
      
      const success = await reconnectFn();
      if (success) {
        return { success: true, attempts: attempt + 1 };
      }
    }
    
    return { success: false, attempts: maxRetries };
  }
  
  // Desconexiones permanentes (requieren QR)
  isPermanentDisconnection(reason: string): boolean {
    const PERMANENT_REASONS = [
      'LOGOUT', 'LOGGED_OUT', 'AUTHENTICATION_FAILURE',
      'AUTH_FAILURE', 'REVOKED', 'CONFLICT', 'REPLACED',
      'SESSION_EXPIRED', 'UNPAIRED', 'PHONE_REMOVED'
    ];
    
    return PERMANENT_REASONS.some(r => reason?.toUpperCase().includes(r));
  }
}
```

---

## 📧 Notificaciones y Alertas

### Sistema de Emails Automáticos

```typescript
// sendEmailViaFrontend.ts

// 1. WhatsApp Conectado
await sendWhatsAppConnectedEmail(userId, phoneNumber);
// Envía: "✅ Tu WhatsApp +34 602 71 84 51 está conectado"

// 2. WhatsApp Desconectado
await sendWhatsAppDisconnectedEmail(userId, phoneNumber, reason);
// Envía: "⚠️ Tu WhatsApp se ha desconectado - Razón: CONFLICT"

// 3. Desconexión Manual
await sendWhatsAppManualDisconnectEmail(userId, phoneNumber);
// Envía: "ℹ️ Has desconectado tu WhatsApp manualmente"

// 4. Reconexión Exitosa
await sendWhatsAppReconnectedEmail(userId, phoneNumber);
// Envía: "✅ Tu WhatsApp se ha reconectado automáticamente"
```

### Mensajes Automáticos de Test

```typescript
// Envío automático al conectar
client.on('ready', async () => {
  // Enviar mensaje de prueba al número configurado
  const testNumber = '+34602718451'; // Tu número
  const message = `✅ WhatsApp conectado exitosamente\n` +
                  `📱 Número: ${sessionData.phoneNumber}\n` +
                  `⏰ Hora: ${new Date().toLocaleString('es-ES')}`;
  
  await client.sendMessage(`${testNumber}@c.us`, message);
});
```

---

## 🏗️ Infraestructura Railway

### Configuración del Contenedor

```dockerfile
# nixpacks.toml (Railway)
[phases.setup]
nixPkgs = [
  'nodejs-18_x',
  'chromium',      # Navegador para Puppeteer
  'nss',
  'freetype',
  'harfbuzz',
  'ca-certificates',
  'ttf-freefont'
]

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'node dist/index.js'
```

### Variables de Entorno

```env
# Railway Environment Variables
NODE_ENV=production
PORT=4000

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
SUPABASE_ANON_KEY=...

# Redis (Railway Plugin)
REDIS_URL=redis://...

# WhatsApp Sessions
SESSIONS_PATH=/data/whatsapp-sessions

# Puppeteer
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### Volumen Persistente

```bash
# Railway Volume Configuration
Volume Name: whatsapp-sessions
Mount Path: /data
Size: 1GB
Backup: Enabled
```

**Archivos Persistidos:**
- Sesiones de LocalAuth
- Cookies de WhatsApp Web
- IndexedDB
- Local Storage
- Session Storage

---

## 🧠 Optimizaciones de Memoria

### Configuración de Puppeteer

```typescript
const puppeteerConfig = {
  headless: true,
  timeout: 0,
  protocolTimeout: 240000,
  args: [
    // Reducción de memoria
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',        // ⭐ Crítico para Railway
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-software-rasterizer',
    
    // Desactivar features innecesarias
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
    
    // Optimizaciones de red
    '--enable-features=NetworkService,NetworkServiceInProcess',
    
    // Otras optimizaciones
    '--force-color-profile=srgb',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio',
    '--safebrowsing-disable-auto-update',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost'
  ]
};
```

### Límites de Memoria

```typescript
// Railway: 512MB RAM limit
// Chromium: ~200-300MB
// Node.js: ~100-150MB
// Redis: ~50MB
// Margen: ~50-100MB

// Monitoreo de memoria
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`
  });
}, 60000); // Cada minuto
```

---

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /settings/connections                                │   │
│  │  - Botón "Connect WhatsApp"                          │   │
│  │  - Display QR Code                                   │   │
│  │  - Status: initializing → ready                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ Socket.IO
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Railway)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WhatsAppService                                      │   │
│  │  ├─ createSession()                                  │   │
│  │  ├─ setupEventHandlers()                            │   │
│  │  ├─ startHeartbeat() ───────────┐                   │   │
│  │  ├─ startWatchdog() ────────────┤ Keepalive         │   │
│  │  └─ startMouseActivity() ───────┘                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Puppeteer + Chromium                                 │   │
│  │  - Headless browser                                   │   │
│  │  - WhatsApp Web JS                                    │   │
│  │  - LocalAuth Strategy                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Railway Volume: /data/whatsapp-sessions             │   │
│  │  └─ session-user_123_wa_456/                         │   │
│  │     ├─ Default/                                       │   │
│  │     │  ├─ IndexedDB/                                  │   │
│  │     │  ├─ Local Storage/                              │   │
│  │     │  └─ Session Storage/                            │   │
│  │     └─ SingletonCookie                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE (PostgreSQL)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  whatsapp_accounts                                    │   │
│  │  ├─ id                                                │   │
│  │  ├─ user_id                                           │   │
│  │  ├─ session_id                                        │   │
│  │  ├─ status (initializing/ready/error)                │   │
│  │  ├─ phone_number                                      │   │
│  │  ├─ connected_at                                      │   │
│  │  ├─ last_seen ◄─── Actualizado cada 2 min           │   │
│  │  └─ last_check                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   REDIS (Railway Plugin)                     │
│  - Rate Limiting                                             │
│  - Bull Queue (mensajes)                                     │
│  - Cache                                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo Completo de Conexión

### Paso a Paso

1. **Usuario hace click en "Connect WhatsApp"**
   ```
   Frontend → POST /api/whatsapp/sessions
   ```

2. **Backend crea sesión**
   ```typescript
   whatsappService.createSession(userId, accountId)
   ├─ Crear cliente Puppeteer
   ├─ Configurar LocalAuth
   ├─ Setup event handlers
   └─ Initialize client
   ```

3. **WhatsApp genera QR**
   ```typescript
   client.on('qr', (qr) => {
     // Convertir a Data URL
     // Emitir a frontend vía Socket.IO
     io.to(`user:${userId}`).emit('qr', { sessionId, qr })
   })
   ```

4. **Usuario escanea QR con teléfono**
   ```
   WhatsApp Mobile App → Scan QR → Authenticate
   ```

5. **WhatsApp autentica**
   ```typescript
   client.on('authenticated', () => {
     // Guardar sesión en /data/whatsapp-sessions
     // NO actualizar Supabase aún
   })
   ```

6. **WhatsApp está listo**
   ```typescript
   client.on('ready', async () => {
     // Actualizar Supabase: status = 'ready'
     // Iniciar keepalive mechanisms
     startHeartbeat()
     startWatchdog()
     startMouseActivity()
     // Enviar email de confirmación
     sendWhatsAppConnectedEmail()
     // Enviar mensaje de test
     sendMessage('+34602718451', '✅ Conectado')
   })
   ```

7. **Mantener conexión activa (24/7)**
   ```
   Heartbeat (2 min) → Verificar estado + Enviar presencia
   Watchdog (1 min) → Detectar desconexiones
   Mouse Activity (30 seg) → Prevenir suspensión
   ```

8. **Si se desconecta**
   ```typescript
   client.on('disconnected', async (reason) => {
     if (isPermanentDisconnection(reason)) {
       // Requiere re-escaneo de QR
       updateStatus('error')
       sendWhatsAppDisconnectedEmail()
     } else {
       // Intentar reconexión automática
       autoReconnectService.executeReconnection()
     }
   })
   ```

---

## 📈 Métricas y Monitoreo

### Indicadores Clave

```typescript
// Health Check Endpoint
GET /api/health

Response:
{
  "status": "healthy",
  "uptime": 86400,
  "memory": {
    "rss": "256MB",
    "heapUsed": "128MB"
  },
  "whatsapp": {
    "activeSessions": 5,
    "readySessions": 4,
    "initializingSessions": 1
  },
  "redis": {
    "connected": true,
    "ping": "PONG"
  },
  "supabase": {
    "connected": true
  }
}
```

### Logs Importantes

```bash
# Conexión exitosa
✅ Server running on port 4000
✅ Redis connected and ready
🚀 Initializing WhatsApp client
📱 First QR generated
🔐 Session authenticated locally
✅ Session ready
💓 Starting enhanced heartbeat
🐕 Starting watchdog
🖱️ Starting mouse activity simulation

# Keepalive activo
💓 Heartbeat - session state: CONNECTED
✅ Presence sent
🐕 Watchdog - session state: CONNECTED
🖱️ Mouse activity simulated

# Desconexión detectada
⚠️ Session disconnected: CONFLICT
🔄 Starting auto-reconnection
✅ Reconnection successful
```

---

## 🎯 Conclusión

La arquitectura de WhaHook implementa **5 capas de protección** para garantizar conexiones WhatsApp persistentes:

1. **LocalAuth + Railway Volume** - Persistencia física
2. **Heartbeat (2 min)** - Verificación y presencia
3. **Watchdog (1 min)** - Detección agresiva
4. **Mouse Activity (30 seg)** - Anti-suspensión
5. **Auto-Reconnect** - Recuperación inteligente

Esta combinación permite mantener sesiones activas 24/7 incluso en entornos con recursos limitados como Railway (512MB RAM).

---

**Documento creado:** 25 de Noviembre, 2025  
**Versión:** 1.0  
**Autor:** Análisis del proyecto WhaHook  
