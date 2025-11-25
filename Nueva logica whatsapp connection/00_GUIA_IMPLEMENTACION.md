# Guía de Implementación Paso a Paso

## Orden de Construcción

```
1. Supabase (Base de datos)
2. Backend (Railway)
3. Frontend (Vercel)
4. Monitoreo (UptimeRobot)
5. Testing
```

---

## FASE 1: Supabase (30 min)

### 1.1 Crear Proyecto
```
1. Ir a supabase.com → New Project
2. Nombre: whahook-production
3. Región: eu-central-1 (Frankfurt)
4. Guardar la contraseña de DB
```

### 1.2 Crear Tablas

```sql
-- Ejecutar en SQL Editor de Supabase

-- Tabla de usuarios
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cuentas WhatsApp
CREATE TABLE whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected',
  error_message TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  message_id TEXT NOT NULL,
  from_me BOOLEAN DEFAULT false,
  body TEXT,
  type TEXT DEFAULT 'text',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_accounts_user ON whatsapp_accounts(user_id);
CREATE INDEX idx_accounts_session ON whatsapp_accounts(session_id);
CREATE INDEX idx_messages_account ON whatsapp_messages(account_id);
```

### 1.3 Habilitar RLS

```sql
-- RLS para users_profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

-- RLS para whatsapp_accounts
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
  ON whatsapp_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON whatsapp_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON whatsapp_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON whatsapp_accounts FOR DELETE
  USING (auth.uid() = user_id);
```

### 1.4 Obtener Credenciales

```
Settings → API:
- Project URL → Guardar
- anon public key → Guardar
- service_role key → Guardar (SECRETO)
```

---

## FASE 2: Backend (1-2 horas)

### 2.1 Crear Proyecto

```bash
mkdir whahook-backend
cd whahook-backend
npm init -y
```

### 2.2 Instalar Dependencias

```bash
npm install express socket.io whatsapp-web.js qrcode-terminal @supabase/supabase-js ioredis cors helmet morgan dotenv
npm install -D typescript @types/node @types/express tsx
```

### 2.3 Configurar TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 2.4 Estructura de Carpetas

```
whahook-backend/
├── src/
│   ├── config/
│   │   ├── supabase.ts
│   │   ├── redis.ts
│   │   └── puppeteer.ts
│   ├── modules/
│   │   └── whatsapp/
│   │       ├── whatsapp.service.ts
│   │       ├── whatsapp.types.ts
│   │       └── whatsapp.socket.ts
│   ├── services/
│   │   ├── keepalive.service.ts
│   │   ├── keepaliveMessages.service.ts
│   │   └── sessionMonitoring.service.ts
│   └── server.ts
├── package.json
├── tsconfig.json
├── nixpacks.toml
└── .env
```

### 2.5 Archivos Clave

**src/config/supabase.ts**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**src/config/puppeteer.ts**
```typescript
export const PUPPETEER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--single-process',
    '--no-zygote',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-first-run',
    '--safebrowsing-disable-auto-update',
  ],
};
```

**nixpacks.toml** (CRÍTICO para Railway)
```toml
[phases.setup]
nixPkgs = [
  "nodejs_18",
  "chromium",
  "libuuid",
  "libdrm",
  "mesa",
  "libxkbcommon",
  "libxshmfence"
]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"

[variables]
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
PUPPETEER_EXECUTABLE_PATH = "/nix/store/chromium/bin/chromium"
```

### 2.6 Variables de Entorno (.env)

```env
NODE_ENV=development
PORT=4000

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Redis (vacío en desarrollo local)
REDIS_URL=

# WhatsApp
SESSIONS_PATH=./whatsapp-sessions

# Puppeteer
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Frontend
FRONTEND_URL=http://localhost:3000

# Keepalive
KEEPALIVE_TARGET_NUMBER=34602718451
```

### 2.7 Scripts en package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

## FASE 3: Implementar Servicios Backend

### 3.1 WhatsApp Service (Simplificado)

```typescript
// src/modules/whatsapp/whatsapp.service.ts
import { Client, LocalAuth } from 'whatsapp-web.js';
import { PUPPETEER_CONFIG } from '../../config/puppeteer';
import { supabaseAdmin } from '../../config/supabase';

interface Session {
  client: Client;
  status: string;
  userId: string;
}

class WhatsAppService {
  private sessions: Map<string, Session> = new Map();

  async createSession(sessionId: string, userId: string): Promise<Client> {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: process.env.SESSIONS_PATH,
      }),
      puppeteer: PUPPETEER_CONFIG,
    });

    this.sessions.set(sessionId, { client, status: 'initializing', userId });

    client.on('qr', (qr) => {
      // Emitir QR via Socket.IO
    });

    client.on('ready', async () => {
      const info = client.info;
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({
          status: 'ready',
          phone_number: info.wid.user,
          last_seen: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
    });

    client.on('disconnected', async (reason) => {
      await supabaseAdmin
        .from('whatsapp_accounts')
        .update({ status: 'disconnected', error_message: reason })
        .eq('session_id', sessionId);
    });

    await client.initialize();
    return client;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): Map<string, Session> {
    return this.sessions;
  }
}

export const whatsappService = new WhatsAppService();
```

