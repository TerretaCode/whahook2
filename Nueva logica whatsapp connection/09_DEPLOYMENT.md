# Guía de Deployment

## Requisitos Previos

- Cuenta en [Railway](https://railway.app)
- Cuenta en [Vercel](https://vercel.com)
- Proyecto en [Supabase](https://supabase.com)
- Repositorio en GitHub

---

## 1. Configuración Supabase

### 1.1 Crear Tablas

Ejecutar en Supabase SQL Editor:

```sql
-- Ver documento 07_BASE_DATOS.md para el script completo
```

### 1.2 Crear Storage Bucket

1. Supabase Dashboard → Storage
2. "New Bucket"
3. Name: `whatsapp-backups`
4. Public: No

### 1.3 Obtener Credenciales

1. Settings → API
2. Copiar:
   - Project URL
   - anon public key
   - service_role key

---

## 2. Deployment Backend (Railway)

### 2.1 Crear Proyecto

1. Ve a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Selecciona tu repositorio
4. Configura el directorio: `backend`

### 2.2 Configurar nixpacks.toml

Crear archivo `backend/nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "chromium"]
aptPkgs = [
  "fonts-liberation",
  "libasound2t64",
  "libatk-bridge2.0-0",
  "libatk1.0-0",
  "libatspi2.0-0",
  "libcairo2",
  "libcups2",
  "libdbus-1-3",
  "libdrm2",
  "libgbm1",
  "libglib2.0-0",
  "libgtk-3-0",
  "libnspr4",
  "libnss3",
  "libpango-1.0-0",
  "libx11-6",
  "libxcb1",
  "libxcomposite1",
  "libxdamage1",
  "libxext6",
  "libxfixes3",
  "libxkbcommon0",
  "libxrandr2",
  "xdg-utils"
]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### 2.3 Agregar Redis

1. En tu proyecto Railway
2. "New" → "Database" → "Redis"
3. Railway vincula automáticamente `REDIS_URL`

### 2.4 Crear Volumen

1. Click en tu servicio backend
2. Settings → Volumes
3. "New Volume"
4. Mount Path: `/data`
5. Size: 1GB

### 2.5 Variables de Entorno

En Settings → Variables, agregar:

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

### 2.6 Configurar Networking

1. Settings → Networking
2. "Generate Domain" o configurar dominio personalizado
3. Copiar URL para el frontend

### 2.7 Deploy

Railway despliega automáticamente al hacer push a main.

Para deploy manual:
1. Settings → Deployments
2. "Deploy Now"

---

## 3. Deployment Frontend (Vercel)

### 3.1 Crear Proyecto

1. Ve a [vercel.com](https://vercel.com)
2. "Add New" → "Project"
3. Importar repositorio de GitHub
4. Root Directory: `frontend`

### 3.2 Variables de Entorno

En Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 3.3 Build Settings

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`

### 3.4 Deploy

Vercel despliega automáticamente al hacer push.

---

## 4. Verificación Post-Deploy

### 4.1 Health Check Backend

```bash
curl https://tu-backend.railway.app/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T10:00:00.000Z",
  "sessions": {
    "active": 0,
    "ready": 0
  }
}
```

### 4.2 Verificar Frontend

1. Abrir https://tu-app.vercel.app
2. Iniciar sesión
3. Ir a Settings → Connections
4. Verificar que carga correctamente

### 4.3 Verificar Socket.IO

Abrir DevTools → Network → WS:
- Verificar conexión WebSocket a backend
- Sin errores CORS

### 4.4 Logs Railway

```bash
# Via CLI
railway logs

# O en Dashboard → tu servicio → Logs
```

Buscar:
```
✅ Server running on port 4000
✅ Redis connected
✅ Supabase connected
```

---

## 5. Configuración de Dominio (Opcional)

### Railway

1. Settings → Networking → Custom Domain
2. Agregar dominio: `api.tudominio.com`
3. Configurar DNS:
   - CNAME → `tu-servicio.up.railway.app`

### Vercel

1. Settings → Domains
2. Agregar dominio: `app.tudominio.com`
3. Configurar DNS según instrucciones de Vercel

---

## 6. Monitoreo

### Railway Metrics

- CPU Usage
- Memory Usage
- Network I/O

### Vercel Analytics

Habilitar en Vercel Dashboard para:
- Page views
- Web Vitals
- Error tracking

### Supabase

- Database → Metrics
- Auth → Users
- Logs

---

## 7. Troubleshooting Común

### Error: "Chromium not found"

**Causa:** nixpacks.toml mal configurado

**Solución:** 
1. Verificar que `nixpacks.toml` está en `/backend`
2. Verificar que incluye `chromium` en nixPkgs
3. Redeploy

### Error: "CORS blocked"

**Causa:** FRONTEND_URL incorrecto

**Solución:**
1. Verificar que FRONTEND_URL coincide exactamente con URL de Vercel
2. Sin trailing slash
3. Redeploy backend

### Error: "Session files not found after restart"

**Causa:** Volumen no configurado

**Solución:**
1. Verificar que el volumen está montado en `/data`
2. Verificar SESSIONS_PATH=/data/whatsapp-sessions
3. Redeploy

### Error: "Redis connection refused"

**Causa:** Redis no vinculado

**Solución:**
1. Agregar Redis plugin en Railway
2. Verificar que REDIS_URL está configurado
3. Redeploy

### Error: "WebSocket connection failed"

**Causa:** Configuración de Socket.IO

**Solución:**
1. Verificar NEXT_PUBLIC_API_URL en frontend
2. Verificar CORS en backend
3. Verificar que el servicio está healthy

---

## 8. Checklist de Deployment

### Backend (Railway)

- [ ] nixpacks.toml configurado
- [ ] Variables de entorno configuradas
- [ ] Redis plugin agregado
- [ ] Volumen montado en /data
- [ ] Health check responde OK
- [ ] Logs sin errores críticos

### Frontend (Vercel)

- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Página carga correctamente
- [ ] Socket.IO conecta sin errores

### Supabase

- [ ] Tablas creadas
- [ ] RLS habilitado
- [ ] Storage bucket creado
- [ ] Credenciales copiadas correctamente

### Integración

- [ ] Frontend conecta con backend
- [ ] Backend conecta con Supabase
- [ ] Backend conecta con Redis
- [ ] WhatsApp QR se genera correctamente

---

## 9. Comandos Útiles

### Railway CLI

```bash
# Instalar
npm install -g @railway/cli

# Login
railway login

# Ver logs
railway logs

# Ver variables
railway variables

# Deploy manual
railway up
```

### Vercel CLI

```bash
# Instalar
npm install -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod
```

---

## 10. Rollback

### Railway

1. Dashboard → Deployments
2. Click en deployment anterior
3. "Rollback to this deployment"

### Vercel

1. Dashboard → Deployments
2. Click en deployment anterior
3. "..." → "Promote to Production"

---

**Documento:** 09_DEPLOYMENT.md  
**Versión:** 2.0
