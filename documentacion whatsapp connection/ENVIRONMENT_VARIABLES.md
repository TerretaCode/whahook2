# 🔐 Variables de Entorno - WhaHook

## 📋 Configuración Completa para Backend y Frontend

---

## 🔧 BACKEND (Railway)

### Archivo: `backend/.env`

```env
# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV=production
PORT=4000

# ============================================
# SUPABASE (CRÍTICO)
# ============================================
SUPABASE_URL=https://gdepyhzhmowhurmdakry.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# ============================================
# REDIS (Railway Plugin - CRÍTICO)
# ============================================
REDIS_URL=redis://default:password@host:port

# ============================================
# WHATSAPP SESSIONS (CRÍTICO)
# ============================================
SESSIONS_PATH=/data/whatsapp-sessions

# ============================================
# PUPPETEER/CHROMIUM (CRÍTICO)
# ============================================
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium

# ============================================
# FRONTEND URL (CRÍTICO - Para CORS y Emails)
# ============================================
FRONTEND_URL=https://tu-app.vercel.app

# ============================================
# RATE LIMITING - General
# ============================================
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORE=redis

# ============================================
# RATE LIMITING - TIER CONSERVADOR (Seguro)
# Para: Números nuevos, previamente baneados
# Riesgo: <1%
# ============================================
RATE_LIMIT_CONSERVATIVE_PER_MINUTE=5
RATE_LIMIT_CONSERVATIVE_PER_HOUR=100
RATE_LIMIT_CONSERVATIVE_PER_DAY=300
RATE_LIMIT_CONSERVATIVE_MIN_INTERVAL=5000
RATE_LIMIT_CONSERVATIVE_BURST_LIMIT=10
RATE_LIMIT_CONSERVATIVE_BURST_WINDOW=120000
RATE_LIMIT_CONSERVATIVE_WARMUP_DAYS=14
RATE_LIMIT_CONSERVATIVE_WARMUP_START=50
RATE_LIMIT_CONSERVATIVE_WARMUP_INCREMENT=10

# ============================================
# RATE LIMITING - TIER BALANCEADO (Recomendado)
# Para: Mayoría de usuarios
# Riesgo: <5%
# ============================================
RATE_LIMIT_BALANCED_PER_MINUTE=10
RATE_LIMIT_BALANCED_PER_HOUR=200
RATE_LIMIT_BALANCED_PER_DAY=500
RATE_LIMIT_BALANCED_MIN_INTERVAL=3000
RATE_LIMIT_BALANCED_BURST_LIMIT=20
RATE_LIMIT_BALANCED_BURST_WINDOW=60000
RATE_LIMIT_BALANCED_WARMUP_DAYS=7
RATE_LIMIT_BALANCED_WARMUP_START=100
RATE_LIMIT_BALANCED_WARMUP_INCREMENT=25

# ============================================
# RATE LIMITING - TIER AGRESIVO (Alto Riesgo)
# Para: Números antiguos (>6 meses) con respaldo
# Riesgo: 10-20%
# ============================================
RATE_LIMIT_AGGRESSIVE_PER_MINUTE=20
RATE_LIMIT_AGGRESSIVE_PER_HOUR=400
RATE_LIMIT_AGGRESSIVE_PER_DAY=1000
RATE_LIMIT_AGGRESSIVE_MIN_INTERVAL=2000
RATE_LIMIT_AGGRESSIVE_BURST_LIMIT=30
RATE_LIMIT_AGGRESSIVE_BURST_WINDOW=60000
RATE_LIMIT_AGGRESSIVE_WARMUP_DAYS=10
RATE_LIMIT_AGGRESSIVE_WARMUP_START=200
RATE_LIMIT_AGGRESSIVE_WARMUP_INCREMENT=50

# ============================================
# RATE LIMITING - Por Usuario
# ============================================
RATE_LIMIT_USER_PER_MINUTE=30
RATE_LIMIT_USER_PER_HOUR=600
RATE_LIMIT_USER_PER_DAY=2000
RATE_LIMIT_USER_MAX_SESSIONS=10

# ============================================
# RATE LIMITING - Global
# ============================================
RATE_LIMIT_GLOBAL_PER_MINUTE=100
RATE_LIMIT_GLOBAL_PER_HOUR=3000
RATE_LIMIT_IP_PER_MINUTE=60

# ============================================
# RATE LIMITING - Por Destinatario (Opcional)
# ============================================
RATE_LIMIT_RECIPIENT_PER_HOUR=5
RATE_LIMIT_RECIPIENT_PER_DAY=20

# ============================================
# LOGGING (Opcional)
# ============================================
LOG_LEVEL=info
```

