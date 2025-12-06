-- ============================================
-- Migration: Fix workspace_id for WhatsApp accounts and chatbot configs
-- Description: Ensure all WhatsApp accounts and chatbot configs have correct workspace_id
-- ============================================

-- STEP 1: First, ensure whatsapp_accounts have workspace_id from their owner's default workspace
UPDATE whatsapp_accounts wa
SET workspace_id = (
  SELECT w.id 
  FROM workspaces w 
  WHERE w.owner_id = wa.user_id 
  ORDER BY w.created_at ASC 
  LIMIT 1
)
WHERE wa.workspace_id IS NULL;

-- STEP 2: Update chatbot_configs to have workspace_id from their associated whatsapp_accounts
UPDATE chatbot_configs cc
SET workspace_id = wa.workspace_id
FROM whatsapp_accounts wa
WHERE cc.session_id = wa.session_id
  AND cc.user_id = wa.user_id
  AND cc.workspace_id IS NULL
  AND wa.workspace_id IS NOT NULL;

-- STEP 3: Also update from widget's workspace if it's a web chatbot config
UPDATE chatbot_configs cc
SET workspace_id = cw.workspace_id
FROM chat_widgets cw
WHERE cc.widget_id = cw.id
  AND cc.workspace_id IS NULL
  AND cw.workspace_id IS NOT NULL;

-- STEP 4: For any remaining chatbot_configs without workspace_id, use owner's default workspace
UPDATE chatbot_configs cc
SET workspace_id = (
  SELECT w.id 
  FROM workspaces w 
  WHERE w.owner_id = cc.user_id 
  ORDER BY w.created_at ASC 
  LIMIT 1
)
WHERE cc.workspace_id IS NULL;

-- Create indexes for faster workspace lookups if not exists
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_workspace_id ON chatbot_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_workspace_id ON whatsapp_accounts(workspace_id);

-- Log the updates
DO $$
DECLARE
  wa_count INTEGER;
  cc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO wa_count 
  FROM whatsapp_accounts 
  WHERE workspace_id IS NOT NULL;
  
  SELECT COUNT(*) INTO cc_count 
  FROM chatbot_configs 
  WHERE workspace_id IS NOT NULL;
  
  RAISE NOTICE 'WhatsApp accounts with workspace_id: %', wa_count;
  RAISE NOTICE 'Chatbot configs with workspace_id: %', cc_count;
END $$;
