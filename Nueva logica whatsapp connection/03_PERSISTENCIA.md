# Sistema de Persistencia

## Objetivo

Garantizar que las sesiones WhatsApp sobrevivan a:
- Reinicios del contenedor (deploys)
- Crashes del backend
- Actualizaciones de código
- Reinicio manual del servicio

**Resultado:** Los usuarios NO necesitan re-escanear el QR tras un reinicio del backend.

---

## Capas de Persistencia

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 1: LocalAuth                        │
│  Archivos de sesión en disco (Railway Volume)               │
│  /data/whatsapp-sessions/session-{sessionId}/              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 2: Supabase                         │
│  Estado y metadatos en PostgreSQL                           │
│  whatsapp_accounts table                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 3: Backup                           │
│  Backup comprimido en Supabase Storage (opcional)           │
│  whatsapp-backups bucket                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Capa 1: LocalAuth (Archivos de Sesión)

### Configuración Railway Volume

```bash
# Railway Dashboard > Service > Volumes
Volume Name: whatsapp-data
Mount Path: /data
Size: 1GB (mínimo recomendado)
```

### Estructura de Archivos

```
/data/whatsapp-sessions/
├── session-user_abc123_wa_def456/
│   ├── Default/
│   │   ├── IndexedDB/           # Base de datos WhatsApp
│   │   ├── Local Storage/       # Configuración local
│   │   └── Session Storage/     # Datos de sesión
│   ├── SingletonCookie          # Cookie de instancia única
│   ├── SingletonLock            # Lock file (Chromium)
│   └── SingletonSocket          # Socket file (Chromium)
└── session-user_xyz789_wa_ghi012/
    └── ...
```

### Archivos Críticos

| Archivo | Propósito | Requerido |
|---------|-----------|-----------|
| `Default/IndexedDB/` | Datos de mensajes y contactos | Sí |
| `Default/Local Storage/` | Credenciales de sesión | Sí |
| `Default/Session Storage/` | Estado temporal | Sí |
| `SingletonCookie` | Identificador de instancia | No* |
| `SingletonLock` | Lock de Chromium | No* |

> *Los archivos Singleton deben **eliminarse** antes de restaurar una sesión para evitar conflictos.

---

## Capa 2: Supabase (Estado)

La tabla `whatsapp_accounts` almacena el estado de cada sesión:

```sql
-- Campos relevantes para persistencia
session_id TEXT UNIQUE NOT NULL,  -- Identificador para LocalAuth
status TEXT NOT NULL,              -- Estado actual
phone_number TEXT,                 -- Número conectado
last_seen TIMESTAMPTZ,             -- Última actividad
connected_at TIMESTAMPTZ           -- Fecha de conexión
```

### Sincronización Estado-Archivos

| Estado Supabase | Archivos Disco | Acción al Reiniciar |
|-----------------|----------------|---------------------|
| `ready` | Existen | Restaurar sesión |
| `ready` | No existen | Marcar como `error` |
| `error` | Existen | Intentar restaurar |
| `error` | No existen | Ignorar |
| `initializing` | - | Eliminar registro huérfano |

---

## Capa 3: Backup (Opcional)

### Backup Automático Diario

