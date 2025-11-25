# 🗄️ Esquema de Base de Datos Supabase - WhaHook

## 📋 Tablas Necesarias para WhatsApp Connection

---

## 🔑 Tablas Críticas (Obligatorias)

### 1. `whatsapp_accounts`

**Propósito:** Almacenar las cuentas/sesiones de WhatsApp de cada usuario.

```sql
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificación de sesión
  session_id TEXT UNIQUE NOT NULL,  -- ⭐ CRÍTICO: user_123_wa_456
  phone_number TEXT,                 -- Se llena cuando conecta
  
  -- Estado de conexión
  status TEXT NOT NULL DEFAULT 'initializing' 
    CHECK (status IN ('initializing', 'ready', 'error')),
  
  -- Información adicional
  name TEXT,                         -- Alias (ej: "Ventas Principal")
  profile_name TEXT,                 -- Nombre del perfil WhatsApp
  
  -- Actividad y monitoreo
  last_seen TIMESTAMPTZ,            -- ⭐ CRÍTICO: Para heartbeat
  last_check TIMESTAMPTZ,           -- Para health checks
  connected_at TIMESTAMPTZ,         -- Cuándo se conectó
  
  -- Errores
  error_message TEXT,               -- Mensaje de error si status='error'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata (opcional)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices críticos
CREATE INDEX idx_wa_accounts_user ON whatsapp_accounts(user_id);
CREATE INDEX idx_wa_accounts_session ON whatsapp_accounts(session_id);
CREATE INDEX idx_wa_accounts_status ON whatsapp_accounts(status);
CREATE INDEX idx_wa_accounts_last_seen ON whatsapp_accounts(last_seen);

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Columnas Críticas para Conexión:**
- ✅ `session_id` - Identificador único de la sesión
- ✅ `status` - Estado actual ('initializing', 'ready', 'error')
- ✅ `last_seen` - Última actividad (actualizado por heartbeat cada 2 min)
- ✅ `last_check` - Última verificación (health check)
- ✅ `phone_number` - Número de WhatsApp conectado
- ✅ `connected_at` - Timestamp de conexión
- ✅ `error_message` - Mensaje de error si falla

---

### 2. `users_profile`

**Propósito:** Perfil extendido de usuarios (para emails de notificación).

```sql
CREATE TABLE IF NOT EXISTS public.users_profile (
  -- ID referencia a auth.users
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información personal
  email TEXT UNIQUE NOT NULL,       -- ⭐ CRÍTICO: Para enviar emails
  full_name TEXT,
  avatar_url TEXT,
  
  -- Información de negocio
  company_name TEXT,
  phone TEXT,
  
  -- Configuración
  timezone TEXT DEFAULT 'Europe/Madrid',
  language TEXT DEFAULT 'es',
  
  -- Suscripción
  subscription_tier TEXT DEFAULT 'free' 
    CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise', 'admin')),
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_users_profile_email ON users_profile(email);
CREATE INDEX idx_users_profile_subscription ON users_profile(subscription_tier);
```

**Columnas Críticas:**
- ✅ `email` - Para enviar notificaciones de conexión/desconexión
- ✅ `full_name` - Para personalizar emails
- ✅ `subscription_tier` - Para límites de sesiones

---

### 3. `conversations`

**Propósito:** Hilos de conversación con clientes.

```sql
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  
  -- Contacto
  contact_phone TEXT NOT NULL,      -- ⭐ CRÍTICO: Número del cliente
  contact_name TEXT,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'closed', 'escalated')),
  
  -- IA y Fallback
  ai_enabled BOOLEAN DEFAULT TRUE,
  requires_human_attention BOOLEAN DEFAULT FALSE,
  fallback_reason TEXT,
  fallback_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_wa_account ON conversations(whatsapp_account_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_phone);
CREATE INDEX idx_conversations_status ON conversations(status);
```

**Columnas Críticas:**
- ✅ `whatsapp_account_id` - Relaciona con la sesión WhatsApp
- ✅ `contact_phone` - Número del cliente
- ✅ `ai_enabled` - Si la IA está activa
- ✅ `requires_human_attention` - Si necesita atención humana

---

### 4. `messages`

**Propósito:** Mensajes individuales de las conversaciones.

```sql
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenido
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  
  -- Dirección
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  -- WhatsApp específico
  whatsapp_message_id TEXT,         -- ID del mensaje en WhatsApp
  from_number TEXT,
  to_number TEXT,
  
  -- Media
  has_media BOOLEAN DEFAULT FALSE,
  media_url TEXT,
  media_type TEXT,
  
  -- Estado
  status TEXT DEFAULT 'sent' 
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  
  -- IA
  is_ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  ai_tokens_used INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_whatsapp_id ON messages(whatsapp_message_id);
```

**Columnas Críticas:**
- ✅ `conversation_id` - Relaciona con la conversación
- ✅ `content` - Contenido del mensaje
- ✅ `direction` - 'inbound' (recibido) o 'outbound' (enviado)
- ✅ `whatsapp_message_id` - ID único de WhatsApp

---

## 🔧 Tablas Opcionales (Recomendadas)

### 5. `whatsapp_audit_log`

**Propósito:** Auditoría de eventos de WhatsApp.

```sql
CREATE TABLE IF NOT EXISTS public.whatsapp_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  
  -- Evento
  event_type TEXT NOT NULL,         -- 'connected', 'disconnected', 'qr_generated', etc.
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Contexto
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_log_user ON whatsapp_audit_log(user_id);
CREATE INDEX idx_audit_log_session ON whatsapp_audit_log(session_id);
CREATE INDEX idx_audit_log_event ON whatsapp_audit_log(event_type);
CREATE INDEX idx_audit_log_created ON whatsapp_audit_log(created_at DESC);
```

---

### 6. Storage Bucket: `whatsapp-backups`

**Propósito:** Almacenar backups de sesiones WhatsApp.

```sql
-- Crear bucket en Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-backups', 'whatsapp-backups', false);

