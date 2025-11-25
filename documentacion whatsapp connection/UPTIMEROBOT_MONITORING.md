# 🔍 UptimeRobot & Health Monitoring - WhaHook

## 📊 Sistema de Monitoreo Externo

---

## 🎯 ¿Qué es UptimeRobot?

**UptimeRobot** es un servicio de monitoreo externo que verifica que tu backend esté funcionando 24/7.

### ¿Por qué es Importante?

1. **Detecta caídas** - Te notifica si el backend deja de responder
2. **Mantiene Railway activo** - Evita que Railway pause el servicio por inactividad
3. **Monitoreo proactivo** - Detecta problemas antes que los usuarios
4. **Estadísticas de uptime** - Historial de disponibilidad

---

## 🏥 Health Check Endpoint

### Endpoint Público

```
GET https://tu-backend.railway.app/api/health
```

**Características:**
- ✅ **Público** - No requiere autenticación
- ✅ **Rápido** - Responde en <500ms
- ✅ **Completo** - Verifica todos los servicios críticos
- ✅ **Estándar** - Sigue best practices de health checks

### Respuesta Exitosa (200 OK)

```json
{
  "status": "healthy",
  "timestamp": 1732503600000,
  "uptime": 86400,
  "responsetime": [0, 123456789],
  "checks": {
    "redis": {
      "status": "up",
      "responseTime": 5,
      "details": {
        "connected": true,
        "mode": "ready"
      }
    },
    "supabase": {
      "status": "up",
      "responseTime": 45,
      "details": {
        "connected": true,
        "latency": 45
      }
    },
    "disk": {
      "status": "up",
      "responseTime": 2,
      "details": {
        "available": 512000000,
        "total": 1000000000,
        "usagePercent": 48.8,
        "sessionsPath": "/data/whatsapp-sessions"
      }
    },
    "whatsapp": {
      "status": "up",
      "responseTime": 10,
      "details": {
        "activeSessions": 3,
        "readySessions": 2,
        "errorSessions": 0
      }
    }
  },
  "system": {
    "memory": {
      "total": 8589934592,
      "free": 2147483648,
      "used": 6442450944,
      "usagePercent": 75.0
    },
    "cpu": {
      "model": "Intel(R) Xeon(R) CPU",
      "cores": 4,
      "loadAverage": [0.5, 0.4, 0.3]
    }
  }
}
```

### Estados Posibles

#### 1. **healthy** (200 OK)
- Todos los servicios críticos funcionan
- Redis: ✅
- Supabase: ✅
- Disk: ✅
- WhatsApp: ✅ (opcional)

#### 2. **degraded** (200 OK)
- Servicios críticos funcionan
- WhatsApp tiene problemas (no crítico)
- Redis: ✅
- Supabase: ✅
- Disk: ✅
- WhatsApp: ❌

#### 3. **unhealthy** (503 Service Unavailable)
- Algún servicio crítico falló
- Redis: ❌ o Supabase: ❌ o Disk: ❌

---

## 🔧 Configuración de UptimeRobot

### Paso 1: Crear Cuenta