```typescript
// services/backup.service.ts
import cron from 'node-cron';
import tar from 'tar';

class BackupService {
  private readonly BACKUP_HOUR = 3; // 3 AM
  private readonly RETENTION_DAYS = 7;
  
  start(): void {
    // Ejecutar diariamente a las 3 AM
    cron.schedule(`0 ${this.BACKUP_HOUR} * * *`, () => {
      this.createBackup();
    });
  }
  
  async createBackup(): Promise<void> {
    const sessions = await this.getActiveSessions();
    
    for (const session of sessions) {
      try {
        await this.backupSession(session.session_id);
      } catch (error) {
        console.error(`Backup failed for ${session.session_id}:`, error);
      }
    }
    
    // Limpiar backups antiguos
    await this.cleanupOldBackups();
  }
  
  private async backupSession(sessionId: string): Promise<void> {
    const sessionPath = path.join(SESSIONS_PATH, `session-${sessionId}`);
    
    if (!fs.existsSync(sessionPath)) {
      console.log(`Session ${sessionId} not found on disk, skipping backup`);
      return;
    }
    
    // Crear archivo comprimido
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${sessionId}_${timestamp}.tar.gz`;
    const tempPath = path.join('/tmp', filename);
    
    await tar.create(
      { gzip: true, file: tempPath, cwd: SESSIONS_PATH },
      [`session-${sessionId}`]
    );
    
    // Subir a Supabase Storage
    const fileBuffer = fs.readFileSync(tempPath);
    
    await supabaseAdmin.storage
      .from('whatsapp-backups')
      .upload(`sessions/${filename}`, fileBuffer, {
        contentType: 'application/gzip'
      });
    
    // Limpiar archivo temporal
    fs.unlinkSync(tempPath);
    
    console.log(`Backup created: ${filename}`);
  }
}
```

---

## Restauración al Iniciar

### Flujo de Restauración

```
Backend Inicia
      │
      ▼
┌─────────────────────┐
│ Conectar Supabase   │
│ Conectar Redis      │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│ Obtener sesiones    │
│ status = 'ready'    │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐     ┌─────────────────────┐
│ ¿Archivos existen?  │─NO─>│ Restaurar de backup │
└─────────────────────┘     │ o marcar error      │
      │ SÍ                  └─────────────────────┘
      ▼
┌─────────────────────┐
│ Limpiar lock files  │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│ Crear cliente       │
│ LocalAuth           │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│ client.initialize() │
│ (auto-restaura)     │
└─────────────────────┘
      │
      ▼
┌─────────────────────┐
│ Verificar conexión  │
│ Iniciar keepalive   │
└─────────────────────┘
```

### Implementación

```typescript
// whatsapp.service.ts
async restoreActiveSessions(): Promise<void> {
  console.log('Restoring active WhatsApp sessions...');
  
  // 1. Obtener sesiones que deberían estar activas
  const { data: sessions } = await supabaseAdmin
    .from('whatsapp_accounts')
    .select('*')
    .eq('status', 'ready');
  
  if (!sessions?.length) {
    console.log('No active sessions to restore');
    return;
  }
  
  console.log(`Found ${sessions.length} session(s) to restore`);
  
  // 2. Restaurar cada sesión
  for (const account of sessions) {
    try {
      await this.restoreSession(account);
    } catch (error) {
      console.error(`Failed to restore ${account.session_id}:`, error);
      
      // Marcar como error si no se puede restaurar
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          status: 'error',
          error_message: 'Failed to restore session after restart'
        })
        .eq('id', account.id);
    }
  }
}

private async restoreSession(account: WhatsAppAccount): Promise<void> {
  const { session_id, user_id, id: accountId } = account;
  const sessionPath = path.join(SESSIONS_PATH, `session-${session_id}`);
  
  // Verificar archivos en disco
  if (!fs.existsSync(sessionPath)) {
    console.log(`Session files not found for ${session_id}`);
    
    // Intentar restaurar desde backup
    const restored = await this.restoreFromBackup(session_id);
    if (!restored) {
      throw new Error('Session files not found and no backup available');
    }
  }
  
  // Limpiar lock files (evita "browser is already running")
  this.cleanLockFiles(sessionPath);
  
  // Crear cliente
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: session_id,
      dataPath: SESSIONS_PATH
    }),
    puppeteer: this.getPuppeteerConfig()
  });
  
  // Registrar en memoria
  const sessionData: SessionData = {
    sessionId: session_id,
    userId: user_id,
    accountId,
    client,
    status: 'initializing',
    phoneNumber: account.phone_number,
    lastActivity: Date.now(),
    createdAt: Date.now()
  };
  
  this.sessions.set(session_id, sessionData);
  this.setupEventHandlers(sessionData);
  
  // Inicializar (LocalAuth restaura automáticamente)
  await client.initialize();
  
  // Esperar a que esté listo (máximo 30 segundos)
  await this.waitForReady(session_id, 30000);
  
  console.log(`Session ${session_id} restored successfully`);
}

