-- ==============================================
-- MIGRACIÓN: 002_chat_widgets
-- Chat Widgets embebibles para sitios web
-- ==============================================

-- Tabla principal de widgets
CREATE TABLE IF NOT EXISTS chat_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configuración básica
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  
  -- Personalización visual
  primary_color VARCHAR(7) DEFAULT '#10B981',
  header_text VARCHAR(100) DEFAULT 'Chat Support',
  header_logo_url TEXT,
  welcome_message TEXT DEFAULT '¡Hola! 👋 ¿En qué puedo ayudarte?',
  placeholder_text VARCHAR(100) DEFAULT 'Escribe tu mensaje...',
  
  -- Configuración de posición
  position VARCHAR(20) DEFAULT 'bottom-right',
  bubble_icon_url TEXT,
  
  -- Branding
  powered_by_text VARCHAR(50) DEFAULT 'Powered by Whahook',
  powered_by_url VARCHAR(500) DEFAULT 'https://whahook.com',
  
  -- Estadísticas
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS chat_widget_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES chat_widgets(id) ON DELETE CASCADE,
  
  -- Identificación del visitante
  visitor_id VARCHAR(255) NOT NULL,
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  
  -- Metadata
  user_agent TEXT,
  ip_address VARCHAR(45),
  page_url TEXT,
  referrer TEXT,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'active',
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS chat_widget_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_widget_conversations(id) ON DELETE CASCADE,
  
  -- Contenido
  message TEXT NOT NULL,
  sender_type VARCHAR(20) NOT NULL, -- visitor, assistant, system
  
  -- Metadata
  is_read BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- ÍNDICES
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_chat_widgets_user_id ON chat_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_widgets_is_active ON chat_widgets(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_widget_conversations_widget_id ON chat_widget_conversations(widget_id);
CREATE INDEX IF NOT EXISTS idx_chat_widget_conversations_visitor_id ON chat_widget_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_chat_widget_messages_conversation_id ON chat_widget_messages(conversation_id);

-- ==============================================
-- RLS (Row Level Security)
-- ==============================================
ALTER TABLE chat_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_widget_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_widget_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_widgets
CREATE POLICY "Users can view own widgets"
  ON chat_widgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own widgets"
  ON chat_widgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widgets"
  ON chat_widgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own widgets"
  ON chat_widgets FOR DELETE
  USING (auth.uid() = user_id);

-- Service role tiene acceso completo
CREATE POLICY "Service role full access to widgets"
  ON chat_widgets FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to conversations"
  ON chat_widget_conversations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to messages"
  ON chat_widget_messages FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- TRIGGER: Actualizar updated_at
-- ==============================================
CREATE OR REPLACE FUNCTION update_chat_widget_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chat_widget_updated_at ON chat_widgets;
CREATE TRIGGER trigger_chat_widget_updated_at
  BEFORE UPDATE ON chat_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_widget_timestamp();

-- ==============================================
-- FUNCIÓN: Incrementar estadísticas
-- ==============================================
CREATE OR REPLACE FUNCTION increment_widget_stats(
  p_widget_id UUID,
  p_new_conversation BOOLEAN DEFAULT false
)
RETURNS void AS $$
BEGIN
  IF p_new_conversation THEN
    UPDATE chat_widgets
    SET total_conversations = total_conversations + 1,
        total_messages = total_messages + 1
    WHERE id = p_widget_id;
  ELSE
    UPDATE chat_widgets
    SET total_messages = total_messages + 1
    WHERE id = p_widget_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
