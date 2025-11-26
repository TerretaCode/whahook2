-- ==============================================
-- MIGRACIÓN: 009_ai_config
-- Configuración global de IA para toda la app
-- ==============================================

-- Crear tabla de configuración de IA
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Proveedor y modelo
  provider TEXT NOT NULL DEFAULT 'google', -- 'google', 'openai', 'anthropic'
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  
  -- API Key encriptada
  api_key_encrypted TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un registro por usuario
  CONSTRAINT ai_config_user_unique UNIQUE (user_id)
);

-- RLS para ai_config
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI config"
  ON ai_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI config"
  ON ai_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI config"
  ON ai_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ai_config_updated_at ON ai_config;
CREATE TRIGGER trigger_ai_config_updated_at
  BEFORE UPDATE ON ai_config
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_config_updated_at();
