-- ==============================================
-- CHATBOT ASSISTANT CONFIGURATION
-- Complete schema for WhatsApp and Web chatbot assistant settings
-- ==============================================

-- Create chatbot_configs table if not exists (basic structure)
CREATE TABLE IF NOT EXISTS chatbot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- ADD ALL COLUMNS (using ALTER TABLE for existing tables)
-- ==============================================

-- Identifier columns
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS widget_id UUID REFERENCES chat_widgets(id) ON DELETE CASCADE;

-- 🤖 BOT SECTION (Tu Bot)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS bot_name VARCHAR(100) DEFAULT 'Asistente';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS tone VARCHAR(20) DEFAULT 'profesional';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS emoji_usage VARCHAR(20) DEFAULT 'moderado';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS response_length VARCHAR(20) DEFAULT 'normal';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';

-- 🏢 BUSINESS SECTION (Tu Negocio)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS contact JSONB DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS business_hours TEXT;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS out_of_hours_message TEXT;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '[]';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]';

-- 🛒 PRODUCTS SECTION (Productos)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS use_ecommerce_api BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS ecommerce_connection_ids UUID[] DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS ecommerce_search_message TEXT DEFAULT 'Estoy buscando la mejor solución para ti...';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS product_categories JSONB DEFAULT '[]';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS featured_products JSONB DEFAULT '[]';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS product_recommendations_enabled BOOLEAN DEFAULT true;

-- 📦 SHIPPING SECTION (Envíos y Pagos)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS return_policy TEXT;

-- 🎯 BEHAVIOR SECTION (Comportamiento del Bot)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS bot_objectives TEXT[] DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS custom_objectives TEXT[] DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS restrictions TEXT[] DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- ⏰ AVAILABILITY SECTION (Disponibilidad)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS business_hours_enabled BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS business_hours_timezone VARCHAR(50) DEFAULT 'Europe/Madrid';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS active_hours_start TIME DEFAULT '09:00';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS active_hours_end TIME DEFAULT '18:00';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS active_days INTEGER[] DEFAULT '{1,2,3,4,5}';

-- 💬 CONVERSATION SECTION (Conversación)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]';

-- 🚨 ESCALATION SECTION (Escalación a Humano)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS handoff_enabled BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS escalation_triggers TEXT[] DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS custom_escalation_triggers TEXT[] DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS escalation_message TEXT DEFAULT 'Entiendo que necesitas ayuda más personalizada. Te paso con un compañero de mi equipo.';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS info_fields_to_collect TEXT[] DEFAULT '{Nombre completo,Email,Teléfono}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS custom_info_fields TEXT[] DEFAULT '{}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS handoff_keywords TEXT[] DEFAULT '{humano,agente,representante,soporte,persona}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS handoff_message TEXT;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS handoff_frustration_detection BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS handoff_frustration_keywords TEXT[] DEFAULT '{no sirve,inútil,mal servicio,horrible,pésimo}';

-- ➕ ADDITIONAL SECTION (Información Adicional)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- 🌐 WEB-SPECIFIC FIELDS (Solo Web Chatbot)
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS collect_visitor_data BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS collect_name BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS collect_email BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS collect_phone BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS collect_data_timing VARCHAR(20) DEFAULT 'during_chat';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS human_handoff_email VARCHAR(255);

-- ⚙️ MODEL/TECHNICAL CONFIG
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'google';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS model VARCHAR(100) DEFAULT 'gemini-2.5-flash';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS has_api_key BOOLEAN DEFAULT false;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 1000;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS top_p DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS frequency_penalty DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS presence_penalty DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS response_format VARCHAR(20) DEFAULT 'text';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS context_window INTEGER DEFAULT 10;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS max_conversation_length INTEGER DEFAULT 20;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS enable_memory BOOLEAN DEFAULT true;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS enable_typing_indicator BOOLEAN DEFAULT true;

