# Esquema de Base de Datos

## Tablas Requeridas

### 1. whatsapp_accounts

Tabla principal para almacenar las cuentas/sesiones WhatsApp de cada usuario.

```sql
-- Crear tabla
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'initializing' 
    CHECK (status IN ('initializing', 'ready', 'error')),
  error_message TEXT,
  
  -- Información de WhatsApp
  phone_number TEXT,
  profile_name TEXT,
  name TEXT,                -- Alias dado por el usuario
  
  -- Timestamps de actividad
  connected_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  
  -- Timestamps estándar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_wa_accounts_user_id ON whatsapp_accounts(user_id);
CREATE INDEX idx_wa_accounts_session_id ON whatsapp_accounts(session_id);
CREATE INDEX idx_wa_accounts_status ON whatsapp_accounts(status);
CREATE INDEX idx_wa_accounts_last_seen ON whatsapp_accounts(last_seen);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_accounts_updated_at
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | Referencia al usuario propietario |
| `session_id` | TEXT | ID de sesión para LocalAuth (user_xxx_wa_yyy) |
| `status` | TEXT | Estado: initializing, ready, error |
| `error_message` | TEXT | Mensaje de error si status=error |
| `phone_number` | TEXT | Número de WhatsApp conectado |
| `profile_name` | TEXT | Nombre del perfil de WhatsApp |
| `name` | TEXT | Alias personalizado por el usuario |
| `connected_at` | TIMESTAMPTZ | Fecha/hora de conexión |
| `last_seen` | TIMESTAMPTZ | Última actividad (actualizado por heartbeat) |

---

### 2. users_profile (Extensión)

Si no existe, crear tabla de perfil de usuario para emails de notificación.

```sql
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Suscripción
  subscription_tier TEXT DEFAULT 'free' 
    CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  
  -- Límites
  max_whatsapp_accounts INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
```

---

### 3. whatsapp_messages (Opcional)

Para almacenar historial de mensajes.

```sql
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Mensaje
  whatsapp_message_id TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT,
  body TEXT,
  
  -- Dirección
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  -- Media
  has_media BOOLEAN DEFAULT FALSE,
  media_type TEXT,
  media_url TEXT,
  
  -- Estado
  status TEXT DEFAULT 'received' 
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'received', 'failed')),
  
  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_wa_messages_account ON whatsapp_messages(account_id);
CREATE INDEX idx_wa_messages_from ON whatsapp_messages(from_number);
CREATE INDEX idx_wa_messages_timestamp ON whatsapp_messages(timestamp DESC);
```

---

## Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_accounts
CREATE POLICY "Users can view own accounts"
  ON whatsapp_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts"
  ON whatsapp_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts"
  ON whatsapp_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts"
  ON whatsapp_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para service_role (backend)
CREATE POLICY "Service role full access on accounts"
  ON whatsapp_accounts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para whatsapp_messages
CREATE POLICY "Users can view own messages"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on messages"
  ON whatsapp_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## Storage Bucket (Backups)

```sql
-- Crear bucket para backups (ejecutar en Supabase Dashboard o SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('whatsapp-backups', 'whatsapp-backups', false, 104857600); -- 100MB

-- Políticas de storage
CREATE POLICY "Service role can manage backups"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'whatsapp-backups')
  WITH CHECK (bucket_id = 'whatsapp-backups');
```

---

## Consultas Útiles

### Sesiones activas por usuario
```sql
SELECT 
  wa.id,
  wa.session_id,
  wa.phone_number,
  wa.status,
  wa.last_seen,
  wa.connected_at
FROM whatsapp_accounts wa
WHERE wa.user_id = 'USER_ID_HERE'
  AND wa.status = 'ready'
ORDER BY wa.created_at DESC;
```

### Sesiones inactivas (más de 5 minutos sin actividad)
```sql
SELECT 
  wa.id,
  wa.session_id,
  wa.phone_number,
  wa.last_seen,
  NOW() - wa.last_seen AS inactive_duration
FROM whatsapp_accounts wa
WHERE wa.status = 'ready'
  AND wa.last_seen < NOW() - INTERVAL '5 minutes'
ORDER BY wa.last_seen ASC;
```

### Sesiones huérfanas (initializing por más de 10 minutos)
```sql
SELECT id, session_id, created_at
FROM whatsapp_accounts
WHERE status = 'initializing'
  AND created_at < NOW() - INTERVAL '10 minutes';
```

### Estadísticas globales
```sql
SELECT 
  status,
  COUNT(*) as count
FROM whatsapp_accounts
GROUP BY status;
```

---

## Migración Inicial

Script completo para crear todas las tablas:

```sql
-- 001_create_whatsapp_tables.sql

-- Función update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabla whatsapp_accounts
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'initializing' 
    CHECK (status IN ('initializing', 'ready', 'error')),
  error_message TEXT,
  phone_number TEXT,
  profile_name TEXT,
  name TEXT,
  connected_at TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wa_accounts_user_id ON whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_accounts_session_id ON whatsapp_accounts(session_id);
CREATE INDEX IF NOT EXISTS idx_wa_accounts_status ON whatsapp_accounts(status);

-- Trigger
DROP TRIGGER IF EXISTS whatsapp_accounts_updated_at ON whatsapp_accounts;
CREATE TRIGGER whatsapp_accounts_updated_at
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own accounts" ON whatsapp_accounts;
CREATE POLICY "Users can view own accounts"
  ON whatsapp_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own accounts" ON whatsapp_accounts;
CREATE POLICY "Users can insert own accounts"
  ON whatsapp_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON whatsapp_accounts;
CREATE POLICY "Users can update own accounts"
  ON whatsapp_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own accounts" ON whatsapp_accounts;
CREATE POLICY "Users can delete own accounts"
  ON whatsapp_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on accounts" ON whatsapp_accounts;
CREATE POLICY "Service role full access on accounts"
  ON whatsapp_accounts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## Verificación

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('whatsapp_accounts', 'users_profile', 'whatsapp_messages');

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'whatsapp_accounts';

-- Verificar políticas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'whatsapp_accounts';
```

---

**Documento:** 07_BASE_DATOS.md  
**Versión:** 2.0
