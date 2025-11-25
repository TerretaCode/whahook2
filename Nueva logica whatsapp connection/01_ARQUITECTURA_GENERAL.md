# Arquitectura WhatsApp Connection - WhaHook

## Resumen

Sistema de conexión WhatsApp multi-usuario que permite a cada usuario conectar su cuenta de WhatsApp mediante código QR desde `/settings/connections`. El sistema mantiene las sesiones activas 24/7 con mecanismos de persistencia y reconexión automática.

---

## Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| Cliente WhatsApp | whatsapp-web.js ^1.23.0 | Conexión con WhatsApp Web |
| Browser Headless | Puppeteer + Chromium | Ejecutar WhatsApp Web |
| Real-time | Socket.IO ^4.6.1 | Comunicación bidireccional |
| Base de datos | Supabase (PostgreSQL) | Persistencia de datos |
| Cache | Redis (ioredis) | Rate limiting y colas |
| Colas | Bull | Procesamiento de mensajes |
| Backend | Express + TypeScript | API REST |
| Frontend | Next.js 14 (Vercel) | Interfaz de usuario |
| Hosting Backend | Railway | Contenedores con volumen |

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                            │
│  /settings/connections                                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  • Botón "Conectar WhatsApp"                                │    │
│  │  • Visualización de QR Code                                 │    │
│  │  • Estado de conexión en tiempo real                        │    │
│  │  • Gestión de sesiones activas                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Socket.IO + REST API
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Railway)                            │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  WhatsAppService                                            │    │
│  │  ├─ Gestión de sesiones (Map<sessionId, SessionData>)      │    │
│  │  ├─ Eventos WhatsApp (qr, ready, disconnected, message)    │    │
│  │  └─ Mecanismos de keepalive                                │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  Puppeteer + Chromium                                       │    │
│  │  └─ WhatsApp Web headless por cada sesión                  │    │
│  ├─────────────────────────────────────────────────────────────┤    │
│  │  Railway Volume: /data/whatsapp-sessions                    │    │
│  │  └─ Archivos de sesión LocalAuth (persisten tras reinicio) │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICIOS EXTERNOS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │   Supabase   │  │    Redis     │  │   SMTP (Hostinger)       │   │
│  │  PostgreSQL  │  │   Cache/     │  │   Notificaciones email   │   │
│  │  + Storage   │  │   Queues     │  │                          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Componentes Principales

### 1. WhatsAppService (Backend)

Servicio singleton que gestiona todas las sesiones WhatsApp activas.

**Responsabilidades:**
- Crear/destruir sesiones de usuario
- Configurar cliente Puppeteer optimizado
- Manejar eventos de whatsapp-web.js
- Mantener conexiones activas (keepalive)
- Sincronizar estado con Supabase

**Estructura de datos:**
```typescript
interface SessionData {
  sessionId: string;          // "user_{userId}_wa_{accountId}"
  userId: string;
  accountId: string;
  client: Client;             // Instancia whatsapp-web.js
  status: 'initializing' | 'qr' | 'authenticated' | 'ready' | 'error';
  phoneNumber?: string;
  lastActivity: number;
  createdAt: number;
}
```

### 2. Frontend Connection Page

Página en `/settings/connections` que permite:
- Ver estado de cuentas WhatsApp conectadas
- Iniciar nueva conexión (muestra QR)
- Desconectar cuentas existentes
- Ver historial de actividad

### 3. Socket.IO Events

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `whatsapp:create` | Client → Server | `{accountId}` | Solicitar nueva conexión |
| `whatsapp:qr` | Server → Client | `{qr, sessionId}` | QR code generado |
| `whatsapp:ready` | Server → Client | `{sessionId, phoneNumber}` | Conexión exitosa |
| `whatsapp:disconnected` | Server → Client | `{sessionId, reason}` | Desconexión |
| `whatsapp:error` | Server → Client | `{sessionId, error}` | Error |
| `whatsapp:destroy` | Client → Server | `{sessionId}` | Desconectar sesión |

---

## Decisiones de Diseño

### LocalAuth vs RemoteAuth

**Elegimos LocalAuth** por las siguientes razones:

| Aspecto | LocalAuth | RemoteAuth |
|---------|-----------|------------|
| Velocidad | Rápido (disco local) | Lento (red) |
| Dependencias | Solo volumen | MongoDB requerido |
| Complejidad | Simple | Compleja |
| Costo | Incluido en Railway | MongoDB adicional |
| Persistencia | Railway Volume | Base de datos externa |

### Un Chromium por Sesión

Cada sesión WhatsApp ejecuta su propia instancia de Chromium. Esto:
- Aísla sesiones entre usuarios
- Permite escalado horizontal futuro
- Evita conflictos de estado

### Volumen Persistente Railway

Los archivos de sesión se guardan en `/data/whatsapp-sessions` (Railway Volume):
- Sobreviven a reinicios del contenedor
- No requieren re-escaneo de QR tras deploy
- Backup automático opcional a Supabase Storage

---

## Límites y Consideraciones

### Recursos por Sesión
- **Memoria:** 80-120 MB por sesión
- **CPU:** 5-10% por sesión activa
- **Disco:** 50-100 MB por sesión

### Límites Recomendados
- **Plan Railway Starter (512MB):** 3-4 sesiones máximo
- **Plan Railway Pro (1GB+):** 8-10 sesiones máximo

### Rate Limiting WhatsApp
- **Mensajes por sesión:** 10/minuto (conservador)
- **Mensajes por usuario:** 30/minuto (total)
- **Anti-spam:** Detección de duplicados

---

## Documentos Relacionados

1. `02_FLUJO_CONEXION.md` - Flujo detallado de conexión
2. `03_PERSISTENCIA.md` - Sistema de persistencia y backups
3. `04_KEEPALIVE.md` - Mecanismos para mantener conexión activa
4. `05_IMPLEMENTACION_BACKEND.md` - Código del servicio WhatsApp
5. `06_IMPLEMENTACION_FRONTEND.md` - Código de la página de conexión
6. `07_BASE_DATOS.md` - Esquema de Supabase
7. `08_VARIABLES_ENTORNO.md` - Configuración de entorno
8. `09_DEPLOYMENT.md` - Guía de despliegue

---

**Versión:** 2.0  
**Última actualización:** Noviembre 2025
