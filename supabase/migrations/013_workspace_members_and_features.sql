-- ============================================
-- Migration: Workspace Members, Connection Links, AI Usage, Campaigns
-- Description: Complete multi-tenant system for agencies
-- Run after: 012_create_profiles_table.sql
-- ============================================

-- ============================================
-- 1. ADD WHITE-LABEL FIELDS TO WORKSPACES
-- ============================================
DO $$
BEGIN
  -- White-label settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'white_label') THEN
    ALTER TABLE workspaces ADD COLUMN white_label JSONB DEFAULT '{
      "enabled": false,
      "brand_name": null,
      "brand_logo_url": null,
      "brand_color": "#10b981",
      "widget_footer_text": null,
      "widget_footer_url": null,
      "hide_whahook_branding": false,
      "show_ai_costs_to_client": false
    }'::jsonb;
  END IF;

  -- Custom domain for Enterprise
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'custom_domain') THEN
    ALTER TABLE workspaces ADD COLUMN custom_domain TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'custom_domain_verified') THEN
    ALTER TABLE workspaces ADD COLUMN custom_domain_verified BOOLEAN DEFAULT FALSE;
  END IF;

  -- Workspace-specific Gemini API Key (encrypted)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'gemini_api_key_encrypted') THEN
    ALTER TABLE workspaces ADD COLUMN gemini_api_key_encrypted TEXT;
  END IF;

  -- Access token for client link access
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'access_token') THEN
    ALTER TABLE workspaces ADD COLUMN access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex');
  END IF;

  -- Slug for URL-friendly workspace identifier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'slug') THEN
    ALTER TABLE workspaces ADD COLUMN slug TEXT UNIQUE;
  END IF;

  -- Logo URL
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name = 'logo_url') THEN
    ALTER TABLE workspaces ADD COLUMN logo_url TEXT;
  END IF;
END $$;

-- Index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_custom_domain ON workspaces(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspaces_access_token ON workspaces(access_token);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

-- ============================================
-- 2. WORKSPACE MEMBERS (Roles and Access)
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- User reference (NULL if access by token only)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role: owner, admin, client, agent, custom
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'client', 'agent', 'custom')),
  
  -- Custom permissions (for custom roles)
  permissions JSONB DEFAULT '{
    "dashboard": true,
    "messages": true,
    "clients": false,
    "campaigns": false,
    "settings": false,
    "ai_costs": false
  }'::jsonb,
  
  -- Access token for link-based access (clients without Whahook account)
  access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  token_expires_at TIMESTAMPTZ,
  
  -- Invitation tracking
  invited_email TEXT,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'expired')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(workspace_id, user_id),
  UNIQUE(workspace_id, invited_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_access_token ON workspace_members(access_token);
CREATE INDEX IF NOT EXISTS idx_workspace_members_invited_email ON workspace_members(invited_email);

-- RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Owners can manage all members in their workspaces
CREATE POLICY "Workspace owners can manage members" ON workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = workspace_members.workspace_id 
      AND w.user_id = auth.uid()
    )
  );

-- Members can view their own membership
CREATE POLICY "Members can view own membership" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 3. WORKSPACE CONNECTION LINKS (Remote QR)
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_connection_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Unique token for the connection link
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- WhatsApp account to connect (created when link is generated)
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connecting', 'connected', 'expired', 'failed')),
  
  -- QR code data (stored temporarily while connecting)
  qr_code TEXT,
  qr_generated_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Connection tracking
  connected_at TIMESTAMPTZ,
  connected_phone TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connection_links_workspace_id ON workspace_connection_links(workspace_id);
CREATE INDEX IF NOT EXISTS idx_connection_links_token ON workspace_connection_links(token);
CREATE INDEX IF NOT EXISTS idx_connection_links_status ON workspace_connection_links(status);

-- RLS
ALTER TABLE workspace_connection_links ENABLE ROW LEVEL SECURITY;

-- Workspace owners can manage connection links
CREATE POLICY "Workspace owners can manage connection links" ON workspace_connection_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = workspace_connection_links.workspace_id 
      AND w.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. WORKSPACE AI USAGE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Period (first day of month)
  month DATE NOT NULL,
  
  -- Usage metrics
  messages_count INTEGER DEFAULT 0,
  tokens_input BIGINT DEFAULT 0,
  tokens_output BIGINT DEFAULT 0,
  
  -- Cost estimation (EUR)
  estimated_cost_eur DECIMAL(10,4) DEFAULT 0,
  
  -- Daily breakdown (optional, for detailed analytics)
  daily_usage JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One record per workspace per month
  UNIQUE(workspace_id, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_workspace_id ON workspace_ai_usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month ON workspace_ai_usage(month);

-- RLS
ALTER TABLE workspace_ai_usage ENABLE ROW LEVEL SECURITY;

-- Workspace owners can view AI usage
CREATE POLICY "Workspace owners can view AI usage" ON workspace_ai_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = workspace_ai_usage.workspace_id 
      AND w.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. CAMPAIGNS (WhatsApp & Email)
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Campaign info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email')),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled', 'failed')),
  
  -- Content
  message_template TEXT NOT NULL,
  subject TEXT, -- Only for email campaigns
  
  -- Media attachments (for WhatsApp)
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'document', 'audio')),
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Segmentation filters
  filters JSONB DEFAULT '{}'::jsonb,
  -- Example: {"tags": ["vip", "active"], "last_interaction_days": 30, "exclude_tags": ["unsubscribed"]}
  
  -- Statistics
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Error tracking
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Workspace owners can manage campaigns
CREATE POLICY "Workspace owners can manage campaigns" ON campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = campaigns.workspace_id 
      AND w.user_id = auth.uid()
    )
  );