-- 📊 ADVANCED CONFIG
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS auto_reply BOOLEAN DEFAULT true;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS custom_instructions TEXT;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS fallback_message TEXT DEFAULT 'Disculpa, no estoy seguro de cómo ayudarte con eso.';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS fallback_uncertainty_phrases TEXT[] DEFAULT '{no estoy seguro,no puedo ayudarte,no tengo información}';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS debounce_delay_ms INTEGER DEFAULT 5000;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS max_wait_ms INTEGER DEFAULT 15000;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS max_batch_size INTEGER DEFAULT 20;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS typing_indicator_delay_ms INTEGER DEFAULT 500;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS intent_classifier_max_tokens INTEGER DEFAULT 1000;

-- 📝 LOGGING CONFIG
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS log_conversations BOOLEAN DEFAULT true;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS log_level VARCHAR(20) DEFAULT 'detailed';
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS log_user_messages BOOLEAN DEFAULT true;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS log_bot_responses BOOLEAN DEFAULT true;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 90;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS auto_delete_enabled BOOLEAN DEFAULT true;
ALTER TABLE chatbot_configs ADD COLUMN IF NOT EXISTS soft_delete_enabled BOOLEAN DEFAULT true;

-- ==============================================
-- INDEXES
-- ==============================================

-- Index for WhatsApp configs (user + session)
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_configs_user_session 
ON chatbot_configs(user_id, session_id) 
WHERE session_id IS NOT NULL;

-- Index for Web configs (user + widget)
CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbot_configs_user_widget 
ON chatbot_configs(user_id, widget_id) 
WHERE widget_id IS NOT NULL;

-- Index for quick lookups by user
CREATE INDEX IF NOT EXISTS idx_chatbot_configs_user_id 
ON chatbot_configs(user_id);

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE chatbot_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own chatbot configs" ON chatbot_configs;
DROP POLICY IF EXISTS "Users can insert own chatbot configs" ON chatbot_configs;
DROP POLICY IF EXISTS "Users can update own chatbot configs" ON chatbot_configs;
DROP POLICY IF EXISTS "Users can delete own chatbot configs" ON chatbot_configs;

-- Policy: Users can only see their own configs
CREATE POLICY "Users can view own chatbot configs"
ON chatbot_configs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own configs
CREATE POLICY "Users can insert own chatbot configs"
ON chatbot_configs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own configs
CREATE POLICY "Users can update own chatbot configs"
ON chatbot_configs FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own configs
CREATE POLICY "Users can delete own chatbot configs"
ON chatbot_configs FOR DELETE
USING (auth.uid() = user_id);

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE chatbot_configs IS 'Configuration for AI chatbot assistants (WhatsApp and Web)';
COMMENT ON COLUMN chatbot_configs.session_id IS 'WhatsApp session identifier (null for web)';
COMMENT ON COLUMN chatbot_configs.widget_id IS 'Web chat widget identifier (null for WhatsApp)';
COMMENT ON COLUMN chatbot_configs.bot_name IS 'Name the bot uses to introduce itself';
COMMENT ON COLUMN chatbot_configs.tone IS 'Communication style: profesional, amigable, formal, casual';
COMMENT ON COLUMN chatbot_configs.emoji_usage IS 'Emoji frequency: ninguno, pocos, moderado, muchos';
COMMENT ON COLUMN chatbot_configs.response_length IS 'Response verbosity: cortas, normal, detalladas';
COMMENT ON COLUMN chatbot_configs.bot_objectives IS 'Primary goals: sell, inform, leads, support';
COMMENT ON COLUMN chatbot_configs.restrictions IS 'Things the bot should never do';
COMMENT ON COLUMN chatbot_configs.escalation_triggers IS 'Situations that trigger human handoff';
COMMENT ON COLUMN chatbot_configs.collect_visitor_data IS 'Web only: collect visitor contact info';
COMMENT ON COLUMN chatbot_configs.collect_data_timing IS 'When to collect: before_chat, during_chat, end_of_chat';
