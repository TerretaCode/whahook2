# Whahook - Sistema de Planes y Multi-Empresa

## Resumen Ejecutivo

Este documento define la estrategia de planes de suscripción y el sistema multi-tenant (multi-empresa) para Whahook, permitiendo que agencias de marketing y empresas con múltiples marcas gestionen varios negocios desde una sola cuenta.

### Modelo de negocio IA
> **IMPORTANTE**: El coste de la IA (Google Gemini) NO está incluido en los planes.
> Cada usuario/empresa configura su propia API Key de Gemini y paga directamente a Google.
> Whahook solo cobra por el uso de la plataforma.

---

## 1. Estructura de Planes

### 1.1 Plan Trial (7 días gratis)
- **Precio**: Gratis durante 7 días
- **Después**: Se convierte automáticamente en Starter o se desactiva
- **Incluye**: Todo lo del plan Starter para probar

### 1.2 Plan Starter - 12€/mes
**Público objetivo**: Pequeños negocios, autónomos, tiendas locales

| Característica | Límite |
|----------------|--------|
| Conexiones WhatsApp | 1 |
| Widgets Web | 1 |
| Workspaces (empresas) | 1 |
| Usuarios | 1 |
| IA | Ilimitada (API propia) |
| CRM | Básico (solo contactos) |
| Historial mensajes | 30 días |
| Soporte | Email |

**Funcionalidades CRM Básico**:
- ✅ Lista de contactos/clientes
- ✅ Historial de conversaciones
- ✅ Etiquetas básicas
- ❌ Campañas WhatsApp/Email
- ❌ Segmentación avanzada
- ❌ Exportación de datos

### 1.3 Plan Professional - 28€/mes
**Público objetivo**: Empresas medianas, negocios con múltiples canales, pequeñas agencias

| Característica | Límite |
|----------------|--------|
| Conexiones WhatsApp | 3 |
| Widgets Web | 3 |
| Workspaces (empresas) | 3 |
| Usuarios por workspace | 3 |
| IA | Ilimitada (API por workspace) |
| CRM | Completo |
| Historial mensajes | 1 año |
| Soporte | Prioritario |

**Funcionalidades CRM Completo**:
- ✅ Todo lo del CRM Básico
- ✅ **Campañas WhatsApp** (mensajes masivos programados)
- ✅ **Campañas Email** (a contactos con email registrado)
- ✅ Segmentación por etiquetas
- ✅ Notas y campos personalizados
- ✅ Exportación CSV
- ✅ Métricas y analytics

**Funcionalidades Multi-Empresa (igual que Enterprise, limitado a 3)**:
- ✅ **White-label** (footer personalizable en widgets)
- ✅ **Enlaces de acceso para clientes**
- ✅ **Envío de QR remoto**
- ✅ **API Key por workspace** con tracking de gastos opcional

**Casos de uso**:
- Empresa con tienda física + online (2 WhatsApp diferentes)
- Negocio con departamento ventas y soporte separados
- Pequeña agencia que gestiona 2-3 clientes

### 1.4 Plan Enterprise - 89€/mes
**Público objetivo**: Agencias de marketing, franquicias, empresas con múltiples marcas

| Característica | Límite |
|----------------|--------|
| Conexiones WhatsApp | 10 |
| Widgets Web | 10 |
| Workspaces (empresas) | 10 |
| Usuarios por workspace | Ilimitados |
| IA | Ilimitada (API por workspace) |
| CRM | Completo + API |
| Historial mensajes | Ilimitado |
| Soporte | Dedicado + Onboarding |

**Funcionalidades exclusivas Enterprise**:
- ✅ Todo lo del Professional (pero con límites de 10 en vez de 3)
- ✅ API de acceso externa
- ✅ Webhooks personalizados
- ✅ Roles y permisos avanzados
- ✅ Reportes personalizados
- ✅ Soporte dedicado con onboarding

---

## 2. Sistema Multi-Empresa (Workspaces)

### 2.1 Concepto

