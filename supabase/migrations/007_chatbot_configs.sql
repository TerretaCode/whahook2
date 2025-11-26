-- ==============================================
-- MIGRACIÓN: 007_chatbot_configs
-- Configuración del chatbot por sesión WhatsApp
-- ==============================================

-- Crear tabla de configuración de chatbot
CREATE TABLE IF NOT EXISTS chatbot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  
  -- Configuración del proveedor de IA
  provider TEXT NOT NULL DEFAULT 'google',
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  api_key_encrypted TEXT,
  has_api_key BOOLEAN DEFAULT FALSE,
  
  -- Configuración básica
  bot_name TEXT DEFAULT 'Asistente',
  language TEXT DEFAULT 'es',
  tone TEXT DEFAULT 'professional',
  
  -- Control de respuestas automáticas
  auto_reply BOOLEAN DEFAULT TRUE,
  
  -- Integración E-commerce
  use_ecommerce_api BOOLEAN DEFAULT FALSE,
  ecommerce_connection_ids TEXT[] DEFAULT '{}',
  ecommerce_search_message TEXT DEFAULT 'Estoy buscando la mejor solución para ti...',
  
  -- Configuración avanzada del modelo
  system_prompt TEXT,
  custom_instructions TEXT,
  fallback_message TEXT DEFAULT 'Disculpa, no estoy seguro de cómo ayudarte con eso.',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  top_p DECIMAL(3,2) DEFAULT 1.0,
  frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
  presence_penalty DECIMAL(3,2) DEFAULT 0.0,
  
  -- Configuración de conversación
  context_window INTEGER DEFAULT 10,
  max_conversation_length INTEGER DEFAULT 20,
  enable_memory BOOLEAN DEFAULT TRUE,
  enable_typing_indicator BOOLEAN DEFAULT TRUE,
  
  -- Horarios de atención
  business_hours_enabled BOOLEAN DEFAULT FALSE,
  business_hours_timezone TEXT DEFAULT 'UTC',
  active_hours_start TIME DEFAULT '09:00',
  active_hours_end TIME DEFAULT '18:00',
  out_of_hours_message TEXT DEFAULT 'Gracias por contactarnos. Estamos fuera de horario.',
  
  -- Handoff a humano
  handoff_enabled BOOLEAN DEFAULT FALSE,
  handoff_keywords TEXT[] DEFAULT ARRAY['humano', 'agente', 'representante', 'soporte'],
  handoff_message TEXT DEFAULT 'Te estoy transfiriendo con un agente humano.',
  
  -- Configuración de debounce
  debounce_delay_ms INTEGER DEFAULT 5000,
  max_wait_ms INTEGER DEFAULT 15000,
  max_batch_size INTEGER DEFAULT 20,
  
  -- Logging
  log_conversations BOOLEAN DEFAULT TRUE,
  data_retention_days INTEGER DEFAULT 90,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para una config por sesión por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_configs_user_session 
  ON chatbot_configs(user_id, session_id);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_user ON chatbot_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_session ON chatbot_configs(session_id);

-- ==============================================
-- RLS (Row Level Security)
-- ==============================================
ALTER TABLE chatbot_configs ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven sus propias configs
DROP POLICY IF EXISTS "Users can view own chatbot configs" ON chatbot_configs;
CREATE POLICY "Users can view own chatbot configs" ON chatbot_configs
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuarios solo pueden insertar sus propias configs
DROP POLICY IF EXISTS "Users can insert own chatbot configs" ON chatbot_configs;
CREATE POLICY "Users can insert own chatbot configs" ON chatbot_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuarios solo pueden actualizar sus propias configs
DROP POLICY IF EXISTS "Users can update own chatbot configs" ON chatbot_configs;
CREATE POLICY "Users can update own chatbot configs" ON chatbot_configs
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuarios solo pueden eliminar sus propias configs
DROP POLICY IF EXISTS "Users can delete own chatbot configs" ON chatbot_configs;
CREATE POLICY "Users can delete own chatbot configs" ON chatbot_configs
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- Función para actualizar updated_at
-- ==============================================
CREATE OR REPLACE FUNCTION update_chatbot_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-actualizar updated_at
DROP TRIGGER IF EXISTS trigger_chatbot_configs_updated_at ON chatbot_configs;
CREATE TRIGGER trigger_chatbot_configs_updated_at
  BEFORE UPDATE ON chatbot_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_configs_updated_at();
