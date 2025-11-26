-- ==============================================
-- WHAHOOK COMPLETE DATABASE SCHEMA
-- Consolidated migration file
-- ==============================================

-- ==============================================
-- SHARED FUNCTIONS
-- ==============================================

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 1. WHATSAPP ACCOUNTS
-- ==============================================
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

CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_user_id ON whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_session_id ON whatsapp_accounts(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_status ON whatsapp_accounts(status);

ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whatsapp accounts" ON whatsapp_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whatsapp accounts" ON whatsapp_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own whatsapp accounts" ON whatsapp_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own whatsapp accounts" ON whatsapp_accounts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role has full access to whatsapp_accounts" ON whatsapp_accounts FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP TRIGGER IF EXISTS update_whatsapp_accounts_updated_at ON whatsapp_accounts;
CREATE TRIGGER update_whatsapp_accounts_updated_at BEFORE UPDATE ON whatsapp_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================
-- 2. CONVERSATIONS
-- ==============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  contact_avatar TEXT,
  status TEXT DEFAULT 'open',
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  chatbot_enabled BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  needs_attention BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_wa ON conversations(user_id, whatsapp_account_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_phone ON conversations(user_id, whatsapp_account_id, contact_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp ON conversations(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(contact_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================
-- 3. MESSAGES
-- ==============================================
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_message_id_unique ON messages(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages(conversation_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access messages" ON messages FOR ALL USING (true);

-- ==============================================
-- 4. AI CONFIGURATION (Global per user)
-- ==============================================
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  api_key_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ai_config_user_unique UNIQUE (user_id)
);

ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI config" ON ai_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI config" ON ai_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI config" ON ai_config FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_ai_config_updated_at ON ai_config;
CREATE TRIGGER trigger_ai_config_updated_at BEFORE UPDATE ON ai_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================
-- 5. CLIENTS (CRM)
-- ==============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  whatsapp_name TEXT,
  full_name TEXT,
  email TEXT,
  company TEXT,
  interest_type TEXT,
  interest_details TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  ai_summary TEXT,
  status TEXT DEFAULT 'lead',
  priority TEXT DEFAULT 'normal',
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  ai_extracted_at TIMESTAMPTZ,
  ai_extraction_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_phone ON clients(user_id, phone);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_interest ON clients(user_id, interest_type);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(user_id, last_contact_at DESC);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients;
CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Client settings
CREATE TABLE IF NOT EXISTS client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_capture_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT client_settings_user_unique UNIQUE (user_id)
);

ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client settings" ON client_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own client settings" ON client_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client settings" ON client_settings FOR UPDATE USING (auth.uid() = user_id);

-- Sync clients from conversations
CREATE OR REPLACE FUNCTION sync_client_from_conversation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO clients (user_id, phone, whatsapp_name, first_contact_at, last_contact_at, total_conversations)
  VALUES (NEW.user_id, NEW.contact_phone, NEW.contact_name, NEW.created_at, NEW.last_message_at, 1)
  ON CONFLICT (user_id, phone) DO UPDATE SET
    whatsapp_name = COALESCE(EXCLUDED.whatsapp_name, clients.whatsapp_name),
    last_contact_at = GREATEST(EXCLUDED.last_contact_at, clients.last_contact_at),
    total_conversations = clients.total_conversations + 1,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_client_from_conversation ON conversations;
CREATE TRIGGER trigger_sync_client_from_conversation AFTER INSERT ON conversations FOR EACH ROW EXECUTE FUNCTION sync_client_from_conversation();

-- Update client message count
CREATE OR REPLACE FUNCTION update_client_message_count()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_user_id UUID;
BEGIN
  SELECT contact_phone, user_id INTO v_phone, v_user_id FROM conversations WHERE id = NEW.conversation_id;
  IF v_phone IS NOT NULL AND v_user_id IS NOT NULL THEN
    UPDATE clients SET total_messages = total_messages + 1, last_contact_at = NEW.timestamp, updated_at = NOW()
    WHERE user_id = v_user_id AND phone = v_phone;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_message_count ON messages;
CREATE TRIGGER trigger_update_client_message_count AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_client_message_count();

-- ==============================================
-- 6. WEBHOOKS
-- ==============================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  headers JSONB DEFAULT '{}'::jsonb,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  total_sent INTEGER DEFAULT 0,
  total_success INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  request_url TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  attempt INTEGER DEFAULT 1,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING gin(events);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks" ON webhooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access webhooks" ON webhooks FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access webhook_logs" ON webhook_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP TRIGGER IF EXISTS trigger_webhooks_updated ON webhooks;
CREATE TRIGGER trigger_webhooks_updated BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION increment_webhook_stats(p_webhook_id UUID, p_success BOOLEAN)
RETURNS void AS $$
BEGIN
  IF p_success THEN
    UPDATE webhooks SET total_sent = total_sent + 1, total_success = total_success + 1, last_triggered_at = NOW(), last_success_at = NOW() WHERE id = p_webhook_id;
  ELSE
    UPDATE webhooks SET total_sent = total_sent + 1, total_failed = total_failed + 1, last_triggered_at = NOW(), last_failure_at = NOW() WHERE id = p_webhook_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. CHAT WIDGETS (Optional feature)
-- ==============================================
CREATE TABLE IF NOT EXISTS chat_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  primary_color VARCHAR(7) DEFAULT '#10B981',
  header_text VARCHAR(100) DEFAULT 'Chat Support',
  header_logo_url TEXT,
  welcome_message TEXT DEFAULT 'Hello! 👋 How can I help you?',
  placeholder_text VARCHAR(100) DEFAULT 'Type your message...',
  position VARCHAR(20) DEFAULT 'bottom-right',
  bubble_icon_url TEXT,
  powered_by_text VARCHAR(50) DEFAULT 'Powered by Whahook',
  powered_by_url VARCHAR(500) DEFAULT 'https://whahook.com',
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_widget_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES chat_widgets(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255) NOT NULL,
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),
  page_url TEXT,
  referrer TEXT,
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_widget_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_widget_conversations(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_widgets_user_id ON chat_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_widgets_is_active ON chat_widgets(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_widget_conversations_widget_id ON chat_widget_conversations(widget_id);
CREATE INDEX IF NOT EXISTS idx_chat_widget_messages_conversation_id ON chat_widget_messages(conversation_id);

ALTER TABLE chat_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_widget_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_widget_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own widgets" ON chat_widgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own widgets" ON chat_widgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own widgets" ON chat_widgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own widgets" ON chat_widgets FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to widgets" ON chat_widgets FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access to widget_conversations" ON chat_widget_conversations FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access to widget_messages" ON chat_widget_messages FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP TRIGGER IF EXISTS trigger_chat_widget_updated_at ON chat_widgets;
CREATE TRIGGER trigger_chat_widget_updated_at BEFORE UPDATE ON chat_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION increment_widget_stats(p_widget_id UUID, p_new_conversation BOOLEAN DEFAULT false)
RETURNS void AS $$
BEGIN
  IF p_new_conversation THEN
    UPDATE chat_widgets SET total_conversations = total_conversations + 1, total_messages = total_messages + 1 WHERE id = p_widget_id;
  ELSE
    UPDATE chat_widgets SET total_messages = total_messages + 1 WHERE id = p_widget_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 8. E-COMMERCE (Optional feature)
-- ==============================================
CREATE TABLE IF NOT EXISTS ecommerce_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('woocommerce', 'shopify', 'prestashop', 'magento')),
  store_url TEXT NOT NULL,
  credentials JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disabled')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  sync_config JSONB DEFAULT '{"auto_sync": true, "sync_interval_minutes": 60, "sync_products": true, "sync_orders": true}'::jsonb,
  webhook_secret TEXT,
  webhook_enabled BOOLEAN DEFAULT false,
  store_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ecommerce_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ecommerce_connections(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  sku VARCHAR(255),
  price DECIMAL(10, 2),
  regular_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'EUR',
  stock_quantity INTEGER,
  stock_status VARCHAR(50),
  manage_stock BOOLEAN DEFAULT false,
  categories JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  featured_image TEXT,
  status VARCHAR(50) DEFAULT 'publish',
  raw_data JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, external_id)
);

CREATE TABLE IF NOT EXISTS ecommerce_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ecommerce_connections(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  order_number VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2),
  tax_total DECIMAL(10, 2),
  shipping_total DECIMAL(10, 2),
  discount_total DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'EUR',
  order_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  billing_address JSONB DEFAULT '{}'::jsonb,
  line_items JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, external_id)
);

CREATE TABLE IF NOT EXISTS ecommerce_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ecommerce_connections(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_connections_user ON ecommerce_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_connections_platform ON ecommerce_connections(platform);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_connection ON ecommerce_products(connection_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_sku ON ecommerce_products(sku);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_name ON ecommerce_products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_connection ON ecommerce_orders(connection_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_status ON ecommerce_orders(status);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_date ON ecommerce_orders(order_date DESC);

ALTER TABLE ecommerce_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ecommerce connections" ON ecommerce_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access ecommerce_connections" ON ecommerce_connections FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access ecommerce_products" ON ecommerce_products FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access ecommerce_orders" ON ecommerce_orders FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role full access ecommerce_sync_logs" ON ecommerce_sync_logs FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP TRIGGER IF EXISTS trigger_ecommerce_connections_updated ON ecommerce_connections;
CREATE TRIGGER trigger_ecommerce_connections_updated BEFORE UPDATE ON ecommerce_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_ecommerce_products_updated ON ecommerce_products;
CREATE TRIGGER trigger_ecommerce_products_updated BEFORE UPDATE ON ecommerce_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_ecommerce_orders_updated ON ecommerce_orders;
CREATE TRIGGER trigger_ecommerce_orders_updated BEFORE UPDATE ON ecommerce_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
