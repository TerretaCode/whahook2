# Arquitectura y Escalabilidad

## Configuración Recomendada: Un Solo Servicio

Para la mayoría de casos (hasta 100 usuarios), **un solo servicio es suficiente**.

### Capacidad por RAM

| RAM | Sesiones | Usuarios | Costo/mes |
|-----|----------|----------|-----------|
| 1GB | 12-15 | 15 | ~$5 |
| 2GB | 25-30 | 30 | ~$10 |
| 4GB | 50-60 | 60 | ~$20 |
| 8GB | 100-120 | 100 | ~$40 |

> **Decisión:** Usar un solo servicio Railway con escalado vertical (más RAM según necesites).

---

## Arquitectura Multi-Worker (Solo si necesitas 100+ usuarios)

> ⚠️ **Nota:** Esta sección es solo referencia para escalado futuro. No implementar hasta tener +100 usuarios.

### Problema del Escalado Horizontal

Con `whatsapp-web.js`, cada sesión consume ~60-80MB:

---

## Arquitectura Multi-Worker

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 RAILWAY: ORCHESTRATOR                        │
│              (API + Asignación de Sesiones)                 │
│                     256MB RAM                                │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   WORKER 1    │     │   WORKER 2    │     │   WORKER N    │
│ (10 sesiones) │     │ (10 sesiones) │     │ (10 sesiones) │
│   512MB RAM   │     │   512MB RAM   │     │   512MB RAM   │
│  + Volume     │     │  + Volume     │     │  + Volume     │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                     ┌───────────────┐
                     │     REDIS     │
                     │ (Coordinación)│
                     └───────────────┘
```

---

## Implementación del Orchestrator

```typescript
// orchestrator/session-router.ts

class SessionRouter {
  
  /**
   * Registrar workers disponibles en Redis
   */
  async registerWorker(workerId: string, capacity: number): Promise<void> {
    await redis.hset('workers', workerId, JSON.stringify({
      id: workerId,
      capacity,
      currentLoad: 0,
      lastHeartbeat: Date.now(),
      url: `https://worker-${workerId}.railway.app`
    }));
  }
  
  /**
   * Encontrar worker con menos carga
   */
  async findBestWorker(): Promise<WorkerInfo | null> {
    const workers = await redis.hgetall('workers');
    let bestWorker: WorkerInfo | null = null;
    let lowestLoad = Infinity;
    
    for (const [id, data] of Object.entries(workers)) {
      const worker = JSON.parse(data) as WorkerInfo;
      
      // Verificar que está vivo (heartbeat < 1 min)
      if (Date.now() - worker.lastHeartbeat > 60000) continue;
      
      // Verificar capacidad
      if (worker.currentLoad >= worker.capacity) continue;
      
      const loadPercent = worker.currentLoad / worker.capacity;
      if (loadPercent < lowestLoad) {
        lowestLoad = loadPercent;
        bestWorker = worker;
      }
    }
    
    return bestWorker;
  }
  
  /**
   * Asignar sesión a worker
   */
  async assignSession(sessionId: string, userId: string): Promise<string> {
    const worker = await this.findBestWorker();
    
    if (!worker) {
      throw new Error('No workers available - all at capacity');
    }
    
    // Guardar mapping
    await redis.hset('session:worker', sessionId, worker.id);
    await redis.hset('user:worker', userId, worker.id);
    
    // Incrementar carga del worker
    worker.currentLoad++;
    await redis.hset('workers', worker.id, JSON.stringify(worker));
    
    return worker.url;
  }
  
  /**
   * Obtener worker de una sesión existente
   */
  async getSessionWorker(sessionId: string): Promise<string | null> {
    const workerId = await redis.hget('session:worker', sessionId);
    if (!workerId) return null;
    
    const workerData = await redis.hget('workers', workerId);
    if (!workerData) return null;
    
    return JSON.parse(workerData).url;
  }
}
```

---

## Worker Individual

```typescript
// worker/index.ts

