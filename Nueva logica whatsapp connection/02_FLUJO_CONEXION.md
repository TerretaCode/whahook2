# Flujo de Conexión WhatsApp

## Diagrama de Secuencia

```
Usuario          Frontend           Backend            WhatsApp
   │                │                  │                   │
   │ Click Connect  │                  │                   │
   │───────────────>│                  │                   │
   │                │  socket.emit     │                   │
   │                │  'whatsapp:create'                   │
   │                │─────────────────>│                   │
   │                │                  │                   │
   │                │                  │ createSession()   │
   │                │                  │──────────────────>│
   │                │                  │                   │
   │                │                  │     QR Code       │
   │                │                  │<──────────────────│
   │                │  'whatsapp:qr'   │                   │
   │                │<─────────────────│                   │
   │  Mostrar QR    │                  │                   │
   │<───────────────│                  │                   │
   │                │                  │                   │
   │ Escanear QR    │                  │                   │
   │ (móvil)        │                  │  authenticated    │
   │────────────────│──────────────────│<──────────────────│
   │                │                  │                   │
   │                │                  │     ready         │
   │                │                  │<──────────────────│
   │                │                  │                   │
   │                │                  │ updateSupabase()  │
   │                │                  │ startKeepalive()  │
   │                │                  │ sendEmail()       │
   │                │                  │                   │
   │                │ 'whatsapp:ready' │                   │
   │                │<─────────────────│                   │
   │  Conectado!    │                  │                   │
   │<───────────────│                  │                   │
```

---

## Estados de la Sesión

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ initializing │────>│      qr      │────>│authenticated │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    error     │<────│    error     │     │    ready     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                                │ disconnect
                                                ▼
                                         ┌──────────────┐
                                         │    error     │
                                         └──────────────┘