-- Campaign creators can manage their own campaigns
CREATE POLICY "Users can manage own campaigns" ON campaigns
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 6. CAMPAIGN RECIPIENTS (Tracking per recipient)
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Recipient info
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  phone_number TEXT,
  email TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'replied', 'failed', 'skipped')),
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  
  -- Error info
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_client_id ON campaign_recipients(client_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);

-- RLS
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Access through campaign ownership
CREATE POLICY "Access through campaign" ON campaign_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.id = campaign_recipients.campaign_id
      AND w.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. UPDATE TRIGGERS
-- ============================================

-- workspace_members updated_at trigger
CREATE OR REPLACE FUNCTION update_workspace_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_workspace_members_updated_at ON workspace_members;
CREATE TRIGGER trigger_update_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_members_updated_at();

-- workspace_connection_links updated_at trigger
CREATE OR REPLACE FUNCTION update_connection_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_connection_links_updated_at ON workspace_connection_links;
CREATE TRIGGER trigger_update_connection_links_updated_at
  BEFORE UPDATE ON workspace_connection_links
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_links_updated_at();

-- workspace_ai_usage updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_usage_updated_at ON workspace_ai_usage;
CREATE TRIGGER trigger_update_ai_usage_updated_at
  BEFORE UPDATE ON workspace_ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_usage_updated_at();

-- campaigns updated_at trigger
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaigns_updated_at ON campaigns;
CREATE TRIGGER trigger_update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaigns_updated_at();

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to generate unique slug from workspace name
CREATE OR REPLACE FUNCTION generate_workspace_slug(workspace_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(workspace_name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := substring(base_slug, 1, 50);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add suffix if needed
  WHILE EXISTS (SELECT 1 FROM workspaces WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug on workspace insert
CREATE OR REPLACE FUNCTION auto_generate_workspace_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_workspace_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_workspace_slug ON workspaces;
CREATE TRIGGER trigger_auto_generate_workspace_slug
  BEFORE INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_workspace_slug();

-- Function to check if user has permission in workspace
CREATE OR REPLACE FUNCTION user_has_workspace_permission(
  p_user_id UUID,
  p_workspace_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_owner BOOLEAN;
  v_member_permissions JSONB;
  v_member_role TEXT;
BEGIN
  -- Check if user is workspace owner
  SELECT EXISTS (
    SELECT 1 FROM workspaces 
    WHERE id = p_workspace_id AND user_id = p_user_id
  ) INTO v_is_owner;
  
  IF v_is_owner THEN
    RETURN TRUE;
  END IF;
  
  -- Check member permissions
  SELECT role, permissions INTO v_member_role, v_member_permissions
  FROM workspace_members
  WHERE workspace_id = p_workspace_id 
    AND user_id = p_user_id 
    AND status = 'active';
  
  IF v_member_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admin has all permissions
  IF v_member_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  RETURN COALESCE((v_member_permissions->>p_permission)::boolean, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. AUTO-CREATE OWNER MEMBER ON WORKSPACE CREATE
-- ============================================
CREATE OR REPLACE FUNCTION auto_create_workspace_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at, permissions)
  VALUES (
    NEW.id, 
    NEW.user_id, 
    'owner', 
    'active', 
    NOW(),
    '{
      "dashboard": true,
      "messages": true,
      "clients": true,
      "campaigns": true,
      "settings": true,
      "ai_costs": true
    }'::jsonb
  )
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_workspace_owner ON workspaces;
CREATE TRIGGER trigger_auto_create_workspace_owner
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_workspace_owner();

-- ============================================
-- SUMMARY
-- ============================================
-- New tables created:
-- 1. workspace_members - Roles and access management
-- 2. workspace_connection_links - Remote QR connection
-- 3. workspace_ai_usage - AI cost tracking
-- 4. campaigns - WhatsApp/Email campaigns
-- 5. campaign_recipients - Per-recipient tracking
--
-- New columns added to workspaces:
-- - white_label (JSONB)
-- - custom_domain
-- - custom_domain_verified
-- - gemini_api_key_encrypted
-- - access_token
-- - slug
-- - logo_url
--
-- Helper functions:
-- - generate_workspace_slug()
-- - user_has_workspace_permission()
-- ============================================
