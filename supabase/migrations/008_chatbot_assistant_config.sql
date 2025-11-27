-- ==============================================
-- CHATBOT ASSISTANT CONFIGURATION
-- Complete schema for WhatsApp and Web chatbot assistant settings
-- ==============================================

-- Create chatbot_configs table if not exists
CREATE TABLE IF NOT EXISTS chatbot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identifier: either session_id (WhatsApp) or widget_id (Web)
    session_id TEXT,                                    -- WhatsApp session identifier
    widget_id UUID REFERENCES chat_widgets(id) ON DELETE CASCADE,  -- Web widget identifier
    
    -- ==============================================
    -- 🤖 BOT SECTION (Tu Bot)
    -- ==============================================
    bot_name VARCHAR(100) DEFAULT 'Asistente',          -- Name the bot introduces itself as
    tone VARCHAR(20) DEFAULT 'profesional',             -- profesional, amigable, formal, casual
    emoji_usage VARCHAR(20) DEFAULT 'moderado',         -- ninguno, pocos, moderado, muchos
    response_length VARCHAR(20) DEFAULT 'normal',       -- cortas, normal, detalladas
    language VARCHAR(10) DEFAULT 'es',                  -- Auto-detected, but default language
    
    -- ==============================================
    -- 🏢 BUSINESS SECTION (Tu Negocio)
    -- ==============================================
    business_name VARCHAR(255),                         -- Company/store name
    business_description TEXT,                          -- What the business does
    contact JSONB DEFAULT '{}',                         -- {email, phone, website}
    business_hours TEXT,                                -- Human-readable hours
    out_of_hours_message TEXT,                          -- Message when closed
    social_media JSONB DEFAULT '[]',                    -- [{platform, handle}]
    locations JSONB DEFAULT '[]',                       -- [{name, address, google_maps_url}]
    
    -- ==============================================
    -- 🛒 PRODUCTS SECTION (Productos)
    -- ==============================================
    use_ecommerce_api BOOLEAN DEFAULT false,            -- Enable ecommerce integration
    ecommerce_connection_ids UUID[] DEFAULT '{}',       -- Connected ecommerce stores
    ecommerce_search_message TEXT DEFAULT 'Estoy buscando la mejor solución para ti...',
    product_categories JSONB DEFAULT '[]',              -- [{name, description}]
    featured_products JSONB DEFAULT '[]',               -- [{name, description, price, url}]
    product_recommendations_enabled BOOLEAN DEFAULT true,
    
    -- ==============================================
    -- 📦 SHIPPING SECTION (Envíos y Pagos)
    -- ==============================================
    shipping_info JSONB DEFAULT '{}',                   -- {zones: [{name, price, time}], free_shipping_threshold}
    payment_methods JSONB DEFAULT '[]',                 -- [{method, details}]
    return_policy TEXT,                                 -- Return/refund policy
    
    -- ==============================================
    -- 🎯 BEHAVIOR SECTION (Comportamiento del Bot)
    -- ==============================================
    bot_objectives TEXT[] DEFAULT '{}',                 -- ['sell', 'inform', 'leads', 'support']
    custom_objectives TEXT[] DEFAULT '{}',              -- Custom objectives
    restrictions TEXT[] DEFAULT '{}',                   -- Things bot should NOT do
    special_instructions TEXT,                          -- Additional behavior notes
    
    -- ==============================================
    -- ⏰ AVAILABILITY SECTION (Disponibilidad)
    -- ==============================================
    business_hours_enabled BOOLEAN DEFAULT false,       -- Enable business hours checking
    business_hours_timezone VARCHAR(50) DEFAULT 'Europe/Madrid',
    active_hours_start TIME DEFAULT '09:00',
    active_hours_end TIME DEFAULT '18:00',
    active_days INTEGER[] DEFAULT '{1,2,3,4,5}',        -- 0=Sunday, 1=Monday, etc.
    
    -- ==============================================
    -- 💬 CONVERSATION SECTION (Conversación)
    -- ==============================================
    welcome_message TEXT,                               -- First message to user
    faqs JSONB DEFAULT '[]',                            -- [{question, answer}]
    
    -- ==============================================
    -- 🚨 ESCALATION SECTION (Escalación a Humano)
    -- ==============================================
    handoff_enabled BOOLEAN DEFAULT false,              -- Enable human handoff
    escalation_triggers TEXT[] DEFAULT '{}',            -- Predefined triggers
    custom_escalation_triggers TEXT[] DEFAULT '{}',     -- Custom triggers
    escalation_message TEXT DEFAULT 'Entiendo que necesitas ayuda más personalizada. Te paso con un compañero de mi equipo.',
    info_fields_to_collect TEXT[] DEFAULT '{Nombre completo,Email,Teléfono}',
    custom_info_fields TEXT[] DEFAULT '{}',
    handoff_keywords TEXT[] DEFAULT '{humano,agente,representante,soporte,persona}',
    handoff_message TEXT,
    handoff_frustration_detection BOOLEAN DEFAULT false,
    handoff_frustration_keywords TEXT[] DEFAULT '{no sirve,inútil,mal servicio,horrible,pésimo}',
    
    -- ==============================================
    -- ➕ ADDITIONAL SECTION (Información Adicional)
    -- ==============================================
    additional_info TEXT,                               -- Free-form additional info
    
    -- ==============================================
    -- 🌐 WEB-SPECIFIC FIELDS (Solo Web Chatbot)
    -- ==============================================
    collect_visitor_data BOOLEAN DEFAULT false,         -- Enable visitor data collection
    collect_name BOOLEAN DEFAULT false,
    collect_email BOOLEAN DEFAULT false,
    collect_phone BOOLEAN DEFAULT false,
    collect_data_timing VARCHAR(20) DEFAULT 'during_chat', -- before_chat, during_chat, end_of_chat
    human_handoff_email VARCHAR(255),                   -- Email for handoff notifications
    
    -- ==============================================
    -- ⚙️ MODEL/TECHNICAL CONFIG
    -- ==============================================
    provider VARCHAR(50) DEFAULT 'google',              -- google, openai, anthropic
    model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
    api_key_encrypted TEXT,                             -- Encrypted API key
    has_api_key BOOLEAN DEFAULT false,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    top_p DECIMAL(3,2) DEFAULT 1.0,
    frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
    presence_penalty DECIMAL(3,2) DEFAULT 0.0,
    response_format VARCHAR(20) DEFAULT 'text',
    context_window INTEGER DEFAULT 10,
    max_conversation_length INTEGER DEFAULT 20,
    enable_memory BOOLEAN DEFAULT true,
    enable_typing_indicator BOOLEAN DEFAULT true,
    
    -- ==============================================
    -- 📊 ADVANCED CONFIG
    -- ==============================================
    auto_reply BOOLEAN DEFAULT true,                    -- Bot responds automatically
    system_prompt TEXT,                                 -- Custom system prompt override
    custom_instructions TEXT,                           -- Additional instructions
    fallback_message TEXT DEFAULT 'Disculpa, no estoy seguro de cómo ayudarte con eso.',
    fallback_uncertainty_phrases TEXT[] DEFAULT '{no estoy seguro,no puedo ayudarte,no tengo información}',
    debounce_delay_ms INTEGER DEFAULT 5000,
    max_wait_ms INTEGER DEFAULT 15000,
    max_batch_size INTEGER DEFAULT 20,
    typing_indicator_delay_ms INTEGER DEFAULT 500,
    intent_classifier_max_tokens INTEGER DEFAULT 1000,
    
    -- ==============================================
    -- 📝 LOGGING CONFIG
    -- ==============================================
    log_conversations BOOLEAN DEFAULT true,
    log_level VARCHAR(20) DEFAULT 'detailed',
    log_user_messages BOOLEAN DEFAULT true,
    log_bot_responses BOOLEAN DEFAULT true,
    data_retention_days INTEGER DEFAULT 90,
    auto_delete_enabled BOOLEAN DEFAULT true,
    soft_delete_enabled BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Policy: Users can only see their own configs
CREATE POLICY IF NOT EXISTS "Users can view own chatbot configs"
ON chatbot_configs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own configs
CREATE POLICY IF NOT EXISTS "Users can insert own chatbot configs"
ON chatbot_configs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own configs
CREATE POLICY IF NOT EXISTS "Users can update own chatbot configs"
ON chatbot_configs FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own configs
CREATE POLICY IF NOT EXISTS "Users can delete own chatbot configs"
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
