-- ==============================================
-- MIGRACIÓN: 001_whatsapp_accounts
-- Crear tabla para sesiones de WhatsApp
-- ==============================================

-- TABLA: whatsapp_accounts
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  label TEXT DEFAULT 'WhatsApp Account',
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('initializing', 'qr_pending', 'authenticating', 'ready', 'disconnected', 'error')),
  error_message TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_user_id ON whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_session_id ON whatsapp_accounts(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_status ON whatsapp_accounts(status);

-- ==============================================
-- RLS (Row Level Security)
-- ==============================================
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias cuentas
CREATE POLICY "Users can view own whatsapp accounts"
  ON whatsapp_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden insertar sus propias cuentas
CREATE POLICY "Users can insert own whatsapp accounts"
  ON whatsapp_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar sus propias cuentas
CREATE POLICY "Users can update own whatsapp accounts"
  ON whatsapp_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuarios pueden eliminar sus propias cuentas
CREATE POLICY "Users can delete own whatsapp accounts"
  ON whatsapp_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Service role puede hacer todo (backend)
CREATE POLICY "Service role has full access"
  ON whatsapp_accounts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- TRIGGER: Actualizar updated_at automáticamente
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_whatsapp_accounts_updated_at ON whatsapp_accounts;
CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