### 3.2 Server Principal

```typescript
// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Health Check (para UptimeRobot)
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('whatsapp:connect', async (data) => {
    // Crear sesión
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## FASE 4: Deploy Backend en Railway (30 min)

### 4.1 Preparar Repositorio

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/whahook-backend.git
git push -u origin main
```

### 4.2 Crear Proyecto en Railway

```
1. railway.app → New Project
2. Deploy from GitHub repo
3. Seleccionar whahook-backend
```

### 4.3 Añadir Redis

```
1. En Railway → Add Service → Redis
2. Copiar REDIS_URL de Variables
```

### 4.4 Añadir Volume (CRÍTICO)

```
1. Click en servicio backend
2. Settings → Volumes
3. Mount Path: /data/whatsapp-sessions
4. Guardar
```

### 4.5 Configurar Variables

```
En Railway → Variables:

NODE_ENV=production
PORT=4000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
REDIS_URL=${{Redis.REDIS_URL}}
SESSIONS_PATH=/data/whatsapp-sessions
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/zi7xfbsqbdljmb3r0w481dc8bmhkipjr-chromium-130.0.6723.91/bin/chromium
FRONTEND_URL=https://tu-app.vercel.app
KEEPALIVE_TARGET_NUMBER=34602718451
```

### 4.6 Generar Dominio

```
Settings → Networking → Generate Domain
Guardar URL (ej: whahook-backend.railway.app)
```

---

## FASE 5: Frontend Vercel (1 hora)

### 5.1 Crear Proyecto Next.js

```bash
npx create-next-app@latest whahook-frontend --typescript --tailwind --eslint
cd whahook-frontend
npm install @supabase/supabase-js socket.io-client
```

### 5.2 Variables de Entorno (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
NEXT_PUBLIC_BACKEND_URL=https://whahook-backend.railway.app
```

### 5.3 Deploy en Vercel

```
1. vercel.com → Import Git Repository
2. Seleccionar whahook-frontend
3. Configurar variables de entorno
4. Deploy
```

### 5.4 Actualizar CORS en Backend

```
En Railway → Variables:
FRONTEND_URL=https://tu-app.vercel.app
```

---

## FASE 6: Monitoreo (10 min)

### 6.1 UptimeRobot

```
1. uptimerobot.com → Create Account
2. Add Monitor:
   - Type: HTTP(s)
   - URL: https://whahook-backend.railway.app/api/health
   - Interval: 5 minutes
   - Keyword: "healthy"
3. Add Alert Contact (tu email)
```

---

## FASE 7: Testing

### 7.1 Verificar Backend

```bash
curl https://whahook-backend.railway.app/api/health
# Debe responder: {"status":"healthy","timestamp":...}
```

### 7.2 Verificar Frontend

```
1. Abrir https://tu-app.vercel.app
2. Iniciar sesión con Supabase Auth
3. Ir a Conexiones
4. Click "Conectar WhatsApp"
5. Escanear QR con tu teléfono
6. Verificar que status cambia a "Conectado"
```

### 7.3 Verificar Persistencia

```
1. En Railway → Redeploy servicio
2. Esperar que reinicie
3. Verificar que sesión sigue conectada (no pide QR)
```

---

## Checklist Final

### Supabase
- [ ] Proyecto creado
- [ ] Tablas creadas
- [ ] RLS habilitado
- [ ] Credenciales guardadas

### Backend Railway
- [ ] Código desplegado
- [ ] Redis añadido
- [ ] Volume montado en /data/whatsapp-sessions
- [ ] Variables configuradas
- [ ] nixpacks.toml incluido
- [ ] Health check respondiendo

### Frontend Vercel
- [ ] Código desplegado
- [ ] Variables configuradas
- [ ] Conecta con backend

### Monitoreo
- [ ] UptimeRobot configurado
- [ ] Alertas por email activadas

### Testing
- [ ] Health check funciona
- [ ] Login funciona
- [ ] QR se genera
- [ ] WhatsApp se conecta
- [ ] Sesión persiste tras redeploy

---

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| QR no aparece | Verificar logs de Railway |
| Error Chromium | Verificar nixpacks.toml y PUPPETEER_EXECUTABLE_PATH |
| Sesión no persiste | Verificar Volume está montado |
| CORS error | Verificar FRONTEND_URL en backend |
| Socket no conecta | Verificar URL backend en frontend |

---

**Documento:** 00_GUIA_IMPLEMENTACION.md  
**Tiempo total estimado:** 3-4 horas