Un **Workspace** es un espacio aislado que representa una empresa/cliente. Cada workspace tiene:
- Sus propias conexiones WhatsApp
- Sus propios widgets web
- Su propia base de clientes
- Sus propias conversaciones
- Su propia configuración de chatbot

```
┌─────────────────────────────────────────────────────────────┐
│                    CUENTA PRINCIPAL                          │
│                  (Agencia de Marketing)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Workspace 1 │  │ Workspace 2 │  │ Workspace 3 │          │
│  │ Restaurante │  │ Clínica     │  │ Tienda Ropa │          │
│  │             │  │ Dental      │  │             │          │
│  │ • 1 WhatsApp│  │ • 1 WhatsApp│  │ • 1 WhatsApp│          │
│  │ • 1 Widget  │  │ • 1 Widget  │  │ • 1 Widget  │          │
│  │ • Clientes  │  │ • Clientes  │  │ • Clientes  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Roles de Usuario

#### Owner (Propietario de la cuenta)
- Acceso total a todos los workspaces
- Crear/eliminar workspaces
- Invitar usuarios
- Configurar API Keys por workspace
- Ver gastos de IA (opcional)

#### Admin (Administrador de workspace)
- Acceso total a UN workspace específico
- Configurar chatbot, conexiones
- Ver analytics
- Gestionar clientes y campañas
- Enviar QR de conexión WhatsApp

#### Agent (Agente/Operador)
- Solo acceso a conversaciones
- Responder mensajes
- Ver clientes (solo lectura)
- NO puede configurar nada

### 2.3 Enlaces de Acceso para Clientes (Professional y Enterprise)

La funcionalidad clave para agencias: generar un enlace único que permite al cliente final acceder SOLO a su workspace.

> **OBJETIVO**: El panel del cliente debe parecer de la propia agencia, no de Whahook.
> El cliente NO debe saber que la agencia usa Whahook para evitar que se vayan directamente a nosotros.

**URL de ejemplo**: `https://app.whahook.com/w/abc123-token`
O con dominio personalizado: `https://panel.agencia.com/cliente/abc123`

**Lo que ve el cliente al acceder**:
- Dashboard simplificado (solo su workspace)
- Bandeja de mensajes (conversaciones que necesitan atención)
- Lista de clientes (su CRM)
- Gastos de IA (si la agencia lo activa)
- NO ve: Configuración, otros workspaces, marca Whahook

```
┌─────────────────────────────────────────────────────────────┐
│  VISTA AGENCIA (Owner)           VISTA CLIENTE (Link)       │
├─────────────────────────────────────────────────────────────┤
│  ✅ Dashboard global             ✅ Dashboard workspace      │
│  ✅ Todos los workspaces         ❌ Solo SU workspace        │
│  ✅ Configuración completa       ❌ Sin configuración        │
│  ✅ Crear workspaces             ❌ No puede crear           │
│  ✅ Analytics global             ✅ Analytics propio         │
│  ✅ Gestión chatbot              ❌ Solo ver chatbot         │
│  ✅ Ver gastos IA todos          ⚙️ Ver gastos IA (opcional) │
│  ✅ Marca Whahook visible        ❌ Marca agencia/ninguna    │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Envío de QR Remoto (Professional y Enterprise)

Para conectar WhatsApp sin necesidad de tener el móvil del cliente presencialmente:

```
┌─────────────────────────────────────────────────────────────┐
│  FLUJO DE CONEXIÓN REMOTA                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Agencia crea workspace para cliente                     │
│                    ↓                                         │
│  2. Agencia genera "Enlace de conexión WhatsApp"            │
│                    ↓                                         │
│  3. Enlace se envía al cliente por email/WhatsApp           │
│     https://app.whahook.com/connect/xyz789                  │
│                    ↓                                         │
│  4. Cliente abre enlace en su móvil                         │
│                    ↓                                         │
│  5. Ve página con QR + instrucciones                        │
│     "Abre WhatsApp > Dispositivos vinculados > Escanear"    │
│                    ↓                                         │
│  6. Cliente escanea QR desde su WhatsApp                    │
│                    ↓                                         │
│  7. Conexión establecida ✅                                  │
│     Agencia recibe notificación                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Página de conexión (vista del cliente)**:
- Logo de la agencia (white-label)
- Instrucciones paso a paso
- QR code que se actualiza automáticamente
- Estado de conexión en tiempo real
- Sin mencionar Whahook