const WORKER_ID = process.env.WORKER_ID || 'worker-1';
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS || '10');

class WorkerService {
  private sessions: Map<string, SessionData> = new Map();
  
  async start(): Promise<void> {
    // Registrar en orchestrator
    await this.registerWithOrchestrator();
    
    // Heartbeat cada 30 segundos
    setInterval(() => this.sendHeartbeat(), 30000);
    
    // Restaurar sesiones locales
    await this.restoreLocalSessions();
  }
  
  private async registerWithOrchestrator(): Promise<void> {
    await fetch(`${ORCHESTRATOR_URL}/api/workers/register`, {
      method: 'POST',
      body: JSON.stringify({
        workerId: WORKER_ID,
        capacity: MAX_SESSIONS,
        currentLoad: this.sessions.size
      })
    });
  }
  
  private async sendHeartbeat(): Promise<void> {
    await redis.hset('workers', WORKER_ID, JSON.stringify({
      id: WORKER_ID,
      capacity: MAX_SESSIONS,
      currentLoad: this.sessions.size,
      lastHeartbeat: Date.now(),
      url: process.env.WORKER_URL
    }));
  }
}
```

---

## Capacidad por Plan Railway

| Plan | RAM | Workers | Sesiones/Worker | Total Sesiones |
|------|-----|---------|-----------------|----------------|
| Hobby | 512MB | 1 | 6-7 | 6-7 |
| Pro | 8GB | 1 | 100+ | 100+ |
| Pro (multi) | 512MB x 10 | 10 | 7 | **70** |
| Pro (multi) | 1GB x 5 | 5 | 15 | **75** |

---

## Costos Estimados (Railway Pro)

| Configuración | RAM Total | Costo/mes | Sesiones |
|---------------|-----------|-----------|----------|
| 1 x 1GB | 1GB | ~$5 | 15 |
| 5 x 512MB | 2.5GB | ~$12.50 | 35 |
| 10 x 512MB | 5GB | ~$25 | 70 |
| 1 x 8GB | 8GB | ~$40 | 100+ |

**Recomendación:** Para <20 usuarios, usar 1 instancia de 1GB. Para >20, escalar horizontalmente.

---

## Alternativa: Baileys (Menor Consumo)

Para máxima eficiencia, considerar migrar de `whatsapp-web.js` a `@whiskeysockets/baileys`:

| Aspecto | whatsapp-web.js | Baileys |
|---------|-----------------|---------|
| RAM por sesión | 60-80 MB | **15-30 MB** |
| Dependencia | Puppeteer + Chromium | Solo Node.js |
| Sesiones en 512MB | 6-7 | **15-20** |
| Complejidad | Media | Alta |
| Mantenimiento | Activo | Activo |

```typescript
// Ejemplo con Baileys (mucho más ligero)
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';

async function createBaileysSession(sessionId: string) {
  const { state, saveCreds } = await useMultiFileAuthState(
    `./sessions/${sessionId}`
  );
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  return sock;
}
```

**Nota:** Baileys requiere más código manual pero usa ~75% menos RAM.

---

## Checklist Actual (Un Solo Servicio)

- [x] Usar whatsapp-web.js con Chromium
- [x] Un solo servicio Railway
- [x] Escalado vertical (aumentar RAM según crecimiento)
- [ ] Implementar límite de capacidad en código
- [ ] Monitorear uso de RAM
- [ ] Alertas cuando capacidad > 80%

## Checklist Futuro (100+ usuarios)

- [ ] Implementar orchestrator para routing de sesiones
- [ ] Configurar Redis compartido entre workers
- [ ] Implementar heartbeat de workers
- [ ] Monitorear uso de RAM por worker

---

**Documento:** 12_ARQUITECTURA_ESCALABLE.md  
**Versión:** 2.2  
**Decisión:** Un solo servicio con whatsapp-web.js + Chromium
