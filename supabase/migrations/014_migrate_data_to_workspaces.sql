-- ============================================
-- Migration: Migrate existing data to workspaces
-- Description: Assigns workspace_id to existing records based on user_id
-- Run after: 013_workspace_members_and_features.sql
-- ============================================

-- ============================================
-- 1. MIGRATE CLIENTS TO WORKSPACES
-- Assigns each client to the user's first workspace
-- ============================================
UPDATE clients c
SET workspace_id = (
  SELECT w.id 
  FROM workspaces w 
  WHERE w.user_id = c.user_id 
  ORDER BY w.created_at ASC 
  LIMIT 1
)
WHERE c.workspace_id IS NULL 
AND c.user_id IS NOT NULL;

-- ============================================
-- 2. MIGRATE CONVERSATIONS TO WORKSPACES
-- ============================================
UPDATE conversations c
SET workspace_id = (
  SELECT w.id 
  FROM workspaces w 
  WHERE w.user_id = c.user_id 
  ORDER BY w.created_at ASC 
  LIMIT 1
)
WHERE c.workspace_id IS NULL 
AND c.user_id IS NOT NULL;

-- ============================================
-- 3. MIGRATE MESSAGES TO WORKSPACES
-- ============================================
UPDATE messages m
SET workspace_id = (
  SELECT c.workspace_id 
  FROM conversations c 
  WHERE c.id = m.conversation_id
)
WHERE m.workspace_id IS NULL 
AND m.conversation_id IS NOT NULL;

-- ============================================
-- 4. MIGRATE CHATBOT CONFIGS TO WORKSPACES
-- ============================================
UPDATE chatbot_configs c
SET workspace_id = (
  SELECT w.id 
  FROM workspaces w 
  WHERE w.user_id = c.user_id 
  ORDER BY w.created_at ASC 
  LIMIT 1
)
WHERE c.workspace_id IS NULL 
AND c.user_id IS NOT NULL;

-- ============================================
-- 5. MIGRATE CHAT WIDGETS TO WORKSPACES
-- ============================================
UPDATE chat_widgets cw
SET workspace_id = (
  SELECT w.id 
  FROM workspaces w 
  WHERE w.user_id = cw.user_id 
  ORDER BY w.created_at ASC 
  LIMIT 1
)
WHERE cw.workspace_id IS NULL 
AND cw.user_id IS NOT NULL;

-- ============================================
-- 6. MIGRATE CHAT WIDGET CONVERSATIONS TO WORKSPACES
-- ============================================
UPDATE chat_widget_conversations cwc
SET workspace_id = (
  SELECT cw.workspace_id 
  FROM chat_widgets cw 
  WHERE cw.id = cwc.widget_id
)
WHERE cwc.workspace_id IS NULL 
AND cwc.widget_id IS NOT NULL;

-- ============================================
-- 7. MIGRATE WHATSAPP ACCOUNTS TO WORKSPACES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_accounts') THEN
    UPDATE whatsapp_accounts wa
    SET workspace_id = (
      SELECT w.id 
      FROM workspaces w 
      WHERE w.user_id = wa.user_id 
      ORDER BY w.created_at ASC 
      LIMIT 1
    )
    WHERE wa.workspace_id IS NULL 
    AND wa.user_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 8. MIGRATE ECOMMERCE CONNECTIONS TO WORKSPACES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ecommerce_connections') THEN
    UPDATE ecommerce_connections ec
    SET workspace_id = (
      SELECT w.id 
      FROM workspaces w 
      WHERE w.user_id = ec.user_id 
      ORDER BY w.created_at ASC 
      LIMIT 1
    )
    WHERE ec.workspace_id IS NULL 
    AND ec.user_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 9. MIGRATE WEBHOOKS TO WORKSPACES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks') THEN
    UPDATE webhooks wh
    SET workspace_id = (
      SELECT w.id 
      FROM workspaces w 
      WHERE w.user_id = wh.user_id 
      ORDER BY w.created_at ASC 
      LIMIT 1
    )
    WHERE wh.workspace_id IS NULL 
    AND wh.user_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 10. MIGRATE AI CONFIG TO WORKSPACES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_config') THEN
    UPDATE ai_config ac
    SET workspace_id = (
      SELECT w.id 
      FROM workspaces w 
      WHERE w.user_id = ac.user_id 
      ORDER BY w.created_at ASC 
      LIMIT 1
    )
    WHERE ac.workspace_id IS NULL 
    AND ac.user_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
-- This migration assigns all existing records to their user's
-- first (oldest) workspace. This ensures that:
-- 1. Existing data is preserved
-- 2. Users can see their data when they log in
-- 3. Invited members can see the workspace's data
--
-- After running this migration, all records should have
-- a workspace_id assigned.
-- ============================================
