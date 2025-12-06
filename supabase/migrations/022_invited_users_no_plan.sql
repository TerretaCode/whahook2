-- ============================================
-- Migration: Handle invited users without their own plan
-- Description: Invited users should not have a subscription_tier,
-- they inherit access from the workspace owner who invited them
-- ============================================

-- 1. Add 'member' to subscription_tier options
-- Members don't have their own plan, they use the owner's plan
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_subscription_tier_check 
CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise', 'member'));

-- 2. Add is_invited_user column to track if user was created via invitation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_invited_user'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_invited_user BOOLEAN DEFAULT false;
    COMMENT ON COLUMN profiles.is_invited_user IS 'True if user was created via workspace invitation';
  END IF;
END $$;

-- 3. Add invited_to_workspace_id to track the original workspace invitation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'invited_to_workspace_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN invited_to_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
    COMMENT ON COLUMN profiles.invited_to_workspace_id IS 'Original workspace the user was invited to';
  END IF;
END $$;

-- 4. Update the handle_new_user function to check for invitation metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invited_workspace_id UUID;
BEGIN
  -- Check if user was invited (has invited_to_workspace in metadata)
  invited_workspace_id := (NEW.raw_user_meta_data->>'invited_to_workspace')::UUID;
  
  IF invited_workspace_id IS NOT NULL THEN
    -- User was invited - set as member with no plan
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name, 
      company_name, 
      account_type,
      subscription_tier,
      subscription_status,
      trial_ends_at,
      is_invited_user,
      invited_to_workspace_id
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      'saas',
      'member',  -- No own plan, uses owner's plan
      'active',
      NULL,      -- No trial for invited users
      true,
      invited_workspace_id
    )
    ON CONFLICT (id) DO UPDATE SET
      subscription_tier = 'member',
      subscription_status = 'active',
      trial_ends_at = NULL,
      is_invited_user = true,
      invited_to_workspace_id = invited_workspace_id;
  ELSE
    -- Regular signup - gets trial
    INSERT INTO public.profiles (id, email, full_name, company_name, account_type)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'account_type', 'saas')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update existing invited users to have 'member' tier
-- Find users who are members of workspaces but not owners
UPDATE profiles p
SET 
  subscription_tier = 'member',
  subscription_status = 'active',
  trial_ends_at = NULL,
  is_invited_user = true
WHERE EXISTS (
  SELECT 1 FROM workspace_members wm
  WHERE wm.user_id = p.id
  AND wm.status = 'active'
)
AND NOT EXISTS (
  SELECT 1 FROM workspaces w
  WHERE w.user_id = p.id
);

-- 6. Create index for invited users
CREATE INDEX IF NOT EXISTS idx_profiles_is_invited_user ON profiles(is_invited_user) WHERE is_invited_user = true;

-- 7. Update the plan check functions to handle members
CREATE OR REPLACE FUNCTION get_current_user_plan()
RETURNS TEXT AS $$
DECLARE
  user_tier TEXT;
  owner_tier TEXT;
  workspace_id UUID;
BEGIN
  -- Get user's own tier
  SELECT subscription_tier INTO user_tier FROM profiles WHERE id = auth.uid();
  
  -- If user is a member, get the owner's plan from their primary workspace
  IF user_tier = 'member' THEN
    -- Get the first workspace they're a member of
    SELECT wm.workspace_id INTO workspace_id
    FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.status = 'active'
    LIMIT 1;
    
    IF workspace_id IS NOT NULL THEN
      -- Get the owner's plan
      SELECT p.subscription_tier INTO owner_tier
      FROM workspaces w
      JOIN profiles p ON p.id = w.user_id
      WHERE w.id = workspace_id;
      
      RETURN COALESCE(owner_tier, 'trial');
    END IF;
  END IF;
  
  RETURN COALESCE(user_tier, 'trial');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to get effective plan for a specific workspace
CREATE OR REPLACE FUNCTION get_workspace_plan(p_workspace_id UUID)
RETURNS TEXT AS $$
DECLARE
  owner_tier TEXT;
BEGIN
  SELECT p.subscription_tier INTO owner_tier
  FROM workspaces w
  JOIN profiles p ON p.id = w.user_id
  WHERE w.id = p_workspace_id;
  
  RETURN COALESCE(owner_tier, 'trial');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUMMARY
-- ============================================
-- Changes made:
-- 1. Added 'member' to subscription_tier options
-- 2. Added is_invited_user boolean column
-- 3. Added invited_to_workspace_id column
-- 4. Updated handle_new_user() to detect invited users
-- 5. Updated existing invited users to 'member' tier
-- 6. Updated get_current_user_plan() to return owner's plan for members
-- 7. Added get_workspace_plan() function
--
-- How it works:
-- - Regular users: Get 'trial' tier with 14-day trial
-- - Invited users: Get 'member' tier with no trial
-- - When checking plan, members inherit the owner's plan
-- ============================================
