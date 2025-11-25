# Implementación Backend

## Estructura de Archivos

```
backend/src/
├── config/
│   ├── index.ts              # Configuración general
│   ├── supabase.ts           # Cliente Supabase
│   ├── redis.ts              # Cliente Redis
│   └── puppeteer.ts          # Configuración Puppeteer
├── modules/
│   ├── auth/                 # (existente)
│   └── whatsapp/
│       ├── index.ts          # Exports
│       ├── whatsapp.service.ts
│       ├── whatsapp.routes.ts
│       ├── keepalive.service.ts
│       ├── backup.service.ts
│       └── types.ts
├── utils/
│   ├── logger.ts
│   └── email.ts
├── server.ts
└── index.ts
```

---

## 1. Configuración Puppeteer

```typescript
// config/puppeteer.ts
import { execSync } from 'child_process';
import fs from 'fs';

export interface PuppeteerConfig {
  headless: boolean;
  args: string[];
  executablePath?: string;
  timeout: number;
  protocolTimeout: number;
}

export function getPuppeteerConfig(): PuppeteerConfig {
  const config: PuppeteerConfig = {
    headless: true,
    timeout: 0,
    protocolTimeout: 240000, // 4 minutos
    args: [
      // Seguridad y sandboxing
      '--no-sandbox',
      '--disable-setuid-sandbox',
      
      // Optimización de memoria (crítico para Railway)
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-software-rasterizer',
      
      // Desactivar features innecesarias
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-features=TranslateUI,BlinkGenPropertyTrees',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      
      // Optimizaciones adicionales
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--safebrowsing-disable-auto-update',
      
      // Memoria
      '--js-flags=--max-old-space-size=256'
    ]
  };

  // Detectar Chromium del sistema
  config.executablePath = findChromiumPath();
  
  return config;
}

function findChromiumPath(): string {
  // 1. Variable de entorno explícita
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (fs.existsSync(envPath)) {
      console.log(`Using Chromium from env: ${envPath}`);
      return envPath;
    }
  }
  
  // 2. Buscar con 'which' (Linux/Nix)
  try {
    const whichPath = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', {
      encoding: 'utf8'
    }).trim();
    
    if (whichPath && fs.existsSync(whichPath)) {
      console.log(`Using Chromium from which: ${whichPath}`);
      return whichPath;
    }
  } catch (e) {
    // Ignorar
  }
  
  // 3. Rutas conocidas
  const knownPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable'
  ];
  
  for (const path of knownPaths) {
    if (fs.existsSync(path)) {
      console.log(`Using Chromium from known path: ${path}`);
      return path;
    }
  }
  
  // 4. Buscar en Nix store (Railway)
  try {
    const nixPath = execSync('find /nix/store -name "chromium" -type f 2>/dev/null | head -1', {
      encoding: 'utf8'
    }).trim();
    
    if (nixPath && fs.existsSync(nixPath)) {
      console.log(`Using Chromium from Nix: ${nixPath}`);
      return nixPath;
    }
  } catch (e) {
    // Ignorar
  }
  
  throw new Error('Chromium executable not found. Please install Chromium.');
}
```

---

## 2. Tipos

```typescript
// modules/whatsapp/types.ts
import { Client } from 'whatsapp-web.js';

export type SessionStatus = 
  | 'initializing' 
  | 'qr' 
  | 'authenticated' 
  | 'ready' 
  | 'error';

export interface SessionData {
  sessionId: string;
  userId: string;
  accountId: string;
  client: Client;
  status: SessionStatus;
  phoneNumber?: string;
  profileName?: string;
  lastActivity: number;
  createdAt: number;
}

export interface WhatsAppAccount {
  id: string;
  user_id: string;
  session_id: string;
  status: string;
  phone_number: string | null;
  profile_name: string | null;
  name: string | null;
  connected_at: string | null;
  last_seen: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionParams {
  userId: string;
  accountId: string;
  sessionId: string;
}

export interface KeepaliveStatus {
  heartbeat: boolean;
  watchdog: boolean;
  browserActivity: boolean;
}
```

---

## 3. WhatsApp Service

