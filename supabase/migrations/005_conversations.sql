-- ==============================================
-- MIGRACIÓN: 005_conversations
-- Añadir columnas de chatbot a conversaciones existentes
-- ==============================================

-- Añadir columnas faltantes a conversations (tabla ya existe)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS chatbot_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS needs_attention BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_avatar TEXT;

-- ==============================================
-- ÍNDICES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot ON conversations(chatbot_enabled);
CREATE INDEX IF NOT EXISTS idx_conversations_attention ON conversations(needs_attention);