---

## 🎨 FRONTEND (Vercel)

### Archivo: `frontend/.env.local`

```env
# ============================================
# BACKEND API (CRÍTICO)
# ============================================
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.railway.app

# ============================================
# SUPABASE (Para Auth en Frontend)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://gdepyhzhmowhurmdakry.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# ============================================
# APPLICATION SETTINGS
# ============================================
NEXT_PUBLIC_APP_NAME=WhaHook
NEXT_PUBLIC_APP_VERSION=1.0.0

# ============================================
# EMAIL (Hostinger - CRÍTICO para notificaciones)
# ============================================
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=info@terretacode.com
EMAIL_PASSWORD=tu_password_aqui
EMAIL_FROM=TerretaCode <info@terretacode.com>
```

---

## 📝 Descripción de Variables Críticas

### Backend

#### **Supabase (Obligatorio)**
```env
SUPABASE_URL=https://gdepyhzhmowhurmdakry.supabase.co
```
- URL de tu proyecto Supabase
- Obtener de: Supabase Dashboard → Settings → API

```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Clave pública (anon key)
- Obtener de: Supabase Dashboard → Settings → API
- Usada para operaciones del cliente

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- ⚠️ **MUY IMPORTANTE:** Clave privada (service role)
- Obtener de: Supabase Dashboard → Settings → API
- ⚠️ **NUNCA** exponer en frontend
- Bypass RLS, acceso completo a la base de datos

#### **Redis (Obligatorio)**
```env
REDIS_URL=redis://default:password@host:port
```
- URL de conexión a Redis
- Railway: Agregar Redis plugin → Copia la URL automáticamente
- Usado para: Rate limiting, cache, Bull queue

#### **WhatsApp Sessions (Obligatorio)**
```env
SESSIONS_PATH=/data/whatsapp-sessions
```
- Ruta donde se guardan las sesiones de WhatsApp
- Railway: Debe apuntar al volumen montado
- **Crítico:** Sin esto, las sesiones no persisten

#### **Puppeteer/Chromium (Obligatorio)**
```env
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
```
- Indica a Puppeteer que use Chromium del sistema
- Railway: Chromium se instala via nixpacks.toml
- **Crítico:** Sin esto, Puppeteer falla

#### **Frontend URL (Obligatorio)**
```env
FRONTEND_URL=https://tu-app.vercel.app
```
- URL del frontend en Vercel
- Usado para:
  - CORS (permitir requests del frontend)
  - Envío de emails (backend llama a frontend API)
  - Redirects en emails

#### **Rate Limiting (Recomendado)**
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORE=redis
```
- Habilita rate limiting para prevenir ban de WhatsApp
- 3 tiers: Conservador, Balanceado, Agresivo
- Configuración detallada por tier

---

### Frontend

#### **Backend API (Obligatorio)**
```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```
- URL del backend en Railway
- Usado para todas las llamadas API

#### **Supabase (Obligatorio)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://gdepyhzhmowhurmdakry.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Mismo URL y anon key que el backend
- Usado para autenticación en el frontend
- **Nota:** Solo anon key, NUNCA service role key

#### **Email (Obligatorio para notificaciones)**
```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=info@terretacode.com
EMAIL_PASSWORD=tu_password_aqui
```
- Configuración SMTP de Hostinger
- Usado por `/api/send-email` route
- Backend llama a esta API para enviar emails

---

## 🚀 Configuración en Railway

### Paso 1: Agregar Variables Básicas

1. Ve a tu proyecto en Railway
2. Click en tu servicio backend
3. Settings → Variables
4. Agregar una por una:

```
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://gdepyhzhmowhurmdakry.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SESSIONS_PATH=/data/whatsapp-sessions
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/*/bin/chromium
FRONTEND_URL=https://tu-app.vercel.app
```

### Paso 2: Agregar Redis Plugin

