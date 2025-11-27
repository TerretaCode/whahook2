-- ==============================================
-- CHAT WIDGET ENHANCEMENTS
-- Add new configuration fields for professional chat widget
-- ==============================================

-- Add new columns to chat_widgets table (visual config)
ALTER TABLE chat_widgets 
ADD COLUMN IF NOT EXISTS launcher_animation VARCHAR(20) DEFAULT 'pulse',
ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 9999,
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true;

-- Add AI/Chatbot configuration columns
ALTER TABLE chat_widgets
ADD COLUMN IF NOT EXISTS assistant_name VARCHAR(100) DEFAULT 'Asistente',
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS greeting_message TEXT,
ADD COLUMN IF NOT EXISTS fallback_message TEXT DEFAULT 'Lo siento, no he podido entender tu mensaje. ¿Podrías reformularlo?',
ADD COLUMN IF NOT EXISTS collect_visitor_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_name BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_phone BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collect_data_timing VARCHAR(20) DEFAULT 'during_chat',
ADD COLUMN IF NOT EXISTS human_handoff_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS ecommerce_connection_id UUID REFERENCES ecommerce_connections(id) ON DELETE SET NULL;

-- Add rating column to chat_widget_conversations
ALTER TABLE chat_widget_conversations
ADD COLUMN IF NOT EXISTS rating VARCHAR(20),
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN chat_widgets.launcher_animation IS 'Animation type: pulse, bounce, or none';
COMMENT ON COLUMN chat_widgets.z_index IS 'CSS z-index for widget positioning (default 9999)';
COMMENT ON COLUMN chat_widgets.sound_enabled IS 'Enable notification sound on new messages';
COMMENT ON COLUMN chat_widgets.assistant_name IS 'Name of the AI assistant';
COMMENT ON COLUMN chat_widgets.system_prompt IS 'System prompt for AI behavior';
COMMENT ON COLUMN chat_widgets.greeting_message IS 'First message when chat opens';
COMMENT ON COLUMN chat_widgets.fallback_message IS 'Message when AI cannot understand';
COMMENT ON COLUMN chat_widgets.collect_visitor_data IS 'Enable AI to collect visitor data during conversation';
COMMENT ON COLUMN chat_widgets.collect_name IS 'AI should ask for visitor name';
COMMENT ON COLUMN chat_widgets.collect_email IS 'AI should ask for visitor email';
COMMENT ON COLUMN chat_widgets.collect_phone IS 'AI should ask for visitor phone';
COMMENT ON COLUMN chat_widgets.collect_data_timing IS 'When to collect data: before_chat, during_chat, end_of_chat';
COMMENT ON COLUMN chat_widgets.human_handoff_email IS 'Email to notify when visitor requests human agent';
COMMENT ON COLUMN chat_widgets.ecommerce_connection_id IS 'Connected ecommerce store for product/order queries';
COMMENT ON COLUMN chat_widget_conversations.rating IS 'Conversation rating: positive or negative';
