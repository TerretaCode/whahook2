# Estructura de Carpetas del Proyecto

## Vista General

```
whahook/
├── backend/                    # Servidor Express + WhatsApp
├── frontend/                   # Next.js + React
└── docs/                       # Documentación (opcional)
```

---

## Backend (Railway)

```
backend/
│
├── src/
│   │
│   ├── config/                         # ⚙️ CONFIGURACIONES
│   │   ├── index.ts                    # Exporta todas las configs
│   │   ├── supabase.ts                 # Cliente Supabase Admin
│   │   ├── redis.ts                    # Conexión Redis
│   │   ├── puppeteer.ts                # Args optimizados Chromium
│   │   └── constants.ts                # Constantes globales
│   │
│   ├── modules/                        # 📦 MÓDULOS (por feature)
│   │   │
│   │   ├── auth/                       # Autenticación
│   │   │   ├── auth.middleware.ts      # Verificar JWT Supabase
│   │   │   └── auth.routes.ts          # Rutas /api/auth/*
│   │   │
│   │   └── whatsapp/                   # 📱 WHATSAPP (principal)
│   │       ├── whatsapp.types.ts       # Tipos e interfaces
│   │       ├── whatsapp.service.ts     # Lógica de sesiones
│   │       ├── whatsapp.socket.ts      # Eventos Socket.IO
│   │       └── whatsapp.routes.ts      # Rutas /api/whatsapp/*
│   │
│   ├── services/                       # 🔧 SERVICIOS GLOBALES
│   │   ├── keepalive.service.ts        # Heartbeat, Watchdog, Browser
│   │   ├── keepaliveMessages.service.ts # Mensajes cada 55-65 min
│   │   ├── sessionMonitoring.service.ts # Monitoreo cada hora
│   │   └── health.service.ts           # Health check endpoint
│   │
│   ├── utils/                          # 🛠️ UTILIDADES
│   │   ├── humanDelay.ts               # Delays humanizados
│   │   ├── rateLimiter.ts              # Rate limiting
│   │   └── logger.ts                   # Logging
│   │
│   ├── types/                          # 📝 TIPOS GLOBALES
│   │   └── index.ts                    # Tipos compartidos
│   │
│   └── server.ts                       # 🚀 ENTRY POINT
│
├── nixpacks.toml                       # Config Chromium Railway
├── package.json
├── tsconfig.json
├── .env                                # Variables (no commitear)
└── .env.example                        # Template variables
```

---

## Frontend (Vercel)

```
frontend/
│
├── app/                                # 📄 PÁGINAS (App Router)
│   │
│   ├── (auth)/                         # Rutas de autenticación
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (marketing)/                    # Landing, pricing, etc.
│   │   ├── page.tsx                    # Home
│   │   └── layout.tsx
│   │
│   ├── (application)/                  # 🔐 APP PROTEGIDA
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── conversations/              # Chat WhatsApp
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── clients/                    # Gestión clientes
│   │   │   └── page.tsx
│   │   │
│   │   ├── settings/                   # ⚙️ CONFIGURACIÓN
│   │   │   │
│   │   │   ├── connections/            # 📱 WHATSAPP CONNECTION
│   │   │   │   ├── page.tsx            # Página principal
│   │   │   │   ├── components/
│   │   │   │   │   ├── WhatsAppCard.tsx
│   │   │   │   │   ├── QRModal.tsx
│   │   │   │   │   ├── ConnectionStatus.tsx
│   │   │   │   │   └── DisconnectButton.tsx
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── layout.tsx
│   │   │
│   │   └── layout.tsx                  # Layout con sidebar
│   │
│   ├── api/                            # API Routes (si necesitas)
│   │   └── health/
│   │       └── route.ts
│   │
│   ├── globals.css
│   └── layout.tsx                      # Root layout
│
├── components/                         # 🧩 COMPONENTES GLOBALES
│   │
│   ├── ui/                             # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── layout/                         # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   │
│   └── shared/                         # Componentes compartidos
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
├── hooks/                              # 🪝 CUSTOM HOOKS
│   │
│   ├── ui/                             # Hooks de UI
│   │   └── use-toast.ts
│   │
│   └── whatsapp/                       # 📱 HOOKS WHATSAPP
│       ├── useWhatsApp.ts              # Hook principal
│       ├── useWhatsAppStatus.ts        # Estado de conexión
│       └── useWhatsAppMessages.ts      # Mensajes
│
├── lib/                                # 📚 LIBRERÍAS/UTILS
│   ├── supabase/
│   │   ├── client.ts                   # Cliente browser
│   │   └── server.ts                   # Cliente server
│   ├── socket.ts                       # Configuración Socket.IO
│   └── utils.ts                        # Utilidades generales
│
├── contexts/                           # 🌐 CONTEXTOS REACT
│   ├── AuthContext.tsx
│   └── WhatsAppContext.tsx             # Estado global WhatsApp
│
├── types/                              # 📝 TIPOS
│   ├── supabase.ts                     # Tipos generados Supabase
│   └── whatsapp.ts                     # Tipos WhatsApp
│
├── public/                             # Archivos estáticos
│   └── images/
│
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── .env.local                          # Variables (no commitear)
└── .env.example
```

