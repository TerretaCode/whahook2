# Whahook - Sistema de Planes y Multi-Empresa

## Resumen Ejecutivo

Este documento define la estrategia de planes de suscripción y el sistema multi-tenant (multi-empresa) para Whahook, permitiendo que agencias de marketing y empresas con múltiples marcas gestionen varios negocios desde una sola cuenta.

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
| Mensajes IA/mes | 500 |
| CRM | Básico (solo contactos) |
| Historial mensajes | 30 días |
| Soporte | Email |

**Funcionalidades CRM Básico**:
- ✅ Lista de contactos/clientes
- ✅ Historial de conversaciones
- ✅ Etiquetas básicas
- ❌ Campañas automáticas
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
| Mensajes IA/mes | 5,000 |
| CRM | Completo |
| Historial mensajes | 1 año |
| Soporte | Prioritario |

**Funcionalidades CRM Completo**:
- ✅ Todo lo del CRM Básico
- ✅ Campañas automáticas (mensajes programados)
- ✅ Segmentación por etiquetas
- ✅ Notas y campos personalizados
- ✅ Exportación CSV
- ✅ Métricas y analytics

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
| Mensajes IA/mes | Ilimitados |
| CRM | Completo + API |
| Historial mensajes | Ilimitado |
| Soporte | Dedicado + Onboarding |

**Funcionalidades adicionales**:
- ✅ Todo lo del Professional
- ✅ API de acceso
- ✅ Webhooks personalizados
- ✅ White-label (sin marca Whahook en widgets)
- ✅ Enlaces de acceso para clientes
- ✅ Roles y permisos avanzados
- ✅ Reportes personalizados

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
- Gestión de facturación
- Crear/eliminar workspaces
- Invitar usuarios

#### Admin (Administrador de workspace)
- Acceso total a UN workspace específico
- Configurar chatbot, conexiones
- Ver analytics
- Gestionar clientes y campañas

#### Agent (Agente/Operador)
- Solo acceso a conversaciones
- Responder mensajes
- Ver clientes (solo lectura)
- NO puede configurar nada

### 2.3 Enlaces de Acceso para Clientes (Enterprise)

La funcionalidad clave para agencias: generar un enlace único que permite al cliente final acceder SOLO a su workspace.

**URL de ejemplo**: `https://app.whahook.com/workspace/abc123-token`

**Lo que ve el cliente al acceder**:
- Dashboard simplificado (solo su workspace)
- Bandeja de mensajes (conversaciones que necesitan atención)
- Lista de clientes (su CRM)
- NO ve: Configuración, otros workspaces, facturación

```
┌─────────────────────────────────────────────────────────────┐
│  VISTA AGENCIA (Owner)           VISTA CLIENTE (Link)       │
├─────────────────────────────────────────────────────────────┤
│  ✅ Dashboard global             ✅ Dashboard workspace      │
│  ✅ Todos los workspaces         ❌ Solo SU workspace        │
│  ✅ Configuración                ❌ Sin configuración        │
│  ✅ Facturación                  ❌ Sin facturación          │
│  ✅ Crear workspaces             ❌ No puede crear           │
│  ✅ Analytics global             ✅ Analytics propio         │
│  ✅ Gestión chatbot              ❌ Solo ver chatbot         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Flujo de Trabajo para Agencias

### 3.1 Onboarding de nuevo cliente

```
1. Agencia crea nuevo Workspace "Restaurante El Buen Sabor"
   └── Configura nombre, logo, colores

2. Agencia conecta WhatsApp del cliente
   └── Cliente escanea QR desde su teléfono
   └── La sesión queda vinculada al workspace

3. Agencia configura el chatbot
   └── Prompt personalizado para el restaurante
   └── Horarios, menú, reservas, etc.

4. Agencia instala widget en web del cliente
   └── Copia código embed
   └── Personaliza colores para la marca

5. Agencia genera enlace de acceso
   └── https://app.whahook.com/workspace/xyz789
   └── Envía enlace al cliente

6. Cliente accede con el enlace
   └── Ve solo SU dashboard
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

## 4. Modelo de Datos

### 4.1 Nuevas tablas necesarias

```sql
-- Workspaces (empresas/clientes)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
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

## 6. Comparativa con Competencia

| Característica | Whahook | Respond.io | WATI | Manychat |
|----------------|---------|------------|------|----------|
| Multi-workspace | ✅ | ✅ | ❌ | ✅ |
| Enlaces de acceso | ✅ | ❌ | ❌ | ❌ |
| White-label | ✅ Enterprise | ✅ | ❌ | ❌ |
| Precio entrada | 12€ | $79 | $49 | $15 |
| IA incluida | ✅ | Extra | Extra | Extra |

---

## 7. Implementación por Fases

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

### Fase 4: Roles y Permisos (1 semana)
- [ ] Implementar roles (owner, admin, agent)
- [ ] Restricciones por rol en UI
- [ ] Restricciones por rol en API

### Fase 5: Dashboard Global (1 semana)
- [ ] Vista resumen de todos los workspaces
- [ ] Métricas agregadas
- [ ] Alertas globales

---

## 8. Preguntas Frecuentes

**¿Qué pasa si un cliente quiere su propia cuenta?**
> Puede registrarse con plan Starter. La agencia puede transferir el workspace si es necesario.

**¿Cómo se factura?**
> La agencia paga por el plan. Puede cobrar a sus clientes lo que quiera.

**¿El cliente puede ver que usa Whahook?**
> En Enterprise con white-label, no. En otros planes, sí aparece "Powered by Whahook".

**¿Qué pasa si la agencia cancela?**
> Los workspaces se desactivan. Se puede exportar datos antes.

**¿Puede un workspace tener múltiples WhatsApp?**
> Sí, según el plan. Starter: 1, Professional: 3, Enterprise: 10.

---

## 9. Resumen de Planes Final

| | Trial | Starter | Professional | Enterprise |
|---|---|---|---|---|
| **Precio** | Gratis 7 días | 12€/mes | 28€/mes | 89€/mes |
| **WhatsApp** | 1 | 1 | 3 | 10 |
| **Widgets Web** | 1 | 1 | 3 | 10 |
| **Workspaces** | 1 | 1 | 3 | 10 |
| **Usuarios** | 1 | 1 | 3/workspace | Ilimitados |
| **CRM** | Básico | Básico | Completo | Completo + API |
| **Campañas** | ❌ | ❌ | ✅ | ✅ |
| **Enlaces acceso** | ❌ | ❌ | ❌ | ✅ |
| **White-label** | ❌ | ❌ | ❌ | ✅ |
| **Soporte** | Email | Email | Prioritario | Dedicado |

---

*Documento creado: Noviembre 2024*
*Última actualización: Noviembre 2024*