---

## 3. White-Label (Professional y Enterprise)

### 3.1 Elementos personalizables

| Elemento | Descripción |
|----------|-------------|
| **Widget Web Footer** | Cambiar "Powered by Whahook" por "Powered by [Agencia]" con link personalizado |
| **Panel de cliente** | Logo, colores, nombre de la agencia |
| **Emails transaccionales** | Remitente y branding de la agencia |
| **Página de conexión QR** | Branding completo de la agencia |
| **Dominio** (futuro) | Posibilidad de usar subdominio propio |

### 3.2 Configuración en el workspace

```typescript
workspace.white_label = {
  enabled: true,
  brand_name: "Marketing Pro Agency",
  brand_logo_url: "https://...",
  brand_color: "#FF5722",
  widget_footer_text: "Powered by Marketing Pro",
  widget_footer_url: "https://marketingpro.com",
  hide_whahook_branding: true,
  show_ai_costs_to_client: false, // Opcional
}
```

---

## 4. Gestión de API Keys y Costes IA (Professional y Enterprise)

### 4.1 API Key por Workspace

En los planes Professional y Enterprise, cada workspace puede tener su propia API Key de Gemini:

```
┌─────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN IA - Workspace "Restaurante"                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API Key de Gemini:                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ AIza●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●  [Cambiar]     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ☑️ Usar API Key del workspace (no la global)               │
│                                                              │
│  Mostrar costes al cliente:                                 │
│  ○ No mostrar (el cliente no ve gastos)                     │
│  ● Mostrar solo total mensual                               │
│  ○ Mostrar desglose completo                                │
│                                                              │
│  ⚠️ Si no configuras API Key, se usará la global de la      │
│     cuenta y los costes se agregarán al total.              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Tracking de costes (opcional)

Si la agencia activa "Mostrar costes al cliente":

```
┌─────────────────────────────────────────────────────────────┐
│  PANEL CLIENTE - Gastos IA (Noviembre 2024)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Total este mes: 12.45€                                     │
│                                                              │
│  Desglose:                                                  │
│  • Mensajes procesados: 1,234                               │
│  • Tokens entrada: 245,000                                  │
│  • Tokens salida: 89,000                                    │
│                                                              │
│  📊 Ver historial de meses anteriores                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

> **NOTA**: La agencia puede decidir NO mostrar esto si prefiere cobrar un precio fijo
> a sus clientes sin revelar el coste real de la IA.

---

## 5. Campañas WhatsApp y Email

### 5.1 Tipos de campañas (Professional y Enterprise)

| Tipo | Descripción |
|------|-------------|
| **WhatsApp Broadcast** | Mensaje masivo a contactos seleccionados |
| **Email Marketing** | Campañas a contactos con email registrado |
| **Secuencias** | Mensajes automáticos tras X días sin respuesta |
| **Recordatorios** | Citas, pagos pendientes, etc. |

### 5.2 Segmentación

Las campañas pueden segmentarse por:
- Etiquetas de cliente
- Última interacción (hace X días)
- Estado de conversación
- Campos personalizados

---

## 6. Flujo de Trabajo para Agencias

### 6.1 Onboarding de nuevo cliente (REMOTO)

```
1. Agencia crea nuevo Workspace "Restaurante El Buen Sabor"
   └── Configura nombre, logo, colores
   └── Configura white-label (logo agencia, ocultar Whahook)

2. Agencia genera enlace de conexión WhatsApp
   └── https://app.whahook.com/connect/xyz789
   └── Envía por email/WhatsApp al cliente

3. Cliente abre enlace en su móvil
   └── Ve página con branding de la agencia
   └── Escanea QR desde su WhatsApp
   └── Conexión establecida ✅

4. Agencia configura el chatbot
   └── Prompt personalizado para el restaurante
   └── Horarios, menú, reservas, etc.
   └── (Opcional) Configura API Key específica

5. Agencia instala widget en web del cliente
   └── Copia código embed
   └── Footer muestra "Powered by [Agencia]"

6. Agencia genera enlace de acceso al panel
   └── https://app.whahook.com/w/abc123
   └── Envía enlace al cliente

7. Cliente accede con el enlace
   └── Ve panel con branding de la agencia
   └── Puede responder mensajes que necesitan atención
   └── Ve sus clientes y conversaciones
```

