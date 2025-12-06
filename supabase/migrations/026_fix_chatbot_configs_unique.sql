-- ==============================================
-- Fix chatbot_configs to use session_id as unique key
-- ==============================================

-- First, remove any duplicate configs (keep the most recent one)
DELETE FROM chatbot_configs a
USING chatbot_configs b
WHERE a.session_id = b.session_id
  AND a.id < b.id
  AND a.session_id IS NOT NULL;

-- Drop the old unique constraint if it exists
ALTER TABLE chatbot_configs DROP CONSTRAINT IF EXISTS chatbot_configs_user_id_session_id_key;

-- Create unique index on session_id (for WhatsApp configs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_configs_session_id_unique 
ON chatbot_configs(session_id) 
WHERE session_id IS NOT NULL;

-- Create unique index on widget_id (for Web configs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_configs_widget_id_unique 
ON chatbot_configs(widget_id) 
WHERE widget_id IS NOT NULL;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Created unique indexes on chatbot_configs for session_id and widget_id';
END $$;
