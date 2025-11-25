# 🔧 Detalles Técnicos - Conexión WhatsApp

## 📋 Índice
1. [Redis y Rate Limiting](#redis-y-rate-limiting)
2. [Bull Queue](#bull-queue)
3. [Docker y Chromium](#docker-y-chromium)
4. [LocalAuth vs RemoteAuth](#localauth-vs-remoteauth)
5. [Gestión de Eventos](#gestión-de-eventos)
6. [Manejo de Errores](#manejo-de-errores)
7. [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)
8. [Troubleshooting](#troubleshooting)

---

## 🔴 Redis y Rate Limiting

### Configuración de Redis

```typescript
// config/redis.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  
  // Estrategia de reconexión
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`🔄 Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  
  // Reconectar solo en ciertos errores
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// Event listeners
redis.on('connect', () => console.log('🔗 Redis connecting...'));
redis.on('ready', () => console.log('✅ Redis connected and ready'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));
redis.on('close', () => console.log('🔌 Redis connection closed'));
redis.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
```

### Rate Limiting con Redis

```typescript
// services/rateLimiter.service.ts
import { redis } from '../config/redis';

class RateLimiterService {
  /**
   * Rate limit por usuario
   * Límite: 30 mensajes por minuto
   */
  async checkUserRateLimit(userId: string): Promise<boolean> {
    const key = `ratelimit:user:${userId}`;
    const limit = 30;
    const window = 60; // segundos
    
    const current = await redis.incr(key);
    
    if (current === 1) {
      // Primera request, establecer TTL
      await redis.expire(key, window);
    }
    
    if (current > limit) {
      console.warn(`⚠️ Rate limit exceeded for user ${userId}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Rate limit por sesión WhatsApp
   * Límite: 10 mensajes por minuto (más conservador)
   */
  async checkSessionRateLimit(sessionId: string): Promise<boolean> {
    const key = `ratelimit:session:${sessionId}`;
    const limit = 10;
    const window = 60;
    
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, window);
    }
    
    return current <= limit;
  }
  
  /**
   * Anti-spam: detectar mensajes duplicados
   */
  async checkDuplicateMessage(
    sessionId: string, 
    phoneNumber: string, 
    message: string
  ): Promise<boolean> {
    const hash = this.hashMessage(message);
    const key = `antispam:${sessionId}:${phoneNumber}:${hash}`;
    
    const exists = await redis.exists(key);
    
    if (exists) {
      console.warn(`⚠️ Duplicate message detected`);
      return false; // Es duplicado
    }
    
    // Guardar por 5 minutos
    await redis.setex(key, 300, '1');
    return true; // No es duplicado
  }
  
  private hashMessage(message: string): string {
    // Simple hash para detectar duplicados
    return Buffer.from(message).toString('base64').substring(0, 20);
  }
}

export const rateLimiterService = new RateLimiterService();
```

### Cache de Validación de Teléfonos

```typescript
// services/phoneValidation.service.ts
class PhoneValidationService {
  /**
   * Validar número de teléfono con cache
   */
  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    const cacheKey = `phone:valid:${phoneNumber}`;
    
    // Buscar en cache
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return cached === '1';
    }
    
    // Validar con WhatsApp
    try {
      const isValid = await this.checkWithWhatsApp(phoneNumber);
      
      // Guardar en cache por 24 horas
      await redis.setex(cacheKey, 86400, isValid ? '1' : '0');
      
      return isValid;
    } catch (error) {
      return false;
    }
  }
  
  private async checkWithWhatsApp(phoneNumber: string): Promise<boolean> {
    // Implementación de validación con WhatsApp
    // ...
  }
}
```

---

## 📬 Bull Queue

### Configuración de Cola de Mensajes

```typescript
// config/queue.ts
import Bull from 'bull';
import { redis } from './redis';

// Cola para mensajes WhatsApp
export const messageQueue = new Bull('whatsapp-messages', {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Event listeners
messageQueue.on('completed', (job) => {
  console.log(`✅ Message sent: ${job.id}`);
});

messageQueue.on('failed', (job, err) => {
  console.error(`❌ Message failed: ${job.id}`, err);
});

messageQueue.on('stalled', (job) => {
  console.warn(`⚠️ Message stalled: ${job.id}`);
});
```

### Procesamiento de Mensajes

```typescript
// services/messageBatching.service.ts
class MessageBatchingService {
  constructor() {
    this.setupProcessor();
  }
  
  private setupProcessor() {
    messageQueue.process(async (job) => {
      const { sessionId, phoneNumber, message, mediaUrl } = job.data;
      
      console.log(`📤 Processing message for ${phoneNumber}`);
      
      // Obtener sesión
      const session = whatsappService.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Rate limiting
      const canSend = await rateLimiterService.checkSessionRateLimit(sessionId);
      if (!canSend) {
        throw new Error('Rate limit exceeded');
      }
      
      // Enviar mensaje
      const formattedNumber = `${phoneNumber}@c.us`;
      
      if (mediaUrl) {
        // Mensaje con media
        const media = await MessageMedia.fromUrl(mediaUrl);
        await session.client.sendMessage(formattedNumber, media, {
          caption: message
        });
      } else {
        // Mensaje de texto
        await session.client.sendMessage(formattedNumber, message);
      }
      
      console.log(`✅ Message sent to ${phoneNumber}`);
      
      return { success: true, timestamp: Date.now() };
    });
  }
  
  /**
   * Agregar mensaje a la cola
   */
  async queueMessage(
    sessionId: string,
    phoneNumber: string,
    message: string,
    mediaUrl?: string,
    priority: number = 0
  ): Promise<Bull.Job> {
    return await messageQueue.add(
      {
        sessionId,
        phoneNumber,
        message,
        mediaUrl
      },
      {
        priority, // 0 = normal, 1 = high, -1 = low
        delay: 0
      }
    );
  }
  
  /**
   * Programar mensaje para envío futuro
   */
  async scheduleMessage(
    sessionId: string,
    phoneNumber: string,
    message: string,
    sendAt: Date
  ): Promise<Bull.Job> {
    const delay = sendAt.getTime() - Date.now();
    
    return await messageQueue.add(
      {
        sessionId,
        phoneNumber,
        message
      },
      {
        delay: Math.max(0, delay)
      }
    );
  }
}

export const messageBatchingService = new MessageBatchingService();
```

---

## 🐳 Docker y Chromium

### Nixpacks Configuration (Railway)

```toml
# nixpacks.toml
[phases.setup]
nixPkgs = [
  'nodejs-18_x',
  'chromium',           # Navegador headless
  'nss',                # Network Security Services
  'freetype',           # Font rendering
  'harfbuzz',           # Text shaping
  'ca-certificates',    # SSL certificates
  'ttf-freefont',       # Fonts
  'fontconfig',         # Font configuration
  'liberation_ttf'      # Liberation fonts
]

[phases.install]
cmds = ['npm ci --production']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'node dist/index.js'
```

### Detección de Chromium

```typescript
// whatsapp.service.ts - createSession()

// CRITICAL: Detectar Chromium del sistema
const fs = require('fs');
const { execSync } = require('child_process');

// 1. Intentar con 'which' command (Nix)
let whichChromium;
try {
  whichChromium = execSync(
    'which chromium 2>/dev/null || which chromium-browser 2>/dev/null',
    { encoding: 'utf8' }
  ).trim();
} catch (e) {
  whichChromium = null;
}

// 2. Buscar en rutas conocidas
const possiblePaths = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  whichChromium,
  '/nix/store/*/bin/chromium',        // Nix (Railway)
  '/usr/bin/chromium',                 // Linux
  '/usr/bin/chromium-browser',         // Ubuntu
  '/usr/bin/google-chrome',            // Google Chrome
  '/usr/bin/google-chrome-stable'      // Chrome Stable
].filter(Boolean);

// 3. Encontrar el primero que existe
let chromiumPath = possiblePaths.find(p => p && fs.existsSync(p));

if (!chromiumPath) {
  logger.error('Chromium not found', { possiblePaths });
  throw new Error('Chromium executable not found. Please install Chromium.');
}

puppeteerConfig.executablePath = chromiumPath;
logger.info('Using system Chromium', { chromiumPath });
```

### Variables de Entorno para Puppeteer

```env
# .env
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
```

---

## 💾 LocalAuth vs RemoteAuth

### LocalAuth (Actual - Recomendado)

**Ventajas:**
- ✅ Más rápido (archivos locales)
- ✅ No requiere base de datos externa
- ✅ Funciona con Railway Volume
- ✅ Menor latencia

**Desventajas:**
- ⚠️ Requiere volumen persistente
- ⚠️ No compartible entre instancias

```typescript
// LocalAuth con Railway Volume
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: sessionId,
    dataPath: '/data/whatsapp-sessions' // Railway Volume
  })
});
```

### RemoteAuth (Alternativa)

**Ventajas:**
- ✅ Compartible entre instancias
- ✅ Backup automático en MongoDB
- ✅ Escalable horizontalmente

**Desventajas:**
- ⚠️ Más lento (red)
- ⚠️ Requiere MongoDB
- ⚠️ Mayor latencia

```typescript
// RemoteAuth con MongoDB (no usado actualmente)
import { RemoteAuth } from 'wwebjs-mongo';
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose';

const store = new MongoStore({ mongoose });

const client = new Client({
  authStrategy: new RemoteAuth({
    clientId: sessionId,
    store,
    backupSyncIntervalMs: 300000 // 5 minutos
  })
});
```

### Comparación

| Feature | LocalAuth | RemoteAuth |
|---------|-----------|------------|
| Velocidad | ⚡ Rápido | 🐌 Lento |
| Persistencia | 💾 Volumen | ☁️ MongoDB |
| Escalabilidad | 📉 Limitada | 📈 Alta |
| Complejidad | ✅ Simple | ⚠️ Compleja |
| Costo | 💰 Bajo | 💰💰 Alto |
| **Recomendado** | ✅ Sí | ❌ No |

---

## 🎭 Gestión de Eventos

### Eventos Principales

```typescript
// setupEventHandlers()

// 1. QR Code
client.on('qr', async (qr) => {
  // Generar QR y emitir a frontend
  // NO actualizar Supabase
});

// 2. Loading Screen
client.on('loading_screen', (percent, message) => {
  // Mostrar progreso de carga
});

// 3. Authenticated
client.on('authenticated', async () => {
  // Sesión guardada localmente
  // NO actualizar Supabase
});

// 4. Ready
client.on('ready', async () => {
  // ✅ ACTUALIZAR SUPABASE: status = 'ready'
  // ✅ INICIAR KEEPALIVE
  // ✅ ENVIAR EMAIL
});

// 5. Message
client.on('message', async (msg) => {
  // Procesar mensaje recibido
  await this.handleIncomingMessage(msg);
});

// 6. Message Create (enviado)
client.on('message_create', async (msg) => {
  // Mensaje enviado por el usuario
});

// 7. Disconnected
client.on('disconnected', async (reason) => {
  // Determinar si es permanente o temporal
  if (isPermanentDisconnection(reason)) {
    // Requiere QR
    updateStatus('error');
    sendDisconnectedEmail();
  } else {
    // Auto-reconectar
    await autoReconnectService.executeReconnection();
  }
});

// 8. Auth Failure
client.on('auth_failure', async (msg) => {
  // Error de autenticación
  updateStatus('error');
  sendAuthFailureEmail();
});

// 9. Change State
client.on('change_state', (state) => {
  // Estado cambió: CONFLICT, UNPAIRED, etc.
  console.log(`State changed: ${state}`);
});
```

### Procesamiento de Mensajes Entrantes

```typescript
async handleIncomingMessage(msg: Message): Promise<void> {
  const { from, body, hasMedia, type } = msg;
  
  // 1. Validar que no sea del bot
  if (msg.fromMe) return;
  
  // 2. Validar que no sea de grupo (opcional)
  const chat = await msg.getChat();
  if (chat.isGroup) return;
  
  // 3. Rate limiting
  const canProcess = await rateLimiterService.checkUserRateLimit(from);
  if (!canProcess) {
    await msg.reply('⚠️ Demasiados mensajes. Por favor, espera un momento.');
    return;
  }
  
  // 4. Guardar en Supabase
  await supabaseAdmin.from('messages').insert({
    session_id: sessionId,
    phone_number: from,
    message: body,
    type,
    has_media: hasMedia,
    timestamp: new Date().toISOString()
  });
  
  // 5. Procesar con IA (si está habilitado)
  if (account.ai_enabled) {
    const response = await aiService.processMessage(body, from);
    await msg.reply(response);
  }
  
  // 6. Emitir evento a frontend
  io.to(`user:${userId}`).emit('message:received', {
    from,
    body,
    timestamp: Date.now()
  });
}
```

---

## ⚠️ Manejo de Errores

### Tipos de Errores

```typescript
// 1. Errores de Conexión
try {
  await client.initialize();
} catch (error) {
  if (error.message.includes('Chromium not found')) {
    // Chromium no instalado
    logger.error('Chromium not found');
    throw new Error('Please install Chromium');
  }
  
  if (error.message.includes('timeout')) {
    // Timeout de conexión
    logger.error('Connection timeout');
    throw new Error('Connection timeout. Please try again.');
  }
}

// 2. Errores de Autenticación
client.on('auth_failure', (msg) => {
  logger.error('Authentication failed', { msg });
  
  // Limpiar sesión corrupta
  this.destroySession(sessionId);
  
  // Notificar usuario
  sendAuthFailureEmail(userId);
});

// 3. Errores de Desconexión
client.on('disconnected', async (reason) => {
  logger.warn('Session disconnected', { sessionId, reason });
  
  // Clasificar desconexión
  if (isPermanentDisconnection(reason)) {
    // Permanente: requiere QR
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({ status: 'error', error_message: reason })
      .eq('session_id', sessionId);
    
    sendDisconnectedEmail(userId, reason);
  } else {
    // Temporal: auto-reconectar
    const result = await autoReconnectService.executeReconnection(
      sessionId,
      async () => {
        await client.initialize();
        return true;
      },
      reason
    );
    
    if (result.success) {
      sendReconnectedEmail(userId);
    } else {
      sendDisconnectedEmail(userId, reason);
    }
  }
});

// 4. Errores de Envío de Mensajes
try {
  await client.sendMessage(phoneNumber, message);
} catch (error) {
  if (error.message.includes('phone number is not registered')) {
    throw new Error('Número no registrado en WhatsApp');
  }
  
  if (error.message.includes('rate limit')) {
    throw new Error('Límite de mensajes alcanzado');
  }
  
  throw error;
}
```

### Recovery Strategies

```typescript
// errorRecovery.service.ts
class ErrorRecoveryService {
  async recoverFromError(
    sessionId: string,
    error: Error
  ): Promise<boolean> {
    logger.info('Attempting error recovery', { sessionId, error: error.message });
    
    // 1. Chromium crashed
    if (error.message.includes('Target closed')) {
      logger.info('Chromium crashed, restarting...');
      await this.restartSession(sessionId);
      return true;
    }
    
    // 2. Connection lost
    if (error.message.includes('Protocol error')) {
      logger.info('Protocol error, reconnecting...');
      await this.reconnectSession(sessionId);
      return true;
    }
    
    // 3. Session corrupted
    if (error.message.includes('Session')) {
      logger.info('Session corrupted, recreating...');
      await this.recreateSession(sessionId);
      return true;
    }
    
    return false;
  }
  
  private async restartSession(sessionId: string): Promise<void> {
    const session = whatsappService.getSession(sessionId);
    if (!session) return;
    
    await session.client.destroy();
    await session.client.initialize();
  }
  
  private async reconnectSession(sessionId: string): Promise<void> {
    const session = whatsappService.getSession(sessionId);
    if (!session) return;
    
    await session.client.initialize();
  }
  
  private async recreateSession(sessionId: string): Promise<void> {
    // Destruir sesión actual
    await whatsappService.destroySession(sessionId);
    
    // Crear nueva sesión
    const [userId, accountId] = sessionId.split('_').slice(1, 3);
    await whatsappService.createSession(userId, accountId);
  }
}
```

---

## ⚡ Optimizaciones de Rendimiento

### 1. Lazy Loading de Sesiones

```typescript
// Solo cargar sesiones cuando se necesitan
async getSessionWithReload(sessionId: string): Promise<SessionData | null> {
  // Buscar en memoria
  let session = this.sessions.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
    return session;
  }
  
  // No está en memoria, cargar desde disco
  logger.info('Session not in memory, lazy loading...', { sessionId });
  return await this.reloadSession(sessionId);
}
```

### 2. Batch Processing de Mensajes

```typescript
// Procesar mensajes en lotes
class MessageBatchProcessor {
  private batches: Map<string, Message[]> = new Map();
  
  async addMessage(sessionId: string, message: Message): Promise<void> {
    if (!this.batches.has(sessionId)) {
      this.batches.set(sessionId, []);
    }
    
    this.batches.get(sessionId)!.push(message);
    
    // Procesar cuando hay 10 mensajes o después de 5 segundos
    if (this.batches.get(sessionId)!.length >= 10) {
      await this.processBatch(sessionId);
    }
  }
  
  private async processBatch(sessionId: string): Promise<void> {
    const messages = this.batches.get(sessionId) || [];
    if (messages.length === 0) return;
    
    // Procesar todos los mensajes del lote
    await Promise.all(
      messages.map(msg => this.processMessage(msg))
    );
    
    // Limpiar lote
    this.batches.set(sessionId, []);
  }
}
```

### 3. Cache de Contactos

```typescript
// Cache de información de contactos
class ContactCacheService {
  private cache: Map<string, ContactInfo> = new Map();
  
  async getContact(phoneNumber: string): Promise<ContactInfo> {
    // Buscar en cache
    if (this.cache.has(phoneNumber)) {
      return this.cache.get(phoneNumber)!;
    }
    
    // Buscar en WhatsApp
    const contact = await client.getContactById(`${phoneNumber}@c.us`);
    const info = {
      name: contact.pushname || contact.name,
      isBlocked: contact.isBlocked,
      isWAContact: contact.isWAContact
    };
    
    // Guardar en cache por 1 hora
    this.cache.set(phoneNumber, info);
    setTimeout(() => this.cache.delete(phoneNumber), 3600000);
    
    return info;
  }
}
```

---

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. "Chromium not found"

```bash
# Verificar instalación
which chromium
which chromium-browser

# Railway: Verificar nixpacks.toml
[phases.setup]
nixPkgs = ['chromium']

# Variables de entorno
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

#### 2. "Session files not found"

```bash
# Verificar volumen Railway
ls -la /data/whatsapp-sessions

# Verificar permisos
chmod -R 755 /data/whatsapp-sessions

# Recrear sesión
DELETE FROM whatsapp_accounts WHERE session_id = 'xxx';
# Conectar de nuevo desde frontend
```

#### 3. "Memory limit exceeded"

```typescript
// Monitorear memoria
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`
  });
  
  // Si supera 450MB, limpiar
  if (usage.rss > 450 * 1024 * 1024) {
    global.gc?.(); // Forzar garbage collection
  }
}, 60000);
```

#### 4. "Session disconnects frequently"

```typescript
// Verificar keepalive mechanisms
console.log('Heartbeat active:', this.heartbeatIntervals.has(sessionId));
console.log('Watchdog active:', this.watchdogIntervals.has(sessionId));
console.log('Mouse activity active:', this.mouseActivityIntervals.has(sessionId));

// Reiniciar keepalive
this.startHeartbeat(sessionId, accountId);
this.startWatchdog(sessionId);
this.startMouseActivity(sessionId);
```

#### 5. "QR code not generating"

```typescript
// Timeout más largo
const qrPromise = new Promise<void>((resolve) => {
  const qrHandler = () => {
    client.off('qr', qrHandler);
    resolve();
  };
  client.once('qr', qrHandler);
  
  // Aumentar timeout a 60 segundos
  setTimeout(() => {
    client.off('qr', qrHandler);
    resolve();
  }, 60000); // Era 30000
});
```

---

## 📊 Métricas de Rendimiento

### Benchmarks

```typescript
// Tiempo de inicialización
Crear sesión: ~5-10 segundos
Generar QR: ~2-5 segundos
Autenticar: ~3-7 segundos
Ready: ~10-20 segundos total

// Uso de recursos
Memoria por sesión: ~80-120MB
CPU por sesión: ~5-10%
Disco por sesión: ~50-100MB

// Límites
Sesiones simultáneas: 5-10 (512MB RAM)
Mensajes por minuto: 10 por sesión
Mensajes por hora: 600 por sesión
```

### Optimización Continua

```typescript
// Limpiar sesiones inactivas cada hora
setInterval(async () => {
  const inactiveSessions = await this.findInactiveSessions();
  
  for (const sessionId of inactiveSessions) {
    logger.info('Cleaning inactive session', { sessionId });
    await this.destroySession(sessionId);
  }
}, 3600000); // 1 hora
```

---

**Documento creado:** 25 de Noviembre, 2025  
**Versión:** 1.0  
**Complemento de:** WHATSAPP_CONNECTION_ARCHITECTURE.md
