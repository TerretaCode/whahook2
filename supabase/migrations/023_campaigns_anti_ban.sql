-- ============================================
-- Migration: Enhanced campaigns with anti-ban features
-- Description: Add message variations, delays, and queue system
-- ============================================

-- 1. Add anti-ban settings to campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS send_settings JSONB DEFAULT '{
  "min_delay_seconds": 30,
  "max_delay_seconds": 120,
  "batch_size": 10,
  "batch_pause_minutes": 5,
  "randomize_message": true,
  "daily_limit": 100,
  "respect_quiet_hours": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00"
}';

-- 2. Add message variations (array of alternative messages)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS message_variations TEXT[] DEFAULT '{}';

-- 3. Add personalization fields
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS personalization_fields TEXT[] DEFAULT '{name,company}';

-- 4. Add tracking for daily sends
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS daily_sent_count INTEGER DEFAULT 0;

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS last_send_date DATE;

-- 5. Add priority for queue ordering
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10);

-- 6. Enhance campaign_recipients with queue info
ALTER TABLE campaign_recipients 
ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ;

ALTER TABLE campaign_recipients 
ADD COLUMN IF NOT EXISTS actual_message TEXT;

ALTER TABLE campaign_recipients 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

ALTER TABLE campaign_recipients 
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

-- 7. Create campaign queue table for processing
CREATE TABLE IF NOT EXISTS campaign_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Queue status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Message content (randomized version)
  message_content TEXT NOT NULL,
  
  -- Recipient info (denormalized for quick access)
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, recipient_id)
);

-- 8. Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_campaign_queue_status ON campaign_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_queue_workspace ON campaign_queue(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_queue_processing ON campaign_queue(status, processing_started_at) 
  WHERE status = 'processing';

-- 9. Create message templates table for reusable templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  
  -- Template content with placeholders
  content TEXT NOT NULL,
  
  -- Variations for anti-spam
  variations TEXT[] DEFAULT '{}',
  
  -- Variables available in this template
  variables TEXT[] DEFAULT '{name,company,phone}',
  
  -- Usage stats
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_workspace ON message_templates(workspace_id);

-- 10. Create segments table for saved audience segments
CREATE TABLE IF NOT EXISTS audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Filter criteria (JSONB for flexibility)
  filters JSONB NOT NULL DEFAULT '{}',
  -- Example filters:
  -- {
  --   "status": ["customer", "prospect"],
  --   "tags": ["vip", "interested"],
  --   "source": ["whatsapp", "web"],
  --   "purchase_intent_min": 60,
  --   "satisfaction": ["happy", "neutral"],
  --   "language": ["es", "en"],
  --   "last_contact_days": 30,
  --   "has_email": true
  -- }
  
  -- Cached count (updated periodically)
  estimated_count INTEGER DEFAULT 0,
  last_count_at TIMESTAMPTZ,
  
  -- Auto-update segment
  is_dynamic BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audience_segments_workspace ON audience_segments(workspace_id);

-- 11. RLS for new tables
ALTER TABLE campaign_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;

-- Campaign queue policies
CREATE POLICY "Users can view queue in their workspaces"
  ON campaign_queue FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
    UNION
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Users can manage queue in their workspaces"
  ON campaign_queue FOR ALL
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
    UNION
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Message templates policies
CREATE POLICY "Users can view templates in their workspaces"
  ON message_templates FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
    UNION
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Users can manage templates in their workspaces"
  ON message_templates FOR ALL
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
    UNION
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'
  ));

-- Audience segments policies
CREATE POLICY "Users can view segments in their workspaces"
  ON audience_segments FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
    UNION
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Users can manage segments in their workspaces"
  ON audience_segments FOR ALL
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE user_id = auth.uid()
    UNION
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'
  ));

-- 12. Function to count segment audience
CREATE OR REPLACE FUNCTION count_segment_audience(p_workspace_id UUID, p_filters JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_query TEXT;
BEGIN
  v_query := 'SELECT COUNT(*) FROM clients WHERE workspace_id = $1';
  
  -- Add filter conditions dynamically
  IF p_filters ? 'status' THEN
    v_query := v_query || ' AND status = ANY($2->>''status'')';
  END IF;
  
  IF p_filters ? 'source' THEN
    v_query := v_query || ' AND source = ANY($2->>''source'')';
  END IF;
  
  IF p_filters ? 'purchase_intent_min' THEN
    v_query := v_query || ' AND purchase_intent >= ($2->>''purchase_intent_min'')::INTEGER';
  END IF;
  
  IF p_filters ? 'satisfaction' THEN
    v_query := v_query || ' AND satisfaction = ANY($2->>''satisfaction'')';
  END IF;
  
  IF p_filters ? 'last_contact_days' THEN
    v_query := v_query || ' AND last_contact_at >= NOW() - (($2->>''last_contact_days'')::INTEGER || '' days'')::INTERVAL';
  END IF;
  
  IF p_filters ? 'has_email' AND (p_filters->>'has_email')::BOOLEAN THEN
    v_query := v_query || ' AND email IS NOT NULL AND email != ''''';
  END IF;
  
  IF p_filters ? 'has_phone' AND (p_filters->>'has_phone')::BOOLEAN THEN
    v_query := v_query || ' AND phone IS NOT NULL AND phone != ''''';
  END IF;
  
  EXECUTE v_query INTO v_count USING p_workspace_id, p_filters;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Function to reset daily send count (run via cron)
CREATE OR REPLACE FUNCTION reset_daily_campaign_counts()
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET daily_sent_count = 0, last_send_date = CURRENT_DATE
  WHERE last_send_date < CURRENT_DATE OR last_send_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 14. Function to increment campaign sent count
CREATE OR REPLACE FUNCTION increment_campaign_sent_count(p_campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET 
    sent_count = sent_count + 1,
    daily_sent_count = daily_sent_count + 1,
    last_send_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUMMARY
-- ============================================
-- New features:
-- 1. send_settings: Anti-ban configuration (delays, batches, limits)
-- 2. message_variations: Array of alternative messages
-- 3. campaign_queue: Queue system for controlled sending
-- 4. message_templates: Reusable templates with variations
-- 5. audience_segments: Saved filter combinations
-- 6. Daily limits and quiet hours support
-- 7. Message personalization with variables
-- ============================================
