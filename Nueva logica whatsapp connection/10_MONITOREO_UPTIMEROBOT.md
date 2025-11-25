# Monitoreo Externo con UptimeRobot

## ¿Qué es UptimeRobot?

Servicio de monitoreo externo que verifica que tu backend esté funcionando 24/7.

### Beneficios

- **Detecta caídas:** Te notifica si el backend deja de responder
- **Mantiene Railway activo:** Evita que Railway pause el servicio por inactividad
- **Monitoreo proactivo:** Detecta problemas antes que los usuarios
- **Estadísticas de uptime:** Historial de disponibilidad

---

## Health Check Endpoint

### Implementación Backend

```typescript
// routes/health.routes.ts
import { Router } from 'express';
import os from 'os';
import fs from 'fs';
import { redis } from '../config/redis';
import { supabaseAdmin } from '../config/supabase';
import { whatsappService } from '../modules/whatsapp/whatsapp.service';

const router = Router();

router.get('/health', async (req, res) => {
  const startTime = process.hrtime();
  
  const checks = {
    redis: await checkRedis(),
    supabase: await checkSupabase(),
    disk: await checkDisk(),
    whatsapp: checkWhatsApp()
  };
  
  // Determinar estado general
  const criticalServices = [checks.redis, checks.supabase, checks.disk];
  const allCriticalUp = criticalServices.every(c => c.status === 'up');
  
  const status = allCriticalUp 
    ? (checks.whatsapp.status === 'up' ? 'healthy' : 'degraded')
    : 'unhealthy';
  
  const responseTime = process.hrtime(startTime);
  
  const response = {
    status,
    timestamp: Date.now(),
    uptime: process.uptime(),
    responseTime: responseTime,
    checks,
    system: {
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1)
      },
      cpu: {
        model: os.cpus()[0]?.model || 'Unknown',
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      }
    }
  };
  
  const httpStatus = status === 'unhealthy' ? 503 : 200;
  res.status(httpStatus).json(response);
});

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: { connected: true, mode: redis.status }
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      details: { connected: false, error: error.message }
    };
  }
}

async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { error } = await supabaseAdmin
      .from('whatsapp_accounts')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: { connected: true, latency: Date.now() - start }
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      details: { connected: false, error: error.message }
    };
  }
}

async function checkDisk(): Promise<HealthCheck> {
  const start = Date.now();
  const sessionsPath = process.env.SESSIONS_PATH || '/data/whatsapp-sessions';
  
  try {
    // Verificar que el directorio existe y es escribible
    fs.accessSync(sessionsPath, fs.constants.W_OK);
    
    // En Linux, obtener espacio disponible
    const stats = fs.statfsSync?.(sessionsPath) || null;
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: {
        available: stats?.bavail * stats?.bsize || 'N/A',
        sessionsPath,
        writable: true
      }
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      details: { writable: false, error: error.message }
    };
  }
}

function checkWhatsApp(): HealthCheck {
  const start = Date.now();
  const sessions = whatsappService.getAllSessions();
  const sessionsArray = Array.from(sessions.values());
  
  const activeSessions = sessionsArray.length;
  const readySessions = sessionsArray.filter(s => s.status === 'ready').length;
  const errorSessions = sessionsArray.filter(s => s.status === 'error').length;
  
  return {
    status: activeSessions === 0 || readySessions > 0 ? 'up' : 'down',
    responseTime: Date.now() - start,
    details: {
      activeSessions,
      readySessions,
      errorSessions
    }
  };
}

interface HealthCheck {
  status: 'up' | 'down';
  responseTime: number;
  details: Record<string, any>;
}

export default router;
```

### Agregar al Server

```typescript
// server.ts
import healthRoutes from './routes/health.routes';

// Rutas públicas (sin auth)
app.use('/api', healthRoutes);
```

---

## Respuesta del Health Check

### Estado: healthy (200 OK)

```json
{
  "status": "healthy",
  "timestamp": 1732503600000,
  "uptime": 86400,
  "checks": {
    "redis": { "status": "up", "responseTime": 5 },
    "supabase": { "status": "up", "responseTime": 45 },
    "disk": { "status": "up", "responseTime": 2 },
    "whatsapp": { 
      "status": "up",
      "details": {
        "activeSessions": 3,
        "readySessions": 2,
        "errorSessions": 0
      }
    }
  }
}
```

