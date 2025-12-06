-- ============================================
-- Migration: Fix chatbot_configs workspace_id
-- Description: Ensure chatbot_configs have correct workspace_id from whatsapp_accounts
-- ============================================

-- Update chatbot_configs to have workspace_id from their associated whatsapp_accounts
UPDATE chatbot_configs cc
SET workspace_id = wa.workspace_id
FROM whatsapp_accounts wa
WHERE cc.session_id = wa.session_id
  AND cc.user_id = wa.user_id
  AND cc.workspace_id IS NULL
  AND wa.workspace_id IS NOT NULL;

-- Also update from widget's workspace if it's a web chatbot config
UPDATE chatbot_configs cc
SET workspace_id = cw.workspace_id
FROM chat_widgets cw
WHERE cc.widget_id = cw.id
  AND cc.workspace_id IS NULL
  AND cw.workspace_id IS NOT NULL;

-- Create index for faster workspace lookups if not exists
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_workspace_id ON chatbot_configs(workspace_id);

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM chatbot_configs 
  WHERE workspace_id IS NOT NULL;
  
  RAISE NOTICE 'Chatbot configs with workspace_id: %', updated_count;
END $$;
