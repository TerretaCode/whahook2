# WhatsApp Connection - Documentación v2.0

## Resumen

Sistema de conexión WhatsApp multi-usuario para WhaHook. Permite a cada usuario registrado conectar su cuenta de WhatsApp mediante código QR desde la página de configuración (`/settings/connections`).

---

## Índice de Documentos

| # | Documento | Descripción |
|---|-----------|-------------|
| 0 | [**GUÍA DE IMPLEMENTACIÓN**](./00_GUIA_IMPLEMENTACION.md) | **⭐ EMPEZAR AQUÍ - Pasos ordenados para construir todo** |
| 1 | [Arquitectura General](./01_ARQUITECTURA_GENERAL.md) | Stack tecnológico, componentes y decisiones de diseño |
| 2 | [Flujo de Conexión](./02_FLUJO_CONEXION.md) | Secuencia completa de conexión, estados y manejo de errores |
| 3 | [Persistencia](./03_PERSISTENCIA.md) | LocalAuth, backups y restauración de sesiones |
| 4 | [Keepalive](./04_KEEPALIVE.md) | 5 capas para mantener conexiones activas 24/7 |
| 5 | [Implementación Backend](./05_IMPLEMENTACION_BACKEND.md) | Código del servicio WhatsApp y Socket.IO |
| 6 | [Implementación Frontend](./06_IMPLEMENTACION_FRONTEND.md) | Componentes React y hooks |
| 7 | [Base de Datos](./07_BASE_DATOS.md) | Esquema SQL para Supabase |
| 8 | [Variables de Entorno](./08_VARIABLES_ENTORNO.md) | Configuración para Railway y Vercel |
| 9 | [Deployment](./09_DEPLOYMENT.md) | Guía paso a paso de despliegue |
| 10 | [Monitoreo UptimeRobot](./10_MONITOREO_UPTIMEROBOT.md) | Health check + monitoreo externo 24/7 |
| 11 | [Mejoras y Optimizaciones](./11_MEJORAS_OPTIMIZACIONES.md) | RAM -50%, Anti-bot, Rate limiting |
| 12 | [Arquitectura Escalable](./12_ARQUITECTURA_ESCALABLE.md) | Escalado vertical y multi-worker |
| 13 | [Estructura del Proyecto](./13_ESTRUCTURA_PROYECTO.md) | Carpetas y archivos organizados ⭐ |

---

## Arquitectura Resumida

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────>│    Backend      │────>│    WhatsApp     │
│    (Vercel)     │<────│   (Railway)     │<────│    Servers      │
│                 │     │                 │     │                 │
│  Next.js 14     │     │  Express        │     │  whatsapp-web.js│
│  Socket.IO      │     │  Socket.IO      │     │  Puppeteer      │
│  Supabase Auth  │     │  Supabase Admin │     │  Chromium       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Persistencia   │
                        │                 │
                        │  Railway Volume │
                        │  Supabase DB    │
                        │  Redis Cache    │
                        └─────────────────┘
```

---

## Flujo Principal

```
1. Usuario click "Conectar WhatsApp"
   │
2. Frontend crea registro en Supabase (status: initializing)
   │
3. Frontend emite 'whatsapp:create' via Socket.IO
   │
4. Backend crea sesión Puppeteer + LocalAuth
   │
5. WhatsApp genera QR → Backend emite 'whatsapp:qr'
   │
6. Frontend muestra QR → Usuario escanea con móvil
   │
7. WhatsApp autentica → evento 'authenticated'
   │
8. WhatsApp listo → evento 'ready'
   │
9. Backend actualiza Supabase (status: ready)
   │
10. Backend inicia keepalive (heartbeat, watchdog, browser activity)
   │