### Estado: degraded (200 OK)

Servicios críticos funcionan, pero WhatsApp tiene problemas.

### Estado: unhealthy (503)

Algún servicio crítico (Redis, Supabase, Disk) falló.

---

## Configuración de UptimeRobot

### Paso 1: Crear Cuenta

1. Ve a [uptimerobot.com](https://uptimerobot.com)
2. Regístrate gratis (50 monitores gratis)
3. Confirma tu email

### Paso 2: Crear Monitor

Click en **"+ Add New Monitor"** con esta configuración:

| Campo | Valor |
|-------|-------|
| Monitor Type | HTTP(s) |
| Friendly Name | WhaHook Backend - Production |
| URL | `https://tu-backend.railway.app/api/health` |
| Monitoring Interval | 5 minutes |
| Monitor Timeout | 30 seconds |

### Paso 3: Keyword Monitoring (Recomendado)

```
Keyword: "healthy"
Keyword Type: Exists
```

Esto verifica que la respuesta contenga "healthy", no solo que responda 200.

### Paso 4: Configurar Alertas

**Alert Contacts:**
- ✅ Email: tu-email@ejemplo.com
- ⭐ Telegram (recomendado para alertas inmediatas)
- Slack (opcional)
- Discord (opcional)

---

## Alertas

### Down Alert

**Email recibido:**
```
Subject: [DOWN] WhaHook Backend - Health Check

Your monitor "WhaHook Backend - Health Check" is DOWN.
Reason: Connection timeout
Time: 2025-11-25 03:00:00 UTC
```

**Acciones:**
1. Verificar Railway logs
2. Verificar que el servicio esté corriendo
3. Verificar variables de entorno
4. Redeploy si es necesario

### Up Alert (Recuperación)

```
Subject: [UP] WhaHook Backend - Health Check

Your monitor "WhaHook Backend - Health Check" is UP.
Downtime: 5 minutes
```

---

## Beneficio Adicional: Evitar Sleep de Railway

Railway puede pausar servicios inactivos en plan gratuito. UptimeRobot hace ping cada 5 minutos, manteniendo el servicio activo.

---

## Integración con Sistema de Keepalive

El monitoreo de UptimeRobot es **complementario** a las 5 capas de keepalive:

| Capa | Propósito | Alcance |
|------|-----------|---------|
| 1-5 | Keepalive de sesiones WhatsApp | Interno |
| **6** | **UptimeRobot** | **Externo** |

**UptimeRobot monitorea:**
- ✅ Que el backend responda
- ✅ Que Redis esté conectado
- ✅ Que Supabase esté accesible
- ✅ Estado general de sesiones WhatsApp

---

## Troubleshooting

### UptimeRobot marca DOWN pero el backend funciona

**Causa:** Timeout muy corto

**Solución:**
1. Aumentar timeout a 60 segundos
2. Verificar que Railway no esté en sleep mode

### Health check responde 503

**Causa:** Servicio crítico falló

**Verificar:**
- Redis conectado
- Supabase accesible
- Volumen montado correctamente

### Response time muy alto (>1000ms)

**Causa:** Servicios sobrecargados

**Solución:**
1. Optimizar queries a Supabase
2. Verificar latencia de Redis
3. Considerar upgrade de plan Railway

---

## Checklist

### UptimeRobot
- [ ] Cuenta creada
- [ ] Monitor creado para `/api/health`
- [ ] Intervalo: 5 minutos
- [ ] Timeout: 30 segundos
- [ ] Keyword: "healthy"
- [ ] Email alert configurado
- [ ] Telegram alert (opcional pero recomendado)

### Backend
- [ ] Endpoint `/api/health` implementado
- [ ] Responde en <500ms
- [ ] Verifica Redis, Supabase, Disk, WhatsApp
- [ ] Retorna 503 si servicio crítico falla

---

## Resumen

| Aspecto | Valor |
|---------|-------|
| Costo | Gratis (plan básico) |
| Monitores | 50 gratis |
| Intervalo mínimo | 5 minutos |
| Alertas | Email, Telegram, Slack, Discord |
| Uptime objetivo | >99.9% |

---

**Documento:** 10_MONITOREO_UPTIMEROBOT.md  
**Versión:** 2.1
