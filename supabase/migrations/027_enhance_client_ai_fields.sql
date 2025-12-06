-- ==============================================
-- Enhance client AI extraction fields
-- ==============================================

-- Add new fields for improved AI extraction
ALTER TABLE clients ADD COLUMN IF NOT EXISTS messages_since_last_analysis INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conversation_topics TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS key_questions TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS objections TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_steps TEXT;

-- Create index for efficient querying of clients needing analysis
CREATE INDEX IF NOT EXISTS idx_clients_needs_analysis 
ON clients(workspace_id, last_ai_analysis_at, messages_since_last_analysis)
WHERE ai_extraction_status != 'processing';

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Added enhanced AI extraction fields to clients table';
END $$;