1. En Railway Dashboard
2. Click en "+ New"
3. Selecciona "Database" → "Redis"
4. Railway automáticamente crea `REDIS_URL`

### Paso 3: Crear Volumen Persistente

1. En tu servicio backend
2. Settings → Volumes
3. Click "+ New Volume"
4. Mount Path: `/data`
5. Size: 1GB (mínimo)

### Paso 4: Agregar Rate Limiting (Opcional)

Copia todas las variables de rate limiting del `.env.example`

---

## 🎨 Configuración en Vercel

### Paso 1: Agregar Variables

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agregar:

```
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://gdepyhzhmowhurmdakry.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_APP_NAME=WhaHook
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Paso 2: Agregar Variables de Email

```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=info@terretacode.com
EMAIL_PASSWORD=tu_password_hostinger
EMAIL_FROM=TerretaCode <info@terretacode.com>
```

### Paso 3: Aplicar a Todos los Entornos

- Production: ✅
- Preview: ✅
- Development: ✅

---

## ⚠️ Variables Sensibles (NUNCA Commitear)

### Backend
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Acceso total a DB
- ❌ `REDIS_URL` - Contiene password
- ❌ Rate limiting configs (pueden ser públicas pero mejor privadas)

### Frontend
- ❌ `EMAIL_PASSWORD` - Password de Hostinger
- ✅ `NEXT_PUBLIC_*` - Estas SÍ son públicas (van al cliente)

---

## 📋 Checklist de Configuración

### Backend (Railway)
- [ ] `NODE_ENV=production`
- [ ] `PORT=4000`
- [ ] `SUPABASE_URL` configurado
- [ ] `SUPABASE_ANON_KEY` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] `REDIS_URL` configurado (plugin)
- [ ] `SESSIONS_PATH=/data/whatsapp-sessions`
- [ ] `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- [ ] `PUPPETEER_EXECUTABLE_PATH` configurado
- [ ] `FRONTEND_URL` apunta a Vercel
- [ ] Volumen montado en `/data`
- [ ] Rate limiting configurado (opcional)

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` apunta a Railway
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] `EMAIL_HOST` configurado
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USER` configurado
- [ ] `EMAIL_PASSWORD` configurado
- [ ] `EMAIL_FROM` configurado

---

## 🔍 Verificación

### Backend
```bash
# En Railway logs, deberías ver:
✅ SUPABASE_URL: https://gdepyhzhmowhurmdakry.supabase.co
✅ Redis connected and ready
✅ Sessions directory: /data/whatsapp-sessions
✅ Using system Chromium: /nix/store/.../chromium
✅ CORS: https://tu-app.vercel.app
```

### Frontend
```bash
# En Vercel logs, deberías ver:
✅ API URL: https://tu-backend.railway.app
✅ Supabase initialized
✅ Email transporter created
```

---

## 🚨 Troubleshooting

### Error: "SUPABASE_URL not defined"
- Verifica que la variable existe en Railway
- Redeploy el servicio

### Error: "REDIS_URL not defined"
- Agrega Redis plugin en Railway
- Verifica que la variable se creó automáticamente

### Error: "Chromium not found"
- Verifica `PUPPETEER_EXECUTABLE_PATH`
- Verifica que `nixpacks.toml` incluye chromium

### Error: "Failed to send email"
- Verifica credenciales de Hostinger en Vercel
- Verifica que `EMAIL_PASSWORD` es correcto

### Error: "CORS policy"
- Verifica que `FRONTEND_URL` en Railway apunta a Vercel
- Verifica que la URL no tiene `/` al final

---

## 📚 Archivos de Referencia

### Backend
- `backend/.env.example` - Template completo
- `backend/nixpacks.toml` - Configuración de Chromium
- `backend/src/config/supabase.ts` - Uso de variables Supabase
- `backend/src/config/redis.ts` - Uso de REDIS_URL

### Frontend
- `frontend/.env.example` - Template completo
- `frontend/app/api/send-email/route.ts` - Uso de EMAIL_*
- `frontend/lib/supabase.ts` - Uso de Supabase variables

---

**Documento creado:** 25 de Noviembre, 2025  
**Estado:** ✅ COMPLETO  
**Variables Backend:** 50+  
**Variables Frontend:** 10+
