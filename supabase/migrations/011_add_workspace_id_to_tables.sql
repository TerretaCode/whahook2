-- ============================================
-- Migration: Add workspace_id to existing tables
-- Description: Links all connection and data tables to workspaces
-- Run after: 010_workspaces.sql
-- ============================================

-- ============================================
-- 1. WHATSAPP ACCOUNTS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_accounts') THEN
    -- Add workspace_id column
    ALTER TABLE whatsapp_accounts ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_workspace_id ON whatsapp_accounts(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to whatsapp_accounts';
  END IF;
END $$;

-- ============================================
-- 2. CHAT WIDGETS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_widgets') THEN
    -- Add workspace_id column
    ALTER TABLE chat_widgets ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_chat_widgets_workspace_id ON chat_widgets(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to chat_widgets';
  END IF;
END $$;

-- ============================================
-- 3. CHATBOT CONFIGS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chatbot_configs') THEN
    -- Add workspace_id column
    ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_chatbot_configs_workspace_id ON chatbot_configs(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to chatbot_configs';
  END IF;
END $$;

-- ============================================
-- 4. CONVERSATIONS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    -- Add workspace_id column
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to conversations';
  END IF;
END $$;

-- ============================================
-- 5. CLIENTS (CRM)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    -- Add workspace_id column
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_clients_workspace_id ON clients(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to clients';
  END IF;
END $$;

-- ============================================
-- 6. ECOMMERCE CONNECTIONS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ecommerce_connections') THEN
    -- Add workspace_id column
    ALTER TABLE ecommerce_connections ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_ecommerce_connections_workspace_id ON ecommerce_connections(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to ecommerce_connections';
  END IF;
END $$;

-- ============================================
-- 7. WEBHOOKS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    -- Add workspace_id column
    ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_webhooks_workspace_id ON webhooks(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to webhooks';
  END IF;
END $$;

-- ============================================
-- 8. AI CONFIG
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_config') THEN
    -- Add workspace_id column
    ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_ai_config_workspace_id ON ai_config(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to ai_config';
  END IF;
END $$;

-- ============================================
-- 9. MESSAGES (inherits from conversations, but adding for direct queries)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    -- Add workspace_id column
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_messages_workspace_id ON messages(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to messages';
  END IF;
END $$;

-- ============================================
-- 10. CHAT WIDGET CONVERSATIONS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_widget_conversations') THEN
    -- Add workspace_id column
    ALTER TABLE chat_widget_conversations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_chat_widget_conversations_workspace_id ON chat_widget_conversations(workspace_id);
    
    RAISE NOTICE 'Added workspace_id to chat_widget_conversations';
  END IF;
END $$;

-- ============================================
-- SUMMARY OF CHANGES
-- ============================================
-- Tables modified:
-- 1. whatsapp_accounts     - WhatsApp connections
-- 2. chat_widgets          - Web chat widgets
-- 3. chatbot_configs       - Chatbot configuration
-- 4. conversations         - WhatsApp conversations
-- 5. clients               - CRM clients
-- 6. ecommerce_connections - E-commerce integrations
-- 7. webhooks              - Webhook configurations
-- 8. ai_config             - AI provider settings
-- 9. messages              - Chat messages
-- 10. chat_widget_conversations - Web widget conversations
--
-- All columns are nullable (SET NULL on delete) to allow
-- gradual migration of existing data to workspaces.
-- ============================================

-- ============================================
-- 11. Add powered_by_enabled column to chat_widgets
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_widgets' AND column_name = 'powered_by_enabled'
  ) THEN
    ALTER TABLE chat_widgets ADD COLUMN powered_by_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;