---

## Dónde Está Cada Cosa

### Backend - Lógica WhatsApp

| Archivo | Responsabilidad |
|---------|-----------------|
| `modules/whatsapp/whatsapp.service.ts` | Crear/destruir sesiones, manejar eventos |
| `modules/whatsapp/whatsapp.socket.ts` | Eventos Socket.IO (QR, status, etc.) |
| `modules/whatsapp/whatsapp.types.ts` | Interfaces y tipos |
| `services/keepalive.service.ts` | Heartbeat, Watchdog, Browser Activity |
| `services/keepaliveMessages.service.ts` | Mensajes cada 55-65 min |
| `services/sessionMonitoring.service.ts` | Health check sesiones |
| `config/puppeteer.ts` | Configuración Chromium optimizada |

### Frontend - UI WhatsApp

| Archivo | Responsabilidad |
|---------|-----------------|
| `app/(application)/settings/connections/page.tsx` | Página de conexiones |
| `app/(application)/settings/connections/components/` | Componentes específicos |
| `hooks/whatsapp/useWhatsApp.ts` | Hook de conexión |
| `lib/socket.ts` | Cliente Socket.IO |
| `contexts/WhatsAppContext.tsx` | Estado global |

---

## Archivos Clave a Crear

### Backend (en orden)

```
1. src/config/supabase.ts
2. src/config/redis.ts
3. src/config/puppeteer.ts
4. src/modules/whatsapp/whatsapp.types.ts
5. src/modules/whatsapp/whatsapp.service.ts
6. src/modules/whatsapp/whatsapp.socket.ts
7. src/services/keepalive.service.ts
8. src/services/keepaliveMessages.service.ts
9. src/services/sessionMonitoring.service.ts
10. src/server.ts (actualizar)
```

### Frontend (en orden)

```
1. lib/socket.ts
2. hooks/whatsapp/useWhatsApp.ts
3. contexts/WhatsAppContext.tsx
4. app/(application)/settings/connections/components/WhatsAppCard.tsx
5. app/(application)/settings/connections/components/QRModal.tsx
6. app/(application)/settings/connections/page.tsx (actualizar)
```

---

## Convenciones de Nombres

### Archivos

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `WhatsAppCard.tsx` |
| Hooks | camelCase con "use" | `useWhatsApp.ts` |
| Servicios | camelCase con ".service" | `keepalive.service.ts` |
| Tipos | camelCase con ".types" | `whatsapp.types.ts` |
| Rutas | camelCase con ".routes" | `whatsapp.routes.ts` |
| Configs | camelCase | `puppeteer.ts` |

### Variables/Funciones

```typescript
// Servicios - clases con PascalCase, instancias con camelCase
class WhatsAppService { }
export const whatsappService = new WhatsAppService();

// Hooks - funciones con "use" prefix
export function useWhatsApp() { }

// Componentes - PascalCase
export function WhatsAppCard() { }

// Constantes - UPPER_SNAKE_CASE
const MAX_SESSIONS = 15;
const KEEPALIVE_INTERVAL = 2 * 60 * 1000;
```

---

## Imports Recomendados

### Backend

```typescript
// Configs
import { supabaseAdmin } from '@/config/supabase';
import { redis } from '@/config/redis';
import { PUPPETEER_CONFIG } from '@/config/puppeteer';

// Services
import { whatsappService } from '@/modules/whatsapp/whatsapp.service';
import { keepaliveService } from '@/services/keepalive.service';

// Types
import type { WhatsAppSession, SessionStatus } from '@/modules/whatsapp/whatsapp.types';
```

### Frontend

```typescript
// Hooks
import { useWhatsApp } from '@/hooks/whatsapp/useWhatsApp';

// Components
import { WhatsAppCard } from './components/WhatsAppCard';
import { Button } from '@/components/ui/button';

// Lib
import { socket } from '@/lib/socket';
import { supabase } from '@/lib/supabase/client';
```

---

## tsconfig.json Paths (Backend)

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@/config/*": ["config/*"],
      "@/modules/*": ["modules/*"],
      "@/services/*": ["services/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"]
    }
  }
}
```

---

**Documento:** 13_ESTRUCTURA_PROYECTO.md  
**Versión:** 2.2