### 3.2 Operación diaria

**La agencia**:
- Monitorea todos los workspaces desde su dashboard
- Ve métricas globales
- Ajusta configuración de chatbots
- Gestiona campañas automáticas

**El cliente**:
- Recibe notificación cuando hay mensaje que necesita atención
- Accede con su enlace
- Responde mensajes manualmente
- Ve historial de sus clientes

---

## 7. Modelo de Datos

### 7.1 Nuevas tablas necesarias

```sql
-- Workspaces (empresas/clientes)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  
  -- White-label settings
  white_label JSONB DEFAULT '{
    "enabled": false,
    "brand_name": null,
    "brand_logo_url": null,
    "brand_color": null,
    "widget_footer_text": null,
    "widget_footer_url": null,
    "hide_whahook_branding": false,
    "show_ai_costs_to_client": false
  }',
  
  -- API Key específica del workspace (Enterprise)
  gemini_api_key TEXT, -- Encriptada
  
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Miembros de workspace
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- NULL si es acceso por token
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'agent')),
  access_token TEXT UNIQUE, -- Para enlaces de acceso sin cuenta
  token_expires_at TIMESTAMPTZ,
  invited_email TEXT,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enlaces de conexión WhatsApp (para envío remoto de QR)
CREATE TABLE workspace_connection_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking de uso de IA por workspace
CREATE TABLE workspace_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- Primer día del mes
  messages_count INTEGER DEFAULT 0,
  tokens_input BIGINT DEFAULT 0,
  tokens_output BIGINT DEFAULT 0,
  estimated_cost_eur DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, month)
);

-- Campañas (WhatsApp y Email)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')),
  message_template TEXT NOT NULL,
  subject TEXT, -- Solo para email
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Segmentación
  filters JSONB DEFAULT '{}', -- {"tags": ["vip"], "last_interaction_days": 30}
  
  -- Estadísticas
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modificar tablas existentes para añadir workspace_id
ALTER TABLE whatsapp_accounts ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE chat_widgets ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE conversations ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE clients ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
```

### 4.2 Lógica de acceso

```typescript
// Middleware para verificar acceso a workspace
async function requireWorkspaceAccess(req, res, next) {
  const workspaceId = req.params.workspaceId || req.body.workspace_id;
  const userId = req.user.id;
  const accessToken = req.headers['x-workspace-token'];
  
  // Verificar por usuario autenticado
  if (userId) {
    const member = await db.workspace_members.findOne({
      workspace_id: workspaceId,
      user_id: userId
    });
    if (member) {
      req.workspaceRole = member.role;
      return next();
    }
  }
  
  // Verificar por token de acceso (enlaces)
  if (accessToken) {
    const member = await db.workspace_members.findOne({
      workspace_id: workspaceId,
      access_token: accessToken,
      token_expires_at: { $gt: new Date() }
    });
    if (member) {
      req.workspaceRole = member.role;
      return next();
    }
  }
  
  return res.status(403).json({ error: 'Access denied' });
}
```

---

## 5. Interfaz de Usuario

### 5.1 Selector de Workspace (header)

Para usuarios con múltiples workspaces, mostrar un dropdown en el header:

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Restaurante El Buen Sabor ▼  │  Dashboard  Mensajes  ... │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐                             │
│ │ 🏢 Restaurante El Buen Sabor│ ← Actual                    │
│ │ 🏥 Clínica Dental Sonrisa   │                             │
│ │ 👗 Boutique María          │                             │
│ │ ─────────────────────────── │                             │
│ │ ➕ Crear nuevo workspace    │                             │
│ └─────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard Global (solo Owner)

