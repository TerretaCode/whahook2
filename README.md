# Whahook - WhatsApp Business Automation

Sistema de automatización de WhatsApp para negocios con conexión persistente y notificaciones.

## Estructura del Proyecto

```
├── backend/          # API Express + WhatsApp-web.js
│   └── src/
│       ├── config/       # Configuraciones (env, puppeteer, redis, supabase)
│       ├── modules/      # Módulos (auth, whatsapp)
│       ├── routes/       # Rutas API (health)
│       ├── services/     # Servicios (backup, keepalive, monitoring)
│       └── utils/        # Utilidades (email)
│
├── frontend/         # Next.js 14 + Tailwind
│   ├── app/              # App Router (pages)
│   ├── components/       # Componentes UI
│   ├── contexts/         # Context providers
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilidades
│
└── supabase/         # Migraciones SQL
    └── migrations/
```

## Tecnologías

### Backend
- **Express.js** - API REST
- **Socket.IO** - Comunicación en tiempo real
- **whatsapp-web.js** - Cliente WhatsApp
- **Puppeteer** - Automatización del navegador
- **Supabase** - Base de datos y autenticación
- **Redis** - Cache y sesiones

### Frontend
- **Next.js 14** - Framework React
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI
- **Socket.IO Client** - WebSocket

## Despliegue

### Backend (Railway)
1. Conectar repositorio a Railway
2. Configurar variables de entorno (ver `backend/.env.example`)
3. Añadir volumen en `/data` para persistencia de sesiones

### Frontend (Vercel)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno (ver `frontend/.env.example`)
3. Desplegar

## Características

- ✅ Conexión WhatsApp persistente
- ✅ Backup automático de sesiones a Supabase Storage
- ✅ Reconexión automática con exponential backoff
- ✅ Notificaciones por email (SMTP)
- ✅ Monitoreo de sesiones
- ✅ Keepalive para mantener conexión activa
- ✅ Health check para UptimeRobot