1. Ve a [uptimerobot.com](https://uptimerobot.com)
2. Regístrate gratis (50 monitores gratis)
3. Confirma tu email

### Paso 2: Crear Monitor

1. Click en **"+ Add New Monitor"**
2. Configuración:

```
Monitor Type: HTTP(s)
Friendly Name: WhaHook Backend - Production
URL (or IP): https://tu-backend.railway.app/api/health
Monitoring Interval: 5 minutes (plan gratuito)
Monitor Timeout: 30 seconds
```

### Paso 3: Configurar Alertas

**Alert Contacts:**
- Email: tu-email@ejemplo.com
- Telegram (opcional)
- Slack (opcional)
- Discord (opcional)

**Alert When:**
- ✅ Monitor goes DOWN
- ✅ Monitor goes UP (recuperación)
- ⚠️ Monitor is PAUSED

### Paso 4: Configurar Verificación Avanzada

**Keyword Monitoring (Opcional):**
```
Keyword: "healthy"
Keyword Type: Exists
```

Esto verifica que la respuesta contenga la palabra "healthy", no solo que responda 200.

---

## 📊 Configuración Recomendada

### Monitor Principal (Crítico)

```
Name: WhaHook Backend - Health Check
Type: HTTP(s)
URL: https://tu-backend.railway.app/api/health
Interval: 5 minutes
Timeout: 30 seconds
HTTP Method: GET
Expected Status Code: 200
Keyword: "healthy"
Alert Contacts: Email + Telegram
```

### Monitor Secundario (Opcional)

```
Name: WhaHook Backend - Root
Type: HTTP(s)
URL: https://tu-backend.railway.app/
Interval: 10 minutes
Timeout: 30 seconds
HTTP Method: GET
Expected Status Code: 200
Alert Contacts: Email
```

---

## 🔔 Tipos de Alertas

### 1. Down Alert (Crítico)

**Cuándo:** El endpoint no responde o devuelve error

**Email recibido:**
```
Subject: [DOWN] WhaHook Backend - Health Check

Your monitor "WhaHook Backend - Health Check" is DOWN.
Reason: Connection timeout
Time: 2025-11-25 03:00:00 UTC
Duration: 0 minutes

URL: https://tu-backend.railway.app/api/health
```

**Acción:**
1. Verifica Railway logs
2. Verifica que el servicio esté corriendo
3. Verifica variables de entorno
4. Redeploy si es necesario

### 2. Up Alert (Recuperación)

**Cuándo:** El endpoint vuelve a responder correctamente

**Email recibido:**
```
Subject: [UP] WhaHook Backend - Health Check

Your monitor "WhaHook Backend - Health Check" is UP.
Downtime: 5 minutes
Time: 2025-11-25 03:05:00 UTC

URL: https://tu-backend.railway.app/api/health
```

### 3. Degraded Alert (Opcional)

Si configuras keyword monitoring, puedes detectar cuando el status es "degraded":

**Configuración:**
```
Keyword: "unhealthy"
Keyword Type: Not Exists
```

---

## 📈 Estadísticas y Reportes

### Dashboard de UptimeRobot

**Métricas disponibles:**
- **Uptime %** - Porcentaje de disponibilidad (objetivo: >99.9%)
- **Response Time** - Tiempo de respuesta promedio
- **Down Events** - Número de caídas
- **Total Downtime** - Tiempo total fuera de servicio

### Ejemplo de Estadísticas

```
Last 24 hours:
  Uptime: 100%
  Avg Response Time: 245ms
  Down Events: 0

Last 7 days:
  Uptime: 99.95%
  Avg Response Time: 267ms
  Down Events: 1 (5 min)

Last 30 days:
  Uptime: 99.87%
  Avg Response Time: 289ms
  Down Events: 3 (total 38 min)
```

---

## 🔍 Health Check Interno

### Service: `healthCheck.service.ts`

**Propósito:** Monitoreo interno automático de sesiones WhatsApp

```typescript
class HealthCheckService {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

  start(): void {
    this.checkInterval = setInterval(() => {
      this.checkAllSessions();
    }, this.CHECK_INTERVAL);
  }

  async checkAllSessions(): Promise<void> {
    const sessions = whatsappService.getAllSessions();
    
    for (const [sessionId, session] of sessions) {
      await this.checkSession(sessionId, session);
    }
  }

  async checkSession(sessionId: string, session: any): Promise<void> {
    try {
      // Verificar estado del cliente
      const state = await session.client.getState();
      
      if (state !== 'CONNECTED') {
        // Intentar reconectar
        await session.client.initialize();
        
        // Emitir evento Socket.IO
        io.emit('session:reconnecting', { sessionId });
      }
      
      // Actualizar last_check en DB
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({ last_check: new Date().toISOString() })
        .eq('session_id', sessionId);
        
    } catch (error) {
      logger.error('Health check failed for session', { sessionId, error });
      
      // Emitir evento de fallo
      io.emit('session:reconnect-failed', { sessionId });
    }
  }
}
```

**Diferencias con UptimeRobot:**
- **UptimeRobot:** Monitorea el backend completo desde fuera
- **healthCheck.service:** Monitorea sesiones WhatsApp desde dentro

---

## 🚨 Troubleshooting

### Problema: UptimeRobot marca como DOWN pero el backend funciona

**Causa:** Timeout muy corto o endpoint lento

**Solución:**
1. Aumentar timeout a 60 segundos
2. Optimizar health check endpoint
3. Verificar que Railway no esté en sleep mode

### Problema: Health check responde 503

**Causa:** Algún servicio crítico falló

**Verificar:**
```bash
# En Railway logs
❌ Redis connection failed
❌ Supabase connection failed
❌ Disk space critical
```

**Solución:**
1. Verificar variables de entorno
2. Verificar que Redis plugin está activo
3. Verificar que Supabase está accesible
4. Verificar espacio en disco del volumen

### Problema: Response time muy alto (>1000ms)

**Causa:** Servicios lentos o sobrecargados

**Verificar:**
```json
{
  "checks": {
    "redis": { "responseTime": 500 },      // ⚠️ Lento
    "supabase": { "responseTime": 800 },   // ⚠️ Lento
    "disk": { "responseTime": 50 }         // ✅ OK
  }
}
```

**Solución:**
1. Verificar latencia de Redis
2. Verificar latencia de Supabase
3. Considerar upgrade de plan Railway
4. Optimizar queries a Supabase

---

## 📋 Checklist de Configuración

### UptimeRobot
- [ ] Cuenta creada en uptimerobot.com
- [ ] Monitor creado para `/api/health`
- [ ] Intervalo configurado (5 min)
- [ ] Timeout configurado (30 seg)
- [ ] Keyword monitoring habilitado ("healthy")
- [ ] Email alert configurado
- [ ] Telegram/Slack alert configurado (opcional)

### Backend
- [ ] Endpoint `/api/health` funcionando
- [ ] Responde en <500ms
- [ ] Verifica Redis
- [ ] Verifica Supabase
- [ ] Verifica Disk
- [ ] Verifica WhatsApp sessions
- [ ] Logs de health checks activos

### Monitoreo Interno
- [ ] `healthCheck.service.ts` iniciado
- [ ] Intervalo de 5 minutos activo
- [ ] Reconexión automática funcionando
- [ ] Socket.IO eventos emitidos
- [ ] DB actualizada con `last_check`

---

## 🎯 Beneficios del Sistema Completo

### 1. **Monitoreo Externo (UptimeRobot)**
- ✅ Detecta si Railway cae
- ✅ Detecta si el backend no responde
- ✅ Mantiene el servicio activo
- ✅ Alertas inmediatas por email/Telegram

### 2. **Monitoreo Interno (healthCheck.service)**
- ✅ Detecta sesiones WhatsApp desconectadas
- ✅ Reconexión automática
- ✅ Actualización de estado en DB
- ✅ Notificaciones en tiempo real (Socket.IO)

### 3. **Health Check Endpoint**
- ✅ Información detallada del sistema
- ✅ Estado de todos los servicios
- ✅ Métricas de rendimiento
- ✅ Debugging facilitado

---

## 📊 Ejemplo de Configuración Completa

### UptimeRobot Dashboard

```
Monitor 1: WhaHook Backend - Health Check
  Status: UP (99.95% uptime)
  Response Time: 245ms
  Last Check: 2 minutes ago
  Alerts: Email + Telegram
  
Monitor 2: WhaHook Backend - Root
  Status: UP (99.98% uptime)
  Response Time: 123ms
  Last Check: 5 minutes ago
  Alerts: Email
```

### Railway Logs

```
✅ Health check service started
🔍 Checking all sessions...
✅ Session user_123_wa_456: CONNECTED
✅ Session user_123_wa_789: CONNECTED
✅ All sessions healthy
📊 Health check endpoint called: 200 OK (234ms)
```

### Supabase Database

```sql
SELECT session_id, status, last_check, last_seen
FROM whatsapp_accounts
WHERE status = 'ready';

-- Resultado:
session_id          | status | last_check           | last_seen
--------------------|--------|----------------------|----------------------
user_123_wa_456     | ready  | 2025-11-25 03:00:00  | 2025-11-25 02:58:00
user_123_wa_789     | ready  | 2025-11-25 03:00:00  | 2025-11-25 02:59:00
```

---

## 🎉 Resumen

### Sistema de Monitoreo Completo

**3 Capas de Monitoreo:**
1. **UptimeRobot** - Monitoreo externo del backend
2. **Health Check Endpoint** - Estado detallado de servicios
3. **Health Check Service** - Monitoreo interno de sesiones

**Beneficios:**
- ✅ Uptime 99.9%+
- ✅ Detección temprana de problemas
- ✅ Reconexión automática
- ✅ Alertas inmediatas
- ✅ Railway siempre activo

**Configuración:**
- ⏱️ 10 minutos para configurar UptimeRobot
- 🆓 Plan gratuito suficiente (50 monitores)
- 📧 Alertas por email/Telegram/Slack
- 📊 Dashboard con estadísticas

---

**Documento creado:** 25 de Noviembre, 2025  
**Estado:** ✅ COMPLETO  
**Monitoreo:** 3 capas  
**Uptime objetivo:** >99.9%