Vista que muestra resumen de TODOS los workspaces:

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Global                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ 3 Workspaces │ │ 15 Mensajes  │ │ 89 Clientes  │         │
│  │   activos    │ │ sin atender  │ │    totales   │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  Workspaces                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🏢 Restaurante    │ ✅ Online │ 5 pendientes │ Ver →    ││
│  │ 🏥 Clínica        │ ✅ Online │ 3 pendientes │ Ver →    ││
│  │ 👗 Boutique       │ ⚠️ Offline│ 7 pendientes │ Ver →    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Página de Gestión de Workspaces

```
/settings/workspaces

┌─────────────────────────────────────────────────────────────┐
│ Gestión de Empresas                    [+ Crear Workspace]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🏢 Restaurante El Buen Sabor                            ││
│  │ WhatsApp: +34 612 345 678 ✅ │ Widget: restaurante.com  ││
│  │ Clientes: 45 │ Mensajes hoy: 23                         ││
│  │                                                          ││
│  │ [Enlace de acceso] [Configurar] [Eliminar]              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🏥 Clínica Dental Sonrisa                               ││
│  │ WhatsApp: +34 698 765 432 ✅ │ Widget: clinica.es       ││
│  │ Clientes: 120 │ Mensajes hoy: 8                         ││
│  │                                                          ││
│  │ [Enlace de acceso] [Configurar] [Eliminar]              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Modal "Generar Enlace de Acceso"

```
┌─────────────────────────────────────────────────────────────┐
│ Generar Enlace de Acceso                              [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Workspace: Restaurante El Buen Sabor                       │
│                                                              │
│  Permisos del enlace:                                       │
│  ○ Solo lectura (ver mensajes y clientes)                   │
│  ● Agente (responder mensajes, editar clientes)             │
│  ○ Admin (todo excepto configuración de conexiones)         │
│                                                              │
│  Expiración:                                                 │
│  ○ Nunca                                                     │
│  ● 30 días                                                   │
│  ○ 7 días                                                    │
│  ○ Personalizado: [____] días                               │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ https://app.whahook.com/w/abc123xyz                     ││
│  │                                        [Copiar] [Email] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ⚠️ Cualquier persona con este enlace podrá acceder.        │
│     Puedes revocarlo en cualquier momento.                  │
│                                                              │
│                                    [Cancelar] [Generar]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Comparativa con Competencia

| Característica | Whahook | Respond.io | WATI | Manychat |
|----------------|---------|------------|------|----------|
| Multi-workspace | ✅ | ✅ | ❌ | ✅ |
| Enlaces de acceso clientes | ✅ | ❌ | ❌ | ❌ |
| Envío QR remoto | ✅ | ❌ | ❌ | ❌ |
| White-label completo | ✅ Enterprise | ✅ | ❌ | ❌ |
| Campañas WhatsApp | ✅ | ✅ | ✅ | ✅ |
| Campañas Email | ✅ | ❌ | ❌ | ✅ |
| API Key por cliente | ✅ | ❌ | ❌ | ❌ |
| Precio entrada | 12€ | $79 | $49 | $15 |
| IA incluida | API propia | Extra | Extra | Extra |

---

## 10. Implementación por Fases

### Fase 1: Fundamentos (2-3 semanas)
- [ ] Crear tabla `workspaces`
- [ ] Crear tabla `workspace_members`
- [ ] Migrar datos existentes a workspace por defecto
- [ ] Añadir `workspace_id` a tablas existentes
- [ ] Middleware de acceso a workspace

### Fase 2: UI Básica (2 semanas)
- [ ] Selector de workspace en header
- [ ] Página de gestión de workspaces
- [ ] Crear/editar workspace
- [ ] Filtrar datos por workspace activo

### Fase 3: Sistema de Acceso (1-2 semanas)
- [ ] Generar tokens de acceso
- [ ] Página de acceso por token
- [ ] Vista simplificada para clientes
- [ ] Gestión de enlaces activos

### Fase 4: Envío QR Remoto (1 semana)
- [ ] Crear tabla `workspace_connection_links`
- [ ] Página pública de conexión con QR
- [ ] Notificaciones de conexión exitosa
- [ ] Expiración automática de enlaces

### Fase 5: White-Label (1-2 semanas)
- [ ] Configuración de branding por workspace
- [ ] Footer personalizable en widgets
- [ ] Branding en página de conexión QR
- [ ] Branding en panel de cliente

### Fase 6: API Keys y Tracking IA (1 semana)
- [ ] API Key por workspace
- [ ] Tabla `workspace_ai_usage`
- [ ] Tracking de tokens y costes
- [ ] Panel de gastos para clientes (opcional)

### Fase 7: Campañas (2-3 semanas)
- [ ] Crear tabla `campaigns`
- [ ] UI de creación de campañas
- [ ] Segmentación por etiquetas
- [ ] Envío masivo WhatsApp
- [ ] Envío masivo Email
- [ ] Estadísticas de campañas

### Fase 8: Dashboard Global (1 semana)
- [ ] Vista resumen de todos los workspaces
- [ ] Métricas agregadas
- [ ] Alertas globales

---

## 11. Preguntas Frecuentes

**¿Qué pasa si un cliente quiere su propia cuenta?**
> Puede registrarse con plan Starter. La agencia puede transferir el workspace si es necesario.

**¿Cómo se factura a la agencia?**
> La agencia paga solo el plan de Whahook (12€, 28€ o 89€/mes). No hay costes adicionales por nuestra parte.
> Los costes de IA (Gemini) los paga cada uno con su propia API Key directamente a Google.

**¿El cliente puede ver que usa Whahook?**
> En Enterprise con white-label activado, NO. Todo aparece con la marca de la agencia.
> En otros planes, sí aparece "Powered by Whahook" en el widget.

**¿Qué pasa si la agencia cancela?**
> Los workspaces se desactivan. Se puede exportar datos antes.

**¿Puede un workspace tener múltiples WhatsApp?**
> Sí, según el plan. Starter: 1, Professional: 3, Enterprise: 10.

**¿Cómo conecta la agencia el WhatsApp de un cliente remoto?**
> Genera un "Enlace de conexión" que envía al cliente. El cliente abre el enlace,
> ve el QR con branding de la agencia, y lo escanea desde su WhatsApp.

**¿La agencia puede cobrar a sus clientes?**
> Sí, la agencia puede cobrar lo que quiera a sus clientes. Whahook no interviene.
> Si activa "Mostrar gastos IA", el cliente ve el coste real de Gemini.
> Si lo desactiva, puede cobrar un precio fijo sin revelar costes.

---

## 12. Resumen de Planes Final

| | Trial | Starter | Professional | Enterprise |
|---|---|---|---|---|
| **Precio** | Gratis 7 días | 12€/mes | 28€/mes | 89€/mes |
| **WhatsApp** | 1 | 1 | 3 | 10 |
| **Widgets Web** | 1 | 1 | 3 | 10 |
| **Workspaces** | 1 | 1 | 3 | 10 |
| **Usuarios** | 1 | 1 | 3/workspace | Ilimitados |
| **IA** | Ilimitada (API propia) | Ilimitada (API propia) | Ilimitada (API por workspace) | Ilimitada (API por workspace) |
| **CRM** | Básico | Básico | Completo | Completo + API externa |
| **Campañas WhatsApp** | ❌ | ❌ | ✅ | ✅ |
| **Campañas Email** | ❌ | ❌ | ✅ | ✅ |
| **Enlaces acceso clientes** | ❌ | ❌ | ✅ (3 max) | ✅ (10 max) |
| **Envío QR remoto** | ❌ | ❌ | ✅ | ✅ |
| **White-label** | ❌ | ❌ | ✅ | ✅ |
| **API Key por workspace** | ❌ | ❌ | ✅ | ✅ |
| **Tracking gastos IA** | ❌ | ❌ | ✅ (opcional) | ✅ (opcional) |
| **API externa** | ❌ | ❌ | ❌ | ✅ |
| **Webhooks** | ❌ | ❌ | ❌ | ✅ |
| **Soporte** | Email | Email | Prioritario | Dedicado |

---

*Documento creado: Noviembre 2024*
*Última actualización: Noviembre 2024*
