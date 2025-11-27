-- ==============================================
-- CHAT WIDGET ENHANCEMENTS
-- Add new configuration fields for professional chat widget
-- ==============================================

-- Add new columns to chat_widgets table
ALTER TABLE chat_widgets 
ADD COLUMN IF NOT EXISTS launcher_animation VARCHAR(20) DEFAULT 'pulse',
ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 9999,
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS collect_visitor_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_name BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_phone BOOLEAN DEFAULT false;

-- Add rating column to chat_widget_conversations
ALTER TABLE chat_widget_conversations
ADD COLUMN IF NOT EXISTS rating VARCHAR(20),
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN chat_widgets.launcher_animation IS 'Animation type: pulse, bounce, or none';
COMMENT ON COLUMN chat_widgets.z_index IS 'CSS z-index for widget positioning (default 9999)';
COMMENT ON COLUMN chat_widgets.sound_enabled IS 'Enable notification sound on new messages';
COMMENT ON COLUMN chat_widgets.collect_visitor_data IS 'Enable AI to collect visitor data during conversation';
COMMENT ON COLUMN chat_widgets.collect_name IS 'AI should ask for visitor name';
COMMENT ON COLUMN chat_widgets.collect_email IS 'AI should ask for visitor email';
COMMENT ON COLUMN chat_widgets.collect_phone IS 'AI should ask for visitor phone';
COMMENT ON COLUMN chat_widget_conversations.rating IS 'Conversation rating: positive or negative';
