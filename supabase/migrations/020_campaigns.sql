-- Migration: Add campaigns table for WhatsApp and Email marketing
-- Created: 2024-12-05

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Campaign info
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled')),
  
  -- Message content
  message_template TEXT NOT NULL,
  subject TEXT, -- Only for email campaigns
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Segmentation filters
  filters JSONB DEFAULT '{}', -- {"tags": ["vip"], "status": ["customer"], "last_interaction_days": 30}
  
  -- Statistics
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign recipients table (to track individual sends)
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'replied')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, client_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Campaigns policies
CREATE POLICY "Users can view campaigns in their workspaces"
  ON campaigns FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaigns in their workspaces"
  ON campaigns FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaigns in their workspaces"
  ON campaigns FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaigns in their workspaces"
  ON campaigns FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Campaign recipients policies
CREATE POLICY "Users can view campaign recipients in their workspaces"
  ON campaign_recipients FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage campaign recipients in their workspaces"
  ON campaign_recipients FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Function to update campaign stats
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE campaigns SET
    sent_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'delivered', 'read', 'replied')),
    delivered_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('delivered', 'read', 'replied')),
    read_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status IN ('read', 'replied')),
    replied_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status = 'replied'),
    failed_count = (SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = NEW.campaign_id AND status = 'failed'),
    updated_at = NOW()
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats
CREATE TRIGGER trigger_update_campaign_stats
  AFTER INSERT OR UPDATE ON campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- Add updated_at trigger
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
