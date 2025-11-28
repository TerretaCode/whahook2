-- Workspaces table for multi-tenant support
-- Each workspace can have 1 WhatsApp connection and 1 Web Widget

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- Connection references (1 per workspace)
  whatsapp_session_id VARCHAR(255), -- References whatsapp_sessions.session_id
  web_widget_id UUID, -- References chat_widgets.id
  -- AI Config for this workspace (optional, falls back to user's global config)
  ai_config_id UUID REFERENCES ai_configs(id) ON DELETE SET NULL,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);

-- RLS Policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Users can only see their own workspaces
CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces" ON workspaces
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces" ON workspaces
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_workspace_updated_at ON workspaces;
CREATE TRIGGER trigger_update_workspace_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_updated_at();

-- Add workspace_id to existing tables that should be workspace-scoped
-- chatbot_configs
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_workspace_id ON chatbot_configs(workspace_id);

-- conversations (messages are linked to conversations, so they inherit workspace scope)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);

-- clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_clients_workspace_id ON clients(workspace_id);
