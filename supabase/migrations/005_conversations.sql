-- ==============================================
-- MIGRACIÓN: 005_conversations
-- Añadir columnas de chatbot a conversaciones existentes
-- ==============================================

-- Añadir columnas faltantes a conversations (tabla ya existe)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS chatbot_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_avatar TEXT,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- ==============================================
-- ÍNDICES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot ON conversations(chatbot_enabled);
CREATE INDEX IF NOT EXISTS idx_conversations_attention ON conversations(needs_attention);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
