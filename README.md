# Whahook - WhatsApp Business Automation

Sistema de automatización de WhatsApp para negocios con conexión persistente y notificaciones.

## Estructura del Proyecto

```
├── backend/          # API Express + WhatsApp-web.js
│   ├── src/
│   │   ├── config/       # Configuraciones (env, puppeteer, redis, supabase)
│   │   ├── modules/      # Módulos (auth, whatsapp)
│   │   ├── routes/       # Rutas API
│   │   ├── services/     # Servicios (backup, keepalive, monitoring)
│   │   └── utils/        # Utilidades (email)
│   └── nixpacks.toml     # Config para Railway
│
├── frontend/         # Next.js 14 + Tailwind
│   ├── app/              # App Router
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
2. Configurar variables de entorno
3. Añadir volumen en `/data` para persistencia de sesiones

### Frontend (Vercel)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar

## Variables de Entorno

### Backend
```env
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://tu-frontend.vercel.app
FRONTEND_URL=https://tu-frontend.vercel.app
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
REDIS_URL=
WHATSAPP_SESSION_PATH=/data/whatsapp-sessions
PUPPETEER_EXECUTABLE_PATH=/nix/var/nix/profiles/default/bin/chromium
KEEPALIVE_TARGET_NUMBER=+34XXXXXXXXX
```

### Frontend
```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.railway.app
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
```

## Características

- ✅ Conexión WhatsApp persistente
- ✅ Backup automático de sesiones
- ✅ Reconexión automática con exponential backoff
- ✅ Notificaciones por email
- ✅ Monitoreo de sesiones
- ✅ Keepalive para mantener conexión activa
