-- ============================================
-- Migration: Advanced Client Segmentation
-- Description: Complete segmentation system for professional marketing
-- ============================================

-- 1. Add more segmentation fields to clients
-- Interest categories (what they're interested in)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'interests'
  ) THEN
    ALTER TABLE clients ADD COLUMN interests TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN clients.interests IS 'Array of detected interests/topics';
  END IF;
END $$;

-- Product/service categories they asked about
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'product_interests'
  ) THEN
    ALTER TABLE clients ADD COLUMN product_interests TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN clients.product_interests IS 'Products/services they showed interest in';
  END IF;
END $$;

-- Sentiment score (-100 to 100)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'sentiment_score'
  ) THEN
    ALTER TABLE clients ADD COLUMN sentiment_score INTEGER;
    COMMENT ON COLUMN clients.sentiment_score IS 'Overall sentiment -100 (negative) to 100 (positive)';
  END IF;
END $$;

-- Engagement level
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'engagement_level'
  ) THEN
    ALTER TABLE clients ADD COLUMN engagement_level TEXT DEFAULT 'low';
    COMMENT ON COLUMN clients.engagement_level IS 'Engagement: cold/low/medium/high/hot';
  END IF;
END $$;

-- Total messages sent by client
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'total_messages'
  ) THEN
    ALTER TABLE clients ADD COLUMN total_messages INTEGER DEFAULT 0;
    COMMENT ON COLUMN clients.total_messages IS 'Total messages sent by this client';
  END IF;
END $$;

-- Average response time (in seconds)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'avg_response_time'
  ) THEN
    ALTER TABLE clients ADD COLUMN avg_response_time INTEGER;
    COMMENT ON COLUMN clients.avg_response_time IS 'Average response time in seconds';
  END IF;
END $$;

-- First contact date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'first_contact_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN first_contact_at TIMESTAMPTZ;
    COMMENT ON COLUMN clients.first_contact_at IS 'Date of first contact';
  END IF;
END $$;

-- Last campaign sent date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'last_campaign_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN last_campaign_at TIMESTAMPTZ;
    COMMENT ON COLUMN clients.last_campaign_at IS 'Last campaign message sent';
  END IF;
END $$;

-- Campaign opt-out status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'campaign_opt_out'
  ) THEN
    ALTER TABLE clients ADD COLUMN campaign_opt_out BOOLEAN DEFAULT false;
    COMMENT ON COLUMN clients.campaign_opt_out IS 'Client opted out of campaigns';
  END IF;
END $$;

-- Preferred contact time
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'preferred_contact_time'
  ) THEN
    ALTER TABLE clients ADD COLUMN preferred_contact_time TEXT;
    COMMENT ON COLUMN clients.preferred_contact_time IS 'Preferred time: morning/afternoon/evening';
  END IF;
END $$;

-- Timezone
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE clients ADD COLUMN timezone TEXT;
    COMMENT ON COLUMN clients.timezone IS 'Client timezone if detected';
  END IF;
END $$;

-- Device type (mobile/desktop)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE clients ADD COLUMN device_type TEXT;
    COMMENT ON COLUMN clients.device_type IS 'Device type: mobile/desktop/tablet';
  END IF;
END $$;

-- Referral source (how they found us)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'referral_source'
  ) THEN
    ALTER TABLE clients ADD COLUMN referral_source TEXT;
    COMMENT ON COLUMN clients.referral_source IS 'How they found us: organic/ad/referral/social';
  END IF;
END $$;

-- Custom fields (JSONB for flexibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE clients ADD COLUMN custom_fields JSONB DEFAULT '{}';
    COMMENT ON COLUMN clients.custom_fields IS 'Custom fields defined by workspace';
  END IF;
END $$;

-- Lifecycle stage
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'lifecycle_stage'
  ) THEN
    ALTER TABLE clients ADD COLUMN lifecycle_stage TEXT DEFAULT 'new';
    COMMENT ON COLUMN clients.lifecycle_stage IS 'Stage: new/engaged/qualified/opportunity/customer/churned';
  END IF;
END $$;

-- Lead score (0-100, calculated)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'lead_score'
  ) THEN
    ALTER TABLE clients ADD COLUMN lead_score INTEGER DEFAULT 0;
    COMMENT ON COLUMN clients.lead_score IS 'Calculated lead score 0-100';
  END IF;
END $$;