-- Políticas de acceso
CREATE POLICY "Users can upload their own backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'whatsapp-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'whatsapp-backups' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can manage all backups"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'whatsapp-backups');
```

**Estructura de archivos:**
```
whatsapp-backups/
├── sessions/
│   ├── session-user_123_wa_456-2025-11-25T02-00-00.tar.gz
│   ├── session-user_123_wa_789-2025-11-25T02-00-00.tar.gz
│   └── ...
└── database/
    ├── database-backup-2025-11-25T02-00-00.json.gz
    └── ...
```

---

## 🔐 Row Level Security (RLS)

### Políticas para `whatsapp_accounts`

```sql
-- Habilitar RLS
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo ven sus propias cuentas
CREATE POLICY "Users can view own accounts"
ON whatsapp_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Los usuarios pueden crear sus propias cuentas
CREATE POLICY "Users can create own accounts"
ON whatsapp_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias cuentas
CREATE POLICY "Users can update own accounts"
ON whatsapp_accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias cuentas
CREATE POLICY "Users can delete own accounts"
ON whatsapp_accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Service role tiene acceso completo
CREATE POLICY "Service role has full access"
ON whatsapp_accounts FOR ALL
TO service_role
USING (true);
```

### Políticas para `conversations`

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access"
ON conversations FOR ALL
TO service_role
USING (true);
```

### Políticas para `messages`

```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access"
ON messages FOR ALL
TO service_role
USING (true);
```

---

## 🔄 Funciones y Triggers

### Función para updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Consultas Útiles

### Ver todas las sesiones activas

```sql
SELECT 
  wa.id,
  wa.session_id,
  wa.phone_number,
  wa.status,
  wa.last_seen,
  wa.connected_at,
  up.email,
  up.full_name
FROM whatsapp_accounts wa
JOIN users_profile up ON wa.user_id = up.user_id
WHERE wa.status = 'ready'
ORDER BY wa.last_seen DESC;
```

### Ver sesiones inactivas (>5 días)

```sql
SELECT 
  wa.id,
  wa.session_id,
  wa.phone_number,
  wa.last_seen,
  NOW() - wa.last_seen AS inactive_duration,
  up.email
FROM whatsapp_accounts wa
JOIN users_profile up ON wa.user_id = up.user_id
WHERE 
  wa.status = 'ready' AND
  wa.last_seen < NOW() - INTERVAL '5 days'
ORDER BY wa.last_seen ASC;
```

### Ver conversaciones con fallback

```sql
SELECT 
  c.id,
  c.contact_phone,
  c.fallback_reason,
  c.fallback_at,
  wa.phone_number AS whatsapp_number,
  up.email AS user_email
FROM conversations c
JOIN whatsapp_accounts wa ON c.whatsapp_account_id = wa.id
JOIN users_profile up ON c.user_id = up.user_id
WHERE c.requires_human_attention = true
ORDER BY c.fallback_at DESC;
```

---

## ✅ Checklist de Setup

### Paso 1: Crear Tablas Base
- [ ] Ejecutar `01-schema-base.sql`
- [ ] Verificar que `users_profile` existe
- [ ] Verificar que `whatsapp_accounts` existe
- [ ] Verificar que `conversations` existe
- [ ] Verificar que `messages` existe

### Paso 2: Crear Extensiones WhatsApp
- [ ] Ejecutar `02-whatsapp-extension.sql`
- [ ] Verificar columnas adicionales en `whatsapp_accounts`
- [ ] Verificar tabla `whatsapp_audit_log`

### Paso 3: Configurar Storage
- [ ] Crear bucket `whatsapp-backups`
- [ ] Configurar políticas de acceso
- [ ] Verificar permisos

### Paso 4: Habilitar RLS
- [ ] Habilitar RLS en todas las tablas
- [ ] Crear políticas para usuarios
- [ ] Crear políticas para service_role
- [ ] Probar acceso con usuario test

### Paso 5: Crear Índices
- [ ] Verificar índices en `whatsapp_accounts`
- [ ] Verificar índices en `conversations`
- [ ] Verificar índices en `messages`

### Paso 6: Configurar Triggers
- [ ] Trigger `updated_at` en `whatsapp_accounts`
- [ ] Trigger `updated_at` en `conversations`
- [ ] Trigger `updated_at` en `messages`

---

## 🎯 Resumen

### Tablas Críticas (4)
1. ✅ `whatsapp_accounts` - Sesiones WhatsApp
2. ✅ `users_profile` - Perfiles de usuario
3. ✅ `conversations` - Conversaciones
4. ✅ `messages` - Mensajes

### Storage (1)
1. ✅ `whatsapp-backups` - Backups de sesiones

### Tablas Opcionales (1)
1. ⭐ `whatsapp_audit_log` - Auditoría

### Columnas Más Importantes
- `whatsapp_accounts.session_id` - Identificador único
- `whatsapp_accounts.status` - Estado de conexión
- `whatsapp_accounts.last_seen` - Para heartbeat
- `users_profile.email` - Para notificaciones
- `conversations.contact_phone` - Número del cliente

---

**Documento creado:** 25 de Noviembre, 2025  
**Estado:** ✅ COMPLETO  
**Tablas documentadas:** 4 críticas + 1 opcional  
**Storage:** 1 bucket
