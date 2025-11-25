# Variables de Entorno

## Backend (Railway)

### Archivo: `backend/.env`

```env
# ============================================
# SERVER
# ============================================
NODE_ENV=production
PORT=4000

# ============================================
# SUPABASE
# ============================================
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# REDIS (Railway Plugin)
# ============================================
REDIS_URL=redis://default:password@containers-xxx.railway.app:6379

# ============================================
# WHATSAPP
# ============================================
SESSIONS_PATH=/data/whatsapp-sessions

# ============================================
# PUPPETEER
# ============================================
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/xxx/bin/chromium

# ============================================
# CORS
# ============================================
FRONTEND_URL=https://tu-app.vercel.app
```

---

## Frontend (Vercel)

### Archivo: `frontend/.env.local`

```env
# ============================================
# BACKEND
# ============================================
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app

# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# EMAIL (Opcional - para notificaciones)
# ============================================
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=info@tudominio.com
EMAIL_PASSWORD=tu_password
EMAIL_FROM=Tu App <info@tudominio.com>
```

---

## Descripción de Variables

### Backend

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NODE_ENV` | Sí | Entorno: `development` o `production` |
| `PORT` | Sí | Puerto del servidor (default: 4000) |
| `SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Sí | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave privada de Supabase (bypass RLS) |
| `REDIS_URL` | Sí | URL de conexión a Redis |
| `SESSIONS_PATH` | Sí | Ruta para archivos de sesión WhatsApp |
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | Sí | Evitar descarga de Chromium (usar del sistema) |
| `PUPPETEER_EXECUTABLE_PATH` | No | Ruta explícita a Chromium (se autodetecta) |
| `FRONTEND_URL` | Sí | URL del frontend para CORS |

### Frontend

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NEXT_PUBLIC_API_URL` | Sí | URL del backend |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública de Supabase |
| `EMAIL_HOST` | No | Host SMTP para emails |
| `EMAIL_PORT` | No | Puerto SMTP |
| `EMAIL_USER` | No | Usuario SMTP |
| `EMAIL_PASSWORD` | No | Contraseña SMTP |
| `EMAIL_FROM` | No | Remitente de emails |

---

## Configuración Railway

### 1. Variables de Entorno

1. Ve a Railway Dashboard → Tu proyecto → Tu servicio
2. Settings → Variables
3. Agrega cada variable:

```
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
SESSIONS_PATH=/data/whatsapp-sessions
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
FRONTEND_URL=https://tu-app.vercel.app
```

### 2. Redis Plugin

1. En Railway Dashboard → Tu proyecto
2. Click "New" → "Database" → "Redis"
3. Railway crea automáticamente `REDIS_URL`

### 3. Volumen Persistente

1. En tu servicio → Settings → Volumes
2. Click "New Volume"
3. Mount Path: `/data`
4. Size: 1GB (mínimo)

---

## Configuración Vercel

### 1. Variables de Entorno

1. Ve a Vercel Dashboard → Tu proyecto
2. Settings → Environment Variables
3. Agrega cada variable:

```
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 2. Entornos

Asegúrate de agregar las variables para todos los entornos:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

## Obtener Credenciales Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. Settings → API
4. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **IMPORTANTE:** Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en el frontend. Solo usar en backend.

---

## Archivos .env.example

### Backend

```env
# backend/.env.example
NODE_ENV=development
PORT=4000

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=redis://localhost:6379

# WhatsApp Sessions
SESSIONS_PATH=./data/whatsapp-sessions

# Puppeteer
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend

```env
# frontend/.env.example
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Seguridad

### Variables Sensibles (NO commitear)

| Variable | Nivel de Sensibilidad |
|----------|----------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 Crítico |
| `REDIS_URL` | 🔴 Crítico |
| `EMAIL_PASSWORD` | 🔴 Crítico |
| `SUPABASE_ANON_KEY` | 🟡 Medio (pública pero no commitear) |

### .gitignore

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# No ignorar ejemplos
!.env.example
```

---

## Validación

### Backend - Verificar configuración

```typescript
// config/index.ts
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'REDIS_URL',
  'SESSIONS_PATH',
  'FRONTEND_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

console.log('✅ All required environment variables are set');
```

### Logs de Verificación (al iniciar)

```
✅ SUPABASE_URL: https://xxx.supabase.co
✅ REDIS_URL: redis://***@containers-xxx.railway.app
✅ SESSIONS_PATH: /data/whatsapp-sessions
✅ FRONTEND_URL: https://tu-app.vercel.app
✅ All environment variables validated
```

---

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY not defined"

```bash
# Verificar en Railway
railway variables
```

Solución: Agregar la variable en Railway Dashboard.

### Error: "REDIS_URL not defined"

Solución: Agregar Redis plugin en Railway.

### Error: "CORS error"

Verificar que `FRONTEND_URL` coincida exactamente con la URL de Vercel (sin `/` al final).

### Error: "Cannot connect to Redis"

```bash
# Verificar que Redis está corriendo
redis-cli -u $REDIS_URL ping
```

---

**Documento:** 08_VARIABLES_ENTORNO.md  
**Versión:** 2.0
