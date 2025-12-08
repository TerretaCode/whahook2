-- ==============================================
-- Email Connections for Campaign Sending
-- ==============================================

CREATE TABLE IF NOT EXISTS email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Connection type
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')),
  
  -- Sender info
  email_address TEXT NOT NULL,
  display_name TEXT,
  
  -- OAuth tokens (for Gmail/Outlook)
  oauth_access_token_encrypted TEXT,
  oauth_refresh_token_encrypted TEXT,
  oauth_expires_at TIMESTAMPTZ,
  
  -- SMTP config (for manual setup)
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password_encrypted TEXT,
  smtp_secure BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One active email connection per workspace
  UNIQUE(workspace_id, is_active) WHERE is_active = true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_connections_workspace ON email_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_user ON email_connections(user_id);

-- RLS
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own workspace email connections
CREATE POLICY "Users can view workspace email connections"
  ON email_connections FOR SELECT
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert email connections for their workspaces
CREATE POLICY "Users can insert email connections"
  ON email_connections FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Users can update their own email connections
CREATE POLICY "Users can update email connections"
  ON email_connections FOR UPDATE
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own email connections
CREATE POLICY "Users can delete email connections"
  ON email_connections FOR DELETE
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Created email_connections table for campaign email sending';
END $$;
