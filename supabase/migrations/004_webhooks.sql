-- ==============================================
-- MIGRACIÓN: 004_webhooks
-- Sistema de Webhooks para eventos de WhatsApp
-- ==============================================

-- Tabla principal de webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información básica
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- Para firmar payloads (HMAC-SHA256)
  
  -- Eventos suscritos
  events TEXT[] NOT NULL DEFAULT '{}',
  -- Eventos disponibles:
  -- 'message.received' - Mensaje recibido
  -- 'message.sent' - Mensaje enviado
  -- 'message.delivered' - Mensaje entregado
  -- 'message.read' - Mensaje leído
  -- 'message.failed' - Mensaje fallido
  -- 'session.ready' - Sesión conectada
  -- 'session.disconnected' - Sesión desconectada
  -- 'session.qr' - QR generado
  -- 'contact.created' - Contacto creado
  -- 'contact.updated' - Contacto actualizado
  -- 'group.joined' - Unido a grupo
  -- 'group.left' - Salido de grupo
  
  -- Estado
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  
  -- Configuración
  headers JSONB DEFAULT '{}'::jsonb, -- Headers personalizados
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Estadísticas
  total_sent INTEGER DEFAULT 0,
  total_success INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Evento
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Request
  request_url TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  
  -- Response
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  
  -- Estado
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  attempt INTEGER DEFAULT 1,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ==============================================
-- ÍNDICES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING gin(events);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event_type);

-- ==============================================
-- RLS (Row Level Security)
-- ==============================================
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para webhooks
DROP POLICY IF EXISTS "Users can manage own webhooks" ON webhooks;
CREATE POLICY "Users can manage own webhooks" ON webhooks
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access webhooks" ON webhooks;
CREATE POLICY "Service role full access webhooks" ON webhooks
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access webhook_logs" ON webhook_logs;
CREATE POLICY "Service role full access webhook_logs" ON webhook_logs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- TRIGGERS
-- ==============================================
CREATE OR REPLACE FUNCTION update_webhook_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_webhooks_updated ON webhooks;
CREATE TRIGGER trigger_webhooks_updated
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_webhook_timestamp();

-- ==============================================
-- FUNCIÓN PARA INCREMENTAR ESTADÍSTICAS
-- ==============================================
CREATE OR REPLACE FUNCTION increment_webhook_stats(
  p_webhook_id UUID,
  p_success BOOLEAN
)
RETURNS void AS $$
BEGIN
  IF p_success THEN
    UPDATE webhooks SET
      total_sent = total_sent + 1,
      total_success = total_success + 1,
      last_triggered_at = NOW(),
      last_success_at = NOW()
    WHERE id = p_webhook_id;
  ELSE
    UPDATE webhooks SET
      total_sent = total_sent + 1,
      total_failed = total_failed + 1,
      last_triggered_at = NOW(),
      last_failure_at = NOW()
    WHERE id = p_webhook_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
