-- ==============================================
-- MIGRACIÓN: 006_messages
-- Crear o actualizar tabla messages
-- ==============================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  message_id TEXT,
  content TEXT,
  type TEXT DEFAULT 'chat',
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT DEFAULT 'sent',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Añadir columnas faltantes si la tabla ya existe
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS message_id TEXT,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'chat',
ADD COLUMN IF NOT EXISTS direction TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Hacer columnas nullable si existen con NOT NULL
DO $$ 
BEGIN
  ALTER TABLE messages ALTER COLUMN remote_jid DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE messages ALTER COLUMN message_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Índice único para message_id (para upsert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_message_id_unique ON messages(message_id);

-- ==============================================
-- ÍNDICES OPTIMIZADOS
-- ==============================================
-- Índice compuesto para obtener mensajes de conversación (query más común)
CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages(conversation_id, timestamp DESC);

-- Índices simples
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- ==============================================
-- RLS
-- ==============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access messages" ON messages;
CREATE POLICY "Service role full access messages" ON messages
  FOR ALL USING (true);