private cleanLockFiles(sessionPath: string): void {
  const lockFiles = [
    'SingletonCookie',
    'SingletonLock', 
    'SingletonSocket',
    'Default/SingletonCookie',
    'Default/SingletonLock',
    'Default/SingletonSocket'
  ];
  
  for (const lockFile of lockFiles) {
    const filePath = path.join(sessionPath, lockFile);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Removed lock file: ${lockFile}`);
      } catch (error) {
        console.warn(`Failed to remove ${lockFile}:`, error.message);
      }
    }
  }
}

private async waitForReady(sessionId: string, timeoutMs: number): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const session = this.sessions.get(sessionId);
    
    if (session?.status === 'ready') {
      return;
    }
    
    if (session?.status === 'error') {
      throw new Error('Session entered error state');
    }
    
    await this.sleep(1000);
  }
  
  throw new Error('Timeout waiting for session ready');
}
```

---

## Restauración desde Backup

```typescript
private async restoreFromBackup(sessionId: string): Promise<boolean> {
  console.log(`Attempting to restore ${sessionId} from backup...`);
  
  try {
    // Buscar backup más reciente
    const { data: files } = await supabaseAdmin.storage
      .from('whatsapp-backups')
      .list('sessions', {
        search: sessionId,
        sortBy: { column: 'created_at', order: 'desc' },
        limit: 1
      });
    
    if (!files?.length) {
      console.log('No backup found');
      return false;
    }
    
    const latestBackup = files[0];
    console.log(`Found backup: ${latestBackup.name}`);
    
    // Descargar backup
    const { data } = await supabaseAdmin.storage
      .from('whatsapp-backups')
      .download(`sessions/${latestBackup.name}`);
    
    if (!data) {
      console.error('Failed to download backup');
      return false;
    }
    
    // Guardar temporalmente
    const tempPath = path.join('/tmp', latestBackup.name);
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);
    
    // Extraer
    await tar.extract({
      file: tempPath,
      cwd: SESSIONS_PATH
    });
    
    // Limpiar
    fs.unlinkSync(tempPath);
    
    console.log(`Backup restored successfully for ${sessionId}`);
    return true;
    
  } catch (error) {
    console.error('Backup restoration failed:', error);
    return false;
  }
}
```

---

## Limpieza de Sesiones Huérfanas

```typescript
// Ejecutar periódicamente (cada hora)
async cleanupOrphanSessions(): Promise<void> {
  // Sesiones en Supabase con status 'initializing' por más de 10 minutos
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const { data: orphans } = await supabaseAdmin
    .from('whatsapp_accounts')
    .select('id, session_id')
    .eq('status', 'initializing')
    .lt('created_at', tenMinutesAgo);
  
  if (!orphans?.length) return;
  
  console.log(`Found ${orphans.length} orphan session(s)`);
  
  for (const orphan of orphans) {
    // Eliminar registro
    await supabaseAdmin
      .from('whatsapp_accounts')
      .delete()
      .eq('id', orphan.id);
    
    // Eliminar archivos si existen
    const sessionPath = path.join(SESSIONS_PATH, `session-${orphan.session_id}`);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true });
    }
    
    console.log(`Cleaned up orphan session: ${orphan.session_id}`);
  }
}
```

---

## Verificación de Integridad

```typescript
async verifySessionIntegrity(sessionId: string): Promise<boolean> {
  const sessionPath = path.join(SESSIONS_PATH, `session-${sessionId}`);
  
  const requiredPaths = [
    'Default/IndexedDB',
    'Default/Local Storage',
    'Default/Session Storage'
  ];
  
  for (const requiredPath of requiredPaths) {
    const fullPath = path.join(sessionPath, requiredPath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Missing required path: ${requiredPath}`);
      return false;
    }
  }
  
  return true;
}
```

---

## Métricas de Persistencia

| Métrica | Valor Típico |
|---------|--------------|
| Tamaño por sesión | 50-100 MB |
| Backup comprimido | 10-30 MB |
| Tiempo de restauración (disco) | 5-10 segundos |
| Tiempo de restauración (backup) | 15-30 segundos |
| Retención de backups | 7 días |

---

**Documento:** 03_PERSISTENCIA.md  
**Versión:** 2.0
