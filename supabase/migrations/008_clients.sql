-- ==============================================
-- MIGRACIÓN: 008_clients
-- Tabla de clientes extraídos de conversaciones
-- ==============================================

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información básica (desde WhatsApp)
  phone TEXT NOT NULL,
  whatsapp_name TEXT,
  
  -- Información extraída por IA
  full_name TEXT,
  email TEXT,
  company TEXT,
  
  -- Intereses y categorización
  interest_type TEXT, -- 'product', 'service', 'support', 'information', 'complaint', 'other'
  interest_details TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Notas y contexto
  notes TEXT,
  ai_summary TEXT, -- Resumen generado por IA de las conversaciones
  
  -- Estado del cliente
  status TEXT DEFAULT 'lead', -- 'lead', 'prospect', 'customer', 'inactive'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Métricas
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  
  -- Última extracción de IA
  ai_extracted_at TIMESTAMPTZ,
  ai_extraction_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para un cliente por teléfono por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_phone 
  ON clients(user_id, phone);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_interest ON clients(user_id, interest_type);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(user_id, last_contact_at DESC);

-- ==============================================
-- RLS (Row Level Security)
-- ==============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven sus propios clientes
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuarios solo pueden insertar sus propios clientes
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuarios solo pueden actualizar sus propios clientes
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuarios solo pueden eliminar sus propios clientes
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;
CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- Función para actualizar updated_at
-- ==============================================
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-actualizar updated_at
DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- ==============================================
-- Función para sincronizar clientes desde conversaciones
-- ==============================================
CREATE OR REPLACE FUNCTION sync_client_from_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar o actualizar cliente cuando hay una nueva conversación
  INSERT INTO clients (
    user_id,
    phone,
    whatsapp_name,
    first_contact_at,
    last_contact_at,
    total_conversations
  ) VALUES (
    NEW.user_id,
    NEW.contact_phone,
    NEW.contact_name,
    NEW.created_at,
    NEW.last_message_at,
    1
  )
  ON CONFLICT (user_id, phone) DO UPDATE SET
    whatsapp_name = COALESCE(EXCLUDED.whatsapp_name, clients.whatsapp_name),
    last_contact_at = GREATEST(EXCLUDED.last_contact_at, clients.last_contact_at),
    total_conversations = clients.total_conversations + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar automáticamente
DROP TRIGGER IF EXISTS trigger_sync_client_from_conversation ON conversations;
CREATE TRIGGER trigger_sync_client_from_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION sync_client_from_conversation();

-- ==============================================
-- Función para actualizar métricas de mensajes
-- ==============================================
CREATE OR REPLACE FUNCTION update_client_message_count()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_user_id UUID;
BEGIN
  -- Obtener el teléfono y user_id de la conversación
  SELECT contact_phone, user_id INTO v_phone, v_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  IF v_phone IS NOT NULL AND v_user_id IS NOT NULL THEN
    UPDATE clients
    SET 
      total_messages = total_messages + 1,
      last_contact_at = NEW.timestamp,
      updated_at = NOW()
    WHERE user_id = v_user_id AND phone = v_phone;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar conteo de mensajes
DROP TRIGGER IF EXISTS trigger_update_client_message_count ON messages;
CREATE TRIGGER trigger_update_client_message_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_client_message_count();

-- ==============================================
-- Tabla de configuración de captura de clientes
-- ==============================================
CREATE TABLE IF NOT EXISTS client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Captura automática con IA
  auto_capture_enabled BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un registro por usuario
  CONSTRAINT client_settings_user_unique UNIQUE (user_id)
);

-- RLS para client_settings
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client settings"
  ON client_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client settings"
  ON client_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client settings"
  ON client_settings FOR UPDATE
  USING (auth.uid() = user_id);
