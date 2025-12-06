-- ============================================
-- Migration: Enhance clients table for AI extraction and segmentation
-- Description: Add source field and improve AI extraction tracking
-- ============================================

-- Add source column to differentiate WhatsApp vs Web clients
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'source'
  ) THEN
    ALTER TABLE clients ADD COLUMN source TEXT DEFAULT 'whatsapp';
    COMMENT ON COLUMN clients.source IS 'Source of the client: whatsapp or web';
  END IF;
END $$;

-- Add visitor_id for web widget clients
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'visitor_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN visitor_id TEXT;
    COMMENT ON COLUMN clients.visitor_id IS 'Visitor ID for web widget clients';
  END IF;
END $$;

-- Add widget_id for web widget clients
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'widget_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN widget_id UUID REFERENCES chat_widgets(id) ON DELETE SET NULL;
    COMMENT ON COLUMN clients.widget_id IS 'Widget ID for web widget clients';
  END IF;
END $$;

-- Add last_ai_analysis_at to track when AI last analyzed this client
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'last_ai_analysis_at'
  ) THEN
    ALTER TABLE clients ADD COLUMN last_ai_analysis_at TIMESTAMPTZ;
    COMMENT ON COLUMN clients.last_ai_analysis_at IS 'Timestamp of last AI analysis';
  END IF;
END $$;

-- Add ai_analysis_count to track how many times AI has analyzed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'ai_analysis_count'
  ) THEN
    ALTER TABLE clients ADD COLUMN ai_analysis_count INTEGER DEFAULT 0;
    COMMENT ON COLUMN clients.ai_analysis_count IS 'Number of AI analyses performed';
  END IF;
END $$;

-- Add language detected from conversations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'language'
  ) THEN
    ALTER TABLE clients ADD COLUMN language TEXT;
    COMMENT ON COLUMN clients.language IS 'Detected language from conversations';
  END IF;
END $$;

-- Add location/region if detected
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'location'
  ) THEN
    ALTER TABLE clients ADD COLUMN location TEXT;
    COMMENT ON COLUMN clients.location IS 'Location/region if detected';
  END IF;
END $$;

-- Add purchase_intent score (0-100)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'purchase_intent'
  ) THEN
    ALTER TABLE clients ADD COLUMN purchase_intent INTEGER;
    COMMENT ON COLUMN clients.purchase_intent IS 'Purchase intent score 0-100';
  END IF;
END $$;

-- Add budget_range if detected
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'budget_range'
  ) THEN
    ALTER TABLE clients ADD COLUMN budget_range TEXT;
    COMMENT ON COLUMN clients.budget_range IS 'Budget range if mentioned (low/medium/high/premium)';
  END IF;
END $$;

-- Add urgency level
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'urgency'
  ) THEN
    ALTER TABLE clients ADD COLUMN urgency TEXT DEFAULT 'normal';
    COMMENT ON COLUMN clients.urgency IS 'Urgency level: low/normal/high/immediate';
  END IF;
END $$;

-- Add conversation_id reference for linking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN conversation_id UUID;
    COMMENT ON COLUMN clients.conversation_id IS 'Reference to main conversation';
  END IF;
END $$;

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(user_id, source);
CREATE INDEX IF NOT EXISTS idx_clients_workspace_source ON clients(workspace_id, source);
CREATE INDEX IF NOT EXISTS idx_clients_purchase_intent ON clients(workspace_id, purchase_intent DESC);
CREATE INDEX IF NOT EXISTS idx_clients_ai_analysis ON clients(workspace_id, last_ai_analysis_at);

-- ============================================
-- SUMMARY
-- ============================================
-- New columns added:
-- - source: 'whatsapp' or 'web'
-- - visitor_id: for web widget tracking
-- - widget_id: reference to chat widget
-- - last_ai_analysis_at: when AI last analyzed
-- - ai_analysis_count: number of analyses
-- - language: detected language
-- - location: detected location/region
-- - purchase_intent: 0-100 score
-- - budget_range: low/medium/high/premium
-- - urgency: low/normal/high/immediate
-- - conversation_id: link to conversation
-- ============================================