```

| Estado | Descripción | Acción en Supabase |
|--------|-------------|-------------------|
| `initializing` | Creando sesión, esperando QR | INSERT registro |
| `qr` | QR generado, esperando escaneo | NO actualizar |
| `authenticated` | Usuario escaneó QR | NO actualizar |
| `ready` | Conexión establecida | UPDATE status='ready' |
| `error` | Error o desconexión | UPDATE status='error' |

> **Importante:** Solo actualizamos Supabase en `ready` y `error`. Los estados intermedios son transitorios y no deben persistirse para evitar inconsistencias.

---

## Paso 1: Usuario Inicia Conexión

### Frontend
```typescript
// /settings/connections/page.tsx
const handleConnect = async () => {
  setStatus('connecting');
  
  // Crear registro en Supabase
  const { data: account } = await supabase
    .from('whatsapp_accounts')
    .insert({
      user_id: user.id,
      session_id: `user_${user.id}_wa_${crypto.randomUUID()}`,
      status: 'initializing',
      name: 'WhatsApp Principal'
    })
    .select()
    .single();
  
  // Solicitar conexión al backend
  socket.emit('whatsapp:create', {
    accountId: account.id,
    sessionId: account.session_id
  });
};
```

### Backend
```typescript
// Socket handler
socket.on('whatsapp:create', async ({ accountId, sessionId }) => {
  const userId = socket.data.userId;
  
  try {
    await whatsappService.createSession(userId, accountId, sessionId);
  } catch (error) {
    socket.emit('whatsapp:error', {
      sessionId,
      error: error.message
    });
  }
});
```

---

## Paso 2: Crear Sesión WhatsApp

```typescript
// whatsapp.service.ts
async createSession(userId: string, accountId: string, sessionId: string): Promise<void> {
  // 1. Verificar que no existe sesión activa
  if (this.sessions.has(sessionId)) {
    throw new Error('Session already exists');
  }

  // 2. Configurar Puppeteer optimizado para Railway
  const puppeteerConfig = this.getPuppeteerConfig();

  // 3. Crear cliente WhatsApp
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionId,
      dataPath: process.env.SESSIONS_PATH || '/data/whatsapp-sessions'
    }),
    puppeteer: puppeteerConfig,
    qrMaxRetries: 3,
    authTimeoutMs: 60000
  });

  // 4. Registrar sesión en memoria
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

  // 5. Configurar event handlers
  this.setupEventHandlers(sessionData);

  // 6. Inicializar cliente
  await client.initialize();
}
```

---

## Paso 3: Generación de QR

```typescript
// Event handler para QR
private setupEventHandlers(session: SessionData): void {
  const { client, sessionId, userId } = session;
  let qrEmitted = false;

  client.on('qr', async (qr: string) => {
    // Emitir solo el primer QR (evitar múltiples regeneraciones)
    if (qrEmitted) {
      console.log(`QR regenerated for ${sessionId}, ignoring`);
      return;
    }
    qrEmitted = true;
    
    session.status = 'qr';
    
    // Generar QR como imagen base64
    const qrDataUrl = await QRCode.toDataURL(qr, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    
    // Emitir al usuario específico
    this.io.to(`user:${userId}`).emit('whatsapp:qr', {
      sessionId,
      qr: qrDataUrl,
      timestamp: Date.now()
    });
    
    console.log(`QR emitted for session ${sessionId}`);
  });
}
```

---

## Paso 4: Autenticación

```typescript
client.on('authenticated', () => {
  session.status = 'authenticated';
  console.log(`Session ${sessionId} authenticated`);
  
  // NO actualizar Supabase aquí
  // La sesión está guardada localmente en disco
  // Esperamos el evento 'ready' para confirmar
});
```

---

## Paso 5: Conexión Lista (Ready)

```typescript
client.on('ready', async () => {
  session.status = 'ready';
  
  // Obtener información del teléfono
  const info = client.info;
  session.phoneNumber = info.wid.user;
  
  // Actualizar Supabase (único momento para 'ready')
  await supabaseAdmin
    .from('whatsapp_accounts')
    .update({
      status: 'ready',
      phone_number: session.phoneNumber,
      profile_name: info.pushname || null,
      connected_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      error_message: null
    })
    .eq('id', session.accountId);
  
  // Iniciar mecanismos de keepalive
  this.startKeepalive(sessionId);
  
  // Notificar al frontend
  this.io.to(`user:${session.userId}`).emit('whatsapp:ready', {
    sessionId,
    phoneNumber: session.phoneNumber,
    profileName: info.pushname
  });
  
  // Enviar email de confirmación
  await this.sendConnectionEmail(session.userId, session.phoneNumber);
  
  console.log(`Session ${sessionId} ready - Phone: ${session.phoneNumber}`);
});
```

---

## Paso 6: Manejo de Desconexiones

```typescript
client.on('disconnected', async (reason: string) => {
  console.log(`Session ${sessionId} disconnected: ${reason}`);
  
  // Clasificar tipo de desconexión
  const isPermanent = this.isPermanentDisconnection(reason);
  
  if (isPermanent) {
    // Desconexión permanente: requiere nuevo QR
    session.status = 'error';
    
    await supabaseAdmin
      .from('whatsapp_accounts')
      .update({
        status: 'error',
        error_message: `Desconectado: ${reason}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.accountId);
    
    // Limpiar sesión
    this.stopKeepalive(sessionId);
    this.sessions.delete(sessionId);
    
    // Notificar
    this.io.to(`user:${session.userId}`).emit('whatsapp:disconnected', {
      sessionId,
      reason,
      requiresReconnect: true
    });
    
    await this.sendDisconnectionEmail(session.userId, session.phoneNumber, reason);
    
  } else {
    // Desconexión temporal: intentar reconexión automática
    await this.attemptReconnection(session, reason);
  }
});

// Clasificación de desconexiones
private isPermanentDisconnection(reason: string): boolean {
  const PERMANENT_REASONS = [
    'LOGOUT',
    'CONFLICT',          // Sesión abierta en otro dispositivo
    'UNPAIRED',          // Usuario desvinculó desde el móvil
    'UNPAIRED_IDLE',
    'TOS_BLOCK',         // Bloqueado por términos de servicio
    'SMB_TOS_BLOCK'
  ];
  
  return PERMANENT_REASONS.some(r => 
    reason.toUpperCase().includes(r)
  );
}
```

---

## Paso 7: Reconexión Automática

```typescript
private async attemptReconnection(
  session: SessionData, 
  reason: string
): Promise<void> {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 5000; // 5 segundos
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Delay exponencial: 5s, 10s, 20s
    const delay = BASE_DELAY * Math.pow(2, attempt - 1);
    console.log(`Reconnection attempt ${attempt}/${MAX_RETRIES} in ${delay}ms`);
    
    await this.sleep(delay);
    
    try {
      // Reinicializar cliente
      await session.client.initialize();
      
      // Verificar conexión
      const state = await session.client.getState();
      
      if (state === 'CONNECTED') {
        console.log(`Reconnection successful for ${session.sessionId}`);
        
        // Actualizar estado
        session.status = 'ready';
        await supabaseAdmin
          .from('whatsapp_accounts')
          .update({
            status: 'ready',
            error_message: null,
            last_seen: new Date().toISOString()
          })
          .eq('id', session.accountId);
        
        // Notificar reconexión exitosa
        await this.sendReconnectionEmail(session.userId, session.phoneNumber);
        
        return;
      }
    } catch (error) {
      console.error(`Reconnection attempt ${attempt} failed:`, error.message);
    }
  }
  
  // Todos los intentos fallaron
  console.error(`All reconnection attempts failed for ${session.sessionId}`);
  
  session.status = 'error';
  await supabaseAdmin
    .from('whatsapp_accounts')
    .update({
      status: 'error',
      error_message: `Reconexión fallida tras ${MAX_RETRIES} intentos: ${reason}`
    })
    .eq('id', session.accountId);
  
  this.io.to(`user:${session.userId}`).emit('whatsapp:disconnected', {
    sessionId: session.sessionId,
    reason: 'Reconnection failed',
    requiresReconnect: true
  });
}
```

---

## Paso 8: Desconexión Manual

```typescript
// Socket handler para desconexión manual
socket.on('whatsapp:destroy', async ({ sessionId }) => {
  const userId = socket.data.userId;
  
  // Verificar propiedad
  const session = this.sessions.get(sessionId);
  if (!session || session.userId !== userId) {
    socket.emit('whatsapp:error', { error: 'Session not found' });
    return;
  }
  
  await this.destroySession(sessionId, 'manual');
});

async destroySession(sessionId: string, reason: string = 'unknown'): Promise<void> {
  const session = this.sessions.get(sessionId);
  if (!session) return;
  
  // Detener keepalive
  this.stopKeepalive(sessionId);
  
  // Cerrar cliente WhatsApp
  try {
    await session.client.logout();
    await session.client.destroy();
  } catch (error) {
    console.error(`Error destroying client:`, error.message);
  }
  
  // Actualizar Supabase
  await supabaseAdmin
    .from('whatsapp_accounts')
    .update({
      status: 'error',
      error_message: reason === 'manual' ? 'Desconectado manualmente' : reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.accountId);
  
  // Eliminar archivos de sesión (opcional, mantener para reconexión)
  // await this.deleteSessionFiles(sessionId);
  
  // Eliminar de memoria
  this.sessions.delete(sessionId);
  
  // Notificar
  this.io.to(`user:${session.userId}`).emit('whatsapp:disconnected', {
    sessionId,
    reason,
    requiresReconnect: true
  });
  
  console.log(`Session ${sessionId} destroyed: ${reason}`);
}
```

---

## Manejo de Errores

### Error: Timeout de QR

```typescript
// Si el QR no se escanea en 60 segundos
client.on('qr_expired', async () => {
  session.status = 'error';
  
  await supabaseAdmin
    .from('whatsapp_accounts')
    .update({
      status: 'error',
      error_message: 'QR expirado - tiempo de escaneo agotado'
    })
    .eq('id', session.accountId);
  
  this.sessions.delete(sessionId);
  
  this.io.to(`user:${session.userId}`).emit('whatsapp:error', {
    sessionId,
    error: 'QR_EXPIRED',
    message: 'El código QR ha expirado. Por favor, intenta de nuevo.'
  });
});
```

### Error: Fallo de Autenticación

```typescript
client.on('auth_failure', async (message: string) => {
  session.status = 'error';
  
  await supabaseAdmin
    .from('whatsapp_accounts')
    .update({
      status: 'error',
      error_message: `Error de autenticación: ${message}`
    })
    .eq('id', session.accountId);
  
  // Limpiar archivos corruptos
  await this.deleteSessionFiles(sessionId);
  
  this.sessions.delete(sessionId);
  
  this.io.to(`user:${session.userId}`).emit('whatsapp:error', {
    sessionId,
    error: 'AUTH_FAILURE',
    message: 'Error de autenticación. Por favor, intenta de nuevo.'
  });
});
```

---

## Tiempos Estimados

| Operación | Tiempo |
|-----------|--------|
| Crear sesión + generar QR | 5-10 segundos |
| Usuario escanea QR | Variable (usuario) |
| Autenticación → Ready | 3-7 segundos |
| Reconexión automática | 15-60 segundos |
| **Total conexión nueva** | **15-30 segundos** |

---

**Documento:** 02_FLUJO_CONEXION.md  
**Versión:** 2.0