11. Frontend muestra cuenta conectada
```

---

## Características Principales

### Persistencia
- **LocalAuth:** Sesiones guardadas en disco (Railway Volume)
- **Backup:** Opcional a Supabase Storage
- **Restauración:** Automática al reiniciar backend

### Keepalive (24/7) - 6 Capas
- **Heartbeat:** Cada 2 min (presencia + DB sync)
- **Watchdog:** Cada 1 min (detección desconexión)
- **Browser Activity:** Cada 45 seg (anti-suspensión)
- **Keepalive Messages:** Cada 55-65 min ALEATORIO (mensajes REALES al +34 602 71 84 51) ⭐
- **Session Monitoring:** Cada 1 hora (health check + alertas email) ⭐
- **UptimeRobot:** Cada 5 min (monitoreo EXTERNO del backend + evita sleep de Railway) ⭐

### Reconexión
- **Temporal:** 3 intentos con backoff exponencial
- **Permanente:** Requiere nuevo QR (LOGOUT, CONFLICT, etc.)

---

## Requisitos

### Backend
- Node.js 20+
- Chromium (via nixpacks)
- Railway con volumen persistente
- Redis (Railway plugin)

### Frontend
- Next.js 14+
- Vercel hosting
- Socket.IO client

### Base de Datos
- Supabase (PostgreSQL)
- Tabla `whatsapp_accounts`
- Storage bucket para backups

---

## Quick Start

### 1. Base de Datos

```sql
-- Ejecutar en Supabase SQL Editor
-- Ver 07_BASE_DATOS.md para script completo
```

### 2. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# Desarrollo
npm run dev

# Producción (Railway)
# Push a GitHub → Railway despliega automáticamente
```

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar .env.local
cp .env.example .env.local
# Editar con tus credenciales

# Desarrollo
npm run dev

# Producción (Vercel)
# Push a GitHub → Vercel despliega automáticamente
```

---

## Dependencias Principales

### Backend

```json
{
  "whatsapp-web.js": "^1.23.0",
  "puppeteer": "^18.x",
  "socket.io": "^4.6.1",
  "@supabase/supabase-js": "^2.39.0",
  "ioredis": "^5.3.2",
  "qrcode": "^1.5.3"
}
```

### Frontend

```json
{
  "socket.io-client": "^4.6.1",
  "@supabase/supabase-js": "^2.39.0",
  "date-fns": "^3.x"
}
```

---

## Mejoras sobre Documentación Anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Organización | 7 archivos con info duplicada | 10 archivos especializados |
| Estados | Actualizaba DB en cada evento | Solo actualiza en `ready` y `error` |
| Keepalive | 10 capas confusas/redundantes | 5 capas claras y bien definidas |
| Mensajes Keepalive | ✅ Cada 55-65 min aleatorio | ✅ Mantenido (crítico) |
| Session Monitoring | ✅ Cada hora | ✅ Mantenido (crítico) |
| Código | Fragmentado y repetido | Servicios modulares |
| Backup | Complejo con múltiples estrategias | Simple y opcional |
| Flujos | Diagramas ASCII extensos | Diagramas concisos + tablas |

---

## Notas Importantes

1. **Railway Volume:** Obligatorio para persistencia de sesiones.

2. **Chromium:** Instalado via nixpacks.toml, no descargar con Puppeteer.

3. **SUPABASE_SERVICE_ROLE_KEY:** Solo en backend, nunca en frontend.

4. **Socket.IO:** Requiere autenticación con token JWT de Supabase.

5. **Rate Limiting:** Implementar para evitar ban de WhatsApp.

6. **Número Keepalive (+34 602 71 84 51):** Debe ser un teléfono que puedas verificar. Recibirás ~24 mensajes/día para confirmar que el sistema funciona.

7. **Mensajes reales son críticos:** Según issue #377 de whatsapp-web.js, `sendPresenceAvailable()` no siempre evita que WhatsApp "congele" sesiones inactivas.

---

## Soporte

Para problemas comunes, ver sección Troubleshooting en:
- [09_DEPLOYMENT.md](./09_DEPLOYMENT.md#7-troubleshooting-común)

---

---

## Mejoras v2.2 (Optimizaciones)

| Aspecto | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **RAM por sesión** | 120-150 MB | 60-80 MB | **-50%** |
| **Sesiones en 1GB** | 6-8 | 12-15 | **+90%** |
| **Disco por sesión** | 80-100 MB | 30-50 MB | **-50%** |
| **Riesgo de ban** | Alto | Bajo | **-80%** |

### Nuevas Características
- ✅ Configuración Puppeteer ultra-optimizada
- ✅ Delays humanizados (distribución gaussiana)
- ✅ Actividad según hora del día
- ✅ Rate limiting inteligente
- ✅ Limpieza automática de cache
- ✅ Arquitectura multi-worker para 50+ usuarios

---

**Versión:** 2.2 (Con optimizaciones y arquitectura escalable)  
**Fecha:** Noviembre 2025  
**Autor:** TerretaCode