-- 2. Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_clients_engagement ON clients(workspace_id, engagement_level);
CREATE INDEX IF NOT EXISTS idx_clients_lifecycle ON clients(workspace_id, lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_clients_lead_score ON clients(workspace_id, lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_clients_sentiment ON clients(workspace_id, sentiment_score);
CREATE INDEX IF NOT EXISTS idx_clients_opt_out ON clients(workspace_id, campaign_opt_out);
CREATE INDEX IF NOT EXISTS idx_clients_interests ON clients USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_clients_product_interests ON clients USING GIN(product_interests);

-- 3. Function to calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(p_client_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_client RECORD;
BEGIN
  SELECT * INTO v_client FROM clients WHERE id = p_client_id;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- Base score from engagement level
  v_score := v_score + CASE v_client.engagement_level
    WHEN 'hot' THEN 30
    WHEN 'high' THEN 25
    WHEN 'medium' THEN 15
    WHEN 'low' THEN 5
    WHEN 'cold' THEN 0
    ELSE 5
  END;
  
  -- Score from purchase intent
  IF v_client.purchase_intent IS NOT NULL THEN
    v_score := v_score + (v_client.purchase_intent * 0.3)::INTEGER;
  END IF;
  
  -- Score from sentiment
  IF v_client.sentiment_score IS NOT NULL THEN
    v_score := v_score + GREATEST(0, (v_client.sentiment_score * 0.1)::INTEGER);
  END IF;
  
  -- Score from message count (engagement)
  v_score := v_score + LEAST(10, COALESCE(v_client.total_messages, 0) / 5);
  
  -- Score from recency
  IF v_client.last_contact_at IS NOT NULL THEN
    v_score := v_score + CASE
      WHEN v_client.last_contact_at > NOW() - INTERVAL '1 day' THEN 10
      WHEN v_client.last_contact_at > NOW() - INTERVAL '7 days' THEN 7
      WHEN v_client.last_contact_at > NOW() - INTERVAL '30 days' THEN 4
      ELSE 0
    END;
  END IF;
  
  -- Score from lifecycle stage
  v_score := v_score + CASE v_client.lifecycle_stage
    WHEN 'opportunity' THEN 15
    WHEN 'qualified' THEN 10
    WHEN 'engaged' THEN 5
    WHEN 'new' THEN 2
    ELSE 0
  END;
  
  -- Penalty for opt-out
  IF v_client.campaign_opt_out THEN
    v_score := v_score - 20;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- 4. Function to update lead scores for a workspace
CREATE OR REPLACE FUNCTION update_workspace_lead_scores(p_workspace_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE clients 
  SET lead_score = calculate_lead_score(id)
  WHERE workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Advanced segment filter function
CREATE OR REPLACE FUNCTION get_segment_clients(
  p_workspace_id UUID,
  p_filters JSONB
)
RETURNS TABLE(client_id UUID) AS $$
DECLARE
  v_query TEXT;
BEGIN
  v_query := 'SELECT id FROM clients WHERE workspace_id = $1 AND campaign_opt_out = false';
  
  -- Source filter (whatsapp/web)
  IF p_filters ? 'source' AND jsonb_array_length(p_filters->'source') > 0 THEN
    v_query := v_query || ' AND source = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''source'')))';
  END IF;
  
  -- Status filter
  IF p_filters ? 'status' AND jsonb_array_length(p_filters->'status') > 0 THEN
    v_query := v_query || ' AND status = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''status'')))';
  END IF;
  
  -- Engagement level filter
  IF p_filters ? 'engagement_level' AND jsonb_array_length(p_filters->'engagement_level') > 0 THEN
    v_query := v_query || ' AND engagement_level = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''engagement_level'')))';
  END IF;
  
  -- Lifecycle stage filter
  IF p_filters ? 'lifecycle_stage' AND jsonb_array_length(p_filters->'lifecycle_stage') > 0 THEN
    v_query := v_query || ' AND lifecycle_stage = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''lifecycle_stage'')))';
  END IF;
  
  -- Language filter
  IF p_filters ? 'language' AND jsonb_array_length(p_filters->'language') > 0 THEN
    v_query := v_query || ' AND language = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''language'')))';
  END IF;
  
  -- Tags filter (has any of these tags)
  IF p_filters ? 'tags' AND jsonb_array_length(p_filters->'tags') > 0 THEN
    v_query := v_query || ' AND tags && ARRAY(SELECT jsonb_array_elements_text($2->''tags''))';
  END IF;
  
  -- Interests filter
  IF p_filters ? 'interests' AND jsonb_array_length(p_filters->'interests') > 0 THEN
    v_query := v_query || ' AND interests && ARRAY(SELECT jsonb_array_elements_text($2->''interests''))';
  END IF;
  
  -- Product interests filter
  IF p_filters ? 'product_interests' AND jsonb_array_length(p_filters->'product_interests') > 0 THEN
    v_query := v_query || ' AND product_interests && ARRAY(SELECT jsonb_array_elements_text($2->''product_interests''))';
  END IF;
  
  -- Purchase intent range
  IF p_filters ? 'purchase_intent_min' THEN
    v_query := v_query || ' AND purchase_intent >= ($2->>''purchase_intent_min'')::INTEGER';
  END IF;
  IF p_filters ? 'purchase_intent_max' THEN
    v_query := v_query || ' AND purchase_intent <= ($2->>''purchase_intent_max'')::INTEGER';
  END IF;
  
  -- Lead score range
  IF p_filters ? 'lead_score_min' THEN
    v_query := v_query || ' AND lead_score >= ($2->>''lead_score_min'')::INTEGER';
  END IF;
  IF p_filters ? 'lead_score_max' THEN
    v_query := v_query || ' AND lead_score <= ($2->>''lead_score_max'')::INTEGER';
  END IF;
  
  -- Sentiment range
  IF p_filters ? 'sentiment_min' THEN
    v_query := v_query || ' AND sentiment_score >= ($2->>''sentiment_min'')::INTEGER';
  END IF;
  IF p_filters ? 'sentiment_max' THEN
    v_query := v_query || ' AND sentiment_score <= ($2->>''sentiment_max'')::INTEGER';
  END IF;
  
  -- Last contact days
  IF p_filters ? 'last_contact_days' THEN
    v_query := v_query || ' AND last_contact_at >= NOW() - (($2->>''last_contact_days'')::INTEGER || '' days'')::INTERVAL';
  END IF;
  
  -- No contact in X days (inactive)
  IF p_filters ? 'no_contact_days' THEN
    v_query := v_query || ' AND (last_contact_at IS NULL OR last_contact_at < NOW() - (($2->>''no_contact_days'')::INTEGER || '' days'')::INTERVAL)';
  END IF;
  
  -- First contact date range
  IF p_filters ? 'first_contact_after' THEN
    v_query := v_query || ' AND first_contact_at >= ($2->>''first_contact_after'')::TIMESTAMPTZ';
  END IF;
  IF p_filters ? 'first_contact_before' THEN
    v_query := v_query || ' AND first_contact_at <= ($2->>''first_contact_before'')::TIMESTAMPTZ';
  END IF;
  
  -- Has email
  IF p_filters ? 'has_email' AND (p_filters->>'has_email')::BOOLEAN THEN
    v_query := v_query || ' AND email IS NOT NULL AND email != ''''';
  END IF;
  
  -- Has phone
  IF p_filters ? 'has_phone' AND (p_filters->>'has_phone')::BOOLEAN THEN
    v_query := v_query || ' AND phone IS NOT NULL AND phone != ''''';
  END IF;
  
  -- Budget range
  IF p_filters ? 'budget_range' AND jsonb_array_length(p_filters->'budget_range') > 0 THEN
    v_query := v_query || ' AND budget_range = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''budget_range'')))';
  END IF;
  
  -- Urgency
  IF p_filters ? 'urgency' AND jsonb_array_length(p_filters->'urgency') > 0 THEN
    v_query := v_query || ' AND urgency = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''urgency'')))';
  END IF;
  
  -- Satisfaction
  IF p_filters ? 'satisfaction' AND jsonb_array_length(p_filters->'satisfaction') > 0 THEN
    v_query := v_query || ' AND satisfaction = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''satisfaction'')))';
  END IF;
  
  -- Device type
  IF p_filters ? 'device_type' AND jsonb_array_length(p_filters->'device_type') > 0 THEN
    v_query := v_query || ' AND device_type = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''device_type'')))';
  END IF;
  
  -- Referral source
  IF p_filters ? 'referral_source' AND jsonb_array_length(p_filters->'referral_source') > 0 THEN
    v_query := v_query || ' AND referral_source = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''referral_source'')))';
  END IF;
  
  -- Not contacted by campaign in X days
  IF p_filters ? 'not_campaigned_days' THEN
    v_query := v_query || ' AND (last_campaign_at IS NULL OR last_campaign_at < NOW() - (($2->>''not_campaigned_days'')::INTEGER || '' days'')::INTERVAL)';
  END IF;
  
  -- Total messages range
  IF p_filters ? 'min_messages' THEN
    v_query := v_query || ' AND total_messages >= ($2->>''min_messages'')::INTEGER';
  END IF;
  IF p_filters ? 'max_messages' THEN
    v_query := v_query || ' AND total_messages <= ($2->>''max_messages'')::INTEGER';
  END IF;
  
  -- Location filter
  IF p_filters ? 'location' AND jsonb_array_length(p_filters->'location') > 0 THEN
    v_query := v_query || ' AND location = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''location'')))';
  END IF;
  
  -- Preferred contact time
  IF p_filters ? 'preferred_contact_time' AND jsonb_array_length(p_filters->'preferred_contact_time') > 0 THEN
    v_query := v_query || ' AND preferred_contact_time = ANY(ARRAY(SELECT jsonb_array_elements_text($2->''preferred_contact_time'')))';
  END IF;
  
  RETURN QUERY EXECUTE v_query USING p_workspace_id, p_filters;
END;
$$ LANGUAGE plpgsql;

-- 6. Create predefined segments view
CREATE OR REPLACE VIEW predefined_segments AS
SELECT 
  'hot_leads' as segment_id,
  'Hot Leads' as name,
  'Clients with high engagement and purchase intent' as description,
  '{"engagement_level": ["hot", "high"], "purchase_intent_min": 70}'::JSONB as filters
UNION ALL
SELECT 
  'whatsapp_clients',
  'WhatsApp Clients',
  'All clients from WhatsApp',
  '{"source": ["whatsapp"]}'::JSONB
UNION ALL
SELECT 
  'web_clients',
  'Web Visitors',
  'All clients from web chat widget',
  '{"source": ["web"]}'::JSONB
UNION ALL
SELECT 
  'inactive_30_days',
  'Inactive 30+ Days',
  'Clients with no contact in 30 days',
  '{"no_contact_days": 30}'::JSONB
UNION ALL
SELECT 
  'new_this_week',
  'New This Week',
  'Clients who contacted for the first time this week',
  '{"last_contact_days": 7, "lifecycle_stage": ["new"]}'::JSONB
UNION ALL
SELECT 
  'high_value',
  'High Value',
  'High budget clients with positive sentiment',
  '{"budget_range": ["high", "premium"], "sentiment_min": 50}'::JSONB
UNION ALL
SELECT 
  'ready_to_buy',
  'Ready to Buy',
  'High purchase intent and urgency',
  '{"purchase_intent_min": 80, "urgency": ["high", "immediate"]}'::JSONB
UNION ALL
SELECT 
  'needs_followup',
  'Needs Follow-up',
  'Engaged but not contacted recently',
  '{"engagement_level": ["medium", "high"], "no_contact_days": 7}'::JSONB
UNION ALL
SELECT 
  'at_risk',
  'At Risk',
  'Previously engaged but going cold',
  '{"lifecycle_stage": ["engaged", "qualified"], "no_contact_days": 14}'::JSONB
UNION ALL
SELECT 
  'promoters',
  'Promoters',
  'Happy customers who might refer others',
  '{"satisfaction": ["happy"], "sentiment_min": 70, "lifecycle_stage": ["customer"]}'::JSONB;

-- ============================================
-- SUMMARY
-- ============================================
-- New client fields:
-- - interests: Array of detected interests
-- - product_interests: Products they asked about
-- - sentiment_score: -100 to 100
-- - engagement_level: cold/low/medium/high/hot
-- - total_messages: Message count
-- - avg_response_time: Response time in seconds
-- - first_contact_at: First contact date
-- - last_campaign_at: Last campaign sent
-- - campaign_opt_out: Opted out of campaigns
-- - preferred_contact_time: morning/afternoon/evening
-- - timezone: Client timezone
-- - device_type: mobile/desktop/tablet
-- - referral_source: organic/ad/referral/social
-- - custom_fields: JSONB for custom data
-- - lifecycle_stage: new/engaged/qualified/opportunity/customer/churned
-- - lead_score: Calculated 0-100
--
-- Functions:
-- - calculate_lead_score(): Calculate score for a client
-- - update_workspace_lead_scores(): Update all scores
-- - get_segment_clients(): Get clients matching filters
--
-- Predefined segments:
-- - hot_leads, whatsapp_clients, web_clients
-- - inactive_30_days, new_this_week, high_value
-- - ready_to_buy, needs_followup, at_risk, promoters
-- ============================================
