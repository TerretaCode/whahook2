-- ==============================================
-- Add default_language column to chat_widgets
-- ==============================================

-- Add default_language column (defaults to 'es' for Spanish)
ALTER TABLE chat_widgets 
ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) DEFAULT 'es';

-- Add comment
COMMENT ON COLUMN chat_widgets.default_language IS 'Default language of the widget welcome message (ISO 639-1 code)';