```typescript
// modules/whatsapp/whatsapp.service.ts
import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { Server as SocketServer } from 'socket.io';
import { supabaseAdmin } from '../../config/supabase';
import { getPuppeteerConfig } from '../../config/puppeteer';
import { keepaliveService } from './keepalive.service';
import { SessionData, SessionStatus, WhatsAppAccount } from './types';
import { sendConnectionEmail, sendDisconnectionEmail } from '../../utils/email';

class WhatsAppService {
  private sessions: Map<string, SessionData> = new Map();
  private io: SocketServer | null = null;
  private sessionsPath: string;

  constructor() {
    this.sessionsPath = process.env.SESSIONS_PATH || '/data/whatsapp-sessions';
    this.ensureSessionsDirectory();
  }

  /**
   * Configurar Socket.IO server
   */
  setSocketServer(io: SocketServer): void {
    this.io = io;
  }

  /**
   * Crear nueva sesión WhatsApp
   */
  async createSession(userId: string, accountId: string, sessionId: string): Promise<void> {
    console.log(`Creating session: ${sessionId}`);
    
    // Verificar que no existe
    if (this.sessions.has(sessionId)) {
      throw new Error('Session already exists');
    }

    // Crear cliente
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: this.sessionsPath
      }),
      puppeteer: getPuppeteerConfig(),
      qrMaxRetries: 3,
      authTimeoutMs: 60000
    });

    // Registrar sesión
    const sessionData: SessionData = {
      sessionId,
      userId,
      accountId,
      client,
      status: 'initializing',
      lastActivity: Date.now(),
      createdAt: Date.now()
    };

    this.sessions.set(sessionId, sessionData);

    // Configurar eventos
    this.setupEventHandlers(sessionData);

    // Inicializar
    await client.initialize();
  }

  /**
   * Configurar event handlers para una sesión
   */
  private setupEventHandlers(session: SessionData): void {
    const { client, sessionId, userId, accountId } = session;
    let qrEmitted = false;

    // QR Code generado
    client.on('qr', async (qr: string) => {
      if (qrEmitted) return;
      qrEmitted = true;

      session.status = 'qr';

      const qrDataUrl = await QRCode.toDataURL(qr, {
        width: 256,
        margin: 2
      });

      this.emitToUser(userId, 'whatsapp:qr', {
        sessionId,
        qr: qrDataUrl,
        timestamp: Date.now()
      });

      console.log(`QR emitted for ${sessionId}`);
    });

    // Pantalla de carga
    client.on('loading_screen', (percent: number, message: string) => {
      console.log(`Loading ${sessionId}: ${percent}% - ${message}`);
    });

    // Autenticado
    client.on('authenticated', () => {
      session.status = 'authenticated';
      console.log(`Session ${sessionId} authenticated`);
    });

    // Listo para usar
    client.on('ready', async () => {
      session.status = 'ready';
      session.phoneNumber = client.info.wid.user;
      session.profileName = client.info.pushname;

      // Actualizar Supabase
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          status: 'ready',
          phone_number: session.phoneNumber,
          profile_name: session.profileName,
          connected_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          error_message: null
        })
        .eq('id', accountId);

      // Iniciar keepalive
      keepaliveService.startAll(sessionId);

      // Notificar frontend
      this.emitToUser(userId, 'whatsapp:ready', {
        sessionId,
        phoneNumber: session.phoneNumber,
        profileName: session.profileName
      });

      // Enviar email
      await sendConnectionEmail(userId, session.phoneNumber!);

      console.log(`Session ${sessionId} ready - Phone: ${session.phoneNumber}`);
    });

    // Mensaje recibido
    client.on('message', async (msg) => {
      if (msg.fromMe) return;
      
      session.lastActivity = Date.now();
      
      // Emitir al frontend
      this.emitToUser(userId, 'whatsapp:message', {
        sessionId,
        from: msg.from,
        body: msg.body,
        timestamp: msg.timestamp
      });
    });

    // Desconectado
    client.on('disconnected', async (reason: string) => {
      console.log(`Session ${sessionId} disconnected: ${reason}`);
      
      keepaliveService.stopAll(sessionId);
      
      if (this.isPermanentDisconnection(reason)) {
        await this.handlePermanentDisconnection(session, reason);
      } else {
        await this.handleTemporaryDisconnection(session, reason);
      }
    });

    // Error de autenticación
    client.on('auth_failure', async (message: string) => {
      console.error(`Auth failure for ${sessionId}: ${message}`);
      
      session.status = 'error';
      
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          status: 'error',
          error_message: `Auth failure: ${message}`
        })
        .eq('id', accountId);

      this.emitToUser(userId, 'whatsapp:error', {
        sessionId,
        error: 'AUTH_FAILURE',
        message: 'Error de autenticación. Por favor, intenta de nuevo.'
      });

      // Limpiar archivos corruptos
      await this.deleteSessionFiles(sessionId);
      this.sessions.delete(sessionId);
    });
  }

  /**
   * Destruir sesión
   */
  async destroySession(sessionId: string, reason: string = 'manual'): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`Destroying session ${sessionId}: ${reason}`);

    // Detener keepalive
    keepaliveService.stopAll(sessionId);

    // Cerrar cliente
    try {
      await session.client.logout();
      await session.client.destroy();
    } catch (error) {
      console.error('Error closing client:', error);
    }

    // Actualizar DB
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({
        status: 'error',
        error_message: reason === 'manual' ? 'Desconectado manualmente' : reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.accountId);

    // Notificar
    this.emitToUser(session.userId, 'whatsapp:disconnected', {
      sessionId,
      reason
    });

    this.sessions.delete(sessionId);
  }

  /**
   * Restaurar sesiones activas al iniciar
   */
  async restoreActiveSessions(): Promise<void> {
    console.log('Restoring active sessions...');

    const { data: accounts } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('*')
      .eq('status', 'ready');

    if (!accounts?.length) {
      console.log('No sessions to restore');
      return;
    }

    console.log(`Found ${accounts.length} session(s) to restore`);

    for (const account of accounts) {
      try {
        await this.restoreSession(account);
      } catch (error) {
        console.error(`Failed to restore ${account.session_id}:`, error);
        
        await supabaseAdmin
          .from('whatsapp_accounts')
          .update({
            status: 'error',
            error_message: 'Failed to restore after restart'
          })
          .eq('id', account.id);
      }
    }
  }

  /**
   * Restaurar una sesión específica
   */
  private async restoreSession(account: WhatsAppAccount): Promise<void> {
    const { session_id, user_id, id: accountId } = account;
    const sessionPath = path.join(this.sessionsPath, `session-${session_id}`);

    // Verificar archivos
    if (!fs.existsSync(sessionPath)) {
      throw new Error('Session files not found');
    }

    // Limpiar locks
    this.cleanLockFiles(sessionPath);

    // Crear cliente
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: session_id,
        dataPath: this.sessionsPath
      }),
      puppeteer: getPuppeteerConfig()
    });

    const sessionData: SessionData = {
      sessionId: session_id,
      userId: user_id,
      accountId,
      client,
      status: 'initializing',
      phoneNumber: account.phone_number || undefined,
      lastActivity: Date.now(),
      createdAt: Date.now()
    };

    this.sessions.set(session_id, sessionData);
    this.setupEventHandlers(sessionData);

    // Inicializar
    await client.initialize();

    // Esperar ready
    await this.waitForReady(session_id, 30000);

    console.log(`Session ${session_id} restored`);
  }

  /**
   * Obtener sesión por ID
   */
  getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Obtener todas las sesiones
   */
  getAllSessions(): Map<string, SessionData> {
    return this.sessions;
  }

  /**
   * Verificar si la desconexión es permanente
   */
  private isPermanentDisconnection(reason: string): boolean {
    const permanent = ['LOGOUT', 'CONFLICT', 'UNPAIRED', 'TOS_BLOCK'];
    return permanent.some(r => reason.toUpperCase().includes(r));
  }

  /**
   * Manejar desconexión permanente
   */
  private async handlePermanentDisconnection(
    session: SessionData,
    reason: string
  ): Promise<void> {
    session.status = 'error';

    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({
        status: 'error',
        error_message: `Desconectado: ${reason}`
      })
      .eq('id', session.accountId);

    this.emitToUser(session.userId, 'whatsapp:disconnected', {
      sessionId: session.sessionId,
      reason,
      requiresReconnect: true
    });

    await sendDisconnectionEmail(session.userId, session.phoneNumber!, reason);

    this.sessions.delete(session.sessionId);
  }

  /**
   * Manejar desconexión temporal (intentar reconexión)
   */
  private async handleTemporaryDisconnection(
    session: SessionData,
    reason: string
  ): Promise<void> {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 5000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const delay = BASE_DELAY * Math.pow(2, attempt - 1);
      console.log(`Reconnection attempt ${attempt}/${MAX_RETRIES} in ${delay}ms`);
      
      await this.sleep(delay);

      try {
        await session.client.initialize();
        
        const state = await session.client.getState();
        if (state === 'CONNECTED') {
          session.status = 'ready';
          keepaliveService.startAll(session.sessionId);
          
          await supabaseAdmin
            .from('whatsapp_accounts')
            .update({ status: 'ready', error_message: null })
            .eq('id', session.accountId);

          console.log(`Reconnected: ${session.sessionId}`);
          return;
        }
      } catch (error) {
        console.error(`Reconnection attempt ${attempt} failed`);
      }
    }

    // Falló reconexión
    await this.handlePermanentDisconnection(session, reason);
  }

  // Utilidades privadas
  
  private ensureSessionsDirectory(): void {
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
  }

  private cleanLockFiles(sessionPath: string): void {
    const lockFiles = [
      'SingletonCookie', 'SingletonLock', 'SingletonSocket',
      'Default/SingletonCookie', 'Default/SingletonLock', 'Default/SingletonSocket'
    ];

    for (const file of lockFiles) {
      const filePath = path.join(sessionPath, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      }
    }
  }

  private async deleteSessionFiles(sessionId: string): Promise<void> {
    const sessionPath = path.join(this.sessionsPath, `session-${sessionId}`);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true });
    }
  }

  private async waitForReady(sessionId: string, timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const session = this.sessions.get(sessionId);
      if (session?.status === 'ready') return;
      if (session?.status === 'error') throw new Error('Session error');
      await this.sleep(1000);
    }
    throw new Error('Timeout');
  }

  private emitToUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const whatsappService = new WhatsAppService();
```

---

## 4. Socket.IO Setup

```typescript
// modules/whatsapp/whatsapp.socket.ts
import { Server as SocketServer, Socket } from 'socket.io';
import { whatsappService } from './whatsapp.service';
import { supabaseAdmin } from '../../config/supabase';

export function setupWhatsAppSocket(io: SocketServer): void {
  whatsappService.setSocketServer(io);

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Unir al room del usuario
    socket.join(`user:${userId}`);
    console.log(`User ${userId} connected to WhatsApp socket`);

    // Crear nueva sesión
    socket.on('whatsapp:create', async ({ accountId, sessionId }) => {
      try {
        await whatsappService.createSession(userId, accountId, sessionId);
      } catch (error: any) {
        socket.emit('whatsapp:error', {
          sessionId,
          error: error.message
        });
      }
    });

    // Destruir sesión
    socket.on('whatsapp:destroy', async ({ sessionId }) => {
      const session = whatsappService.getSession(sessionId);
      
      if (!session || session.userId !== userId) {
        socket.emit('whatsapp:error', { error: 'Session not found' });
        return;
      }

      await whatsappService.destroySession(sessionId, 'manual');
    });

    // Estado de sesiones
    socket.on('whatsapp:status', async () => {
      const { data: accounts } = await supabaseAdmin
        .from('whatsapp_accounts')
        .select('*')
        .eq('user_id', userId);

      socket.emit('whatsapp:status', { accounts });
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected from WhatsApp socket`);
    });
  });
}
```

---

## 5. Integración en Server

```typescript
// server.ts (actualizado)
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { authRoutes } from './modules/auth';
import { whatsappRoutes } from './modules/whatsapp';
import { setupWhatsAppSocket } from './modules/whatsapp/whatsapp.socket';
import { whatsappService } from './modules/whatsapp/whatsapp.service';
import { authenticateSocket } from './middleware/auth.middleware';

const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: true
  }
});

// Middleware de autenticación para sockets
io.use(authenticateSocket);

// Setup WhatsApp sockets
setupWhatsAppSocket(io);

// Express middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check
app.get('/health', (req, res) => {
  const sessions = whatsappService.getAllSessions();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sessions: {
      active: sessions.size,
      ready: Array.from(sessions.values()).filter(s => s.status === 'ready').length
    }
  });
});

// Iniciar
async function start() {
  // Restaurar sesiones
  await whatsappService.restoreActiveSessions();
  
  // Iniciar servidor
  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start().catch(console.error);
```

---

## 6. Dependencias Adicionales

```json
// Agregar a package.json
{
  "dependencies": {
    "whatsapp-web.js": "^1.23.0",
    "qrcode": "^1.5.3",
    "node-cron": "^3.0.3",
    "tar": "^6.2.0",
    "ioredis": "^5.3.2",
    "bull": "^4.11.5"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5",
    "@types/node-cron": "^3.0.11",
    "@types/tar": "^6.1.7"
  }
}
```

---

**Documento:** 05_IMPLEMENTACION_BACKEND.md  
**Versión:** 2.0
